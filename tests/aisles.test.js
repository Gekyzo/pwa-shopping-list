import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, setSort } from '#store';
import { addAisle, renameAisle, deleteAisle, moveAisle, setItemAisle, addDefaultAisles, aisleGroups } from '#aisles';

let counter = 0;
const newId = () => `id-${++counter}`;

// Each spec is [name, list, patch]: the list is 'active' or 'saved'.
const build = (aisles, ...specs) =>
  specs.reduce((state, [name, list, patch = {}]) => {
    const { state: added } = addItem(state, name, newId);
    const items = added.items.map((item) => (item.name === name ? { ...item, list, ...patch } : item));
    return { ...added, items };
  }, { ...emptyState(), aisles });

const find = (state, name) => state.items.find((item) => item.name === name);
const names = (items) => items.map((item) => item.name);
const shape = ({ groups, rest }) => ({
  groups: groups.map(({ aisle, items, total }) => [aisle, names(items), total]),
  rest: names(rest),
});

test('addAisle appends a trimmed aisle and does not change its input', () => {
  const start = build(['Dairy']);
  const { state, error } = addAisle(start, '  Frozen ');
  assert.equal(error, undefined);
  assert.deepEqual(state.aisles, ['Dairy', 'Frozen']);
  assert.deepEqual(start.aisles, ['Dairy']);
});

test('addAisle rejects an empty name', () => {
  const start = build([]);
  for (const name of ['', '   ', null, undefined]) {
    const rejected = addAisle(start, name);
    assert.equal(rejected.state, start);
    assert.deepEqual(rejected.error, { key: 'error.aisleRequired' });
  }
});

test('addAisle rejects a name that differs from an aisle only by case', () => {
  const start = build(['Dairy']);
  const rejected = addAisle(start, 'dairy');
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.duplicateAisle', params: { name: 'Dairy' } });
});

test('renameAisle renames the aisle in place and on each item that has it', () => {
  const start = build(['Dairy', 'Frozen'], ['Milk', 'active', { aisle: 'Dairy' }], ['Peas', 'saved', { aisle: 'Frozen' }]);
  const { state, error } = renameAisle(start, 'Dairy', ' Milk and eggs ');
  assert.equal(error, undefined);
  assert.deepEqual(state.aisles, ['Milk and eggs', 'Frozen']);
  assert.equal(find(state, 'Milk').aisle, 'Milk and eggs');
  assert.equal(find(state, 'Peas').aisle, 'Frozen');
  assert.equal(find(start, 'Milk').aisle, 'Dairy');
});

test('renameAisle changes only the case of a name', () => {
  const start = build(['dairy'], ['Milk', 'active', { aisle: 'dairy' }]);
  const { state } = renameAisle(start, 'dairy', 'Dairy');
  assert.deepEqual(state.aisles, ['Dairy']);
  assert.equal(find(state, 'Milk').aisle, 'Dairy');
});

test('renameAisle to the same name returns the same state object', () => {
  const start = build(['Dairy']);
  assert.equal(renameAisle(start, 'Dairy', ' Dairy ').state, start);
});

test('renameAisle rejects an unknown aisle, an empty name and the name of another aisle', () => {
  const start = build(['Dairy', 'Frozen']);
  assert.deepEqual(renameAisle(start, 'Bakery', 'Bread').error, { key: 'error.aisleNotFound' });
  assert.deepEqual(renameAisle(start, 'Dairy', ' ').error, { key: 'error.aisleRequired' });
  const duplicate = renameAisle(start, 'Dairy', 'frozen');
  assert.equal(duplicate.state, start);
  assert.deepEqual(duplicate.error, { key: 'error.duplicateAisle', params: { name: 'Frozen' } });
});

test('deleteAisle removes the aisle and clears it on its items', () => {
  const start = build(['Dairy', 'Frozen'], ['Milk', 'active', { aisle: 'Dairy' }], ['Peas', 'saved', { aisle: 'Frozen' }]);
  const { state, error } = deleteAisle(start, 'Dairy');
  assert.equal(error, undefined);
  assert.deepEqual(state.aisles, ['Frozen']);
  assert.equal(find(state, 'Milk').aisle, '');
  assert.equal(find(state, 'Peas').aisle, 'Frozen');
  assert.deepEqual(start.aisles, ['Dairy', 'Frozen']);
});

test('deleteAisle rejects an unknown aisle', () => {
  const start = build(['Dairy']);
  const rejected = deleteAisle(start, 'Frozen');
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.aisleNotFound' });
});

test('moveAisle moves an aisle one place up or down', () => {
  const start = build(['A', 'B', 'C']);
  assert.deepEqual(moveAisle(start, 'B', -1).state.aisles, ['B', 'A', 'C']);
  assert.deepEqual(moveAisle(start, 'B', 1).state.aisles, ['A', 'C', 'B']);
  assert.deepEqual(start.aisles, ['A', 'B', 'C']);
});

test('moveAisle past an end returns the same state object', () => {
  const start = build(['A', 'B']);
  assert.equal(moveAisle(start, 'A', -1).state, start);
  assert.equal(moveAisle(start, 'B', 1).state, start);
});

test('moveAisle rejects an unknown aisle', () => {
  const start = build(['A']);
  assert.deepEqual(moveAisle(start, 'Z', 1).error, { key: 'error.aisleNotFound' });
});

test('setItemAisle sets the aisle of an item in the spelling of the aisle', () => {
  const start = build(['Dairy'], ['Milk', 'active'], ['Salt', 'active']);
  const { state, error } = setItemAisle(start, find(start, 'Milk').id, 'dairy');
  assert.equal(error, undefined);
  assert.equal(find(state, 'Milk').aisle, 'Dairy');
  assert.equal(find(state, 'Salt').aisle, '');
  assert.equal(find(start, 'Milk').aisle, '');
});

test('setItemAisle with an empty name clears the aisle', () => {
  const start = build(['Dairy'], ['Milk', 'active', { aisle: 'Dairy' }]);
  assert.equal(find(setItemAisle(start, find(start, 'Milk').id, '').state, 'Milk').aisle, '');
});

test('setItemAisle to the aisle that the item has returns the same state object', () => {
  const start = build(['Dairy'], ['Milk', 'active', { aisle: 'Dairy' }]);
  assert.equal(setItemAisle(start, find(start, 'Milk').id, 'Dairy').state, start);
});

test('setItemAisle rejects an unknown item and an unknown aisle', () => {
  const start = build(['Dairy'], ['Milk', 'active']);
  assert.deepEqual(setItemAisle(start, 'nope', 'Dairy').error, { key: 'error.itemNotFound' });
  const unknown = setItemAisle(start, find(start, 'Milk').id, 'Frozen');
  assert.equal(unknown.state, start);
  assert.deepEqual(unknown.error, { key: 'error.aisleNotFound' });
});

test('addDefaultAisles adds the trimmed names that are not there, in their order', () => {
  const start = build(['Dairy']);
  const { state } = addDefaultAisles(start, [' Bakery ', 'dairy', '', 'Frozen', 'bakery']);
  assert.deepEqual(state.aisles, ['Dairy', 'Bakery', 'Frozen']);
});

test('addDefaultAisles with nothing new returns the same state object', () => {
  const start = build(['Dairy']);
  assert.equal(addDefaultAisles(start, ['DAIRY']).state, start);
});

test('aisleGroups follows the order of the aisles and keeps the ticked members in the total', () => {
  const start = build(
    ['Bakery', 'Dairy', 'Frozen'],
    ['Milk', 'active', { aisle: 'Dairy' }],
    ['Bread', 'active', { aisle: 'Bakery', bought: true }],
    ['Rolls', 'active', { aisle: 'Bakery' }],
    ['Salt', 'active'],
    ['Peas', 'saved', { aisle: 'Frozen' }],
  );
  assert.deepEqual(shape(aisleGroups(start)), {
    groups: [['Bakery', ['Rolls'], 2], ['Dairy', ['Milk'], 1]],
    rest: ['Salt'],
  });
});

test('aisleGroups uses the order of the user and leaves out the saved items', () => {
  const start = build(
    ['Dairy'],
    ['Yogurt', 'active', { aisle: 'Dairy' }],
    ['Cheese', 'active', { aisle: 'Dairy' }],
    ['Milk', 'active', { aisle: 'Dairy', bought: true, recurrent: true }],
    ['Butter', 'saved', { aisle: 'Dairy' }],
    ['Salt', 'active'],
  );
  const sorted = setSort(start, 'name').state;
  assert.deepEqual(shape(aisleGroups(sorted)), {
    groups: [['Dairy', ['Cheese', 'Yogurt'], 3]],
    rest: ['Salt'],
  });
});
