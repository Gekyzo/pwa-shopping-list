import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState,
  addItem,
  renameItem,
  toggleRecurrent,
  toggleBought,
  toggleAgain,
  deleteItem,
  moveItem,
  removeFromNext,
  startNewShopping,
  activeItems,
  nextItems,
  searchItems,
  findByName,
  bringToList,
} from '../src/store.js';

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

test('addItem adds a one-time item to active', () => {
  const { state, error } = addItem(emptyState(), 'Bread', 'active', newId);
  assert.equal(error, undefined);
  assert.equal(state.items.length, 1);
  const { id, ...rest } = state.items[0];
  assert.ok(id);
  assert.deepEqual(rest, { name: 'Bread', recurrent: false, list: 'active', bought: false, again: false });
});

test('addItem adds a recurrent item to next', () => {
  const { state } = addItem(emptyState(), 'Milk', 'next', newId);
  assert.equal(state.items[0].recurrent, true);
  assert.equal(state.items[0].list, 'next');
});

test('addItem trims the name and rejects an empty one', () => {
  const { state } = addItem(emptyState(), '  Eggs  ', 'active', newId);
  assert.equal(state.items[0].name, 'Eggs');
  const start = emptyState();
  const rejected = addItem(start, '   ', 'active', newId);
  assert.equal(rejected.state, start);
  assert.equal(rejected.error, 'Escribe un nombre.');
});

test('addItem rejects a duplicate in either list, without case distinction', () => {
  const start = build(['Milk', 'next'], ['Bread', 'active']);
  const inNext = addItem(start, ' milk ', 'active', newId);
  assert.equal(inNext.state, start);
  assert.equal(inNext.error, '"Milk" ya está en Próxima.');
  assert.equal(addItem(start, 'BREAD', 'next', newId).error, '"Bread" ya está en Actual.');
});

test('addItem rejects an unknown list', () => {
  assert.equal(addItem(emptyState(), 'Milk', 'other', newId).error, 'Lista desconocida.');
});

test('addItem does not change the input state', () => {
  const start = emptyState();
  addItem(start, 'Bread', 'active', newId);
  assert.deepEqual(start, emptyState());
});

test('renameItem renames and trims', () => {
  const start = build(['Bred', 'active']);
  const { state } = renameItem(start, find(start, 'Bred').id, ' Bread ');
  assert.deepEqual(names(state.items), ['Bread']);
});

test('renameItem rejects an empty name and a duplicate of another item', () => {
  const start = build(['Bread', 'active'], ['Milk', 'next']);
  const { id } = find(start, 'Bread');
  assert.equal(renameItem(start, id, ' ').error, 'Escribe un nombre.');
  const duplicate = renameItem(start, id, 'MILK');
  assert.equal(duplicate.error, '"Milk" ya está en Próxima.');
  assert.equal(duplicate.state, start);
});

test('renameItem accepts a change of case of the same item', () => {
  const start = build(['bread', 'active']);
  const { state, error } = renameItem(start, find(start, 'bread').id, 'Bread');
  assert.equal(error, undefined);
  assert.equal(state.items[0].name, 'Bread');
});

test('operations reject an unknown id', () => {
  const start = build(['Bread', 'active']);
  const calls = [
    renameItem(start, 'nope', 'X'),
    toggleRecurrent(start, 'nope'),
    toggleBought(start, 'nope'),
    toggleAgain(start, 'nope'),
    deleteItem(start, 'nope'),
    moveItem(start, 'nope'),
    removeFromNext(start, 'nope'),
  ];
  calls.forEach((result) => {
    assert.equal(result.error, 'Artículo no encontrado.');
    assert.equal(result.state, start);
  });
});

test('toggleRecurrent flips the flag', () => {
  const start = build(['Bread', 'active']);
  const { id } = find(start, 'Bread');
  const { state } = toggleRecurrent(start, id);
  assert.equal(state.items[0].recurrent, true);
  assert.equal(toggleRecurrent(state, id).state.items[0].recurrent, false);
});

test('toggleRecurrent on clears again, because the item is in next already', () => {
  const start = build(['Soap', 'active', { bought: true, again: true }]);
  const { state } = toggleRecurrent(start, find(start, 'Soap').id);
  assert.equal(state.items[0].recurrent, true);
  assert.equal(state.items[0].again, false);
});

test('toggleBought ticks an active item and keeps it in active', () => {
  const start = build(['Bread', 'active']);
  const { state } = toggleBought(start, find(start, 'Bread').id);
  assert.equal(state.items[0].bought, true);
  assert.equal(state.items[0].list, 'active');
});

test('toggleBought off resets again', () => {
  const start = build(['Soap', 'active', { bought: true, again: true }]);
  const { state } = toggleBought(start, find(start, 'Soap').id);
  assert.equal(state.items[0].bought, false);
  assert.equal(state.items[0].again, false);
});

test('toggleBought rejects an item in next', () => {
  const start = build(['Milk', 'next']);
  const result = toggleBought(start, find(start, 'Milk').id);
  assert.equal(result.error, 'Solo se pueden marcar los artículos de Actual.');
  assert.equal(result.state, start);
});

test('toggleAgain flips again on a ticked one-time item', () => {
  const start = build(['Soap', 'active', { bought: true }]);
  const { id } = find(start, 'Soap');
  const { state } = toggleAgain(start, id);
  assert.equal(state.items[0].again, true);
  assert.equal(toggleAgain(state, id).state.items[0].again, false);
});

test('toggleAgain rejects an item that is not ticked', () => {
  const start = build(['Soap', 'active']);
  const result = toggleAgain(start, find(start, 'Soap').id);
  assert.equal(result.error, 'Marca primero el artículo.');
  assert.equal(result.state, start);
});

test('toggleAgain rejects a recurrent item', () => {
  const start = build(['Milk', 'active', { bought: true, recurrent: true }]);
  assert.equal(toggleAgain(start, find(start, 'Milk').id).error, 'Un artículo recurrente ya está en Próxima.');
});

test('deleteItem removes the item', () => {
  const start = build(['Bread', 'active'], ['Milk', 'next']);
  const { state } = deleteItem(start, find(start, 'Bread').id);
  assert.deepEqual(names(state.items), ['Milk']);
});

test('moveItem moves to the other list and resets bought and again', () => {
  const start = build(['Soap', 'active', { bought: true, again: true }], ['Milk', 'next']);
  const moved = moveItem(start, find(start, 'Soap').id).state;
  assert.deepEqual(
    { ...find(moved, 'Soap'), id: undefined },
    { id: undefined, name: 'Soap', recurrent: false, list: 'next', bought: false, again: false },
  );
  const back = moveItem(moved, find(moved, 'Milk').id).state;
  assert.equal(find(back, 'Milk').list, 'active');
});

test('activeItems lists active items, not bought first, in insertion order', () => {
  const state = build(
    ['A', 'active', { bought: true }],
    ['B', 'active'],
    ['N', 'next'],
    ['C', 'active', { bought: true }],
    ['D', 'active'],
  );
  assert.deepEqual(names(activeItems(state)), ['B', 'D', 'A', 'C']);
});

test('nextItems lists next items, then ticked active items that are recurrent or again', () => {
  const state = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Soap', 'active', { bought: true, again: true }],
    ['Batteries', 'active', { bought: true }],
    ['Eggs', 'active', { recurrent: true }],
    ['Water', 'next'],
  );
  assert.deepEqual(names(nextItems(state)), ['Water', 'Milk', 'Soap']);
});

test('removeFromNext deletes an item of the next list', () => {
  const start = build(['Water', 'next']);
  const { state } = removeFromNext(start, find(start, 'Water').id);
  assert.deepEqual(state.items, []);
});

test('removeFromNext keeps a ticked active item and clears again and recurrent', () => {
  const start = build(['Milk', 'active', { bought: true, recurrent: true }]);
  const { state } = removeFromNext(start, find(start, 'Milk').id);
  assert.deepEqual(
    { ...state.items[0], id: undefined },
    { id: undefined, name: 'Milk', recurrent: false, list: 'active', bought: true, again: false },
  );
  assert.deepEqual(nextItems(state), []);
});

test('removeFromNext rejects an active item that is not in the next view', () => {
  const start = build(['Bread', 'active']);
  assert.equal(removeFromNext(start, find(start, 'Bread').id).error, 'El artículo no está en Próxima.');
});

test('startNewShopping applies each rule', () => {
  const start = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Soap', 'active', { bought: true, again: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Water', 'next'],
  );
  const { state, error } = startNewShopping(start);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['Milk', 'Soap', 'Bread', 'Water']);
  state.items.forEach((item) => {
    assert.equal(item.list, 'active');
    assert.equal(item.bought, false);
    assert.equal(item.again, false);
  });
  assert.equal(find(state, 'Milk').recurrent, true);
  assert.equal(find(state, 'Soap').recurrent, false);
  assert.deepEqual(nextItems(state), []);
});

test('startNewShopping rejects when nothing is ticked and next is empty', () => {
  const start = build(['Bread', 'active']);
  const result = startNewShopping(start);
  assert.equal(result.error, 'Nada que empezar: marca un artículo o añade uno a Próxima.');
  assert.equal(result.state, start);
  assert.equal(startNewShopping(emptyState()).error, 'Nada que empezar: marca un artículo o añade uno a Próxima.');
});

test('startNewShopping does not change the input state', () => {
  const start = build(['Batteries', 'active', { bought: true }], ['Water', 'next']);
  const copy = structuredClone(start);
  startNewShopping(start);
  assert.deepEqual(start, copy);
});

test('searchItems returns nothing for an empty query', () => {
  const state = build(['Milk', 'active']);
  assert.deepEqual(searchItems(state, '   '), []);
});

test('searchItems matches part of a name in both lists, without case or accent distinction', () => {
  const state = build(['Milk', 'next'], ['Oat milk', 'active'], ['Bread', 'active'], ['Jamón', 'active']);
  assert.deepEqual(names(searchItems(state, 'MIL')), ['Milk', 'Oat milk']);
  assert.deepEqual(names(searchItems(state, 'jamon')), ['Jamón']);
});

test('searchItems puts the exact match first, then names that start with the query', () => {
  const state = build(['Oat milk', 'active'], ['Milk chocolate', 'active'], ['Milk', 'next']);
  assert.deepEqual(names(searchItems(state, 'milk')), ['Milk', 'Milk chocolate', 'Oat milk']);
});

test('searchItems respects the limit', () => {
  const state = build(['Milk 1', 'active'], ['Milk 2', 'active'], ['Milk 3', 'active']);
  assert.equal(searchItems(state, 'milk', 2).length, 2);
});

test('findByName finds the item with the same name, trimmed and without case distinction', () => {
  const state = build(['Milk', 'next']);
  assert.equal(findByName(state, '  mILK ').name, 'Milk');
  assert.equal(findByName(state, 'Mil'), undefined);
  assert.equal(findByName(state, ''), undefined);
});

test('bringToList active: moves an item from next', () => {
  const start = build(['Milk', 'next']);
  const { state, changed } = bringToList(start, find(start, 'Milk').id, 'active');
  assert.equal(changed, true);
  assert.equal(state.items[0].list, 'active');
  assert.equal(state.items[0].recurrent, true);
});

test('bringToList active: unticks a bought item', () => {
  const start = build(['Soap', 'active', { bought: true, again: true }]);
  const { state, changed } = bringToList(start, find(start, 'Soap').id, 'active');
  assert.equal(changed, true);
  assert.equal(state.items[0].bought, false);
  assert.equal(state.items[0].again, false);
});

test('bringToList active: changes nothing for an item that is there and not bought', () => {
  const start = build(['Bread', 'active']);
  const result = bringToList(start, find(start, 'Bread').id, 'active');
  assert.equal(result.changed, false);
  assert.equal(result.state, start);
});

test('bringToList next: sets again on a bought one-time item', () => {
  const start = build(['Soap', 'active', { bought: true }]);
  const { state, changed } = bringToList(start, find(start, 'Soap').id, 'next');
  assert.equal(changed, true);
  assert.equal(state.items[0].again, true);
  assert.equal(state.items[0].list, 'active');
});

test('bringToList next: moves an item that is not bought', () => {
  const start = build(['Bread', 'active']);
  const { state, changed } = bringToList(start, find(start, 'Bread').id, 'next');
  assert.equal(changed, true);
  assert.equal(state.items[0].list, 'next');
});

test('bringToList next: changes nothing for an item that is in the next view', () => {
  const start = build(['Water', 'next'], ['Milk', 'active', { bought: true, recurrent: true }]);
  ['Water', 'Milk'].forEach((name) => {
    const result = bringToList(start, find(start, name).id, 'next');
    assert.equal(result.changed, false);
    assert.equal(result.state, start);
  });
});

test('bringToList rejects an unknown id and an unknown list', () => {
  const start = build(['Bread', 'active']);
  assert.equal(bringToList(start, 'nope', 'active').error, 'Artículo no encontrado.');
  assert.equal(bringToList(start, find(start, 'Bread').id, 'other').error, 'Lista desconocida.');
});
