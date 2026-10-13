import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, direction, slideDirection, slideTo } from '#sections';

test('SECTIONS has the order of the bottom bar', () => {
  assert.deepEqual(SECTIONS, ['active', 'next', 'recipes', 'settings']);
});

test('slideDirection is 1 for a slide to the left and -1 for a slide to the right', () => {
  assert.equal(slideDirection(-80, 0), 1);
  assert.equal(slideDirection(80, 0), -1);
});

test('slideDirection is 0 for a short slide', () => {
  assert.equal(slideDirection(-59, 0), 0);
  assert.equal(slideDirection(59, 0), 0);
  assert.equal(slideDirection(0, 0), 0);
  assert.equal(slideDirection(-60, 0), 1);
});

test('slideDirection is 0 for a slide that is not horizontal', () => {
  assert.equal(slideDirection(-80, 41), 0);
  assert.equal(slideDirection(80, -120), 0);
  assert.equal(slideDirection(-80, 40), 1);
  assert.equal(slideDirection(80, -40), -1);
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

test('direction is 1 towards a later section and -1 towards an earlier one', () => {
  assert.equal(direction('active', 'next'), 1);
  assert.equal(direction('active', 'settings'), 1);
  assert.equal(direction('settings', 'recipes'), -1);
  assert.equal(direction('next', 'active'), -1);
});

test('direction is 0 for the same section and for a view that is not a section', () => {
  assert.equal(direction('next', 'next'), 0);
  assert.equal(direction('other', 'next'), 0);
  assert.equal(direction('next', 'other'), 0);
});
