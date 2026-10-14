import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAYERS, rulesOf } from '../designs/catalog.js';

// The rules of docs/spec/15-design-system.md over the real files.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const css = read('styles.css');
const rules = rulesOf(css);

test('styles.css declares the five layers first, and each rule is in one of them (DS-1)', () => {
  assert.match(css, /^@layer tokens, base, components, layouts, screens;/);
  assert.deepEqual(rules.filter((rule) => !LAYERS.includes(rule.layer)).map((rule) => `${rule.line}: ${rule.selector}`), []);
});
