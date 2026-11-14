import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyState,
  addItem,
  renameItem,
  toggleRecurrent,
  toggleBought,
  deleteItem,
  startNewShopping,
  canStartNewShopping,
  openItems,
  activeItems,
  searchItems,
  matchesItem,
  filterGroups,
  findByName,
  bringToList,
  tripSummary,
  tripOutcome,
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

// Each spec is [name, list, patch]: the list is 'active' or 'saved'.
const build = (...specs) =>
  specs.reduce((state, [name, list, patch = {}]) => {
    const { state: added } = addItem(state, name, newId);
    const items = added.items.map((item) => (item.name === name ? { ...item, list, ...patch } : item));
    return { ...added, items };
  }, emptyState());

const find = (state, name) => state.items.find((item) => item.name === name);
const names = (items) => items.map((item) => item.name);

test('addItem adds a one-time item to active', () => {
  const { state, error } = addItem(emptyState(), 'Bread', newId);
  assert.equal(error, undefined);
  assert.equal(state.items.length, 1);
  const { id, ...rest } = state.items[0];
  assert.ok(id);
  assert.deepEqual(rest, { name: 'Bread', recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' });
});

test('addItem always creates a one-time item in active, with no again field', () => {
  const start = build(['Milk', 'active', { recurrent: true }], ['Batteries', 'saved']);
  const { state } = addItem(start, 'Eggs', newId);
  const item = find(state, 'Eggs');
  assert.equal(item.recurrent, false);
  assert.equal(item.list, 'active');
  assert.equal(item.bought, false);
  assert.equal('again' in item, false);
  assert.equal(addItem(emptyState(), 'Tea').state.items[0].list, 'active');
});

test('addItem trims the name and rejects an empty one', () => {
  const { state } = addItem(emptyState(), '  Eggs  ', newId);
  assert.equal(state.items[0].name, 'Eggs');
  const start = emptyState();
  const rejected = addItem(start, '   ', newId);
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.nameRequired' });
});

test('addItem rejects a duplicate in active or saved, without case distinction', () => {
  const start = build(['Milk', 'saved'], ['Bread', 'active']);
  const inSaved = addItem(start, ' milk ', newId);
  assert.equal(inSaved.state, start);
  assert.deepEqual(inSaved.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'saved' } });
  assert.deepEqual(addItem(start, 'BREAD', newId).error, { key: 'error.duplicateItem', params: { name: 'Bread', list: 'active' } });
});

test('addItem does not change the input state', () => {
  const start = emptyState();
  addItem(start, 'Bread', newId);
  assert.deepEqual(start, emptyState());
});

test('renameItem renames and trims', () => {
  const start = build(['Bred', 'active']);
  const { state } = renameItem(start, find(start, 'Bred').id, ' Bread ');
  assert.deepEqual(names(state.items), ['Bread']);
});

test('renameItem rejects an empty name and a duplicate of another item', () => {
  const start = build(['Bread', 'active'], ['Milk', 'saved']);
  const { id } = find(start, 'Bread');
  assert.deepEqual(renameItem(start, id, ' ').error, { key: 'error.nameRequired' });
  const duplicate = renameItem(start, id, 'MILK');
  assert.deepEqual(duplicate.error, { key: 'error.duplicateItem', params: { name: 'Milk', list: 'saved' } });
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
    deleteItem(start, 'nope'),
    bringToList(start, 'nope'),
  ];
  calls.forEach((result) => {
    assert.deepEqual(result.error, { key: 'error.itemNotFound' });
    assert.equal(result.state, start);
  });
});

test('toggleRecurrent flips the flag and changes nothing else', () => {
  const start = build(['Bread', 'active', { bought: true }]);
  const { id } = find(start, 'Bread');
  const { state } = toggleRecurrent(start, id);
  assert.deepEqual(state.items[0], { ...start.items[0], recurrent: true });
  assert.equal(toggleRecurrent(state, id).state.items[0].recurrent, false);
});

test('toggleBought ticks an active item and keeps it in active', () => {
  const start = build(['Bread', 'active']);
  const { state } = toggleBought(start, find(start, 'Bread').id);
  assert.deepEqual(state.items[0], { ...start.items[0], bought: true });
});

test('toggleBought off unticks the item and changes nothing else', () => {
  const start = build(['Soap', 'active', { bought: true }]);
  const { state } = toggleBought(start, find(start, 'Soap').id);
  assert.deepEqual(state.items[0], { ...start.items[0], bought: false });
});

test('deleteItem removes the item', () => {
  const start = build(['Bread', 'active'], ['Milk', 'saved']);
  const { state } = deleteItem(start, find(start, 'Bread').id);
  assert.deepEqual(names(state.items), ['Milk']);
});

test('activeItems lists active items, not bought first, in insertion order', () => {
  const state = build(
    ['A', 'active', { bought: true }],
    ['B', 'active'],
    ['S', 'saved'],
    ['C', 'active', { bought: true }],
    ['D', 'active'],
  );
  assert.deepEqual(names(activeItems(state)), ['B', 'D', 'A', 'C']);
});

test('startNewShopping applies each rule', () => {
  const start = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Eggs', 'active', { recurrent: true }],
    ['Tea', 'saved'],
  );
  const { state, error } = startNewShopping(start);
  assert.equal(error, undefined);
  assert.deepEqual(names(state.items), ['Milk', 'Batteries', 'Bread', 'Eggs', 'Tea']);
  assert.deepEqual(names(state.items.filter((item) => item.list === 'saved')), ['Batteries', 'Bread', 'Tea']);
  state.items.forEach((item) => {
    assert.equal(item.list, ['Milk', 'Eggs'].includes(item.name) ? 'active' : 'saved');
    assert.equal(item.bought, false);
  });
  assert.equal(find(state, 'Milk').recurrent, true);
  assert.equal(find(state, 'Batteries').recurrent, false);
});

test('startNewShopping rejects when nothing is ticked and nothing is open', () => {
  const start = build(['Eggs', 'active', { recurrent: true }], ['Tea', 'saved']);
  const result = startNewShopping(start);
  assert.deepEqual(result.error, { key: 'error.nothingToStart' });
  assert.equal(result.state, start);
  assert.equal(canStartNewShopping(start), false);
  assert.deepEqual(startNewShopping(emptyState()).error, { key: 'error.nothingToStart' });
});

test('startNewShopping finishes with only open items', () => {
  const start = build(['Bread', 'active']);
  assert.equal(startNewShopping(start).error, undefined);
  assert.equal(canStartNewShopping(start), true);
});

test('openItems gives the one-time items of Actual that are not ticked', () => {
  const start = build(['Milk', 'active', { bought: true }], ['Bread', 'active'],
    ['Eggs', 'active', { recurrent: true }], ['Water', 'saved'], ['Salt', 'active']);
  assert.deepEqual(names(openItems(start)), ['Bread', 'Salt']);
});

test('openItems follows the order of Actual', () => {
  const start = { ...build(['Salt', 'active'], ['Bread', 'active']), sort: 'name' };
  assert.deepEqual(names(openItems(start)), ['Bread', 'Salt']);
});

test('startNewShopping keeps the open items of keep in Actual', () => {
  const start = build(['Milk', 'active', { bought: true }], ['Bread', 'active'], ['Salt', 'active']);
  const { state } = startNewShopping(start, [find(start, 'Bread').id]);
  assert.deepEqual(find(state, 'Bread'), { ...find(start, 'Bread'), list: 'active', bought: false });
  assert.equal(find(state, 'Salt').list, 'saved');
  assert.equal(find(state, 'Milk').list, 'saved');
});

test('startNewShopping keeps the open items in keep and saves each other one-time item', () => {
  const start = build(
    ['Bread', 'active'],
    ['Salt', 'active'],
    ['Rice', 'active'],
    ['Soap', 'active', { bought: true }],
    ['Milk', 'active', { recurrent: true, bought: true }],
    ['Tea', 'saved', { shops: ['Lidl'] }],
  );
  const keep = ['Bread', 'Rice', 'Soap', 'Milk', 'Tea'].map((name) => find(start, name).id);
  const { state, error } = startNewShopping(start, keep);
  assert.equal(error, undefined);
  const where = Object.fromEntries(state.items.map(({ name, list, bought }) => [name, `${list}${bought ? ' ticked' : ''}`]));
  assert.deepEqual(where, {
    Bread: 'active',
    Salt: 'saved',
    Rice: 'active',
    Soap: 'saved',
    Milk: 'active',
    Tea: 'saved',
  });
  assert.equal(find(state, 'Tea'), find(start, 'Tea'));
  assert.equal(find(state, 'Milk').recurrent, true);
});

test('startNewShopping ignores an id of keep that is not an open item', () => {
  const start = build(['Milk', 'active', { bought: true }], ['Tea', 'saved'], ['Bread', 'active']);
  const keep = ['Milk', 'Tea'].map((name) => find(start, name).id).concat('nope');
  assert.deepEqual(startNewShopping(start, keep).state, startNewShopping(start).state);
});

test('startNewShopping with keep does not change the input state', () => {
  const start = build(['Bread', 'active'], ['Water', 'saved']);
  const copy = structuredClone(start);
  startNewShopping(start, [find(start, 'Bread').id]);
  assert.deepEqual(start, copy);
});

test('tripSummary counts a kept open item as back', () => {
  const start = build(['Milk', 'active', { bought: true }], ['Bread', 'active'], ['Salt', 'active']);
  assert.deepEqual(tripSummary(start, [find(start, 'Bread').id]),
    { total: 3, left: 2, back: 1, saved: 2 });
});

test('startNewShopping does not change the input state', () => {
  const start = build(['Batteries', 'active', { bought: true }], ['Water', 'saved']);
  const copy = structuredClone(start);
  startNewShopping(start);
  assert.deepEqual(start, copy);
});

test('searchItems returns nothing for an empty query', () => {
  const state = build(['Milk', 'active']);
  assert.deepEqual(searchItems(state, '   '), []);
});

test('searchItems matches part of a name in active and saved, without case or accent distinction', () => {
  const state = build(['Milk', 'saved'], ['Oat milk', 'active'], ['Bread', 'active'], ['Jamón', 'active']);
  assert.deepEqual(names(searchItems(state, 'MIL')), ['Milk', 'Oat milk']);
  assert.deepEqual(names(searchItems(state, 'jamon')), ['Jamón']);
});

test('searchItems puts the exact match first, then names that start with the query', () => {
  const state = build(['Oat milk', 'active'], ['Milk chocolate', 'active'], ['Milk', 'saved']);
  assert.deepEqual(names(searchItems(state, 'milk')), ['Milk', 'Milk chocolate', 'Oat milk']);
});

test('searchItems respects the limit', () => {
  const state = build(['Milk 1', 'active'], ['Milk 2', 'active'], ['Milk 3', 'active']);
  assert.equal(searchItems(state, 'milk', 2).length, 2);
});

test('findByName finds the item with the same name, trimmed and without case distinction', () => {
  const state = build(['Milk', 'saved']);
  assert.equal(findByName(state, '  mILK ').name, 'Milk');
  assert.equal(findByName(state, 'Mil'), undefined);
  assert.equal(findByName(state, ''), undefined);
});

test('bringToList brings a saved item to active, not ticked', () => {
  const start = build(['Milk', 'saved', { recurrent: true }]);
  const { state, changed } = bringToList(start, find(start, 'Milk').id);
  assert.equal(changed, true);
  assert.deepEqual(state.items[0], { ...start.items[0], list: 'active', bought: false });
});

test('bringToList unticks a bought item', () => {
  const start = build(['Soap', 'active', { bought: true }]);
  const { state, changed } = bringToList(start, find(start, 'Soap').id);
  assert.equal(changed, true);
  assert.deepEqual(state.items[0], { ...start.items[0], bought: false });
});

test('bringToList changes nothing for an item that is in active and not bought', () => {
  const start = build(['Bread', 'active'], ['Milk', 'active', { recurrent: true }]);
  ['Bread', 'Milk'].forEach((name) => {
    const result = bringToList(start, find(start, name).id);
    assert.equal(result.changed, false);
    assert.equal(result.state, start);
  });
});

test('bringToList rejects an unknown id', () => {
  const start = build(['Bread', 'active']);
  assert.deepEqual(bringToList(start, 'nope'), { state: start, error: { key: 'error.itemNotFound' } });
});

test('tripSummary counts the items of each kind', () => {
  const state = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Water', 'saved'],
  );
  assert.deepEqual(tripSummary(state), { total: 3, left: 1, back: 1, saved: 2 });
});

test('tripSummary counts an item to buy as saved only when it is one-time', () => {
  const state = build(['Bread', 'active'], ['Eggs', 'active', { recurrent: true }]);
  assert.deepEqual(tripSummary(state), { total: 2, left: 2, back: 1, saved: 1 });
});

test('tripSummary counts each item of Actual as back or saved', () => {
  const state = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Eggs', 'active', { recurrent: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
  );
  const { total, back, saved } = tripSummary(state);
  assert.equal(back + saved, total);
  assert.equal(back, 2);
});

test('tripOutcome counts each item of Actual by where it goes', () => {
  const state = build(
    ['Milk', 'active', { bought: true, recurrent: true }],
    ['Eggs', 'active', { recurrent: true }],
    ['Batteries', 'active', { bought: true }],
    ['Bread', 'active'],
    ['Salt', 'active'],
    ['Rice', 'saved'],
  );
  assert.deepEqual(tripOutcome(state), { recurrent: 2, kept: 0, open: 2, bought: 1 });
  assert.deepEqual(tripOutcome(state, [find(state, 'Bread').id, find(state, 'Milk').id]),
    { recurrent: 2, kept: 1, open: 1, bought: 1 });
});

test('tripOutcome adds up to the items of Actual', () => {
  const state = build(
    ['Agua Zoe', 'active', { bought: true }],
    ['Leche', 'active', { bought: true, recurrent: true }],
    ['Base pizza', 'active'],
    ['Agua', 'active', { recurrent: true }],
    ['Pepperoni', 'active', { bought: true }],
  );
  const outcome = tripOutcome(state, [find(state, 'Base pizza').id]);
  assert.deepEqual(outcome, { recurrent: 2, kept: 1, open: 0, bought: 2 });
  const sum = Object.values(outcome).reduce((a, b) => a + b, 0);
  assert.equal(sum, tripSummary(state).total);
});

test('tripOutcome of an empty state is all zero', () => {
  assert.deepEqual(tripOutcome(emptyState()), { recurrent: 0, kept: 0, open: 0, bought: 0 });
});

test('tripSummary of an empty state is all zero', () => {
  assert.deepEqual(tripSummary(emptyState()), { total: 0, left: 0, back: 0, saved: 0 });
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
  [deleteItem(start, id), toggleBought(start, id), toggleRecurrent(start, id), renameItem(start, id, 'Loaf')].forEach(({ state }) => {
    assert.equal(state.recipes, start.recipes);
    assert.equal(state.sent, start.sent);
  });
});

test('arrivalMessage counts the items of Active that are not bought', () => {
  const state = build(['Milk', 'active'], ['Bread', 'active'], ['Soap', 'active', { bought: true }], ['Water', 'saved']);
  const before = structuredClone(state);
  assert.deepEqual(arrivalMessage(state), { key: 'toast.arrival', params: { count: 2, list: 'active' } });
  assert.deepEqual(state, before);
});

test('arrivalMessage uses the singular for one item', () => {
  assert.deepEqual(arrivalMessage(build(['Milk', 'active'])), { key: 'toast.arrival', params: { count: 1, list: 'active' } });
});

test('arrivalMessage is null when no item of Active is left', () => {
  assert.equal(arrivalMessage(build(['Milk', 'active', { bought: true }], ['Water', 'saved'])), null);
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
  const start = build(['Pan', 'active'], ['Zumo', 'active', { bought: true }], ['Arroz', 'active'], ['Agua', 'active', { bought: true }], ['Sal', 'saved']);
  assert.deepEqual(names(activeItems(start)), ['Pan', 'Arroz', 'Zumo', 'Agua']);
  assert.deepEqual(names(activeItems(setSort(start, 'name').state)), ['Arroz', 'Pan', 'Agua', 'Zumo']);
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
  assert.deepEqual(GROUPS, ['recipe', 'shop', 'aisle', 'none']);
  GROUPS.forEach((group) => assert.equal(setGroup(start, group).state.group, group));
  assert.equal(start.group, 'recipe');
  const rejected = setGroup(start, 'floor');
  assert.equal(rejected.state, start);
  assert.deepEqual(rejected.error, { key: 'error.unknownGroup' });
});

test('compareNames has no case and no accent distinction', () => {
  assert.deepEqual(['Zeta', 'árbol', 'beta'].sort(compareNames), ['árbol', 'beta', 'Zeta']);
  assert.equal(compareNames('lidl', 'Lidl'), 0);
});

const milk = { id: 'a', name: 'Leche', shops: ['Mercadona'], aisle: 'Lácteos' };
const coffee = { id: 'b', name: 'Café', shops: [], aisle: '' };

test('matchesItem matches a part of the name with no case and no accent distinction', () => {
  assert.equal(matchesItem(milk, 'ECH'), true);
  assert.equal(matchesItem(coffee, 'cafe'), true);
  assert.equal(matchesItem(milk, 'cafe'), false);
});

test('matchesItem matches a part of a shop', () => {
  assert.equal(matchesItem(milk, 'merca'), true);
  assert.equal(matchesItem(coffee, 'merca'), false);
});

test('matchesItem matches a part of the aisle with no accent distinction', () => {
  assert.equal(matchesItem(milk, 'lacte'), true);
  assert.equal(matchesItem(coffee, 'lacte'), false);
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

test('the end of a trip keeps the quantity', () => {
  const state = build(['Milk', 'active', { quantity: '2 l', recurrent: true, bought: true }], ['Eggs', 'active', { quantity: '12' }]);
  const [milk, eggs] = state.items;
  const after = startNewShopping(state, [eggs.id]).state;
  assert.deepEqual(after.items.map((item) => item.quantity), ['2 l', '12']);
  assert.equal(after.items[0].id, milk.id);
});

const saved = (...specs) => startNewShopping(build(...specs.map(([name, patch = {}]) => [name, 'active', { bought: true, ...patch }]))).state;

test('startNewShopping keeps a saved item as it is', () => {
  const start = saved(['Batteries', { shops: ['Lidl'], quantity: '4' }]);
  const item = find(start, 'Batteries');
  assert.deepEqual(item, { ...item, list: 'saved', bought: false, recurrent: false, shops: ['Lidl'], quantity: '4' });
  const withOpen = { ...start, items: [...start.items, ...build(['Water', 'active']).items] };
  assert.equal(find(startNewShopping(withOpen).state, 'Batteries'), item);
});

test('a saved item is in no list view and not in the trip figures', () => {
  const state = saved(['Batteries']);
  assert.deepEqual(activeItems(state), []);
  assert.deepEqual(tripSummary(state), { total: 0, left: 0, back: 0, saved: 0 });
  assert.equal(canStartNewShopping(state), false);
});

test('bringToList takes a saved item to active, not ticked', () => {
  const state = saved(['Batteries', { shops: ['Lidl'] }]);
  const id = find(state, 'Batteries').id;
  const result = bringToList(state, id);
  assert.equal(result.changed, true);
  assert.deepEqual(find(result.state, 'Batteries'), { ...find(state, 'Batteries'), list: 'active' });
  assert.deepEqual(names(activeItems(result.state)), ['Batteries']);
});

test('a saved item cannot be ticked', () => {
  const state = saved(['Batteries']);
  const id = find(state, 'Batteries').id;
  assert.deepEqual(toggleBought(state, id), { state, error: { key: 'error.onlyActiveTick', params: { list: 'active' } } });
});

test('a saved item keeps its name: search finds it and an add of the name is a duplicate', () => {
  const state = saved(['Batteries']);
  assert.equal(findByName(state, 'batteries').list, 'saved');
  assert.deepEqual(names(searchItems(state, 'batt')), ['Batteries']);
  assert.deepEqual(addItem(state, 'Batteries').error, { key: 'error.duplicateItem', params: { name: 'Batteries', list: 'saved' } });
});

test('a delete removes a saved item for good', () => {
  const state = saved(['Batteries']);
  assert.deepEqual(deleteItem(state, find(state, 'Batteries').id).state.items, []);
});
