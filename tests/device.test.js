import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BREAKPOINTS, CLASSES, FEATURES, deviceClass, features, gesturePointer } from '#device';

test('deviceClass gives the class of each width of DSV-9', () => {
  const widths = [0, 599, 600, 839, 840, 1023, 1024, 1440];
  const classes = ['phone', 'phone', 'foldable', 'foldable', 'tablet', 'tablet', 'desktop', 'desktop'];
  assert.deepEqual(widths.map(deviceClass), classes);
});

test('deviceClass gives phone for a width that is not a number or below 0', () => {
  assert.equal(deviceClass(NaN), 'phone');
  assert.equal(deviceClass(-1), 'phone');
  assert.equal(deviceClass(undefined), 'phone');
});

test('BREAKPOINTS are the three bounds of DSV-9', () => {
  assert.deepEqual(BREAKPOINTS, { foldable: 600, tablet: 840, desktop: 1024 });
  assert.deepEqual(CLASSES, ['phone', 'foldable', 'tablet', 'desktop']);
});

test('FEATURES has one entry for each class, as NAV-28 lists', () => {
  assert.deepEqual(Object.keys(FEATURES), CLASSES);
  assert.deepEqual(FEATURES.phone, { nav: 'bar', dock: true, panels: 'none', recipePane: false, searchField: false });
  assert.deepEqual(FEATURES.foldable, { nav: 'rail', dock: false, panels: 'below', recipePane: false, searchField: false });
  assert.deepEqual(FEATURES.tablet, { nav: 'rail', dock: false, panels: 'beside', recipePane: true, searchField: false });
  assert.deepEqual(FEATURES.desktop, { nav: 'sidebar', dock: false, panels: 'beside', recipePane: true, searchField: true });
});

test('features gives the phone entry for an unknown class', () => {
  assert.deepEqual(features('tv'), FEATURES.phone);
  assert.equal(features('tablet'), FEATURES.tablet);
});

test('gesturePointer is false for a mouse only', () => {
  assert.equal(gesturePointer('touch'), true);
  assert.equal(gesturePointer('pen'), true);
  assert.equal(gesturePointer(''), true);
  assert.equal(gesturePointer('mouse'), false);
});

test('the tables do not change', () => {
  assert.ok(Object.isFrozen(BREAKPOINTS));
  assert.ok(Object.isFrozen(CLASSES));
  assert.ok(Object.isFrozen(FEATURES));
  assert.ok(Object.isFrozen(FEATURES.desktop));
});
