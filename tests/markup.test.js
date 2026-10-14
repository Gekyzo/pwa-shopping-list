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
  assert.match(layer, /<button id="finish-menu"/);
  assert.match(body, /<button id="trip-button"[^>]*aria-haspopup="dialog"[^>]*aria-controls="trip"/);
  assert.doesNotMatch(body, /trip-menu|role="menu"/);
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
  // A titled part after the fields holds the shops of the item.
  assert.match(layer, /<span class="field-label" data-i18n="edit.quantity"><\/span><\/label>\s*<h2 class="sheet-title part" data-i18n="edit.shops"><\/h2>\s*<div id="edit-chips" class="cluster">/);
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
