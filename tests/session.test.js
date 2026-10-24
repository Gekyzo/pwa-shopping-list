import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY,
  loadSession, saveSession, clearAccountData, loadSyncState, saveSyncState, loadQueue, saveQueue,
  tokenExpired, routeAtStart, accountChange, firstLogin,
} from '#session';

const fakeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
};
const brokenStorage = () => ({
  getItem: () => { throw new Error('x'); },
  setItem: () => { throw new Error('x'); },
  removeItem: () => { throw new Error('x'); },
});
const user = { id: 'u1', email: 'a@b.c', name: 'Ana', approved: true };
const session = { token: 't', user };
const jwt = (payload) => `h.${btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}.s`;
const emptySync = () => ({ owner: null, cursor: '', server: new Map(), local: new Map(), ids: new Map() });

test('routeAtStart routes by the session and the local data (ACC-1)', () => {
  assert.equal(routeAtStart({ session, hasLocalData: false }), 'list');
  assert.equal(routeAtStart({ session: { token: 't', user: { ...user, approved: false } }, hasLocalData: true }), 'waiting');
  assert.equal(routeAtStart({ session: null, hasLocalData: false }), 'login');
  assert.equal(routeAtStart({ session: null, hasLocalData: true }), 'banner');
});

test('a saved session opens the list even with an expired token', () => {
  const storage = fakeStorage();
  saveSession(storage, { token: jwt({ exp: 1 }), user });
  assert.equal(routeAtStart({ session: loadSession(storage), hasLocalData: false }), 'list');
});

test('tokenExpired reads exp with a 60 s margin, and an unreadable token is expired', () => {
  const now = 1_000_000_000_000;
  const exp = now / 1000;
  assert.equal(tokenExpired(jwt({ exp: exp + 61 }), now), false);
  assert.equal(tokenExpired(jwt({ exp: exp + 60 }), now), true);
  assert.equal(tokenExpired(jwt({ exp: exp - 1 }), now), true);
  assert.equal(tokenExpired(jwt({ exp: exp + 3600, x: '??>>' }), now), false);
  for (const bad of ['', 'abc', 'a.b.c', 'a.!!.c', jwt({}), jwt({ exp: 'x' }), null, undefined, 5]) {
    assert.equal(tokenExpired(bad, now), true, String(bad));
  }
});

test('accountChange decides what a login of another user does (ACC-8)', () => {
  assert.equal(accountChange({ previousOwner: 'u1', userId: 'u1', queueLength: 3 }), 'continue');
  assert.equal(accountChange({ previousOwner: 'u1', userId: 'u2', queueLength: 0 }), 'clear');
  assert.equal(accountChange({ previousOwner: 'u1', userId: 'u2', queueLength: 2 }), 'ask-export');
  assert.equal(accountChange({ previousOwner: null, userId: 'u2', queueLength: 2 }), 'continue');
});

test('firstLogin decides what the first login does with the local list (SYNC-8)', () => {
  assert.equal(firstLogin({ previousOwner: 'u1', serverCount: 5, hasLocalData: true }), 'none');
  assert.equal(firstLogin({ previousOwner: null, serverCount: 0, hasLocalData: true }), 'upload');
  assert.equal(firstLogin({ previousOwner: null, serverCount: 4, hasLocalData: true }), 'take-account');
  assert.equal(firstLogin({ previousOwner: null, serverCount: 4, hasLocalData: false }), 'none');
  assert.equal(firstLogin({ previousOwner: null, serverCount: 0, hasLocalData: false }), 'none');
});

test('the session survives a save and a load; a bad value loads as null', () => {
  const storage = fakeStorage();
  assert.equal(loadSession(storage), null);
  assert.equal(saveSession(storage, session), true);
  assert.deepEqual(loadSession(storage), session);
  for (const bad of ['{', 'null', '[]', '{"token":1,"user":{"id":"u"}}', '{"token":"t"}', '{"token":"t","user":{"id":1}}', '{"token":"t","user":null}']) {
    storage.setItem(SESSION_KEY, bad);
    assert.equal(loadSession(storage), null, bad);
  }
  assert.equal(loadSession(brokenStorage()), null);
  assert.equal(saveSession(brokenStorage(), session), false);
});

test('the queue and the sync state survive a save and a load', () => {
  const storage = fakeStorage();
  const queue = [{ op: 'upsert', kind: 'item', key: 'a', data: { n: 1 } }];
  assert.equal(saveQueue(storage, queue), true);
  assert.deepEqual(loadQueue(storage), queue);
  const state = {
    owner: 'u1',
    cursor: '2026-10-24 08:00:00.000Z',
    server: new Map([['item/a', { id: 'r1', kind: 'item', key: 'a', data: { n: 1 }, deleted: false, updated: 'x' }]]),
    local: new Map([['item/a', { n: 1 }]]),
    ids: new Map([['item/a', 'r1']]),
  };
  assert.equal(saveSyncState(storage, state), true);
  const loaded = loadSyncState(storage);
  assert.ok(loaded.server instanceof Map && loaded.local instanceof Map && loaded.ids instanceof Map);
  assert.deepEqual(loaded, state);
});

test('a corrupt or missing value loads as the empty one', () => {
  const storage = fakeStorage();
  assert.deepEqual(loadSyncState(storage), emptySync());
  assert.deepEqual(loadQueue(storage), []);
  for (const bad of ['{', 'null', '42', '{"owner":1}']) {
    storage.setItem(SYNC_KEY, bad);
    assert.deepEqual(loadSyncState(storage), emptySync(), bad);
  }
  for (const bad of ['{', '{}', '"x"']) {
    storage.setItem(QUEUE_KEY, bad);
    assert.deepEqual(loadQueue(storage), [], bad);
  }
  assert.deepEqual(loadSyncState(brokenStorage()), emptySync());
  assert.deepEqual(loadQueue(brokenStorage()), []);
  assert.equal(saveQueue(brokenStorage(), []), false);
  assert.equal(saveSyncState(brokenStorage(), emptySync()), false);
});

test('clearAccountData removes the account keys and the list, and keeps the preferences', () => {
  const storage = fakeStorage({
    [SESSION_KEY]: '1', [SYNC_KEY]: '1', [QUEUE_KEY]: '1', [BEFORE_LOGIN_KEY]: '1', [STORAGE_KEY]: '1',
    'shopping.lang': 'es', 'shopping.theme': 'dark',
  });
  assert.equal(clearAccountData(storage), true);
  for (const key of [SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY]) assert.equal(storage.getItem(key), null, key);
  assert.equal(storage.getItem('shopping.lang'), 'es');
  assert.equal(storage.getItem('shopping.theme'), 'dark');
  assert.equal(clearAccountData(brokenStorage()), false);
});
