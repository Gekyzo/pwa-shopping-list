import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encodePng, decodePng } from '../scripts/png.mjs';

const build = (size, pixel) => Buffer.from(Array.from({ length: size * size }, (_, n) => pixel(n)).flat());

test('decodePng gives back the pixels that encodePng wrote', () => {
  const rgba = build(3, (n) => [n * 20, 255 - n * 20, n, n % 2 ? 255 : 128]);
  assert.deepEqual(decodePng(encodePng(3, rgba)), { width: 3, height: 3, rgba });
});

test('decodePng reads the filters of a PNG from another encoder', () => {
  const { width, height, rgba } = decodePng(readFileSync(new URL('../icons/source.png', import.meta.url)));
  assert.equal(width, height);
  assert.equal(rgba.length, width * height * 4);
  assert.deepEqual([...rgba.subarray(0, 4)], [255, 255, 255, 255]);
  assert.deepEqual(decodePng(encodePng(width, rgba)).rgba, rgba);
});

test('decodePng rejects data that is not a PNG', () => {
  assert.throws(() => decodePng(Buffer.from('not a png')), /not a PNG/);
});

test('decodePng rejects a format other than 8-bit RGBA without interlace', () => {
  const png = encodePng(1, Buffer.from([1, 2, 3, 4]));
  for (const [offset, value] of [[24, 16], [25, 2], [28, 1]]) {
    const other = Buffer.from(png);
    other[offset] = value;
    assert.throws(() => decodePng(other), /8-bit RGBA/);
  }
});
