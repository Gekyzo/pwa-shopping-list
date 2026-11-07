import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BREAKPOINTS } from '#device';

// The media queries of the CSS and the classes of src/device.js use the same three widths (DSV-9).
const root = new URL('../', import.meta.url);
const sheets = ['styles.css', 'design-system/design-system.css'];
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const widths = Object.values(BREAKPOINTS).map((width) => `${width}px`);

test('each width of a media query of the CSS is a breakpoint of DSV-9', () => {
  for (const sheet of sheets) {
    const media = [...read(sheet).matchAll(/@media[^{]*/g)].map(([query]) => query);
    for (const query of media) {
      for (const [, width] of query.matchAll(/min-width:\s*([\d.]+\w+)/g)) assert.ok(widths.includes(width), `${sheet}: ${query}`);
      assert.doesNotMatch(query, /max-width/, `${sheet}: ${query}`);
    }
  }
});

test('no CSS rule selects on data-device: the media query is the one source of a layout', () => {
  for (const sheet of sheets) assert.doesNotMatch(read(sheet), /\[data-device/, sheet);
});

// src/ui/device.js reads the page; a stub lets node load it.
const stub = () => new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub(), set: () => true });
Object.assign(globalThis, { document: globalThis.document ?? stub(), window: globalThis.window ?? stub(), location: globalThis.location ?? { search: '' } });
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { classOf, nextClass } = await import('#ui/device');
const { ui } = await import('#ui/context');

test('classOf gives the widest class whose query matches', () => {
  assert.equal(classOf({ foldable: false, tablet: false, desktop: false }), 'phone');
  assert.equal(classOf({ foldable: true, tablet: false, desktop: false }), 'foldable');
  assert.equal(classOf({ foldable: true, tablet: true, desktop: false }), 'tablet');
  assert.equal(classOf({ foldable: true, tablet: true, desktop: true }), 'desktop');
});

test('ui.device starts as phone in node', () => {
  assert.equal(ui.device, 'phone');
});

test('nextClass reports a change once for each crossing, and not for a move inside a class', () => {
  const steps = [
    { foldable: true, tablet: true, desktop: true },
    { foldable: true, tablet: true, desktop: true },
    { foldable: true, tablet: true, desktop: false },
    { foldable: true, tablet: false, desktop: false },
    { foldable: false, tablet: false, desktop: false },
  ];
  let current = 'phone';
  const changes = [];
  for (const matches of steps) {
    const next = nextClass(current, matches);
    if (next !== null) changes.push((current = next));
  }
  assert.deepEqual(changes, ['desktop', 'tablet', 'foldable', 'phone']);
});
