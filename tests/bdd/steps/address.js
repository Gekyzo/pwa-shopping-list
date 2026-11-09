// The steps of the move to the new address, `src/move.js`.

import assert from 'node:assert/strict';
import { isOldOrigin, encodeMove, decodeMove, takeMove, moveUrl, moveMode, MAX_HASH } from '#move';
import { exportJson } from '#storage';
import { yesNo } from '../world.js';

// "a sync ok, 0 pending, approved" as the sync result of moveMode.
const syncOf = (text) => {
  if (text === 'no sync') return null;
  const match = /^a sync (ok|failed), (\d+) pending, (approved|not approved)$/.exec(text);
  assert.ok(match, `Unknown sync: ${text}`);
  return { result: match[1] === 'ok' ? 'ok' : 'error', pending: Number(match[2]), approved: match[3] === 'approved' };
};

export const defineAddressSteps = ({ Given, When, Then }) => {
  Then('the host {string} is the old address: {word}', (world, host, answer) => {
    assert.equal(isOldOrigin(host), yesNo(answer));
  });
  Then(/the move of a user (signed in|signed out), (online|offline), after (.+) does (\w+)/, (world, signed, online, sync, mode) => {
    assert.equal(moveMode({ signedIn: signed === 'signed in', online: online === 'online', sync: syncOf(sync) }), mode);
  });

  Given('the browser has no CompressionStream', (world) => {
    world.noCompression = true;
  });
  When('I pack the backup for the move', async (world) => {
    world.before = world.state;
    const saved = globalThis.CompressionStream;
    if (world.noCompression) globalThis.CompressionStream = undefined;
    try {
      world.hash = await encodeMove(exportJson(world.state));
    } finally {
      globalThis.CompressionStream = saved;
    }
  });
  When('the new address reads the fragment', async (world) => {
    world.cleared = false;
    world.moved = await takeMove(world.hash, () => {
      world.cleared = true;
    });
  });
  When('the new address reads the fragment {string}', async (world, hash) => {
    world.moved = await decodeMove(hash);
  });

  Then('the fragment starts with {string} and holds only base64url', (world, prefix) => {
    assert.ok(world.hash.startsWith(prefix));
    assert.match(world.hash.slice(prefix.length), /^[\w-]+$/);
  });
  Then('the move opens {string} plus the fragment from the query {string}', (world, url, search) => {
    assert.equal(moveUrl(world.hash, search), url + world.hash);
  });
  Then('the fragment was removed before the read', (world) => {
    assert.equal(world.cleared, true);
  });
  Then('the move brings the state of before', (world) => {
    assert.deepEqual(world.moved, { state: world.before });
  });
  Then('the old address keeps its state', (world) => {
    assert.equal(world.state, world.before);
  });
  Then('a fragment of {int} characters opens an address: {word}', (world, length, answer) => {
    assert.equal(moveUrl('#'.padEnd(length, 'x'), '') !== null, yesNo(answer));
    assert.equal(MAX_HASH, 1_000_000);
  });
  Then('the move packs nothing', (world) => {
    assert.equal(world.hash, null);
  });
  Then('the move gives {word}', (world, result) => {
    if (result === 'nothing') assert.equal(world.moved, null);
    else assert.deepEqual(world.moved, { error: { key: result } });
  });
};
