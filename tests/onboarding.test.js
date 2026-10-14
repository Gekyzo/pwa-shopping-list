import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAGES, isLast, shouldShow, step } from '#onboarding';

test('PAGES has the six pages in their order, each one time', () => {
  assert.deepEqual(PAGES, ['lists', 'trip', 'row', 'sections', 'recipes', 'sample']);
  assert.equal(new Set(PAGES).size, PAGES.length);
});

test('shouldShow is true for no flag and no stored state', () => {
  assert.equal(shouldShow({ seen: false, hasState: false }), true);
});

test('shouldShow is false for a stored state', () => {
  assert.equal(shouldShow({ seen: false, hasState: true }), false);
});

test('shouldShow is false after the walkthrough was seen', () => {
  assert.equal(shouldShow({ seen: true, hasState: false }), false);
  assert.equal(shouldShow({ seen: true, hasState: true }), false);
});

test('step goes one page forward and one page back', () => {
  assert.equal(step(0, 1), 1);
  assert.equal(step(2, 1), 3);
  assert.equal(step(3, -1), 2);
  assert.equal(step(1, -1), 0);
});

test('step stays on the page for no direction', () => {
  assert.equal(step(2, 0), 2);
});

test('step does not go past the first and the last page', () => {
  assert.equal(step(0, -1), 0);
  assert.equal(step(PAGES.length - 1, 1), PAGES.length - 1);
});

test('isLast is true for the last page only', () => {
  assert.equal(isLast(PAGES.length - 1), true);
  assert.equal(isLast(0), false);
  assert.equal(isLast(PAGES.length - 2), false);
});
