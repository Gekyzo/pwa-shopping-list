import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The look of the Stitch screens of Bodega (DSV-11, DSV-15 and later) as facts of styles.css.
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const tokensEnd = (() => {
  const start = css.indexOf('@layer tokens {');
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}' && (depth -= 1) === 0) return i + 1;
  }
  return css.length;
})();

// The light and the dark value of a token of the tokens layer, from `--name: light-dark(a, b)`.
const token = (name) => {
  const match = css.slice(0, tokensEnd).match(new RegExp(`${name}:\\s*light-dark\\((#[0-9a-f]+),\\s*(#[0-9a-f]+)\\)`, 'i'));
  return match ? { light: match[1].toLowerCase(), dark: match[2].toLowerCase() } : null;
};

// The declarations of every rule whose selector list holds `selector` exactly, joined.
export const block = (selector, source = css) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(',').map((part) => part.trim()).includes(selector))
    .map(([, , body]) => body)
    .join('\n');

test('the light palette is the palette of the Stitch screens (DSV-11)', () => {
  const light = {
    '--bg': '#fff8f5',
    '--surface': '#ffffff',
    '--surface-2': '#fcf2eb',
    '--secondary': '#f6ece6',
    '--text': '#1f1b17',
    '--muted': '#3f4942',
    '--struck': '#6f7a71',
    '--line': '#bec9c0',
    '--control': '#6f7a71',
    '--done': '#13734b',
    '--warning': '#a23e18',
    '--danger': '#ba1a1a',
  };
  for (const [name, value] of Object.entries(light)) assert.equal(token(name)?.light, value, name);
});

test('each token of the palette has a dark value of its own (DSV-11)', () => {
  for (const name of ['--bg', '--surface', '--surface-2', '--secondary', '--text', '--muted', '--struck', '--line', '--control', '--done', '--warning']) {
    const value = token(name);
    assert.ok(value, name);
    assert.notEqual(value.dark, value.light, name);
  }
});

test('the dark canvas is the ink of the light theme (DSV-11)', () => {
  assert.equal(token('--bg').dark, '#1f1b17');
  assert.equal(token('--done').dark, '#82d8a8');
});
