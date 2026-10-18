import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, toggleBought } from '#store';
import { suggestionRows } from '#suggest';

const withItems = (...names) => names.reduce((state, name, index) => addItem(state, name, () => `id${index}`).state, emptyState());

test('empty or blank text gives no rows', () => {
  const state = withItems('Pan');
  assert.deepEqual(suggestionRows(state, ''), []);
  assert.deepEqual(suggestionRows(state, '   '), []);
});

test('no exact match: the first row is create', () => {
  const rows = suggestionRows(withItems('Pan', 'Patatas'), 'pa');
  assert.equal(rows[0].kind, 'create');
  assert.deepEqual(rows.slice(1).map((row) => row.item.name), ['Pan', 'Patatas']);
});

test('no match at all: only create', () => {
  assert.deepEqual(suggestionRows(withItems('Pan'), 'zzz'), [{ kind: 'create', inList: false }]);
});

test('an exact match (any case or accent) has no create row', () => {
  const rows = suggestionRows(withItems('Pan', 'Panceta'), 'PAN');
  assert.deepEqual(rows.map((row) => row.kind), ['item', 'item']);
  assert.equal(rows[0].item.name, 'Pan');
});

test('inList is true only for an item to buy in the active list', () => {
  const base = withItems('Pan', 'Pasta');
  const state = toggleBought(base, 'id1').state;
  const rows = suggestionRows(state, 'pa');
  assert.equal(rows.find((row) => row.item?.name === 'Pan').inList, true);
  assert.equal(rows.find((row) => row.item?.name === 'Pasta').inList, false);
  assert.equal(rows[0].inList, false);
});

test('a saved item is not in the list', () => {
  const state = { ...withItems('Pan'), items: [{ ...withItems('Pan').items[0], list: 'saved' }] };
  assert.equal(suggestionRows(state, 'pan')[0].inList, false);
});

test('at most 6 rows, create included', () => {
  const state = withItems('a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8');
  const rows = suggestionRows(state, 'a');
  assert.equal(rows.length, 6);
  assert.equal(rows[0].kind, 'create');
});
