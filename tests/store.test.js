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
  canStartNewShopping,
  activeItems,
  nextItems,
  searchItems,
  matchesItem,
  filterGroups,
  findByName,
  bringToList,
  bringAllToActual,
  tripSummary,
  savedItems,
  arrivalMessage,
  setSort,
  sortItems,
  reorderItems,
  setGroup,
  GROUPS,
  compareNames,
  setQuantity,
} from '#store';

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
  assert.deepEqual(rest, { name: 'Bread', recurrent: false, list: 'active', bought: false, again: false, shops: [], quantity: '' });
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
  assert.deepEqual(rejected.error, { key: 'error.nameRequired' });
});

test('addItem rejects a duplicate in either list, without case distinction', () => {
  const start = build(['Milk', 'next'], ['Bread', 'active']);
  const inNext = addItem(start, ' milk ', 'active', newId);
  assert.equal(inNext.state, start);
  assert.deepEqual(inNext.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'next' } });
  assert.deepEqual(addItem(start, 'BREAD', 'next', newId).error, { key: 'error.duplicateItem', params: { name: 'Bread', list: 'active' } });
});

test('addItem rejects an unknown list', () => {
  assert.deepEqual(addItem(emptyState(), 'Milk', 'other', newId).error, { key: 'error.unknownList' });
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
  assert.deepEqual(renameItem(start, id, ' ').error, { key: 'error.nameRequired' });
  const duplicate = renameItem(start, id, 'MILK');
  assert.deepEqual(duplicate.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'next' } });
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
    assert.deepEqual(result.error, { key: 'error.itemNotFound' });
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
  assert.deepEqual(result.error, { key: 'error.onlyActiveTick', params: { list: 'active' } });
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
  assert.deepEqual(result.error, { key: 'error.tickFirst' });
  assert.equal(result.state, start);
});

test('toggleAgain rejects a recurrent item', () => {
  const start = build(['Milk', 'active', { bought: true, recurrent: true }]);
  assert.deepEqual(toggleAgain(start, find(start, 'Milk').id).error, { key: 'error.recurrentInNext', params: { list: 'next' } });
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
    { id: undefined, name: 'Soap', recurrent: false, list: 'next', bought: false, again: false, shops: [], quantity: '' },
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
    { id: undefined, name: 'Milk', recurrent: false, list: 'active', bought: true, again: false, shops: [], quantity: '' },
  );
  assert.deepEqual(nextItems(state), []);
});

test('removeFromNext rejects an active item that is not in the next view', () => {
  const start = build(['Bread', 'active']);
  assert.deepEqual(removeFromNext(start, find(start, 'Bread').id).error, { key: 'error.notInNext', params: { list: 'next' } });
});

test('startNewShopping applies each rule', () => {
  const start = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Soap', 'active', { bought: true, again: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Eggs', 'active', { recurrent: true }],
    ['Water', 'next'],
    ['Tea', 'next', { recurrent: false }],
  );
  const { state, error } = startNewShopping(start);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['Milk', 'Soap', 'Batteries', 'Bread', 'Eggs', 'Water', 'Tea']);
  assert.deepEqual(names(savedItems(state)), ['Batteries', 'Bread']);
  state.items.forEach((item) => {
    assert.equal(item.list, ['Batteries', 'Bread'].includes(item.name) ? 'saved' : 'active');
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
  assert.deepEqual(result.error, { key: 'error.nothingToStart', params: { list: 'next' } });
  assert.equal(result.state, start);
  assert.deepEqual(startNewShopping(emptyState()).error, { key: 'error.nothingToStart', params: { list: 'next' } });
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
  assert.deepEqual(bringToList(start, 'nope', 'active').error, { key: 'error.itemNotFound' });
  assert.deepEqual(bringToList(start, find(start, 'Bread').id, 'other').error, { key: 'error.unknownList' });
});

test('tripSummary counts the items of each kind', () => {
  const state = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Soap', 'active', { bought: true, again: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Water', 'next'],
  );
  assert.deepEqual(tripSummary(state), { total: 4, left: 1, back: 2, saved: 2, incoming: 1 });
});

test('tripSummary counts an item to buy as saved only when it is one-time', () => {
  const state = build(['Bread', 'active'], ['Eggs', 'active', { recurrent: true }]);
  assert.deepEqual(tripSummary(state), { total: 2, left: 2, back: 0, saved: 1, incoming: 0 });
});

test('tripSummary of an empty state is all zero', () => {
  assert.deepEqual(tripSummary(emptyState()), { total: 0, left: 0, back: 0, saved: 0, incoming: 0 });
});

test('startNewShopping empties the sent recipes and keeps the recipes', () => {
  const recipes = [{ id: 'r1', name: 'Omelette', products: ['Bread'] }];
  const start = { ...build(['Bread', 'active', { bought: true }]), recipes, sent: ['r1'] };
  const { state } = startNewShopping(start);
  assert.deepEqual(state.sent, []);
  assert.equal(state.recipes, recipes);
  assert.deepEqual(start.sent, ['r1']);
});

test('an item operation keeps the recipes and the sent recipes', () => {
  const start = { ...build(['Bread', 'active']), recipes: [{ id: 'r1', name: 'Omelette', products: [] }], sent: ['r1'] };
  const { id } = find(start, 'Bread');
  [deleteItem(start, id), toggleBought(start, id), moveItem(start, id), renameItem(start, id, 'Loaf')].forEach(({ state }) => {
    assert.equal(state.recipes, start.recipes);
    assert.equal(state.sent, start.sent);
  });
});

test('arrivalMessage counts the items of Active that are not bought', () => {
  const state = build(['Milk', 'active'], ['Bread', 'active'], ['Soap', 'active', { bought: true }], ['Water', 'next']);
  const before = structuredClone(state);
  assert.deepEqual(arrivalMessage(state), { key: 'toast.arrival', params: { count: 2, list: 'active' } });
  assert.deepEqual(state, before);
});

test('arrivalMessage uses the singular for one item', () => {
  assert.deepEqual(arrivalMessage(build(['Milk', 'active'])), { key: 'toast.arrival', params: { count: 1, list: 'active' } });
});

test('arrivalMessage is null when no item of Active is left', () => {
  assert.equal(arrivalMessage(build(['Milk', 'active', { bought: true }], ['Water', 'next'])), null);
  assert.equal(arrivalMessage(emptyState()), null);
});

test('setSort sets a known sort and rejects another one', () => {
  const start = emptyState();
  assert.equal(start.sort, 'custom');
  const { state } = setSort(start, 'name');
  assert.equal(state.sort, 'name');
  assert.equal(setSort(state, 'custom').state.sort, 'custom');
  assert.equal(start.sort, 'custom');
  const rejected = setSort(state, 'price');
  assert.equal(rejected.state, state);
  assert.deepEqual(rejected.error, { key: 'error.unknownSort' });
});

test('sortItems keeps the insertion order when the sort is added', () => {
  const state = build(['Zumo', 'active'], ['Arroz', 'active']);
  assert.equal(sortItems(state, state.items), state.items);
});

test('sortItems gives the Spanish name order without case or accent distinction', () => {
  const state = setSort(build(['zumo', 'active'], ['Ñoquis', 'active'], ['Banana', 'active'], ['nata', 'active'], ['árbol', 'active'], ['Oca', 'active']), 'name').state;
  const before = structuredClone(state);
  assert.deepEqual(names(sortItems(state, state.items)), ['árbol', 'Banana', 'nata', 'Ñoquis', 'Oca', 'zumo']);
  assert.deepEqual(state, before);
});

test('activeItems sorts by name and keeps the bought items last', () => {
  const start = build(['Pan', 'active'], ['Zumo', 'active', { bought: true }], ['Arroz', 'active'], ['Agua', 'active', { bought: true }], ['Sal', 'next']);
  assert.deepEqual(names(activeItems(start)), ['Pan', 'Arroz', 'Zumo', 'Agua']);
  assert.deepEqual(names(activeItems(setSort(start, 'name').state)), ['Arroz', 'Pan', 'Agua', 'Zumo']);
});

test('nextItems is one list in name order', () => {
  const start = build(['Sal', 'next'], ['Zumo', 'active', { bought: true, recurrent: true }], ['Arroz', 'next'], ['Leche', 'active', { bought: true, again: true }]);
  assert.deepEqual(names(nextItems(start)), ['Sal', 'Arroz', 'Zumo', 'Leche']);
  assert.deepEqual(names(nextItems(setSort(start, 'name').state)), ['Arroz', 'Leche', 'Sal', 'Zumo']);
});

test('reorderItems writes the new order of a full scope', () => {
  const before = build(['a', 'active'], ['b', 'active'], ['c', 'active']);
  const ids = ['c', 'a', 'b'].map((name) => find(before, name).id);
  const { state, error } = reorderItems(before, ids);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['c', 'a', 'b']);
});

test('reorderItems moves the items of a sub-scope and leaves the others in place', () => {
  const before = build(['a', 'active'], ['b', 'active'], ['c', 'active'], ['d', 'active']);
  const { state } = reorderItems(before, [find(before, 'd').id, find(before, 'b').id]);
  assert.deepEqual(names(state.items), ['a', 'd', 'c', 'b']);
});

test('reorderItems does not change its input', () => {
  const before = build(['a', 'active'], ['b', 'active']);
  const copy = structuredClone(before);
  reorderItems(before, [find(before, 'b').id, find(before, 'a').id]);
  assert.deepEqual(before, copy);
});

test('reorderItems returns the same state for the same order', () => {
  const before = build(['a', 'active'], ['b', 'active']);
  const result = reorderItems(before, before.items.map((item) => item.id));
  assert.equal(result.state, before);
  assert.equal(result.error, undefined);
});

test('reorderItems rejects an id that is not known', () => {
  const before = build(['a', 'active'], ['b', 'active']);
  const result = reorderItems(before, [find(before, 'a').id, 'nope']);
  assert.deepEqual(result.error, { key: 'error.itemNotFound' });
  assert.equal(result.state, before);
});

test('reorderItems rejects an id that is there two times', () => {
  const before = build(['a', 'active'], ['b', 'active']);
  const id = find(before, 'a').id;
  const result = reorderItems(before, [id, id]);
  assert.deepEqual(result.error, { key: 'error.invalidOrder' });
  assert.equal(result.state, before);
});

test('reorderItems from the name order writes the name order, then the move, and sets the custom order', () => {
  const before = setSort(build(['c', 'active'], ['a', 'active'], ['d', 'active'], ['b', 'active']), 'name').state;
  // The screen shows a, b, c, d. The user moves b above a.
  const { state, error } = reorderItems(before, [find(before, 'b').id, find(before, 'a').id]);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['b', 'a', 'c', 'd']);
  assert.equal(state.sort, 'custom');
});

test('reorderItems from the name order does not change its input', () => {
  const before = setSort(build(['c', 'active'], ['a', 'active']), 'name').state;
  const copy = structuredClone(before);
  reorderItems(before, [find(before, 'c').id, find(before, 'a').id]);
  assert.deepEqual(before, copy);
});

test('reorderItems from the name order rejects an unknown id and keeps the name order', () => {
  const before = setSort(build(['c', 'active'], ['a', 'active']), 'name').state;
  const result = reorderItems(before, ['nope']);
  assert.deepEqual(result.error, { key: 'error.itemNotFound' });
  assert.equal(result.state, before);
});

test('setGroup sets each known group and rejects another one', () => {
  const start = emptyState();
  assert.equal(start.group, 'recipe');
  assert.deepEqual(GROUPS, ['recipe', 'shop', 'none']);
  GROUPS.forEach((group) => assert.equal(setGroup(start, group).state.group, group));
  assert.equal(start.group, 'recipe');
  const rejected = setGroup(start, 'aisle');
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.unknownGroup' });
});

test('compareNames has no case and no accent distinction', () => {
  assert.deepEqual(['Zeta', 'árbol', 'beta'].sort(compareNames), ['árbol', 'beta', 'Zeta']);
  assert.equal(compareNames('lidl', 'Lidl'), 0);
});

const milk = { id: 'a', name: 'Leche', shops: ['Mercadona'] };
const coffee = { id: 'b', name: 'Café', shops: [] };

test('matchesItem matches a part of the name with no case and no accent distinction', () => {
  assert.equal(matchesItem(milk, 'ECH'), true);
  assert.equal(matchesItem(coffee, 'cafe'), true);
  assert.equal(matchesItem(milk, 'cafe'), false);
});

test('matchesItem matches a part of a shop', () => {
  assert.equal(matchesItem(milk, 'merca'), true);
  assert.equal(matchesItem(coffee, 'merca'), false);
});

test('matchesItem matches each item for an empty query', () => {
  assert.equal(matchesItem(coffee, ''), true);
  assert.equal(matchesItem(coffee, '   '), true);
});

test('filterGroups keeps the matches, drops a group with no item left and keeps the totals', () => {
  const view = {
    groups: [
      { shop: 'Mercadona', items: [milk], total: 3 },
      { shop: 'Lidl', items: [coffee], total: 1 },
    ],
    rest: [coffee, milk],
  };
  const copy = structuredClone(view);
  assert.deepEqual(filterGroups(view, 'lech'), {
    groups: [{ shop: 'Mercadona', items: [milk], total: 3, left: 1 }],
    rest: [milk],
  });
  assert.deepEqual(view, copy);
});

test('filterGroups gives `left` the count of the full group, not of the matches', () => {
  const view = { groups: [{ shop: 'Mercadona', items: [milk, coffee], total: 3 }], rest: [] };
  assert.deepEqual(filterGroups(view, 'lech').groups, [{ shop: 'Mercadona', items: [milk], total: 3, left: 2 }]);
});

test('filterGroups keeps each group and each item for an empty query', () => {
  const view = { groups: [{ shop: 'Lidl', items: [], total: 2 }], rest: [coffee] };
  assert.deepEqual(filterGroups(view, ' '), { groups: [{ shop: 'Lidl', items: [], total: 2, left: 0 }], rest: [coffee] });
});

test('bringAllToActual moves each item of next to active, not ticked, again cleared', () => {
  const state = build(['Pan', 'next', { again: true }], ['Leche', 'active', { bought: true }]);
  const before = structuredClone(state);
  const result = bringAllToActual(state);
  assert.equal(result.error, undefined);
  assert.deepEqual(
    result.state.items.map(({ name, list, bought, again }) => ({ name, list, bought, again })),
    [
      { name: 'Pan', list: 'active', bought: false, again: false },
      { name: 'Leche', list: 'active', bought: true, again: false },
    ],
  );
  assert.deepEqual(state, before);
});

test('bringAllToActual returns the same state when next has no item', () => {
  const state = build(['Leche', 'active']);
  assert.equal(bringAllToActual(state).state, state);
});

test('addItem creates an item with no quantity', () => {
  assert.equal(build(['Milk', 'active']).items[0].quantity, '');
});

test('setQuantity sets the trimmed text and does not change the input state', () => {
  const state = build(['Milk', 'active']);
  const before = structuredClone(state);
  const { state: next, error } = setQuantity(state, state.items[0].id, '  2 l ');
  assert.equal(error, undefined);
  assert.equal(next.items[0].quantity, '2 l');
  assert.deepEqual(state, before);
});

test('setQuantity with the same text returns the same state object', () => {
  const state = build(['Milk', 'active', { quantity: '2 l' }]);
  assert.equal(setQuantity(state, state.items[0].id, ' 2 l').state, state);
});

test('setQuantity with an empty text clears the quantity', () => {
  const state = build(['Milk', 'active', { quantity: '2 l' }]);
  assert.equal(setQuantity(state, state.items[0].id, '  ').state.items[0].quantity, '');
});

test('setQuantity rejects an unknown item with the same state', () => {
  const state = build(['Milk', 'active']);
  assert.deepEqual(setQuantity(state, 'nope', '2'), { state, error: { key: 'error.itemNotFound' } });
});

test('a move and the end of a trip keep the quantity', () => {
  const state = build(['Milk', 'active', { quantity: '2 l', recurrent: true, bought: true }], ['Eggs', 'next', { quantity: '12' }]);
  const [milk, eggs] = state.items;
  assert.equal(moveItem(state, eggs.id).state.items[1].quantity, '12');
  const after = startNewShopping(state).state;
  assert.deepEqual(after.items.map((item) => item.quantity), ['2 l', '12']);
  assert.equal(after.items[0].id, milk.id);
});

const saved = (...specs) => startNewShopping(build(...specs.map(([name, patch = {}]) => [name, 'active', { bought: true, ...patch }]))).state;

test('startNewShopping keeps a saved item as it is', () => {
  const start = saved(['Batteries', { shops: ['Lidl'], quantity: '4' }]);
  const item = find(start, 'Batteries');
  assert.deepEqual(item, { ...item, list: 'saved', bought: false, again: false, recurrent: false, shops: ['Lidl'], quantity: '4' });
  const withNext = { ...start, items: [...start.items, ...build(['Water', 'next']).items] };
  assert.deepEqual(find(startNewShopping(withNext).state, 'Batteries'), item);
});

test('a saved item is in no list view and not in the trip figures', () => {
  const state = saved(['Batteries']);
  assert.deepEqual(activeItems(state), []);
  assert.deepEqual(nextItems(state), []);
  assert.deepEqual(tripSummary(state), { total: 0, left: 0, back: 0, saved: 0, incoming: 0 });
  assert.equal(canStartNewShopping(state), false);
});

test('savedItems gives the saved items in name order', () => {
  const state = saved(['Soap'], ['batteries'], ['Milk', { recurrent: true }]);
  assert.deepEqual(names(savedItems(state)), ['batteries', 'Soap']);
  assert.deepEqual(savedItems(emptyState()), []);
});

test('bringToList takes a saved item to either list, not ticked', () => {
  const state = saved(['Batteries', { shops: ['Lidl'] }]);
  const id = find(state, 'Batteries').id;
  for (const list of ['active', 'next']) {
    const result = bringToList(state, id, list);
    assert.equal(result.changed, true);
    assert.deepEqual(find(result.state, 'Batteries'), { ...find(state, 'Batteries'), list });
  }
  assert.deepEqual(names(nextItems(bringToList(state, id, 'next').state)), ['Batteries']);
});

test('a saved item cannot be ticked or moved', () => {
  const state = saved(['Batteries']);
  const id = find(state, 'Batteries').id;
  assert.deepEqual(toggleBought(state, id), { state, error: { key: 'error.onlyActiveTick', params: { list: 'active' } } });
  assert.deepEqual(moveItem(state, id), { state, error: { key: 'error.itemSaved' } });
});

test('a saved item keeps its name: search finds it and an add of the name is a duplicate', () => {
  const state = saved(['Batteries']);
  assert.equal(findByName(state, 'batteries').list, 'saved');
  assert.deepEqual(names(searchItems(state, 'batt')), ['Batteries']);
  assert.deepEqual(addItem(state, 'Batteries', 'active').error, { key: 'error.duplicateItem', params: { name: 'Batteries', list: 'saved' } });
});

test('a delete removes a saved item for good', () => {
  const state = saved(['Batteries']);
  assert.deepEqual(deleteItem(state, find(state, 'Batteries').id).state.items, []);
});
