import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sheetOpen, closeTop } from '#layers';

// A screen with nothing open, as `ui` of src/ui/context.js starts.
const closed = () => ({
  sheetOpen: false,
  arrangeOpen: false,
  tripOpen: false,
  menuMoreOpen: false,
  aislesOpen: false,
  shopPickOpen: false,
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
  for (const flag of ['sheetOpen', 'arrangeOpen', 'tripOpen', 'menuMoreOpen', 'aislesOpen', 'shopPickOpen']) {
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
