import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

// The base sheet of the app in design-system/, owned here since 2026-11-07 (DSV-1 to DSV-4).
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const DIR = 'design-system/';
const listing = existsSync(new URL(DIR, root)) ? readdirSync(new URL(DIR, root)).sort() : [];
const sheets = listing.filter((file) => file.endsWith('.css'));
// The files of design-system/ that the page loads: the stylesheets and the modules of the import map.
const loaded = ['design-system.css', 'sheet.js'];

test('design-system/ holds the files of DSV-1 and no other file', () => {
  assert.deepEqual(listing, ['catalog.js', 'design-system.css', 'geist.woff2', 'rules.js', 'sheet.js']);
});

test('SHELL of sw.js has each stylesheet of design-system/', () => {
  const sw = read('sw.js');
  assert.ok(sheets.length > 0);
  for (const file of sheets) assert.ok(sw.includes(`'./${DIR}${file}'`), file);
});

test('SHELL of sw.js has each file of design-system/ that the page loads', () => {
  const sw = read('sw.js');
  for (const file of loaded) assert.ok(sw.includes(`'./${DIR}${file}'`), file);
});

test('SHELL caches the font of the design system', () => {
  assert.ok(read('sw.js').includes(`'./${DIR}geist.woff2'`));
});

const stylesheets = (html, prefix) =>
  [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(([, href]) => href).filter((href) => href.startsWith(prefix)).map((href) => href.slice(prefix.length));

test('index.html links the base stylesheet before styles.css', () => {
  assert.deepEqual(stylesheets(read('index.html'), './'), [`${DIR}design-system.css`, 'styles.css']);
});

test('designs/index.html links the base stylesheet before styles.css', () => {
  assert.deepEqual(stylesheets(read('designs/index.html'), '../'), [`${DIR}design-system.css`, 'styles.css']);
});

// The comments of `css` that open a part: `@component name` or `@extends name` (an override).
const markersOf = (css) =>
  [...css.matchAll(/\/\*[\s\S]*?\*\//g)]
    .map(({ 0: text, index }) => ({ text, line: css.slice(0, index).split('\n').length }))
    .filter(({ text }) => /^\/\*\s*@(component|extends)\s/.test(text));

const own = (rule) => ['components', 'layouts'].includes(rule.layer) && !rule.keyframe;

test('a rule of styles.css with a shared selector follows an @extends block', async () => {
  const { rulesOf } = await import(`../${DIR}catalog.js`);
  const app = read('styles.css');
  const shared = new Set(rulesOf(read(`${DIR}design-system.css`)).filter(own).map((rule) => rule.selector));
  const markers = markersOf(app);
  const copies = rulesOf(app)
    .filter((rule) => own(rule) && shared.has(rule.selector))
    .filter((rule) => !/^\/\*\s*@extends\s/.test(markers.filter((marker) => marker.line < rule.line).at(-1)?.text ?? ''))
    .map((rule) => `${rule.line}: ${rule.selector}`);
  assert.deepEqual(copies, []);
});

test('an @extends block of styles.css names a shared component', async () => {
  const { parseCatalog } = await import(`../${DIR}catalog.js`);
  const names = new Set(parseCatalog({ css: read(`${DIR}design-system.css`), sprite: '' }).components.map((part) => part.name));
  const overrides = [...read('styles.css').matchAll(/\/\*\s*@extends\s+([\w-]+)/g)].map(([, name]) => name);
  assert.ok(overrides.length > 0);
  assert.deepEqual(overrides.filter((name) => !names.has(name)), []);
});
