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

// styles.css with no comments, so a selector list never holds the text of a comment.
const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');

// The selectors of a list, split on the commas outside parentheses, so `:is(a, b)` stays whole.
const topLevel = (selectors) => {
  const parts = [''];
  let depth = 0;
  for (const char of selectors) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) parts.push('');
    else parts[parts.length - 1] += char;
  }
  return parts.map((part) => part.trim().replace(/\s+/g, ' '));
};

// The declarations of every rule whose selector list holds `selector` exactly, joined.
export const block = (selector, source = plain) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => topLevel(selectors).includes(selector))
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

const ROW_LABEL = '.item-row-body:has(> .item-row-check) .item-row-label';

test('the name of a row of Compra keeps one line, then ends with an ellipsis (DSV-15)', () => {
  const body = block(ROW_LABEL);
  assert.match(body, /white-space:\s*nowrap/);
  assert.match(body, /overflow:\s*hidden/);
  assert.match(body, /text-overflow:\s*ellipsis/);
  assert.match(body, /display:\s*block/);
});

test('the quantity of a row is a tonal chip with no border (DSV-15)', () => {
  const rules = [...plain.matchAll(/(^|\})\s*\.item-row-qty\s*\{([^{}]*)\}/g)].map(([, , body]) => body);
  const last = rules.at(-1);
  assert.match(last, /border:\s*0/);
  assert.match(last, /background:\s*var\(--secondary\)/);
});

test('no hex colour outside the tokens layer', () => {
  assert.deepEqual(css.slice(tokensEnd).match(/#[0-9a-f]{3,8}\b/gi) ?? [], []);
});

test('the bought items stand in a card of their own, on --surface-2 (DSV-16)', () => {
  const head = block('.item-list > .bought-head');
  assert.match(head, /background:\s*var\(--surface-2\)/);
  assert.match(head, /border:\s*1px solid var\(--line\)/);
  assert.match(head, /border-radius:\s*var\(--radius-l\)/);
  assert.match(block('.bought-icon'), /color:\s*var\(--done\)/);
});

test('the dock floats over the list: no bar, its controls raised (DSV-17)', () => {
  const dock = block('.dock');
  assert.match(dock, /background:\s*transparent/);
  assert.match(dock, /border-top:\s*0/);
  const controls = block('.dock > :is(.chip, .button.icon):not(.dock-add)');
  assert.match(controls, /border:\s*var\(--border-control\) solid var\(--control\)/);
  assert.match(controls, /box-shadow:\s*var\(--shadow-l\)/);
  assert.match(block('.dock > .dock-add'), /box-shadow:\s*var\(--shadow-l\)/);
});

test('the tools of the header are tinted tiles (DSV-17)', () => {
  assert.match(block('.app-header .button.icon'), /background:\s*var\(--secondary\)/);
});

test('the toast is dark on the light theme, its action in the light emerald (DSV-17)', () => {
  assert.deepEqual(token('--toast-bg'), { light: '#342f2b', dark: '#eae1da' });
  assert.deepEqual(token('--toast-text'), { light: '#f9efe8', dark: '#1f1b17' });
  assert.deepEqual(token('--inverse-primary'), { light: '#82d8a8', dark: '#13734b' });
  assert.match(block('.toast .button.strong'), /color:\s*var\(--inverse-primary\)/);
});
