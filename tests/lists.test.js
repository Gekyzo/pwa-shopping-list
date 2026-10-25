import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, toggleBought } from '#store';
import { sendRecipe } from '#recipes';
import { setMeal, menuWeek, dishRecipe } from '#menu';
import { combine, split, listView, listPart, isShared, onList, targetList, listOf, listCounts, reorderList, fillLists } from '#lists';

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
  assert.deepEqual(combined.sent, ['ro', 'shared:rs']);
  assert.deepEqual(split(combined, shared(), 'all'), { own: own(), shared: shared() });
});

test('combine with no share returns the own state', () => {
  const state = own();
  assert.equal(combine(state, null, 'all'), state);
  assert.deepEqual(split(state, null, 'all'), { own: state, shared: null });
});

test('combine keeps two items of one name, one per list', () => {
  const combined = combine(own(), shared(), 'all');
  assert.deepEqual(combined.items.map((entry) => entry.id), ['o1', 'o2', 'shared:s1', 'shared:s2']);
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
  const parts = split({ ...combined, sent: ['shared:rs'] }, shared(), 'all');
  assert.deepEqual([parts.own.sent, parts.shared.sent], [[], ['rs']]);
});

test('listView filters by list', () => {
  const combined = combine(own(), shared(), 'all');
  assert.equal(listView(combined, null), combined);
  assert.deepEqual(listView(combined, 'own').items.map((entry) => entry.id), ['o1', 'o2']);
  assert.deepEqual(listView(combined, 'shared').items.map((entry) => entry.id), ['shared:s1', 'shared:s2']);
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
  const result = onList(combined, 'shared', (part) => toggleBought(part, 'shared:s2'), shared(), 'all');
  assert.deepEqual(result.state.items.map((entry) => entry.bought), [false, false, false, true]);
});

test('undo state round trip', () => {
  const before = combine(own(), shared(), 'all');
  const after = onList(before, 'shared', (part) => toggleBought(part, 'shared:s1'), shared(), 'all').state;
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
  assert.deepEqual(theirs.items.map((entry) => entry.id), ['shared:s1', 'shared:s2']);
  assert.deepEqual(theirs.recipes.map((entry) => entry.id), ['shared:rs']);
  assert.equal(theirs.menu.length, 1);
  assert.ok(theirs.menu.every(isShared));
  assert.deepEqual(theirs.sent, ['shared:rs']);
});

test('listPart of the shared list under scope list has no recipe and no meal', () => {
  const theirs = listPart(combine(own(), shared(), 'list'), 'shared');
  assert.deepEqual(theirs.items.map((entry) => entry.id), ['shared:s1', 'shared:s2']);
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
  const result = onList(combined, 'shared', (part) => sendRecipe(part, 'shared:rs', () => 'n1'), base, 'all');
  const parts = split(result.state, base, 'all');
  assert.deepEqual(parts.own.items, own().items);
  assert.deepEqual(parts.shared.items.map((entry) => entry.name), ['Leche', 'Sal', 'Arroz']);
  assert.deepEqual(parts.shared.sent, ['rs']);
  assert.deepEqual(parts.own.sent, ['ro']);
  assert.equal(result.added, 1);
});

test('a meal of a shared recipe keeps the own meal of that slot', () => {
  const combined = combine(own(), shared(), 'all');
  const result = onList(combined, 'shared', (part) => setMeal(part, 0, 'lunch', 'shared:rs'), shared(), 'all');
  const parts = split(result.state, shared(), 'all');
  assert.deepEqual(parts.own.menu, [{ day: 0, meal: 'lunch', recipe: 'ro' }]);
  assert.deepEqual(parts.shared.menu, [{ day: 0, meal: 'lunch', recipe: 'rs' }]);
  assert.equal(menuWeek(listPart(result.state, 'shared'))[0].meals[0].recipe.name, 'Paella');
  assert.equal(menuWeek(listPart(result.state, 'own'))[0].meals[0].recipe.name, 'Tortilla');
});

// I2: the two lists may hold one id each (the sample recipe of the walkthrough, an imported
// backup). The combined state gives the shared ids a prefix, so each id names one entity.
const twin = () => ({
  ...emptyState(),
  items: [item('x1', 'Pasta')],
  recipes: [{ id: 'sample-pasta', name: 'Pasta', products: ['Pasta'], url: '' }],
  menu: [{ day: 0, meal: 'lunch', recipe: 'sample-pasta' }],
});

test('one id in both lists gives two entities with distinct ids in the combined state', () => {
  const combined = combine(twin(), twin(), 'all');
  const ids = (entities) => entities.map((entry) => entry.id);
  assert.equal(new Set(ids(combined.items)).size, 2);
  assert.equal(new Set(ids(combined.recipes)).size, 2);
  const [mine, theirs] = combined.recipes;
  assert.equal(mine.id, 'sample-pasta');
  assert.notEqual(theirs.id, 'sample-pasta');
  assert.deepEqual(combined.menu.map((entry) => entry.recipe), [mine.id, theirs.id]);
});

test('a send of the own recipe of a shared id puts the id in the own sent only', () => {
  const combined = combine(twin(), twin(), 'all');
  const result = onList(combined, 'own', (part) => sendRecipe(part, 'sample-pasta', () => 'n1'), twin(), 'all');
  const parts = split(result.state, twin(), 'all');
  assert.deepEqual(parts.own.sent, ['sample-pasta']);
  assert.deepEqual(parts.shared.sent, []);
});

test('a send of the shared recipe of a shared id puts the id in the shared sent only', () => {
  const combined = combine(twin(), twin(), 'all');
  const theirs = combined.recipes.find(isShared);
  const result = onList(combined, 'shared', (part) => sendRecipe(part, theirs.id, () => 'n1'), twin(), 'all');
  const parts = split(result.state, twin(), 'all');
  assert.deepEqual(parts.own.sent, []);
  assert.deepEqual(parts.shared.sent, ['sample-pasta']);
});

test('a tick of the shared item of a shared id changes the shared part only', () => {
  const combined = combine(twin(), twin(), 'all');
  const theirs = combined.items.find(isShared);
  const parts = split(toggleBought(combined, theirs.id).state, twin(), 'all');
  assert.equal(parts.own.items[0].bought, false);
  assert.equal(parts.shared.items[0].bought, true);
  assert.deepEqual(parts.shared.items[0].id, 'x1');
});

test('combine then split of shared ids gives back both parts, for both scopes', () => {
  for (const scope of ['all', 'list']) {
    assert.deepEqual(split(combine(twin(), twin(), scope), twin(), scope), { own: twin(), shared: twin() });
  }
});

test('onList gives the combined id of a new shared recipe, and of an existing one', () => {
  const base = { ...emptyState(), menu: [{ day: 1, meal: 'dinner', dish: 'Sopa' }] };
  const combined = combine(emptyState(), base, 'all');
  const made = onList(combined, 'shared', (part) => dishRecipe(part, 'Sopa', () => 'r1'), base, 'all');
  assert.ok(made.state.recipes.some((entry) => entry.id === made.id && isShared(entry)));
  assert.deepEqual(split(made.state, base, 'all').shared.recipes.map((entry) => entry.id), ['r1']);
  const again = onList(made.state, 'shared', (part) => ({ state: part, id: part.recipes[0].id }), split(made.state, base, 'all').shared, 'all');
  assert.equal(again.id, made.id);
});

// I1: a manual move runs in the list of its rows, so it never writes the order of the other list.
test('a move of two own items in the name order keeps the shared items as they are', () => {
  const combined = combine(own(), shared(), 'all');
  const result = reorderList(combined, ['o2', 'o1'], shared(), 'all');
  const parts = split(result.state, shared(), 'all');
  assert.deepEqual(parts.shared, shared());
  assert.deepEqual(parts.own.items.map((entry) => entry.id), ['o2', 'o1']);
  assert.equal(parts.own.sort, 'custom');
});

test('a move of two shared items in the name order switches the own order to custom', () => {
  const base = { ...shared(), items: [item('s1', 'Sal'), item('s2', 'Arroz'), item('s3', 'Leche')] };
  const combined = combine({ ...own(), items: [item('o1', 'Pan'), item('o2', 'Leche')] }, base, 'all');
  // The screen shows Arroz, Leche, Sal: Sal goes above Arroz.
  const result = reorderList(combined, ['shared:s1', 'shared:s2', 'shared:s3'], base, 'all');
  const parts = split(result.state, base, 'all');
  assert.deepEqual(parts.shared.items.map((entry) => entry.name), ['Sal', 'Arroz', 'Leche']);
  assert.equal(parts.shared.sort, 'custom');
  // The own list keeps the order of the screen, in the custom order now.
  assert.deepEqual(parts.own.items.map((entry) => entry.name), ['Leche', 'Pan']);
  assert.equal(parts.own.sort, 'custom');
});

test('a move that changes nothing gives the same state', () => {
  const combined = { ...combine(own(), shared(), 'all'), sort: 'custom' };
  assert.equal(reorderList(combined, ['o1', 'o2'], shared(), 'all').state, combined);
  assert.equal(reorderList(combined, ['shared:s1', 'shared:s2'], shared(), 'all').state, combined);
});

test('a move of an unknown item is an error', () => {
  assert.equal(reorderList(combine(own(), shared(), 'all'), ['nope'], shared(), 'all').error.key, 'error.itemNotFound');
});

// I3: Llenar cesta fills each list from its own menu.
const withMenu = (items, recipeList, menuList) => ({ ...emptyState(), items, recipes: recipeList, menu: menuList });

test('fillLists fills the shared list from the shared menu when the own menu is empty', () => {
  const base = withMenu([], [{ id: 'r1', name: 'Paella', products: ['Arroz'], url: '' }], [{ day: 0, meal: 'lunch', recipe: 'r1' }]);
  const combined = combine(emptyState(), base, 'all');
  const result = fillLists(combined, base, 'all', () => 'n1');
  const parts = split(result.state, base, 'all');
  assert.deepEqual(parts.shared.items.map((entry) => entry.name), ['Arroz']);
  assert.deepEqual(parts.shared.sent, ['r1']);
  assert.deepEqual(parts.own.items, []);
  assert.deepEqual([result.added, result.already], [1, 0]);
});

test('fillLists fills each list from its menu and sums the sends', () => {
  const mine = withMenu([item('o1', 'Huevos')], [{ id: 'r1', name: 'Tortilla', products: ['Huevos', 'Patatas'], url: '' }], [{ day: 0, meal: 'lunch', recipe: 'r1' }]);
  const base = withMenu([], [{ id: 'r1', name: 'Paella', products: ['Arroz'], url: '' }], [{ day: 0, meal: 'lunch', recipe: 'r1' }]);
  let next = 0;
  const result = fillLists(combine(mine, base, 'all'), base, 'all', () => `n${(next += 1)}`);
  const parts = split(result.state, base, 'all');
  assert.deepEqual(parts.own.items.map((entry) => entry.name), ['Huevos', 'Patatas']);
  assert.deepEqual(parts.shared.items.map((entry) => entry.name), ['Arroz']);
  assert.deepEqual([parts.own.sent, parts.shared.sent], [['r1'], ['r1']]);
  assert.deepEqual([result.added, result.already], [2, 1]);
});

test('fillLists under scope list fills the own list only', () => {
  const base = withMenu([], [{ id: 'r1', name: 'Paella', products: ['Arroz'], url: '' }], [{ day: 0, meal: 'lunch', recipe: 'r1' }]);
  const result = fillLists(combine(emptyState(), base, 'list'), base, 'list', () => 'n1');
  assert.equal(result.error.key, 'error.menuEmpty');
});

test('fillLists gives menuEmpty only when both menus are empty', () => {
  const base = withMenu([], [], []);
  assert.equal(fillLists(combine(emptyState(), base, 'all'), base, 'all').error.key, 'error.menuEmpty');
  assert.equal(fillLists(emptyState(), null, null).error.key, 'error.menuEmpty');
});

test('fillLists gives menuNoProducts when no menu gives a product', () => {
  const base = withMenu([], [], [{ day: 0, meal: 'lunch', dish: 'Sopa' }]);
  assert.equal(fillLists(combine(emptyState(), base, 'all'), base, 'all').error.key, 'error.menuNoProducts');
});

test('fillLists that changes nothing gives the same state', () => {
  const base = withMenu([item('s1', 'Arroz')], [{ id: 'r1', name: 'Paella', products: ['Arroz'], url: '' }], [{ day: 0, meal: 'lunch', recipe: 'r1' }]);
  const sent = { ...base, sent: ['r1'] };
  const combined = combine(emptyState(), sent, 'all');
  const result = fillLists(combined, sent, 'all');
  assert.equal(result.state, combined);
  assert.deepEqual([result.added, result.already], [0, 1]);
});
