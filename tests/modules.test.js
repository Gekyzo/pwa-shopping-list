import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, switchModule, visibleSections } from '#modules';

test('MODULES are next and recipes', () => {
  assert.deepEqual(MODULES, ['next', 'recipes']);
});

test('visibleSections with no module off is the full bottom bar', () => {
  assert.deepEqual(visibleSections([]), ['active', 'next', 'recipes', 'menu', 'settings']);
});

test('visibleSections without next drops next', () => {
  assert.deepEqual(visibleSections(['next']), ['active', 'recipes', 'menu', 'settings']);
});

test('visibleSections without recipes drops recipes and menu', () => {
  assert.deepEqual(visibleSections(['recipes']), ['active', 'next', 'settings']);
});

test('visibleSections with all off keeps active and settings', () => {
  assert.deepEqual(visibleSections(['next', 'recipes']), ['active', 'settings']);
});

test('visibleSections ignores an unknown id', () => {
  assert.deepEqual(visibleSections(['shops']), ['active', 'next', 'recipes', 'menu', 'settings']);
});

test('switchModule turns a module off and on, in the order of MODULES', () => {
  assert.deepEqual(switchModule([], 'recipes', false), ['recipes']);
  assert.deepEqual(switchModule(['recipes'], 'next', false), ['next', 'recipes']);
  assert.deepEqual(switchModule(['next', 'recipes'], 'next', true), ['recipes']);
  assert.deepEqual(switchModule([], 'next', true), []);
});

test('switchModule ignores an unknown id and does not change its input', () => {
  const off = ['next'];
  assert.deepEqual(switchModule(off, 'shops', false), ['next']);
  assert.deepEqual(off, ['next']);
});
