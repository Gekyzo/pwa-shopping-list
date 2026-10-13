import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, setSort } from '#store';
import { shopNames, shopSuggestions, addItemShop, removeItemShop, shopGroups } from '#shops';

let counter = 0;
const newId = () => `id-${++counter}`;

const build = (...specs) =>
  specs.reduce((state, [name, list, patch = {}]) => {
    const { state: added } = addItem(state, name, list, newId);
    const items = added.items.map((item) => (item.name === name ? { ...item, ...patch } : item));
    return { ...added, items };
  }, emptyState());

const find = (state, name) => state.items.find((item) => item.name === name);
const names = (items) => items.map((item) => item.name);
const shape = ({ groups, rest }) => ({
  groups: groups.map(({ shop, items, total }) => [shop, names(items), total]),
  rest: names(rest),
});

test('addItemShop adds a trimmed shop to the item and does not change its input', () => {
  const start = build(['Milk', 'active'], ['Salt', 'active']);
  const { state, error } = addItemShop(start, find(start, 'Milk').id, '  Lidl ');
  assert.equal(error, undefined);
  assert.deepEqual(find(state, 'Milk').shops, ['Lidl']);
  assert.deepEqual(find(state, 'Salt').shops, []);
  assert.deepEqual(find(start, 'Milk').shops, []);
});

test('addItemShop keeps the order in which the shops were added', () => {
  const start = build(['Milk', 'active', { shops: ['Market'] }]);
  const { state } = addItemShop(start, find(start, 'Milk').id, 'Lidl');
  assert.deepEqual(find(state, 'Milk').shops, ['Market', 'Lidl']);
});

test('addItemShop rejects an empty name and an unknown item', () => {
  const start = build(['Milk', 'active']);
  for (const name of ['', '   ', null, undefined]) {
    const rejected = addItemShop(start, find(start, 'Milk').id, name);
    assert.equal(rejected.state, start);
    assert.deepEqual(rejected.error, { key: 'error.shopRequired' });
  }
  const unknown = addItemShop(start, 'nope', 'Lidl');
  assert.equal(unknown.state, start);
  assert.deepEqual(unknown.error, { key: 'error.itemNotFound' });
});

test('addItemShop takes the spelling of a shop in use', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }], ['Salt', 'active']);
  const { state } = addItemShop(start, find(start, 'Salt').id, ' LIDL ');
  assert.deepEqual(find(state, 'Salt').shops, ['Lidl']);
});

test('addItemShop returns the same state for a shop that the item has', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }]);
  const result = addItemShop(start, find(start, 'Milk').id, 'lidl');
  assert.equal(result.state, start);
  assert.equal(result.error, undefined);
});

test('removeItemShop removes a shop with no case distinction', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl', 'Market'] }]);
  const { state, error } = removeItemShop(start, find(start, 'Milk').id, 'LIDL');
  assert.equal(error, undefined);
  assert.deepEqual(find(state, 'Milk').shops, ['Market']);
  assert.deepEqual(find(start, 'Milk').shops, ['Lidl', 'Market']);
});

test('removeItemShop returns the same state for a shop that the item does not have', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }]);
  assert.equal(removeItemShop(start, find(start, 'Milk').id, 'Market').state, start);
  assert.deepEqual(removeItemShop(start, 'nope', 'Lidl'), { state: start, error: { key: 'error.itemNotFound' } });
});

test('shopNames gives each shop in use one time, in name order', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Zeta', 'árbol'] }],
    ['Salt', 'next', { shops: ['beta', 'Zeta'] }],
    ['Rice', 'active'],
  );
  assert.deepEqual(shopNames(state), ['árbol', 'beta', 'Zeta']);
  assert.deepEqual(shopNames(emptyState()), []);
});

test('shopGroups of active puts an item of two shops in the two groups', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Market'] }],
    ['Bread', 'active', { shops: ['Lidl', 'Market'] }],
    ['Salt', 'active'],
    ['Wine', 'next', { shops: ['Cellar'] }],
  );
  assert.deepEqual(shape(shopGroups(state, 'active')), {
    groups: [
      ['Lidl', ['Bread'], 1],
      ['Market', ['Milk', 'Bread'], 2],
    ],
    rest: ['Salt'],
  });
});

test('a ticked item counts in the total and is not in the items or in the rest', () => {
  const state = build(
    ['Bread', 'active', { shops: ['Lidl', 'Market'], bought: true }],
    ['Milk', 'active', { shops: ['Market'] }],
    ['Oil', 'active', { bought: true }],
  );
  assert.deepEqual(shape(shopGroups(state, 'active')), {
    groups: [
      ['Lidl', [], 1],
      ['Market', ['Milk'], 2],
    ],
    rest: [],
  });
});

test('shopGroups uses the order of the list inside a group', () => {
  const state = build(['Milk', 'active', { shops: ['Lidl'] }], ['Bread', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(names(shopGroups(state, 'active').groups[0].items), ['Milk', 'Bread']);
  const sorted = setSort(state, 'name').state;
  assert.deepEqual(names(shopGroups(sorted, 'active').groups[0].items), ['Bread', 'Milk']);
});

test('shopGroups of next has the waiting items and the bought items that go back', () => {
  const state = build(
    ['Milk', 'next', { shops: ['Lidl'] }],
    ['Soap', 'active', { bought: true, recurrent: true, shops: ['Lidl', 'Market'] }],
    ['Salt', 'next'],
    ['Rice', 'active', { shops: ['Lidl'] }],
  );
  assert.deepEqual(shape(shopGroups(state, 'next')), {
    groups: [
      ['Lidl', ['Milk', 'Soap'], 2],
      ['Market', ['Soap'], 1],
    ],
    rest: ['Salt'],
  });
});

test('shopGroups with no shops has no groups and all the items in rest', () => {
  const state = build(['Milk', 'active'], ['Salt', 'active'], ['Rice', 'next']);
  assert.deepEqual(shape(shopGroups(state, 'active')), { groups: [], rest: ['Milk', 'Salt'] });
  assert.deepEqual(shape(shopGroups(state, 'next')), { groups: [], rest: ['Rice'] });
  assert.deepEqual(shape(shopGroups(emptyState(), 'active')), { groups: [], rest: [] });
});

test('shopSuggestions gives the shops in use that the item does not have, in name order', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Lidl'] }],
    ['Salt', 'next', { shops: ['Zeta', 'árbol', 'lidl'] }],
    ['Rice', 'active'],
  );
  assert.deepEqual(shopSuggestions(state, find(state, 'Milk').id), ['árbol', 'Zeta']);
  assert.deepEqual(shopSuggestions(state, find(state, 'Rice').id), ['árbol', 'Lidl', 'Zeta']);
});

test('shopSuggestions is empty for an unknown item and for no shops', () => {
  const state = build(['Milk', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(shopSuggestions(state, 'nope'), []);
  assert.deepEqual(shopSuggestions(state, find(state, 'Milk').id), []);
  assert.deepEqual(shopSuggestions(emptyState(), 'nope'), []);
});
