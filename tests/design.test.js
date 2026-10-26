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
const SKIP = { 'DS-8': 'DSV-9 adds the desktop breakpoint 1024px; the test below runs DS-8 without it' };

// The app's desktop breakpoint (DSV-9), and a stylesheet with the content of one query's blocks taken out.
const DESKTOP = '(min-width: 1024px)';
const withoutQuery = (css, query) => {
  let out = css;
  for (let at = out.indexOf(`@media ${query}`); at !== -1; at = out.indexOf(`@media ${query}`)) {
    let depth = 0;
    let end = out.indexOf('{', at);
    do {
      if (out[end] === '{') depth += 1;
      if (out[end] === '}') depth -= 1;
      end += 1;
    } while (depth > 0);
    out = out.slice(0, at) + out.slice(end);
  }
  return out;
};

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

test('a width query uses 600px, 840px or the 1024px of DSV-9, as min-width (DS-8)', () => {
  const ds8 = RULES.find((rule) => rule.id === 'DS-8');
  assert.ok(read('styles.css').includes(`@media ${DESKTOP}`));
  assert.deepEqual(ds8.check({ ...files, css: [files.css[0], withoutQuery(files.css[1], DESKTOP)] }), []);
});

test('styles.css changes the rail only from 600px (LAY-2, DSV-9)', () => {
  const app = withoutQuery(withoutQuery(read('styles.css'), DESKTOP), '(min-width: 600px)');
  assert.doesNotMatch(app, /\.nav-bar\s*[{,]/);
  assert.match(read('styles.css'), /@extends nav-bar/);
});
