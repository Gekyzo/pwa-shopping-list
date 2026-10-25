import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, toggleBought } from '#store';
import { sendRecipe } from '#recipes';
import { setMeal, menuWeek } from '#menu';
import { combine, split, listView, listPart, isShared, onList, targetList, listOf, listCounts } from '#lists';

const item = (id, name, extra = {}) => ({ id, name, recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '', ...extra });
const recipe = (id, name) => ({ id, name, products: [] });

const own = () => ({
  ...emptyState(),
  items: [item('o1', 'Leche'), item('o2', 'Pan')],
  recipes: [recipe('ro', 'Tortilla')],
  menu: [{ day: 0, meal: 'lunch', recipe: 'ro' }],
  sent: ['ro'],
  group: 'none',
  sort: 'name',
  aisles: ['Lácteos'],
});
const shared = () => ({
  ...emptyState(),
  items: [item('s1', 'Leche'), item('s2', 'Sal')],
  recipes: [recipe('rs', 'Paella')],
  menu: [{ day: 0, meal: 'lunch', dish: 'Paella' }],
  sent: ['rs'],
  group: 'aisle',
  sort: 'custom',
  aisles: ['Secos'],
});

test('combine then split gives back both parts', () => {
  const combined = combine(own(), shared(), 'all');
  assert.deepEqual(combined.sent, ['ro', 'rs']);
  assert.deepEqual(split(combined, shared(), 'all'), { own: own(), shared: shared() });
});

test('combine with no share returns the own state', () => {
  const state = own();
  assert.equal(combine(state, null, 'all'), state);
  assert.deepEqual(split(state, null, 'all'), { own: state, shared: null });
});

test('combine keeps two items of one name, one per list', () => {
  const combined = combine(own(), shared(), 'all');
  assert.deepEqual(combined.items.map((entry) => entry.id), ['o1', 'o2', 's1', 's2']);
  assert.equal(combined.items.filter((entry) => entry.name === 'Leche').length, 2);
  assert.deepEqual(combined.items.map(isShared), [false, false, true, true]);
  assert.deepEqual(combined.group, 'none');
  assert.deepEqual(combined.aisles, ['Lácteos']);
});

test('scope all marks the shared recipes and meals, and keeps two meals of one slot', () => {
  const combined = combine(own(), shared(), 'all');
  assert.deepEqual(combined.recipes.map(isShared), [false, true]);
  assert.deepEqual(combined.menu.map(isShared), [false, true]);
});

test('scope list keeps the shared recipes and meals out of the combined state and in the split', () => {
  const combined = combine(own(), shared(), 'list');
  assert.deepEqual(combined.recipes.map((entry) => entry.id), ['ro']);
  assert.equal(combined.menu.length, 1);
  assert.deepEqual(combined.sent, ['ro']);
  const parts = split(combined, shared(), 'list');
  assert.deepEqual(parts.shared.recipes, shared().recipes);
  assert.deepEqual(parts.shared.menu, shared().menu);
  assert.deepEqual(parts.shared.sent, ['rs']);
  assert.deepEqual(parts, { own: own(), shared: shared() });
});

test('split puts a new unmarked item in the own part', () => {
  const combined = combine(own(), shared(), 'all');
  const { state } = addItem(combined, 'Huevos', () => 'n1');
  const parts = split(state, shared(), 'all');
  assert.deepEqual(parts.own.items.map((entry) => entry.id), ['o1', 'o2', 'n1']);
  assert.deepEqual(parts.shared.items, shared().items);
  assert.ok([...parts.own.items, ...parts.shared.items].every((entry) => !('shared' in entry)));
});

test('split keeps group, sort and aisles of the shared base', () => {
  const combined = { ...combine(own(), shared(), 'all'), group: 'shop', sort: 'custom', aisles: ['Otro'] };
  const parts = split(combined, shared(), 'all');
  assert.deepEqual([parts.shared.group, parts.shared.sort, parts.shared.aisles], ['aisle', 'custom', ['Secos']]);
  assert.deepEqual([parts.own.group, parts.own.sort, parts.own.aisles], ['shop', 'custom', ['Otro']]);
});

test('split sends a sent id to the part that holds the recipe', () => {
  const combined = combine(own(), shared(), 'all');
  const parts = split({ ...combined, sent: ['rs'] }, shared(), 'all');
  assert.deepEqual([parts.own.sent, parts.shared.sent], [[], ['rs']]);
});

test('listView filters by list', () => {
  const combined = combine(own(), shared(), 'all');
  assert.equal(listView(combined, null), combined);
  assert.deepEqual(listView(combined, 'own').items.map((entry) => entry.id), ['o1', 'o2']);
  assert.deepEqual(listView(combined, 'shared').items.map((entry) => entry.id), ['s1', 's2']);
  assert.equal(listView(combined, 'shared').recipes, combined.recipes);
});

test('onList adds Leche to the own list when the shared list has Leche', () => {
  const base = { ...emptyState(), items: [item('s1', 'Leche')] };
  const combined = combine(emptyState(), base, 'all');
  const result = onList(combined, 'own', (part) => addItem(part, 'Leche', () => 'n1'), base, 'all');
  assert.equal(result.error, undefined);
  assert.deepEqual(result.state.items.map((entry) => [entry.name, isShared(entry)]), [['Leche', false], ['Leche', true]]);
});

test('onList refuses a duplicate inside its list', () => {
  const combined = combine(own(), shared(), 'all');
  const result = onList(combined, 'own', (part) => addItem(part, 'leche'), shared(), 'all');
  assert.equal(result.error.key, 'error.duplicateItem');
});

test('onList on the shared part with no share is an error', () => {
  const result = onList(own(), 'shared', (part) => ({ state: part }), null, 'all');
  assert.deepEqual(result, { error: { key: 'share.error.invalid' } });
});

test('onList changes only the shared part', () => {
  const combined = combine(own(), shared(), 'all');
  const result = onList(combined, 'shared', (part) => toggleBought(part, 's2'), shared(), 'all');
  assert.deepEqual(result.state.items.map((entry) => entry.bought), [false, false, false, true]);
});

test('undo state round trip', () => {
  const before = combine(own(), shared(), 'all');
  const after = onList(before, 'shared', (part) => toggleBought(part, 's1'), shared(), 'all').state;
  assert.equal(split(after, shared(), 'all').shared.items[0].bought, true);
  assert.equal(split(before, shared(), 'all').shared.items[0].bought, false);
});

test('targetList sends an add from Todas and from Mi lista to the own list', () => {
  assert.equal(targetList(null), 'own');
  assert.equal(targetList('own'), 'own');
  assert.equal(targetList('shared'), 'shared');
});

test('listOf names the list of an entity', () => {
  const combined = combine(own(), shared(), 'list');
  assert.deepEqual(combined.items.map(listOf), ['own', 'own', 'shared', 'shared']);
});

test('listCounts counts the items to buy of each list', () => {
  const base = shared();
  const sharedState = { ...base, items: [...base.items, item('s3', 'Sal fina', { bought: true }), item('s4', 'Arroz', { list: 'saved' })] };
  const combined = combine({ ...own(), items: [...own().items, item('o3', 'Agua', { recurrent: true })] }, sharedState, 'list');
  assert.deepEqual(listCounts(combined), { all: 5, own: 3, shared: 2 });
});

test('listCounts of a state with no item is zero for each list', () => {
  assert.deepEqual(listCounts(emptyState()), { all: 0, own: 0, shared: 0 });
});

test('listPart gives the items, recipes, meals and sent of one list', () => {
  const combined = combine(own(), shared(), 'all');
  const mine = listPart(combined, 'own');
  assert.deepEqual(mine.items.map((entry) => entry.id), ['o1', 'o2']);
  assert.deepEqual(mine.recipes.map((entry) => entry.id), ['ro']);
  assert.deepEqual(mine.menu, [{ day: 0, meal: 'lunch', recipe: 'ro' }]);
  assert.deepEqual(mine.sent, ['ro']);
  const theirs = listPart(combined, 'shared');
  assert.deepEqual(theirs.items.map((entry) => entry.id), ['s1', 's2']);
  assert.deepEqual(theirs.recipes.map((entry) => entry.id), ['rs']);
  assert.equal(theirs.menu.length, 1);
  assert.ok(theirs.menu.every(isShared));
  assert.deepEqual(theirs.sent, ['rs']);
});

test('listPart of the shared list under scope list has no recipe and no meal', () => {
  const theirs = listPart(combine(own(), shared(), 'list'), 'shared');
  assert.deepEqual(theirs.items.map((entry) => entry.id), ['s1', 's2']);
  assert.deepEqual(theirs.recipes, []);
  assert.deepEqual(theirs.menu, []);
  assert.deepEqual(theirs.sent, []);
});

test('listPart with no choice gives the state as it is', () => {
  const combined = combine(own(), shared(), 'all');
  assert.equal(listPart(combined, null), combined);
});

test('onList gives the same combined state when the operation changes nothing', () => {
  const combined = combine(own(), shared(), 'all');
  assert.equal(onList(combined, 'shared', (part) => ({ state: part, count: 0 }), shared(), 'all').state, combined);
});

test('a send of a shared recipe through onList brings its products to the shared list only', () => {
  const base = { ...shared(), recipes: [{ id: 'rs', name: 'Paella', products: ['Leche', 'Arroz'] }], sent: [] };
  const combined = combine(own(), base, 'all');
  const result = onList(combined, 'shared', (part) => sendRecipe(part, 'rs', () => 'n1'), base, 'all');
  const parts = split(result.state, base, 'all');
  assert.deepEqual(parts.own.items, own().items);
  assert.deepEqual(parts.shared.items.map((entry) => entry.name), ['Leche', 'Sal', 'Arroz']);
  assert.deepEqual(parts.shared.sent, ['rs']);
  assert.deepEqual(parts.own.sent, ['ro']);
  assert.equal(result.added, 1);
});

test('a meal of a shared recipe keeps the own meal of that slot', () => {
  const combined = combine(own(), shared(), 'all');
  const result = onList(combined, 'shared', (part) => setMeal(part, 0, 'lunch', 'rs'), shared(), 'all');
  const parts = split(result.state, shared(), 'all');
  assert.deepEqual(parts.own.menu, [{ day: 0, meal: 'lunch', recipe: 'ro' }]);
  assert.deepEqual(parts.shared.menu, [{ day: 0, meal: 'lunch', recipe: 'rs' }]);
  assert.equal(menuWeek(listPart(result.state, 'shared'))[0].meals[0].recipe.name, 'Paella');
  assert.equal(menuWeek(listPart(result.state, 'own'))[0].meals[0].recipe.name, 'Tortilla');
});
