import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTIONS, SHORTCUTS, direction, emptyAction, fabState, slideDirection, slideTo, shortcutStart } from '#sections';

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

test('shortcutStart opens the add sheet of Compra for add', () => {
  assert.deepEqual(shortcutStart('add'), { view: 'active', add: true });
});

test('shortcutStart opens the section of a section shortcut, with no sheet', () => {
  for (const view of ['active', 'recipes', 'menu']) assert.deepEqual(shortcutStart(view), { view, add: false });
});

test('shortcutStart is null for an unknown name, for settings and for no name', () => {
  for (const name of ['settings', 'other', '', null, undefined, 'toString']) assert.equal(shortcutStart(name), null);
});

test('SHORTCUTS has each shortcut of the manifest, in its order', () => {
  const manifest = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.shortcuts.map(({ url }) => url), SHORTCUTS.map((name) => `./?open=${name}`));
  for (const name of SHORTCUTS) assert.ok(shortcutStart(name), name);
});

const NO_QUERY = { query: '', hasRecipes: false, sample: false };

test('emptyAction of Recetas with no recipe creates one', () => {
  assert.deepEqual(emptyAction('recipes', NO_QUERY), { title: 'empty.recipesTitle', text: 'empty.recipes', action: 'create-recipe', secondary: null });
});

test('emptyAction of Menu has no empty text', () => {
  // Menú always shows its week (MENU-14).
  assert.deepEqual(emptyAction('menu', NO_QUERY), { title: null, text: null, action: null, secondary: null });
});

test('emptyAction of a list search with no match adds the searched name', () => {
  const result = emptyAction('active', { ...NO_QUERY, query: ' xyz ' });
  assert.deepEqual(result, { title: null, text: 'empty.noItemMatch', action: 'add-query', secondary: null });
});

test('emptyAction of a search that is only spaces is the empty list', () => {
  assert.equal(emptyAction('active', { ...NO_QUERY, query: '   ' }).text, 'empty.active');
});

test('emptyAction of a recipe search with no match has no action', () => {
  const result = emptyAction('recipes', { query: 'xyz', hasRecipes: true, sample: false });
  assert.deepEqual(result, { title: null, text: 'empty.noMatch', action: null, secondary: null });
});

test('emptyAction of an empty list has no title, as the header says it is empty; with the sample recipe it adds an item, and its ingredients second', () => {
  const result = emptyAction('active', { ...NO_QUERY, hasRecipes: true, sample: true });
  assert.deepEqual(result, { title: null, text: 'empty.sample', action: 'add-item', secondary: 'add-sample' });
});

test('emptyAction of an empty list without the sample leaves the add button as the action', () => {
  const result = emptyAction('active', { ...NO_QUERY, hasRecipes: true });
  assert.deepEqual(result, { title: null, text: 'empty.active', action: null, secondary: null });
});

test('emptyAction of a section with nothing to say is empty', () => {
  assert.deepEqual(emptyAction('settings', NO_QUERY), { title: null, text: null, action: null, secondary: null });
});

test('fabState collapses the add button after a scroll down of more than 24 px', () => {
  assert.equal(fabState(0, 30, 'open'), 'collapsed');
  assert.equal(fabState(100, 125, 'open'), 'collapsed');
  assert.equal(fabState(100, 124, 'open'), 'open');
});

test('fabState opens the add button on any scroll up', () => {
  assert.equal(fabState(31, 30, 'collapsed'), 'open');
  assert.equal(fabState(200, 199, 'open'), 'open');
});

test('fabState opens the add button at the top of the list', () => {
  assert.equal(fabState(10, 0, 'collapsed'), 'open');
  assert.equal(fabState(0, 0, 'collapsed'), 'open');
});

test('fabState keeps the state on a short scroll down', () => {
  assert.equal(fabState(0, 10, 'collapsed'), 'collapsed');
  assert.equal(fabState(0, 10, 'open'), 'open');
});

test('the section slide does not start on the dock', () => {
  const nav = readFileSync(new URL('../src/ui/nav.js', import.meta.url), 'utf8');
  const [exclusion = ''] = nav.match(/event\.target\.closest\('\.item-row-swipe[^']*'\)/) ?? [];
  assert.match(exclusion, /\.dock\b/);
});
