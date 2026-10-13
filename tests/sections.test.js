import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, slideTo } from '../src/sections.js';

test('SECTIONS has the order of the bottom bar', () => {
  assert.deepEqual(SECTIONS, ['active', 'next', 'recipes', 'settings']);
});

test('slideTo goes to the next section on a slide to the left', () => {
  assert.equal(slideTo('active', -80, 0), 'next');
  assert.equal(slideTo('next', -80, 0), 'recipes');
  assert.equal(slideTo('recipes', -80, 0), 'settings');
});

test('slideTo goes to the previous section on a slide to the right', () => {
  assert.equal(slideTo('settings', 80, 0), 'recipes');
  assert.equal(slideTo('recipes', 80, 0), 'next');
  assert.equal(slideTo('next', 80, 0), 'active');
});

test('slideTo stops at the first and at the last section', () => {
  assert.equal(slideTo('active', 200, 0), null);
  assert.equal(slideTo('settings', -200, 0), null);
});

test('slideTo ignores a short slide', () => {
  assert.equal(slideTo('next', -59, 0), null);
  assert.equal(slideTo('next', 59, 0), null);
  assert.equal(slideTo('next', 0, 0), null);
  assert.equal(slideTo('next', -60, 0), 'recipes');
});

test('slideTo ignores a slide that is not horizontal', () => {
  assert.equal(slideTo('next', -80, 41), null);
  assert.equal(slideTo('next', 80, -120), null);
  assert.equal(slideTo('next', -80, 40), 'recipes');
  assert.equal(slideTo('next', -80, -40), 'recipes');
});

test('slideTo ignores a view that is not a section', () => {
  assert.equal(slideTo('other', -80, 0), null);
  assert.equal(slideTo('other', 80, 0), null);
});
