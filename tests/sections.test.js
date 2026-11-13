import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SECTIONS, SHORTCUTS, ROUTES, canSearch, keyAction, keyMenuEcho, direction, dockShown, emptyAction, fabState, slideDirection, slideTo, shortcutStart, hashOfView, viewOfHash, historyDepth } from '#sections';

// headerOf reads the state of the views; a stub of the page lets node load them.
const stub = () => new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub(), set: () => true });
Object.assign(globalThis, { document: stub(), window: stub(), location: { search: '' } });
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { headerOf } = await import('#ui/list');
const { ui, state, replaceState } = await import('#ui/context');

test('headerOf gives Compra its counts to buy and bought, and no bar', () => {
  const view = ui.view;
  try {
    ui.view = 'active';
    assert.deepEqual(headerOf({ total: 15, left: 12 }), { title: 'Shopping', strong: '12 to buy', subtitle: ' · 3 bought' });
    assert.equal(headerOf({ total: 0, left: 0 }).strong, '');
    assert.equal(headerOf({ total: 4, left: 0 }).strong, '');
    for (const other of ['recipes', 'menu', 'settings']) {
      ui.view = other;
      assert.equal(headerOf({ total: 15, left: 12 }).strong, '', other);
      assert.ok(!('pct' in headerOf({ total: 15, left: 12 })), other);
    }
  } finally {
    ui.view = view;
  }
});

test('headerOf ends the subtitle of Recetas with where the recipes are kept, by the account state (DSV-32)', () => {
  const view = ui.view;
  const before = state;
  try {
    ui.view = 'recipes';
    assert.equal(headerOf({ total: 0, left: 0 }).note, '');
    replaceState({ ...before, recipes: [{ id: 'r1', name: 'Soup', products: [], url: '' }] });
    assert.equal(headerOf({ total: 0, left: 0 }).note, 'saved on this device');
    assert.equal(headerOf({ total: 0, left: 0 }, { signedIn: true }).note, 'synced');
    assert.equal(headerOf({ total: 0, left: 0 }).subtitle, '1 recipe');
  } finally {
    replaceState(before);
    ui.view = view;
  }
});

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

test('canSearch is true for Compra with an item and for Recetas with a recipe or a dish', () => {
  assert.equal(canSearch('active', { items: 1, recipes: 0 }), true);
  assert.equal(canSearch('recipes', { items: 0, recipes: 1 }), true);
});

test('canSearch is false for an empty Compra, an empty Recetas, Menú and Ajustes', () => {
  assert.equal(canSearch('active', { items: 0, recipes: 3 }), false);
  assert.equal(canSearch('recipes', { items: 3, recipes: 0 }), false);
  assert.equal(canSearch('menu', { items: 3, recipes: 3 }), false);
  assert.equal(canSearch('settings', { items: 3, recipes: 3 }), false);
});

test('emptyAction of an empty list with the sample recipe has a title, adds an item, and its ingredients second', () => {
  const result = emptyAction('active', { ...NO_QUERY, hasRecipes: true, sample: true });
  assert.deepEqual(result, { title: 'empty.activeTitle', text: 'empty.sample', action: 'add-item', secondary: 'add-sample' });
});

test('emptyAction of an empty list without the sample has a title and adds an item, as Recetas creates a recipe', () => {
  const result = emptyAction('active', { ...NO_QUERY, hasRecipes: true });
  assert.deepEqual(result, { title: 'empty.activeTitle', text: 'empty.active', action: 'add-item', secondary: null });
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

test('dockShown shows the dock in Compra with an item', () => {
  assert.equal(dockShown({ view: 'active', activeCount: 3, emptyAction: false }), true);
  assert.equal(dockShown({ view: 'active', activeCount: 0, emptyAction: true }), false);
  assert.equal(dockShown({ view: 'active', activeCount: 0, emptyAction: false }), false);
});

test('dockShown shows the dock in Recetas while the empty action does not show', () => {
  assert.equal(dockShown({ view: 'recipes', activeCount: 0, emptyAction: false }), true);
  assert.equal(dockShown({ view: 'recipes', activeCount: 3, emptyAction: false }), true);
  assert.equal(dockShown({ view: 'recipes', activeCount: 0, emptyAction: true }), false);
});

test('dockShown hides the dock in Menú and in Ajustes', () => {
  for (const view of ['menu', 'settings']) {
    assert.equal(dockShown({ view, activeCount: 3, emptyAction: false }), false, view);
  }
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

test('keyAction opens a section with the keys 1 to 4, in the order of NAV-1 (NAV-29)', () => {
  assert.deepEqual(['1', '2', '3', '4'].map((key) => keyAction({ key })), SECTIONS.map((view) => ({ type: 'view', view })));
});

test('keyAction adds with n or N and searches with /', () => {
  assert.deepEqual(keyAction({ key: 'n' }), { type: 'add' });
  assert.deepEqual(keyAction({ key: 'N', shift: true }), { type: 'add' });
  assert.deepEqual(keyAction({ key: '/' }), { type: 'search' });
});

test('keyAction opens the actions of a focused row, or deletes it', () => {
  assert.deepEqual(keyAction({ key: 'ContextMenu', onRow: true }), { type: 'rowMenu' });
  assert.deepEqual(keyAction({ key: 'F10', shift: true, onRow: true }), { type: 'rowMenu' });
  assert.deepEqual(keyAction({ key: 'Delete', onRow: true }), { type: 'rowDelete' });
  for (const input of [{ key: 'ContextMenu' }, { key: 'F10', shift: true }, { key: 'Delete' }]) assert.equal(keyAction({ ...input, onRow: false }), null, input.key);
  assert.equal(keyAction({ key: 'F10', onRow: true }), null);
});

test('keyAction does nothing in a text field, over a layer, or with a modifier', () => {
  const keys = [{ key: '1' }, { key: 'n' }, { key: '/' }, { key: 'ContextMenu', onRow: true }, { key: 'Delete', onRow: true }];
  for (const input of keys) {
    assert.equal(keyAction({ ...input, inField: true }), null, `field ${input.key}`);
    assert.equal(keyAction({ ...input, layer: true }), null, `layer ${input.key}`);
    for (const modifier of ['ctrl', 'meta', 'alt']) assert.equal(keyAction({ ...input, [modifier]: true }), null, `${modifier} ${input.key}`);
  }
});

test('keyAction ignores another key', () => {
  for (const key of ['5', '0', 'x', 'Enter', 'Escape', undefined]) assert.equal(keyAction({ key }), null, String(key));
});

test('keyMenuEcho: the contextmenu that follows a menu key within a second is its echo', () => {
  assert.equal(keyMenuEcho(1000, 1500), true);
  assert.equal(keyMenuEcho(1000, 2001), false);
  assert.equal(keyMenuEcho(null, 5), false);
});

test('each section has its own address, the same in every language (NAV-30)', () => {
  assert.deepEqual(SECTIONS.map(hashOfView), ['#/compra', '#/recetas', '#/menu', '#/ajustes']);
  assert.deepEqual(Object.keys(ROUTES), SECTIONS);
});

test('hashOfView gives the address of Compra for an unknown section (NAV-30)', () => {
  assert.equal(hashOfView('nope'), '#/compra');
});

test('viewOfHash reads the section of each address (NAV-30)', () => {
  for (const view of SECTIONS) assert.equal(viewOfHash(hashOfView(view)), view);
});

test('viewOfHash ignores case, accents and a missing slash (NAV-30)', () => {
  assert.equal(viewOfHash('#/Recetas'), 'recipes');
  assert.equal(viewOfHash('#/men%C3%BA'), 'menu');
  assert.equal(viewOfHash('#/Menú'), 'menu');
  assert.equal(viewOfHash('#ajustes'), 'settings');
});

test('viewOfHash gives Compra for no hash, an unknown one or a broken one (NAV-30)', () => {
  for (const hash of ['', '#', '#/', '#/nope', '#other=abc', '#/%E0%A4%A']) assert.equal(viewOfHash(hash), 'active', hash);
});

test('historyDepth: one entry for a section other than Compra, one for a layer (NAV-25, NAV-30)', () => {
  assert.equal(historyDepth('active', false), 0);
  assert.equal(historyDepth('active', true), 1);
  for (const view of ['recipes', 'menu', 'settings']) {
    assert.equal(historyDepth(view, false), 1, view);
    assert.equal(historyDepth(view, true), 2, view);
  }
});
