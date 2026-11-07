import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sheetOpen, closeTop, keysBlocked, addHidden } from '#layers';

// A screen with nothing open, as `ui` of src/ui/context.js starts.
const closed = () => ({
  sheetOpen: false,
  arrangeOpen: false,
  tripOpen: false,
  aislesOpen: false,
  shareOpen: false,
  shopPickOpen: false,
  whatsNewOpen: false,
  editId: null,
  mealOpen: null,
  recipeId: null,
  openId: null,
  searchOpen: false,
});

test('sheetOpen is false with nothing open', () => {
  assert.equal(sheetOpen(closed()), false);
});

test('sheetOpen is true for each sheet', () => {
  for (const flag of ['sheetOpen', 'arrangeOpen', 'tripOpen', 'aislesOpen', 'shareOpen', 'shopPickOpen', 'whatsNewOpen']) {
    assert.equal(sheetOpen({ ...closed(), [flag]: true }), true, flag);
  }
  assert.equal(sheetOpen({ ...closed(), editId: 'id-1' }), true);
  assert.equal(sheetOpen({ ...closed(), mealOpen: { day: 0, meal: 'lunch' } }), true);
  assert.equal(sheetOpen({ ...closed(), recipeId: 'r-1' }), true);
});

test('sheetOpen is false for an open row or a search', () => {
  assert.equal(sheetOpen({ ...closed(), openId: 'id-1', searchOpen: true }), false);
});

test('closeTop gives the sheet first, then the row, then the search, then null', () => {
  const all = { ...closed(), editId: 'id-1', openId: 'id-2', searchOpen: true };
  assert.equal(closeTop(all), 'sheet');
  assert.equal(closeTop({ ...all, editId: null }), 'row');
  assert.equal(closeTop({ ...all, editId: null, openId: null }), 'search');
  assert.equal(closeTop(closed()), null);
});

test('closeTop does not change the screen state', () => {
  const view = { ...closed(), openId: 'id-1' };
  const copy = structuredClone(view);
  closeTop(view);
  assert.deepEqual(view, copy);
});

test('keysBlocked: the recipe pane beside the list does not block the keys of NAV-29', () => {
  const recipe = { ...closed(), recipeId: 'r1' };
  assert.equal(keysBlocked(recipe, { recipePane: true }), false);
  assert.equal(keysBlocked(recipe, { recipePane: false }), true);
  assert.equal(keysBlocked({ ...recipe, editId: 'i1' }, { recipePane: true }), true);
  assert.equal(keysBlocked({ ...recipe, sheetOpen: true }, { recipePane: true }), true);
  assert.equal(keysBlocked(closed(), { recipePane: false }), false);
  assert.equal(keysBlocked({ ...closed(), mealOpen: { day: 0, meal: 'lunch' } }, { recipePane: true }), true);
});

// NAV-8: an open sheet hides the floating add (fab, dock) but not the add of the header and the
// sidebar from 600px, so the bars keep their place under the veil.
test('addHidden hides every add in Ajustes and Menú, and with an empty-state action', () => {
  for (const place of ['float', 'bar']) {
    for (const view of ['settings', 'menu']) assert.equal(addHidden({ ...closed(), view }, { place }), true);
    assert.equal(addHidden({ ...closed(), view: 'list' }, { place, emptyAction: true }), true);
    assert.equal(addHidden({ ...closed(), view: 'recipes' }, { place }), false);
  }
});

test('addHidden hides the floating add while a sheet is open, and keeps the add of the bars', () => {
  const open = { ...closed(), view: 'list', sheetOpen: true };
  assert.equal(addHidden(open, { place: 'float' }), true);
  assert.equal(addHidden(open, { place: 'bar' }), false);
  assert.equal(addHidden({ ...closed(), view: 'recipes', arrangeOpen: true }, { place: 'bar' }), false);
});

test('addHidden keeps the floating add beside the recipe pane (REC-39)', () => {
  const pane = { ...closed(), view: 'recipes', recipeId: 'r-1' };
  assert.equal(addHidden(pane, { place: 'float', recipePane: true }), false);
  assert.equal(addHidden(pane, { place: 'float' }), true);
});
