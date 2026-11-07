import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { RULES } from '../design-system/rules.js';
import { parseCatalog, classesInScript } from '../design-system/catalog.js';

// The rules of the design system (docs/spec/15-design-system.md) over the files of the app.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const optional = (path) => (existsSync(new URL(path, root)) ? read(path) : '');

const files = {
  css: [read('design-system/design-system.css'), read('styles.css')],
  html: read('index.html'),
  scripts: readdirSync(new URL('src/ui/', root)).map((file) => [file, read(`src/ui/${file}`)]),
  sprite: optional('icons.svg'),
  page: optional('designs/page.js'),
  pageHtml: optional('designs/index.html'),
};

test('the rules read the shared stylesheet and styles.css', () => {
  // LAY-4 reads the body rule of the app only when there are two sheets.
  assert.equal(files.css.length, 2);
});

test('the design system has rules to run', () => {
  assert.ok(RULES.length > 0);
});

for (const rule of RULES) test(rule.title, () => assert.deepEqual(rule.check(files), []));

test('the parts of the app are documented in styles.css (DSV-3)', () => {
  const names = parseCatalog({ css: read('styles.css'), sprite: files.sprite }).components.map((part) => part.name);
  for (const name of ['shop-lists', 'search', 'product-form', 'hint']) assert.ok(names.includes(name), name);
});

test('the design test reads the classes of the item rows, states included', () => {
  const rows = classesInScript(read('src/ui/rows.js'));
  for (const name of ['item-row', 'bought', 'flash', 'gone', 'item-row-swipe', 'open', 'item-row-end', 'item-row-label', 'tick', 'bought-head']) assert.ok(rows.includes(name), name);
});

test('a recipe row has one send button in the end slot and no mark', () => {
  const script = read('src/ui/recipes.js');
  assert.ok(!script.includes('recipe-mark'));
  assert.ok(!read('styles.css').includes('recipe-mark'));
  for (const name of ['item-row-end', 'item-row-label']) assert.ok(classesInScript(script).includes(name), name);
});

test('styles.css leaves the layout of the rail to the design system (LAY-2, DSV-8)', () => {
  // The version of nav-bar (DSV-13) sets colour and weight only, never the place or size of the bar.
  const layout = /^\s*(position|inset[\w-]*|top|right|bottom|left|width|height|min-\w+|max-\w+|display|flex[\w-]*|justify-content|align-items|padding[\w-]*|margin[\w-]*|gap|order)\s*:/m;
  const blocks = [...read('styles.css').matchAll(/([^{}]*\.nav-(?:bar|item)[^{}]*)\{([^{}]*)\}/g)];
  assert.ok(blocks.length > 0);
  for (const [, selector, body] of blocks) assert.doesNotMatch(body, layout, selector.trim());
});
