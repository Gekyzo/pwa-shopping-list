import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS } from '#i18n';
import { PAGES } from '#onboarding';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const body = html.slice(html.indexOf('<body'), html.indexOf('<script type="importmap">'));

const textKeys = [...body.matchAll(/data-i18n="([^"]+)"/g)].map(([, key]) => key);
const attrKeys = [...body.matchAll(/data-i18n-attr="([^"]+)"/g)].flatMap(([, pairs]) =>
  pairs.split(',').map((pair) => pair.split(':')[1]));

test('the page has translated text and translated attributes', () => {
  assert.ok(textKeys.length > 0);
  assert.ok(attrKeys.length > 0);
});

test('each key of the page is in the Spanish catalog', () => {
  for (const key of [...textKeys, ...attrKeys]) assert.ok(Object.hasOwn(CATALOGS.es, key), key);
});

test('an element with a text key is empty in the markup', () => {
  for (const [, key, text] of body.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)) assert.equal(text.trim(), '', key);
});

test('the markup has no text of its own', () => {
  const visible = body
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[+\s]/g, '');
  assert.equal(visible, '');
  assert.doesNotMatch(body, /\s(aria-label|placeholder|title)="/);
});

test('the walkthrough has one drawing for each page, in the order of the pages', () => {
  const [layer = ''] = body.match(/<div id="onboarding"[\s\S]*?<input id="import-file"/) ?? [];
  const drawings = [...layer.matchAll(/<svg data-page="([^"]+)"/g)].map(([, page]) => page);
  assert.deepEqual(drawings, PAGES);
});

test('the walkthrough shows the app icon first, out of the page that changes, with no text', () => {
  const [, layer = ''] = body.match(/<div id="onboarding"[^>]*>\s*([\s\S]*?)<div id="onboarding-page"/) ?? [];
  assert.match(layer, /^<img class="onboarding-logo" src="\.\/icons\/logo\.png" alt="">\s*$/);
});

test('the walkthrough has Saltar and the next button in one bar at the bottom, Saltar first', () => {
  const [bar = ''] = body.match(/<div class="onboarding-actions">[\s\S]*?<\/div>/) ?? [];
  const buttons = [...bar.matchAll(/<button id="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(buttons, ['onboarding-skip', 'onboarding-next']);
  assert.doesNotMatch(body, /onboarding-top/);
});

test('the trip button opens a sheet from the bottom, with a veil, and the header has no dropdown', () => {
  const [layer = ''] = body.match(/<div id="trip" class="sheet-layer"[\s\S]*?<\/div>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="trip-veil" class="sheet-veil">/);
  assert.match(layer, /<div class="sheet" role="dialog"/);
  assert.match(layer, /<header class="sheet-head"><h2 class="sheet-title main" data-i18n="trip.menu"><\/h2>/);
  assert.match(layer, /<div class="sheet-body">\s*<p id="finish-menu-text" class="hint trip-open">[\s\S]*<p id="trip-open" class="hint trip-open" hidden>[\s\S]*<button id="finish-menu" class="button primary wide"/);
  assert.doesNotMatch(layer, /trip-open-list|trip-confirm/);
  assert.match(body, /<button id="trip-button"[^>]*aria-haspopup="dialog"[^>]*aria-controls="trip"/);
  assert.doesNotMatch(body, /trip-menu|role="menu"/);
});

// Each sheet of the page: the markup from its open tag to the open tag of the next sheet.
const sheetParts = () => {
  const opens = [...body.matchAll(/<(div|form) (?:id="([^"]+)" )?class="sheet"/g)];
  return opens.map((open, i) => ({ id: open[2] ?? null, part: body.slice(open.index, opens[i + 1]?.index ?? body.length) }));
};

test('each of the eight sheets has the grab, then a head with its title and Listo, then a body', () => {
  const parts = sheetParts();
  assert.equal(parts.length, 8);
  for (const { id, part } of parts) {
    assert.match(
      part,
      /^<(div|form)[^>]*>\s*<div class="sheet-grab"><\/div>\s*<header class="sheet-head"><h2 [^>]*class="sheet-title main"[^>]*><\/h2><button class="button primary" type="button" data-i18n="edit.done"><\/button><\/header>\s*<div class="sheet-body">/,
      id ?? part.slice(0, 60),
    );
  }
});

test('the edit and recipe sheets have a foot with Eliminar and Guardado; the other sheets have none', () => {
  const feet = sheetParts().filter(({ part }) => part.includes('sheet-foot')).map(({ id }) => id);
  assert.deepEqual(feet, ['edit-form', 'recipe-sheet']);
  for (const [id, prefix] of [['edit-form', 'edit'], ['recipe-sheet', 'recipe']]) {
    const { part } = sheetParts().find((sheet) => sheet.id === id);
    assert.match(
      part,
      new RegExp(`<\\/div>\\s*<footer class="sheet-foot"><button id="${prefix}-delete" class="button outline danger" type="button"><svg [^>]*><use href="icons.svg#trash"\\/><\\/svg><span data-i18n="sheet.delete"><\\/span><\\/button><span class="sheet-saved"><svg [^>]*><use href="icons.svg#check"\\/><\\/svg><span data-i18n="sheet.saved"><\\/span><\\/span><\\/footer>\\s*<\\/(div|form)>`),
      id,
    );
  }
});

test('the sheets with a title of their own give it an id; the others a fixed text', () => {
  const titles = sheetParts().map(({ part }) => part.match(/<h2 ([^>]*)class="sheet-title main"([^>]*)>/).slice(1).join(''));
  assert.deepEqual(titles, [
    'id="add-title" ',
    ' data-i18n="arrange.label"',
    ' data-i18n="trip.menu"',
    'id="meal-title" ',
    ' data-i18n="nav.menu"',
    'id="edit-title" ',
    ' data-i18n="aisles.title"',
    'id="recipe-title" ',
  ]);
});

test('the empty state of a list holds an action button, hidden for now', () => {
  assert.match(body, /<div id="empty" class="empty-state" hidden>\s*<p id="empty-text"><\/p>\s*<button id="empty-action" class="button primary wide" type="button" data-i18n="empty.action" hidden><\/button>\s*<\/div>/);
});

test('the edit sheet has a veil, a dialog, the name and quantity fields and the shops', () => {
  const [layer = ''] = body.match(/<div id="edit" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="edit-veil" class="sheet-veil">/);
  assert.match(layer, /<form id="edit-form" class="sheet" role="dialog"/);
  assert.match(layer, /<input id="edit-name"[^>]*maxlength="80"/);
  assert.match(layer, /<input id="edit-quantity"[^>]*maxlength="20"/);
  // Each field keeps its name in sight: a label that floats onto the border once the field has a value.
  assert.match(layer, /<label class="field"><input id="edit-name"[^>]*><span class="field-label" data-i18n="edit.name"><\/span><\/label>/);
  assert.match(layer, /<label class="field"><input id="edit-quantity"[^>]*><span class="field-label" data-i18n="edit.quantity"><\/span><\/label>/);
  // The switch of the recurrence follows the fields (LIST-7), then a titled part holds the shops of the item.
  assert.match(layer, /<span class="field-label" data-i18n="edit.quantity"><\/span><\/label>\s*<label class="switch"><span data-i18n="edit.repeat"><\/span><input id="edit-repeat" class="switch-input" type="checkbox" role="switch"><\/label>\s*<h2 class="sheet-title part" data-i18n="edit.shops"><\/h2>\s*<div id="edit-chips" class="cluster">/);
  assert.match(layer, /<input id="edit-shop"[^>]*maxlength="40"/);
  assert.doesNotMatch(body, /id="shops/);
});

test('the meal sheet has a recipe search between the title and the chips, and a no-match text', () => {
  const [layer = ''] = body.match(/<div id="meal" class="sheet-layer"[\s\S]*?<\/div>\s*<\/div>/) ?? [];
  const ids = [...layer.matchAll(/ id="([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(ids, ['meal', 'meal-veil', 'meal-sheet', 'meal-title', 'meal-query', 'meal-empty', 'meal-chips', 'meal-remove']);
  assert.match(layer, /<input id="meal-query" class="input" type="search"[^>]*data-i18n-attr="placeholder:recipes.search,aria-label:recipes.search"/);
  assert.match(layer, /<p id="meal-empty"[^>]*hidden><\/p>/);
});

test('Llenar cesta stands in an action bar; Vaciar menú is an entry of the menu sheet', () => {
  assert.match(body, /<div id="menu-actions" class="action-bar" hidden>\s*<button id="menu-fill" class="button primary wide"/);
  const { part } = sheetParts().find((sheet) => sheet.id === 'menu-more-sheet');
  assert.match(part, /<button id="menu-clear" class="button outline entry"[^>]*>[\s\S]*?<small class="entry-note" data-i18n="menu.clearNote"><\/small>/);
  assert.doesNotMatch(body, /class="split menu-actions"/);
  assert.match(body, /<button id="trip-button"[^>]*data-i18n-attr="aria-label:trip.menu"/);
});

test('the es text of menu.fill is Llenar cesta', async () => {
  const { default: es } = await import('../src/locales/es.js');
  assert.equal(es['menu.fill'], 'Llenar cesta');
});
