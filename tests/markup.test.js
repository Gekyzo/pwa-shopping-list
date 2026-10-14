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
  assert.match(layer, /<div id="trip-veil" class="veil">/);
  assert.match(layer, /<div class="sheet" role="dialog"/);
  assert.match(layer, /<button id="finish-menu"/);
  assert.match(body, /<button id="trip-button"[^>]*aria-haspopup="dialog"[^>]*aria-controls="trip"/);
  assert.doesNotMatch(body, /trip-menu|role="menu"/);
});

test('the edit sheet has a veil, a dialog, the name field and the shops', () => {
  const [layer = ''] = body.match(/<div id="edit" class="sheet-layer"[\s\S]*?<\/form>\s*<\/div>/) ?? [];
  assert.match(layer, /<div id="edit-veil" class="veil">/);
  assert.match(layer, /<form id="edit-form" class="sheet" role="dialog"/);
  assert.match(layer, /<input id="edit-name"[^>]*maxlength="80"/);
  assert.match(layer, /<div id="edit-chips" class="chips">/);
  assert.match(layer, /<input id="edit-shop"[^>]*maxlength="40"/);
  assert.doesNotMatch(body, /id="shops/);
});
