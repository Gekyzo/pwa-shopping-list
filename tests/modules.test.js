import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, switchModule, visibleSections } from '#modules';

test('MODULES is recipes only', () => {
  assert.deepEqual(MODULES, ['recipes']);
});

test('visibleSections with no module off is the full bottom bar', () => {
  assert.deepEqual(visibleSections([]), ['active', 'recipes', 'menu', 'settings']);
});

test('visibleSections without recipes drops recipes and menu', () => {
  assert.deepEqual(visibleSections(['recipes']), ['active', 'settings']);
});

test('visibleSections ignores an unknown id and the old next module', () => {
  assert.deepEqual(visibleSections(['shops']), ['active', 'recipes', 'menu', 'settings']);
  assert.deepEqual(visibleSections(['next']), ['active', 'recipes', 'menu', 'settings']);
});

test('switchModule turns a module off and on, in the order of MODULES', () => {
  assert.deepEqual(switchModule([], 'recipes', false), ['recipes']);
  assert.deepEqual(switchModule(['recipes'], 'recipes', false), ['recipes']);
  assert.deepEqual(switchModule(['recipes'], 'recipes', true), []);
  assert.deepEqual(switchModule([], 'recipes', true), []);
});

test('switchModule ignores an unknown id and does not change its input', () => {
  const off = ['recipes'];
  assert.deepEqual(switchModule(off, 'shops', false), ['recipes']);
  assert.deepEqual(switchModule(off, 'next', false), ['recipes']);
  assert.deepEqual(off, ['recipes']);
});
