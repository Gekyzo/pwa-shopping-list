import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exportJson, importJson } from '#storage';
import { OLD_HOST, NEW_ORIGIN, MAX_HASH, isOldOrigin, encodeMove, decodeMove, moveUrl, moveMode } from '#move';

const sample = importJson(readFileSync(new URL('../shopping-sample.json', import.meta.url), 'utf8')).state;
const base64url = (text) => Buffer.from(text).toString('base64url');
const deflate = async (text) => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return Buffer.from(await new Response(stream).arrayBuffer()).toString('base64url');
};
const NOT_BACKUP = { error: { key: 'error.notBackup' } };

test('the old origin is the Pages host only (ADDR-1)', () => {
  assert.equal(OLD_HOST, 'polaris-works.github.io');
  assert.equal(isOldOrigin('polaris-works.github.io'), true);
  for (const host of ['bodega.artisandevs.duckdns.org', 'localhost', '']) assert.equal(isOldOrigin(host), false, host);
});

test('a moved backup comes back as the same state (ADDR-3, ADDR-5)', async () => {
  assert.ok(sample.items.length > 0 && sample.recipes.length > 0);
  const hash = await encodeMove(exportJson(sample));
  assert.match(hash, /^#import=[\w-]+$/);
  assert.deepEqual(await decodeMove(hash), { state: sample });
});

test('a hash with no import is not a move (ADDR-5)', async () => {
  assert.equal(await decodeMove(''), null);
  assert.equal(await decodeMove('#x=1'), null);
  assert.equal(await decodeMove('#top'), null);
});

test('a hash that is not base64url or not deflate is not a backup (ADDR-5)', async () => {
  assert.deepEqual(await decodeMove('#import=***'), NOT_BACKUP);
  assert.deepEqual(await decodeMove(`#import=${base64url('not deflate at all')}`), NOT_BACKUP);
  assert.deepEqual(await decodeMove('#import='), NOT_BACKUP);
});

test('a moved text that is not a backup gets the errors of Import (ADDR-5)', async () => {
  assert.deepEqual(await decodeMove(`#import=${await deflate('{"a":1}')}`), NOT_BACKUP);
  assert.deepEqual(await decodeMove(`#import=${await deflate('nope')}`), { error: { key: 'error.invalidJson' } });
});

test('a truncated move is an error, never a state (ADDR-5)', async () => {
  const hash = await encodeMove(exportJson(sample));
  const result = await decodeMove(hash.slice(0, Math.floor(hash.length / 2)));
  assert.ok(result.error, 'expected an error');
  assert.equal(result.state, undefined);
});

test('moveUrl opens the new origin with the query and the hash (ADDR-3)', () => {
  assert.equal(NEW_ORIGIN, 'https://bodega.artisandevs.duckdns.org');
  assert.equal(moveUrl('#import=abc', '?arrival'), 'https://bodega.artisandevs.duckdns.org/?arrival#import=abc');
  assert.equal(moveUrl('#import=abc', ''), 'https://bodega.artisandevs.duckdns.org/#import=abc');
});

test('a hash over the limit gives no URL, so the user exports (ADDR-4)', () => {
  assert.equal(MAX_HASH, 1_000_000);
  assert.equal(moveUrl(`#import=${'a'.repeat(MAX_HASH - '#import='.length)}`, ''), `${NEW_ORIGIN}/#import=${'a'.repeat(MAX_HASH - 8)}`);
  assert.equal(moveUrl(`#import=${'a'.repeat(MAX_HASH)}`, ''), null);
});

test('moveMode: signed out carries the data, signed in sends the queue first (ADDR-2)', () => {
  assert.equal(moveMode({ signedIn: false, queued: 3, online: false }), 'carry');
  assert.equal(moveMode({ signedIn: true, queued: 2, online: true }), 'sync');
  assert.equal(moveMode({ signedIn: true, queued: 2, online: false }), 'wait');
  assert.equal(moveMode({ signedIn: true, queued: 0, online: true }), 'go');
  assert.equal(moveMode({ signedIn: true, queued: 0, online: false }), 'go');
});
