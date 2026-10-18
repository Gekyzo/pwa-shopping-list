import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathSegments, segmentDistance } from '../scripts/glyph.mjs';

test('pathSegments reads absolute and relative moves and lines', () => {
  assert.deepEqual(pathSegments('M2 3h3l2.5 12H4V1'), [
    [2, 3, 5, 3],
    [5, 3, 7.5, 15],
    [7.5, 15, 4, 15],
    [4, 15, 4, 1],
  ]);
  assert.deepEqual(pathSegments('M1 1L2 2m1 0v2'), [
    [1, 1, 2, 2],
    [3, 2, 3, 4],
  ]);
});

test('pathSegments closes a subpath at its start with Z', () => {
  assert.deepEqual(pathSegments('M0 0H2V2Z'), [
    [0, 0, 2, 0],
    [2, 0, 2, 2],
    [2, 2, 0, 0],
  ]);
});

test('pathSegments flattens a quadratic curve into segments that end on its end point', () => {
  const segments = pathSegments('M0 0Q1 2 2 0', 4);
  assert.equal(segments.length, 4);
  assert.deepEqual(segments[0].slice(0, 2), [0, 0]);
  assert.deepEqual(segments.at(-1).slice(2), [2, 0]);
  assert.deepEqual(segments[1].slice(2), [1, 1]);
});

test('pathSegments makes a circle of segments around its centre', () => {
  const segments = pathSegments('', 8, [{ cx: 5, cy: 5, r: 2 }]);
  assert.equal(segments.length, 8);
  for (const [x, y] of segments) assert.ok(Math.abs(Math.hypot(x - 5, y - 5) - 2) < 1e-9);
});

test('pathSegments rejects a command that it cannot read', () => {
  assert.throws(() => pathSegments('M0 0A1 1 0 0 1 2 2'), /command A/);
});

test('segmentDistance is the distance to the nearest point of the segment', () => {
  assert.equal(segmentDistance(1, 1, [0, 0, 2, 0]), 1);
  assert.equal(segmentDistance(5, 0, [0, 0, 2, 0]), 3);
  assert.equal(segmentDistance(3, 4, [0, 0, 0, 0]), 5);
});
