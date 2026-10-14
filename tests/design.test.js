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

const TOKEN_PROPERTIES = /^(color|background(-color)?|border(-(top|right|bottom|left))?(-color)?|outline(-color)?|fill|stroke|padding(-\w+)?|margin(-\w+)?|gap|row-gap|column-gap|inset|top|right|bottom|left|font-size|font-weight|font-family|font|border-radius|box-shadow|transition|animation)$/;
// A value part that needs no token: a keyword, a token, env(), a percent, or a small border width.
const ALLOWED = /^(0|1px|2px|-?\d+(\.\d+)?%|-?\d+deg|var\(--[\w-]+\)|env\([\w-]+\)|[a-zA-Z-]+)$/;

// The parts of a value that are raw: a length, a time, a colour or a quoted font name.
const rawParts = (value) =>
  value
    .replace(/var\(--[\w-]+\)/g, ' ')
    .replace(/env\([\w-]+\)/g, ' ')
    .replace(/[(),/*+]/g, ' ')
    .split(/\s+/)
    .filter((part) => part && !ALLOWED.test(part) && !/^-?\d+(\.\d+)?$/.test(part));

const where = (rule, d) => `${d.line}: ${rule.selector} { ${d.property}: ${d.value} }`;

test('a raw value of a token property is only in the tokens layer (DS-2)', () => {
  const raw = rules
    .filter((rule) => rule.layer !== 'tokens' && !rule.keyframe)
    .flatMap((rule) => rule.declarations.filter((d) => TOKEN_PROPERTIES.test(d.property) && rawParts(d.value).length).map((d) => where(rule, d)));
  assert.deepEqual(raw, []);
});

test('a keyframe takes its colours from the tokens (DS-2)', () => {
  const raw = rules
    .filter((rule) => rule.keyframe)
    .flatMap((rule) => rule.declarations.filter((d) => /colou?r|background/.test(d.property) && rawParts(d.value).length).map((d) => where(rule, d)));
  assert.deepEqual(raw, []);
});

test('a raw width or height is not in the screens layer (DS-2)', () => {
  const raw = rules
    .filter((rule) => rule.layer === 'screens')
    .flatMap((rule) => rule.declarations.filter((d) => /^(min-|max-)?(width|height)$/.test(d.property) && /\d(px|rem)/.test(d.value.replace(/var\([^)]*\)/g, ''))).map((d) => where(rule, d)));
  assert.deepEqual(raw, []);
});

test('reduced motion sets the motion tokens to 0ms in one place (DS-2)', () => {
  assert.equal((css.match(/prefers-reduced-motion/g) ?? []).length, 1);
  const motion = rules.filter((rule) => rule.layer === 'tokens' && rule.declarations.some((d) => d.property === '--motion' && d.value === '0ms'));
  assert.equal(motion.length, 1);
});
