import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS } from '#i18n';

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
