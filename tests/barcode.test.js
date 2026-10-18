import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORMATS, isBarcode, nameOfCode, learnCode } from '#barcode';
import { emptyState, addItem, renameItem } from '#store';

const build = (codes = {}) => ({ ...emptyState(), codes });

test('the formats are the product codes of a shop', () => {
  assert.deepEqual(FORMATS, ['ean_13', 'ean_8', 'upc_a', 'upc_e']);
});

test('isBarcode accepts 6 to 14 digits only', () => {
  ['123456', '01234565', '012345678905', '8410000000001', '12345678901234'].forEach((code) => assert.equal(isBarcode(code), true, code));
  ['', '12345', '123456789012345', '84100000a0001', ' 8410000000001', '8410-000', 'https://x.es', null, undefined, 8410000000001].forEach((code) =>
    assert.equal(isBarcode(code), false, String(code)));
});

test('nameOfCode gives the learned name, or null', () => {
  const state = build({ '8410000000001': 'Leche' });
  assert.equal(nameOfCode(state, '8410000000001'), 'Leche');
  assert.equal(nameOfCode(state, '8410000000002'), null);
  assert.equal(nameOfCode(state, 'toString'), null);
});

test('learnCode stores the trimmed name of a code and does not change its input', () => {
  const start = build();
  const { state, error } = learnCode(start, '8410000000001', ' Leche ');
  assert.equal(error, undefined);
  assert.deepEqual(state.codes, { '8410000000001': 'Leche' });
  assert.deepEqual(start.codes, {});
});

test('learnCode replaces the name of a known code', () => {
  const { state } = learnCode(build({ '8410000000001': 'Leche' }), '8410000000001', 'Leche entera');
  assert.deepEqual(state.codes, { '8410000000001': 'Leche entera' });
});

test('learnCode returns the same state when the code has that name', () => {
  const start = build({ '8410000000001': 'Leche' });
  assert.equal(learnCode(start, '8410000000001', 'Leche').state, start);
});

test('learnCode rejects a code that is not valid and an empty name', () => {
  const start = build();
  assert.deepEqual(learnCode(start, 'abc', 'Leche'), { state: start, error: { key: 'error.invalidCode' } });
  assert.deepEqual(learnCode(start, '8410000000001', '  '), { state: start, error: { key: 'error.nameRequired' } });
});

test('renameItem moves the codes of the old name, with no case distinction', () => {
  const added = addItem(build({ '1111111': 'leche', '2222222': 'Pan' }), 'Leche', () => 'a').state;
  const { state } = renameItem(added, 'a', 'Leche entera');
  assert.deepEqual(state.codes, { '1111111': 'Leche entera', '2222222': 'Pan' });
});
