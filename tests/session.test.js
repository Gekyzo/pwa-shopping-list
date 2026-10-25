import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY,
  SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY, loadSharedState, saveSharedState,
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
const emptySync = () => ({ owner: null, space: null, shares: [], cursor: '', server: new Map(), local: new Map(), ids: new Map() });

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
    space: 'o1',
    shares: [{ id: 's1', owner: 'o1', email: 'u1@b.c', ownerEmail: 'o1@b.c', ownerName: 'Olga', member: 'u1', scope: 'list', cancelled: true }],
    cursor: '2026-10-24 08:00:00.000Z',
    server: new Map([['item/a', { id: 'r1', kind: 'item', key: 'a', data: { n: 1 }, deleted: false, updated: 'x' }]]),
    local: new Map([['item/a', { n: 1 }]]),
    ids: new Map([['item/a', 'r1']]),
  };
  assert.equal(saveSyncState(storage, state), true);
  const loaded = loadSyncState(storage);
  assert.ok(loaded.server instanceof Map && loaded.local instanceof Map && loaded.ids instanceof Map);
  assert.deepEqual(loaded, state);
  const synced = { ...state, lastSync: '2026-10-24T08:00:00.000Z' };
  saveSyncState(storage, synced);
  assert.deepEqual(loadSyncState(storage), synced);
});

test('a sync state of v1.4 has the owner as its space and no shares (SHARE-6)', () => {
  const storage = fakeStorage();
  storage.setItem(SYNC_KEY, JSON.stringify({ owner: 'u1', cursor: '', server: [], local: [], ids: [], lastSync: null }));
  const loaded = loadSyncState(storage);
  assert.equal(loaded.space, 'u1');
  assert.deepEqual(loaded.shares, []);
});

test('a share of v1.5.0 loads with the defaults of the new fields; the new fields are kept', () => {
  const storage = fakeStorage();
  const old = { id: 's1', owner: 'o1', email: 'u1@b.c', ownerEmail: 'o1@b.c', member: 'u1' };
  const stored = { owner: 'u1', space: 'o1', cursor: '', server: [], local: [], ids: [], lastSync: null };
  storage.setItem(SYNC_KEY, JSON.stringify({ ...stored, shares: [old] }));
  assert.deepEqual(loadSyncState(storage).shares, [{ ...old, ownerName: '', scope: 'all', cancelled: false }]);
  const fresh = { ...old, ownerName: 'Olga', scope: 'list', cancelled: true };
  storage.setItem(SYNC_KEY, JSON.stringify({ ...stored, shares: [fresh] }));
  assert.deepEqual(loadSyncState(storage).shares, [fresh]);
  for (const bad of [{ ownerName: 1 }, { scope: 'x' }, { cancelled: 'no' }]) {
    storage.setItem(SYNC_KEY, JSON.stringify({ ...stored, shares: [{ ...fresh, ...bad }] }));
    assert.deepEqual(loadSyncState(storage).shares, [], JSON.stringify(bad));
  }
});

test('a bad space gives the empty sync state, and a bad list of shares gives none', () => {
  const storage = fakeStorage();
  const stored = { owner: 'u1', cursor: '', server: [], local: [], ids: [], lastSync: null };
  storage.setItem(SYNC_KEY, JSON.stringify({ ...stored, space: 7 }));
  assert.deepEqual(loadSyncState(storage), emptySync());
  for (const shares of ['x', [1], [{ id: 's1' }], null]) {
    storage.setItem(SYNC_KEY, JSON.stringify({ ...stored, space: 'o1', shares }));
    assert.deepEqual(loadSyncState(storage).shares, [], JSON.stringify(shares));
  }
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

const planeState = { version: 9, items: [], recipes: [], sent: [], group: 'aisle', sort: 'custom', menu: {}, aisles: [] };

test('saveSharedState then loadSharedState; null removes the shared state', () => {
  const storage = fakeStorage();
  assert.equal(loadSharedState(storage), null);
  const state = { ...planeState, items: [{ id: 'i1', name: 'Pan', recurrent: false, list: 'active', bought: false }] };
  assert.equal(saveSharedState(storage, state), true);
  assert.ok(storage.getItem(SHARED_STORAGE_KEY));
  assert.equal(loadSharedState(storage).items[0].name, 'Pan');
  assert.equal(saveSharedState(storage, null), true);
  assert.equal(storage.getItem(SHARED_STORAGE_KEY), null);
  assert.equal(loadSharedState(storage), null);
});

test('a shared state that does not validate loads as null', () => {
  const storage = fakeStorage();
  for (const bad of ['{', 'null', '{"version":99,"items":[]}', '{"version":9}']) {
    storage.setItem(SHARED_STORAGE_KEY, bad);
    assert.equal(loadSharedState(storage), null, bad);
  }
  assert.equal(loadSharedState(brokenStorage()), null);
  assert.equal(saveSharedState(brokenStorage(), planeState), false);
});

test('the shared lane uses its own keys and leaves the own ones alone', () => {
  const storage = fakeStorage();
  const own = { ...emptySync(), owner: 'u1', space: 'u1', cursor: 'c1' };
  saveSyncState(storage, own);
  saveQueue(storage, [{ op: 'own' }]);
  const shared = { ...emptySync(), owner: 'u1', space: 'o1', cursor: 'c2' };
  assert.equal(saveSyncState(storage, { ...shared, scope: 'list' }, 'shared'), true);
  assert.equal(saveQueue(storage, [{ op: 'shared' }], 'shared'), true);
  assert.deepEqual(loadSyncState(storage), own);
  assert.deepEqual(loadQueue(storage), [{ op: 'own' }]);
  assert.deepEqual(loadSyncState(storage, 'shared'), { ...shared, scope: 'list' });
  assert.deepEqual(loadQueue(storage, 'shared'), [{ op: 'shared' }]);
  assert.ok(storage.getItem(SHARED_SYNC_KEY) && storage.getItem(SHARED_QUEUE_KEY));
  assert.equal(loadSyncState(storage).scope, undefined);
});

test('the scope of the shared lane defaults to all, and a bad one too', () => {
  const storage = fakeStorage();
  const stored = { owner: 'u1', space: 'o1', cursor: '', server: [], local: [], ids: [], lastSync: null };
  storage.setItem(SHARED_SYNC_KEY, JSON.stringify(stored));
  assert.equal(loadSyncState(storage, 'shared').scope, 'all');
  storage.setItem(SHARED_SYNC_KEY, JSON.stringify({ ...stored, scope: 'x' }));
  assert.equal(loadSyncState(storage, 'shared').scope, 'all');
});

test('clearAccountData removes the shared keys too', () => {
  const storage = fakeStorage({ [SHARED_STORAGE_KEY]: '1', [SHARED_SYNC_KEY]: '1', [SHARED_QUEUE_KEY]: '1' });
  assert.equal(clearAccountData(storage), true);
  for (const key of [SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY]) assert.equal(storage.getItem(key), null, key);
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
