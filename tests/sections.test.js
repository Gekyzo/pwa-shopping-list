import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, direction, slideDirection, slideTo } from '#sections';

test('SECTIONS has the order of the bottom bar', () => {
  assert.deepEqual(SECTIONS, ['active', 'recipes', 'menu', 'settings']);
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
  assert.equal(slideTo('active', -80, 0), 'recipes');
  assert.equal(slideTo('recipes', -80, 0), 'menu');
  assert.equal(slideTo('menu', -80, 0), 'settings');
});

test('slideTo goes to the previous section on a slide to the right', () => {
  assert.equal(slideTo('settings', 80, 0), 'menu');
  assert.equal(slideTo('menu', 80, 0), 'recipes');
  assert.equal(slideTo('recipes', 80, 0), 'active');
});

test('slideTo stops at the first and at the last section', () => {
  assert.equal(slideTo('active', 200, 0), null);
  assert.equal(slideTo('settings', -200, 0), null);
});

test('slideTo ignores a short slide', () => {
  assert.equal(slideTo('recipes', -59, 0), null);
  assert.equal(slideTo('recipes', 59, 0), null);
  assert.equal(slideTo('recipes', 0, 0), null);
  assert.equal(slideTo('recipes', -60, 0), 'menu');
});

test('slideTo ignores a slide that is not horizontal', () => {
  assert.equal(slideTo('recipes', -80, 41), null);
  assert.equal(slideTo('recipes', 80, -120), null);
  assert.equal(slideTo('recipes', -80, 40), 'menu');
  assert.equal(slideTo('recipes', -80, -40), 'menu');
});

test('slideTo ignores a view that is not a section', () => {
  assert.equal(slideTo('other', -80, 0), null);
  assert.equal(slideTo('other', 80, 0), null);
});

test('direction is 1 towards a later section and -1 towards an earlier one', () => {
  assert.equal(direction('active', 'recipes'), 1);
  assert.equal(direction('active', 'settings'), 1);
  assert.equal(direction('settings', 'recipes'), -1);
  assert.equal(direction('recipes', 'menu'), 1);
  assert.equal(direction('recipes', 'active'), -1);
});

test('direction is 0 for the same section and for a view that is not a section', () => {
  assert.equal(direction('recipes', 'recipes'), 0);
  assert.equal(direction('other', 'recipes'), 0);
  assert.equal(direction('recipes', 'other'), 0);
  assert.equal(direction('next', 'active'), 0);
});

test('slideTo skips the sections that are not in the given list', () => {
  const sections = ['active', 'settings'];
  assert.equal(slideTo('active', -80, 0, sections), 'settings');
  assert.equal(slideTo('settings', 80, 0, sections), 'active');
  assert.equal(slideTo('active', -80, 0, ['active', 'settings']), 'settings');
});

test('direction uses the given list of sections', () => {
  const sections = ['active', 'settings'];
  assert.equal(direction('active', 'settings', sections), 1);
  assert.equal(direction('settings', 'active', sections), -1);
  assert.equal(direction('recipes', 'settings', sections), 0);
});
