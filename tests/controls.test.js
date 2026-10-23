import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// src/ui/controls.js touches the page, so its callers are checked in their source.
const dir = new URL('../src/ui/', import.meta.url);
const sources = readdirSync(dir).filter((file) => file.endsWith('.js'))
  .map((file) => [file, readFileSync(new URL(file, dir), 'utf8')]);

test('each call of bindField passes read and write as one object (AISLE-12)', () => {
  const calls = sources.flatMap(([file, source]) =>
    [...source.matchAll(/\bbindField\(([^,]+),\s*(\S)/g)].map(([, input, next]) => ({ file, input, next })));
  assert.ok(calls.length > 0);
  assert.deepEqual(calls.filter(({ next }) => next !== '{'), []);
});
