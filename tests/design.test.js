import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { RULES } from '../vendor/design-system/rules.js';
import { parseCatalog, classesInScript } from '../vendor/design-system/catalog.js';

// The rules of the design system (docs/spec/15-design-system.md) over the files of the app.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const optional = (path) => (existsSync(new URL(path, root)) ? read(path) : '');

const files = {
  css: [read('vendor/design-system/design-system.css'), read('styles.css')],
  html: read('index.html'),
  scripts: readdirSync(new URL('src/ui/', root)).map((file) => [file, read(`src/ui/${file}`)]),
  sprite: optional('icons.svg'),
  page: optional('designs/page.js'),
  pageHtml: optional('designs/index.html'),
};

// The exceptions of docs/spec/15-design-system.md, by rule id.
const SKIP = {};

test('the rules read the shared stylesheet and styles.css', () => {
  // LAY-4 reads the body rule of the app only when there are two sheets.
  assert.equal(files.css.length, 2);
});

test('the design system has rules to run', () => {
  assert.ok(RULES.length > 0);
});

for (const rule of RULES) test(rule.title, { skip: SKIP[rule.id] ?? false }, () => assert.deepEqual(rule.check(files), []));

test('the parts of the app are documented in styles.css (DSV-3)', () => {
  const names = parseCatalog({ css: read('styles.css'), sprite: files.sprite }).components.map((part) => part.name);
  for (const name of ['shop-lists', 'search', 'product-form', 'hint']) assert.ok(names.includes(name), name);
});

test('the design test reads the classes of the item rows, states included', () => {
  const rows = classesInScript(read('src/ui/rows.js'));
  for (const name of ['item-row', 'bought', 'flash', 'gone', 'item-row-swipe', 'open', 'item-row-end', 'item-row-label', 'tick']) assert.ok(rows.includes(name), name);
});

test('a recipe row has one send button in the end slot and no mark', () => {
  const script = read('src/ui/recipes.js');
  assert.ok(!script.includes('recipe-mark'));
  assert.ok(!read('styles.css').includes('recipe-mark'));
  for (const name of ['item-row-end', 'item-row-label']) assert.ok(classesInScript(script).includes(name), name);
});

test('styles.css leaves the rail to the design system (LAY-2)', () => {
  const app = read('styles.css');
  assert.doesNotMatch(app, /\.nav-bar\s*[{,]/);
  assert.doesNotMatch(app, /@extends nav-bar/);
});
