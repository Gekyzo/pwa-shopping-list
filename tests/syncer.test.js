import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createSyncer } from '#syncer';
import { PocketBaseError } from '#pocketbase';
import { emptyState } from '#store';
import { normalizeState, BEFORE_LOGIN_KEY, STORAGE_KEY } from '#storage';
import { saveSession, loadSession, loadQueue, saveQueue, saveSyncState, loadSyncState, loadSharedState, SESSION_KEY, SHARED_STORAGE_KEY } from '#session';
import { recordKey, toRecords } from '#records';

const item = (id, name, patch = {}) => ({ id, name, recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '', ...patch });
const withItems = (items) => ({ ...emptyState(), items });

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
// A JWT whose `exp` is far in the future; the fake server reads the user id from it.
const tokenOf = (id, n = 0) => `${base64url({ alg: 'none' })}.${base64url({ id, exp: 4_000_000_000, n })}.sig`;
const sessionOf = (id, approved = true) => ({ token: tokenOf(id), user: { id, email: `${id}@example.test`, name: id, approved } });

const fakeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    keys: () => [...map.keys()],
  };
};

// An in-memory server: it assigns ids and increasing `updated` strings. A push with no id creates a
// new row, as a POST does, so a resent change shows up as a duplicate.
const fakeServer = () => {
  let clock = 0;
  const rows = [];
  const stamp = () => {
    clock += 1;
    return `2026-10-24 07:00:00.${String(clock).padStart(3, '0')}Z`;
  };
  const copy = (row) => ({ ...row });
  return {
    rows,
    stamp,
    // SHARE-1, SHARE-11: the shares of the server, `{ id, owner, email, ownerEmail, member, ownerName, scope, cancelled }`.
    shares: [],
    live: (owner) => rows.filter((row) => row.owner === owner && !row.deleted),
    add: (owner, kind, key, data) => rows.push({ id: `pb${rows.length + 1}`, owner, kind, key, data, deleted: false, updated: stamp() }),
    copy,
  };
};

const ownerOf = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).id;

const emailOf = (id) => `${id}@example.test`;

// The rule of the server (SHARE-1, SHARE-11): a user acts on their own space, and on the space of a
// share whose member they are and that is not cancelled; with scope `list` on items and settings only.
const mayAct = (server, user, space, kind) =>
  space === user ||
  server.shares.some((s) => s.owner === space && s.member === user && !s.cancelled && (s.scope === 'all' || kind === 'item' || kind === 'settings'));

// PocketBase answers a refused rule as it answers a guest: a 400 with no field error.
const refusedRule = () => new PocketBaseError('invalid', 400, {});

const addShare = (server, owner, member = '', email = emailOf(member), patch = {}) => {
  const share = { id: `sh${server.shares.length + 1}`, owner, email, ownerEmail: emailOf(owner), member, ownerName: '', scope: 'all', cancelled: false, ...patch };
  server.shares.push(share);
  return share;
};

const fakeClient = (server, { approved = true } = {}) => {
  const calls = [];
  const client = {
    calls,
    failPush: null,
    failPull: null,
    failRefresh: null,
    approved,
    pushes: 0,
    // Each push that the server took: `{ space, kind, key, op }`.
    pushed: [],
    refresh: async (token) => {
      calls.push('refresh');
      if (client.failRefresh) throw client.failRefresh;
      const id = ownerOf(token);
      return { token: tokenOf(id, calls.length), user: { id, email: `${id}@example.test`, name: id, approved: client.approved } };
    },
    failShares: null,
    listShares: async (token) => {
      calls.push('shares');
      if (client.failShares) throw client.failShares;
      const user = ownerOf(token);
      return server.shares.filter((s) => s.owner === user || s.member === user || s.email === emailOf(user)).map((s) => ({ ...s }));
    },
    failShareCall: null,
    invite: async (token, owner, email, scope = 'all') => {
      calls.push('invite');
      if (client.failShareCall) throw client.failShareCall;
      return { ...addShare(server, owner, '', email.toLowerCase(), { scope }) };
    },
    cancelShare: async (token, id) => {
      calls.push('cancel');
      if (client.failShareCall) throw client.failShareCall;
      const share = server.shares.find((s) => s.id === id);
      share.cancelled = true;
      return { ...share };
    },
    setShareScope: async (token, id, scope) => {
      calls.push('scope');
      if (client.failShareCall) throw client.failShareCall;
      const share = server.shares.find((s) => s.id === id);
      share.scope = scope;
      return { ...share };
    },
    reinvite: async (token, id) => {
      calls.push('reinvite');
      if (client.failShareCall) throw client.failShareCall;
      const share = server.shares.find((s) => s.id === id);
      Object.assign(share, { cancelled: false, member: '' });
      return { ...share };
    },
    acceptShare: async (token, id, userId) => {
      calls.push('accept');
      if (client.failShareCall) throw client.failShareCall;
      const share = server.shares.find((s) => s.id === id);
      share.member = userId;
      return { ...share };
    },
    removeShare: async (token, id) => {
      calls.push('remove');
      if (client.failShareCall) throw client.failShareCall;
      server.shares.splice(server.shares.findIndex((s) => s.id === id), 1);
    },
    pull: async (token, since, space) => {
      calls.push('pull');
      if (client.hold) await client.hold('pull');
      if (client.failPull) throw client.failPull;
      // Fails the pull of one space only.
      if (client.failPullOf?.space === space) throw client.failPullOf.error;
      return server.rows
        .filter((row) => row.owner === space && mayAct(server, ownerOf(token), space, row.kind) && (!since || row.updated >= since))
        .sort((a, b) => (a.updated < b.updated ? -1 : 1))
        .map(({ owner: _, ...row }) => ({ ...row }));
    },
    push: async (token, change, ids, space) => {
      calls.push('push');
      if (client.hold) await client.hold('push');
      client.pushes += 1;
      const failure = client.failPush?.(client.pushes, change, token);
      if (failure) throw failure;
      if (!mayAct(server, ownerOf(token), space, change.kind)) throw refusedRule();
      client.pushed.push({ space, kind: change.kind, key: change.key, op: change.op });
      const owner = space;
      // SYNC-6: a tombstone keeps its data, as the server does.
      const body = change.op === 'delete' ? { deleted: true } : { deleted: false, data: change.data };
      const id = ids.get(recordKey(change.kind, change.key));
      let row = id ? server.rows.find((r) => r.id === id && r.owner === owner) : null;
      if (!row && change.op === 'delete') {
        row = server.rows.find((r) => r.owner === owner && r.kind === change.kind && r.key === change.key);
        if (!row) return null;
      }
      if (!row) {
        row = { id: `pb${server.rows.length + 1}`, owner, kind: change.kind, key: change.key };
        server.rows.push(row);
      }
      Object.assign(row, body, { updated: server.stamp() });
      const { owner: _, ...rec } = row;
      return { ...rec };
    },
  };
  return client;
};

// A device: its storage, its state and the syncer. The timer only runs when the test says so.
const device = ({ server, user = 'u1', state = emptyState(), shared = null, session = sessionOf(user), synced = true, approved, storage: given, lost } = {}) => {
  const storage = given ?? fakeStorage();
  const client = fakeClient(server, { approved });
  if (session && !given) saveSession(storage, session);
  if (session && synced && !given) saveSyncState(storage, { owner: session.user.id, cursor: '', server: new Map(), local: new Map(), ids: new Map() });
  // `shared` and `share` are the shared part, as the app holds it (SHARE-12).
  const box = { state, shared, share: null, statuses: [], timers: [], sharedCalls: 0 };
  const syncer = createSyncer({
    client,
    storage,
    getState: () => box.state,
    setState: (next) => {
      box.state = next;
    },
    getShared: () => box.shared,
    setShared: (next, share) => {
      box.sharedCalls += 1;
      box.shared = next;
      box.share = share;
    },
    now: () => Date.parse('2026-10-24T08:00:00Z'),
    onStatus: (status) => box.statuses.push(status),
    setTimer: (fn, ms) => {
      box.timers.push({ fn, ms });
      return box.timers.length;
    },
    clearTimer: () => {},
    lost,
  });
  const change = (next, options) => {
    box.state = next;
    syncer.notify(next, options);
  };
  const changeShared = (next) => {
    box.shared = next;
    syncer.notifyShared(next);
  };
  return { storage, client, syncer, box, change, changeShared };
};

test('a tick is queued, pushed, and the queue is empty after run', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.run(), 'ok');
  a.change(withItems([item('i1', 'Leche', { bought: true })]));
  assert.equal(loadQueue(a.storage).length, 1);
  assert.equal(a.box.timers.at(-1).ms, 1500);
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(server.live('u1').find((row) => row.key === 'i1').data.bought, true);
  const status = a.box.statuses.at(-1);
  assert.deepEqual(status, { online: true, pending: 0, lastSync: '2026-10-24T08:00:00.000Z', auth: false, reached: 2, shared: null, shares: [], left: 0, narrowed: 0 });
});

test('the debounce timer runs the sync', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.box.timers.at(-1).fn();
  await a.syncer.run();
  assert.equal(server.live('u1').length, 2);
});

test('two devices converge', async () => {
  const server = fakeServer();
  const start = withItems([item('i1', 'Leche')]);
  const a = device({ server });
  const b = device({ server });
  a.change(start);
  await a.syncer.run();
  await b.syncer.run();
  assert.deepEqual(b.box.state, normalizeState(start));
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  b.change(withItems([item('i1', 'Leche', { bought: true })]));
  await a.syncer.run();
  await b.syncer.run();
  await a.syncer.run();
  assert.deepEqual(a.box.state, b.box.state);
  assert.deepEqual(a.box.state.items.map((i) => [i.name, i.bought]), [['Leche', true], ['Pan', false]]);
});

test('run stops at a network error and keeps what was not sent', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPush = (n) => (n === 4 ? new PocketBaseError('network') : null);
  a.change(withItems(Array.from({ length: 9 }, (_, n) => item(`i${n}`, `Item ${n}`))));
  assert.equal(loadQueue(a.storage).length, 10);
  assert.equal(await a.syncer.run(), 'offline');
  assert.equal(loadQueue(a.storage).length, 7);
  assert.equal(a.box.statuses.at(-1).online, false);
  assert.equal(a.box.statuses.at(-1).pending, 7);
  assert.equal(await a.syncer.run(), 'ok');
  assert.equal(server.rows.length, 10);
  assert.equal(new Set(server.rows.map((row) => row.key)).size, 10);
  assert.deepEqual(loadQueue(a.storage), []);
});

test('a server error stops the run as offline', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPull = new PocketBaseError('server', 503);
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.run(), 'offline');
  assert.deepEqual(loadQueue(a.storage), []);
});

test('an auth error during run returns auth and keeps the queue and the state', async () => {
  const server = fakeServer();
  const a = device({ server });
  const state = withItems([item('i1', 'Leche')]);
  a.change(state);
  a.client.failRefresh = new PocketBaseError('auth', 401);
  assert.equal(await a.syncer.run(), 'auth');
  assert.equal(loadQueue(a.storage).length, 2);
  assert.equal(a.box.state, state);
  assert.deepEqual(a.client.calls, ['refresh']);
});

test('the token is refreshed before the data requests, and again after 10 minutes', async () => {
  const server = fakeServer();
  let clock = Date.parse('2026-10-24T08:00:00Z');
  const storage = fakeStorage();
  const client = fakeClient(server);
  saveSession(storage, sessionOf('u1'));
  saveSyncState(storage, { owner: 'u1', cursor: '', server: new Map(), local: new Map(), ids: new Map() });
  const syncer = createSyncer({ client, storage, getState: emptyState, setState() {}, now: () => clock, setTimer() {}, clearTimer() {} });
  // The stored sync state has no base records, so the first run sends the settings of the state.
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'shares', 'push', 'pull']);
  assert.notEqual(loadSession(storage).token, sessionOf('u1').token);
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'shares', 'push', 'pull', 'shares', 'pull']);
  clock += 10 * 60_000 + 1;
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'shares', 'push', 'pull', 'shares', 'pull', 'refresh', 'shares', 'pull']);
});

test('an expired token is refreshed even right after a refresh', async () => {
  const server = fakeServer();
  const storage = fakeStorage();
  const client = fakeClient(server);
  const expired = `${base64url({})}.${base64url({ id: 'u1', exp: 1 })}.sig`;
  saveSession(storage, { ...sessionOf('u1'), token: expired });
  saveSyncState(storage, { owner: 'u1', cursor: '', server: new Map(), local: new Map(), ids: new Map() });
  client.refresh = async () => {
    client.calls.push('refresh');
    return { token: expired, user: sessionOf('u1').user };
  };
  const syncer = createSyncer({ client, storage, getState: emptyState, setState() {}, now: () => Date.now(), setTimer() {}, clearTimer() {} });
  await syncer.run();
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'shares', 'push', 'pull', 'refresh', 'shares', 'pull']);
});

test('a refresh that says the user is no longer approved makes no data request (ACC-4)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  a.client.approved = false;
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(a.client.calls, ['refresh']);
  assert.equal(loadSession(a.storage).user.approved, false);
  assert.equal(loadQueue(a.storage).length, 2);
});

test('a session that is not approved makes no request (ACC-4)', async () => {
  const server = fakeServer();
  const a = device({ server, session: sessionOf('u1', false) });
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(a.client.calls, []);
  assert.deepEqual(loadQueue(a.storage), []);
});

test('with no session notify keeps no queue and run makes no request', async () => {
  const server = fakeServer();
  const a = device({ server, session: null });
  a.change(withItems([item('i1', 'Leche')]));
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(a.box.timers.length, 0);
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(a.client.calls, []);
});

test('a push refused by a rule stops with auth and keeps the queue', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPush = () => new PocketBaseError('invalid', 400, {});
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.run(), 'auth');
  assert.equal(loadQueue(a.storage).length, 2);
  assert.ok(!a.client.calls.includes('pull'));
});

test('a push with bad data drops that one change and goes on', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPush = (n) => (n === 1 ? new PocketBaseError('invalid', 400, { data: { code: 'validation_json_size_limit' } }) : null);
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(server.rows.length, 1);
  assert.equal(a.box.state.items.length, 1);
});

test('run is a no-op while a run is in progress', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  const first = a.syncer.run();
  const second = a.syncer.run();
  assert.equal(first, second);
  await first;
  assert.equal(a.client.calls.filter((call) => call === 'pull').length, 1);
});

test('a duplicate name from another device gets a tombstone (SYNC-7)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  server.add('u1', 'item', 'i9', { ...item('i9', 'leche'), position: 1 });
  const timers = a.box.timers.length;
  await a.syncer.run();
  assert.deepEqual(a.box.state.items.map((i) => i.id), ['i9']);
  // The merge queues the tombstone, and the new position of i9; the sync that the run schedules sends them.
  assert.deepEqual(loadQueue(a.storage).map((change) => `${change.key}:${change.op}`), ['i1:delete', 'i9:upsert']);
  assert.equal(a.box.timers.length, timers + 1);
  await a.box.timers.at(-1).fn();
  assert.deepEqual(server.live('u1').filter((row) => row.kind === 'item').map((row) => row.key), ['i9']);
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(a.box.timers.length, timers + 1);
});

test('login with local data and an empty account uploads it', async () => {
  const server = fakeServer();
  const a = device({ server, session: null, state: withItems([item('i1', 'Leche')]) });
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i1', 'settings']);
  assert.equal(loadSyncState(a.storage).owner, 'u1');
  assert.equal(a.storage.getItem(BEFORE_LOGIN_KEY), null);
});

test('login with local data and an account with data takes the account and keeps the old list under the before-login key', async () => {
  const server = fakeServer();
  server.add('u1', 'item', 'k1', { ...item('k1', 'Café'), position: 0 });
  const local = withItems([item('i1', 'Leche')]);
  const a = device({ server, session: null, state: local });
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Café']);
  assert.deepEqual(JSON.parse(a.storage.getItem(BEFORE_LOGIN_KEY)), local);
  // The local list is not uploaded: only the settings of the normalized account state are new.
  assert.deepEqual(server.live('u1').map((row) => row.key), ['k1', 'settings']);
});

test('login of an account that is not approved returns waiting and makes no request', async () => {
  const server = fakeServer();
  const a = device({ server, session: null, state: withItems([item('i1', 'Leche')]) });
  assert.equal(await a.syncer.login(sessionOf('u1', false)), 'waiting');
  assert.deepEqual(a.client.calls, []);
  assert.equal(loadSession(a.storage).user.id, 'u1');
  assert.equal(loadSyncState(a.storage).owner, null);
});

test('login as a different user with a queue returns ask-export and changes nothing', async () => {
  const server = fakeServer();
  const a = device({ server });
  const state = withItems([item('i1', 'Leche')]);
  a.change(state);
  const queue = loadQueue(a.storage);
  assert.equal(await a.syncer.login(sessionOf('u2')), 'ask-export');
  assert.equal(a.box.state, state);
  assert.deepEqual(loadQueue(a.storage), queue);
  assert.equal(loadSyncState(a.storage).owner, 'u1');
  assert.deepEqual(a.client.calls, []);
});

test('login with discard clears the other user and continues', async () => {
  const server = fakeServer();
  server.add('u2', 'item', 'k1', { ...item('k1', 'Café'), position: 0 });
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.login(sessionOf('u2'), { discard: true }), 'synced');
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Café']);
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(loadSession(a.storage).user.id, 'u2');
  assert.equal(server.live('u1').length, 0);
});

test('login as a different user with no queue clears the old data', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  assert.equal(await a.syncer.login(sessionOf('u2')), 'synced');
  assert.deepEqual(a.box.state, emptyState());
  assert.equal(loadSyncState(a.storage).owner, 'u2');
});

test('a queue with no owner counts as the queue of another user', async () => {
  const server = fakeServer();
  const storage = fakeStorage();
  saveQueue(storage, [{ kind: 'item', key: 'i1', op: 'delete' }]);
  const syncer = createSyncer({ client: fakeClient(server), storage, getState: emptyState, setState() {}, now: () => 0, setTimer() {}, clearTimer() {} });
  assert.equal(await syncer.login(sessionOf('u1')), 'ask-export');
});

test('logout online sends the queue, then clears the account data', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.storage.setItem('shopping.theme', 'dark');
  a.change(withItems([item('i1', 'Leche')]));
  assert.equal(await a.syncer.logout({ online: true }), 'done');
  assert.equal(server.live('u1').length, 2);
  assert.deepEqual(a.storage.keys(), ['shopping.theme']);
  assert.deepEqual(a.box.state, emptyState());
});

test('logout offline with a queue returns ask-export', async () => {
  const server = fakeServer();
  const a = device({ server });
  const state = withItems([item('i1', 'Leche')]);
  a.change(state);
  assert.equal(await a.syncer.logout({ online: false }), 'ask-export');
  assert.deepEqual(a.client.calls, []);
  assert.equal(a.box.state, state);
  assert.equal(loadQueue(a.storage).length, 2);
  assert.notEqual(a.storage.getItem(SESSION_KEY), null);
  assert.equal(await a.syncer.logout({ online: false, discard: true }), 'done');
  assert.equal(a.storage.getItem(SESSION_KEY), null);
  assert.equal(a.storage.getItem(STORAGE_KEY), null);
});

test('an import replaces the account', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  await a.syncer.run();
  a.change(withItems([item('i3', 'Café')]));
  await a.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i3', 'settings']);
  assert.deepEqual(server.rows.filter((row) => row.deleted).map((row) => row.key).sort(), ['i1', 'i2']);
});

// Holds the next request of `op` until the test releases it; `entered` resolves when it is waiting.
const holdOnce = (client, op) => {
  let release;
  let entered;
  const gate = new Promise((resolve) => (release = resolve));
  const waiting = new Promise((resolve) => (entered = resolve));
  client.hold = (name) => {
    if (name !== op) return null;
    client.hold = null;
    entered();
    return gate;
  };
  return { release, waiting };
};

test('a save during a push in progress is kept and sent', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  const held = holdOnce(a.client, 'push');
  const running = a.syncer.run();
  await held.waiting;
  a.change(withItems([item('i1', 'Leche', { bought: true })]));
  held.release();
  assert.equal(await running, 'ok');
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(server.live('u1').find((row) => row.key === 'i1').data.bought, true);
  assert.equal(a.box.state.items[0].bought, true);
});

test('a save during a pull in progress is kept and sent', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  const held = holdOnce(a.client, 'pull');
  const running = a.syncer.run();
  await held.waiting;
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  held.release();
  assert.equal(await running, 'ok');
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Leche', 'Pan']);
  await a.box.timers.at(-1).fn();
  assert.deepEqual(loadQueue(a.storage), []);
  assert.ok(server.live('u1').some((row) => row.key === 'i2'));
});

test('a logout during a run in progress leaves the storage cleared, and the next login syncs in full', async () => {
  const server = fakeServer();
  server.add('u2', 'item', 'k1', { ...item('k1', 'Café'), position: 0 });
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  const held = holdOnce(a.client, 'push');
  const running = a.syncer.run();
  await held.waiting;
  assert.equal(await a.syncer.logout({ online: false, discard: true }), 'done');
  held.release();
  await running;
  assert.deepEqual(a.storage.keys(), []);
  assert.deepEqual(a.box.state, emptyState());
  assert.equal(await a.syncer.login(sessionOf('u2')), 'synced');
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Café']);
  assert.equal(loadSyncState(a.storage).owner, 'u2');
  // The push in flight at the logout reached the server; the stale run sent nothing after it.
  assert.deepEqual(server.live('u1').map((row) => row.key), ['i1']);
});

test('a save made while the account waits for approval is kept at the next login', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  a.client.approved = false;
  a.client.calls.length = 0;
  // The refresh after 10 minutes is forced by an expired token.
  saveSession(a.storage, { ...sessionOf('u1'), token: `${base64url({})}.${base64url({ id: 'u1', exp: 1 })}.sig` });
  assert.equal(await a.syncer.run(), 'ok');
  assert.equal(loadSession(a.storage).user.approved, false);
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  assert.deepEqual(loadQueue(a.storage), []);
  a.client.approved = true;
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Leche', 'Pan']);
  assert.ok(server.live('u1').some((row) => row.key === 'i2'));
});

test('after an auth stop a save makes no request until a login', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  a.client.failRefresh = new PocketBaseError('auth', 401);
  assert.equal(await a.syncer.run(), 'auth');
  a.client.failRefresh = null;
  const timers = a.box.timers.length;
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan'), item('i3', 'Sal')]));
  assert.equal(a.box.timers.length, timers);
  assert.equal(await a.syncer.run(), 'auth');
  assert.deepEqual(a.client.calls, ['refresh']);
  assert.equal(loadQueue(a.storage).length, 4);
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(server.live('u1').length, 4);
});

test('the status tells an auth stop, so that the app shows Iniciar sesión, until a login (ACC-7)', async () => {
  const server = fakeServer();
  const a = device({ server });
  assert.equal(a.syncer.status().auth, false);
  a.client.failRefresh = new PocketBaseError('auth', 401);
  assert.equal(await a.syncer.run(), 'auth');
  assert.equal(a.syncer.status().auth, true);
  a.client.failRefresh = null;
  await a.syncer.login(sessionOf('u1'));
  assert.equal(a.syncer.status().auth, false);
});

test('a pulled record that the validation refuses changes no state, no queue and no cursor', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  const state = a.box.state;
  const cursor = loadSyncState(a.storage).cursor;
  const timers = a.box.timers.length;
  server.add('u1', 'item', 'i5', { ...item('i5', 'Bad'), list: 'bogus', position: 1 });
  assert.equal(await a.syncer.run(), 'ok');
  assert.equal(a.box.state, state);
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(loadSyncState(a.storage).cursor, cursor);
  assert.equal(a.box.timers.length, timers);
});

test('a failed save of the old list stops the login and keeps the local list', async () => {
  const server = fakeServer();
  server.add('u1', 'item', 'k1', { ...item('k1', 'Café'), position: 0 });
  const local = withItems([item('i1', 'Leche')]);
  const a = device({ server, session: null, state: local });
  const setItem = a.storage.setItem;
  a.storage.setItem = (key, value) => {
    if (key === BEFORE_LOGIN_KEY) throw new Error('quota');
    return setItem(key, value);
  };
  await assert.rejects(a.syncer.login(sessionOf('u1')), /quota/);
  assert.equal(a.box.state, local);
  assert.equal(loadSession(a.storage), null);
  assert.equal(loadSyncState(a.storage).owner, null);
  assert.deepEqual(loadQueue(a.storage), []);
});

test('an error that is not of the client is logged and the run stops as offline', async () => {
  const server = fakeServer();
  const a = device({ server });
  const logged = mock.method(console, 'error', () => {});
  try {
    a.client.pull = async () => {
      throw new TypeError('bug');
    };
    assert.equal(await a.syncer.run(), 'offline');
    assert.equal(logged.mock.callCount(), 1);
    assert.equal(a.box.statuses.at(-1).online, false);
  } finally {
    logged.mock.restore();
  }
});

test('a login with no local data keeps the settings of the account', async () => {
  const server = fakeServer();
  const settings = { group: 'none', sort: 'custom', sent: [], aisles: ['Fruta'] };
  server.add('u1', 'settings', 'settings', settings);
  server.add('u1', 'item', 'i1', { ...item('i1', 'Leche'), position: 0 });
  const a = device({ server, session: null });
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  const rows = server.rows.filter((row) => row.kind === 'settings');
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].data, settings);
  assert.equal(a.box.state.group, 'none');
  assert.deepEqual(a.box.state.aisles, ['Fruta']);
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Leche']);
  assert.deepEqual(loadQueue(a.storage), []);
});

test('a login after a logout keeps the settings of the account', async () => {
  const server = fakeServer();
  const settings = { group: 'none', sort: 'custom', sent: [], aisles: ['Fruta'] };
  server.add('u1', 'settings', 'settings', settings);
  const a = device({ server, session: null });
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.equal(await a.syncer.logout({ online: true }), 'done');
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.equal(server.rows.filter((row) => row.kind === 'settings').length, 1);
  assert.deepEqual(server.rows[0].data, settings);
  assert.equal(a.box.state.group, 'none');
});

test('a run in progress with the old token cannot stop the sync after a login', async () => {
  const server = fakeServer();
  const a = device({ server });
  const login = sessionOf('u1');
  a.change(withItems([item('i1', 'Leche')]));
  const held = holdOnce(a.client, 'push');
  const old = a.syncer.run();
  await held.waiting;
  a.client.failPush = (n, change, token) => (token !== login.token ? new PocketBaseError('auth', 401) : null);
  const done = a.syncer.login(login);
  held.release();
  assert.equal(await done, 'synced');
  await old;
  a.client.failPush = null;
  assert.equal(await a.syncer.run(), 'ok');
  assert.deepEqual(loadQueue(a.storage), []);
  assert.ok(server.live('u1').some((row) => row.key === 'i1'));
});

const expiredToken = (id) => `${base64url({})}.${base64url({ id, exp: 1 })}.sig`;

test('a save during the pull of an upload login is kept and sent', async () => {
  const server = fakeServer();
  const a = device({ server, session: null, state: withItems([item('i1', 'Leche')]) });
  const held = holdOnce(a.client, 'pull');
  const done = a.syncer.login(sessionOf('u1'));
  await held.waiting;
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  held.release();
  assert.equal(await done, 'synced');
  await a.syncer.run();
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Leche', 'Pan']);
  assert.deepEqual(server.live('u1').filter((row) => row.kind === 'item').map((row) => row.key).sort(), ['i1', 'i2']);
});

test('a save before the first pull, while the account waits for approval, is kept', async () => {
  const server = fakeServer();
  const a = device({ server, session: null });
  a.client.failPull = new PocketBaseError('network');
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.equal(loadSyncState(a.storage).cursor, '');
  a.client.failPull = null;
  a.client.approved = false;
  saveSession(a.storage, { ...sessionOf('u1'), token: expiredToken('u1') });
  assert.equal(await a.syncer.run(), 'ok');
  assert.equal(loadSession(a.storage).user.approved, false);
  a.change(withItems([item('i2', 'Pan')]));
  a.client.approved = true;
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  await a.syncer.run();
  assert.deepEqual(a.box.state.items.map((i) => i.name), ['Pan']);
  assert.ok(server.live('u1').some((row) => row.key === 'i2'));
});

test('take-account with two items of one name keeps the account and sends one tombstone (SYNC-8, SYNC-7)', async () => {
  const server = fakeServer();
  server.add('u1', 'item', 'k1', { ...item('k1', 'Leche'), position: 0 });
  server.add('u1', 'item', 'k2', { ...item('k2', 'leche'), position: 1 });
  server.add('u1', 'item', 'k3', { ...item('k3', 'Pan'), position: 2 });
  const local = withItems([item('i1', 'Huevos')]);
  const b = device({ server, session: null, state: local });
  assert.equal(await b.syncer.login(sessionOf('u1')), 'synced');
  // The newer of the two stays.
  assert.deepEqual(b.box.state.items.map((i) => i.name), ['leche', 'Pan']);
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['k2', 'k3', 'settings']);
  assert.deepEqual(server.rows.filter((row) => row.deleted).map((row) => row.key), ['k1']);
  assert.deepEqual(JSON.parse(b.storage.getItem(BEFORE_LOGIN_KEY)), local);
  // A later run sends no delete of the account.
  await b.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['k2', 'k3', 'settings']);
});

test('take-account drops a malformed record and keeps the rest of the account (SYNC-8)', async () => {
  const server = fakeServer();
  server.add('u1', 'item', 'k1', { ...item('k1', 'Leche'), position: 0 });
  server.add('u1', 'item', 'k2', { id: 'other', name: 'Pan', position: 1 });
  const b = device({ server, session: null, state: withItems([item('i1', 'Huevos')]) });
  assert.equal(await b.syncer.login(sessionOf('u1')), 'synced');
  assert.deepEqual(b.box.state.items.map((i) => i.name), ['Leche']);
  await b.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['k1', 'k2', 'settings']);
});

test('take-account that the validation refuses stops the login and keeps the local list (SYNC-8)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const server = fakeServer();
  server.add('u1', 'item', 'k1', { ...item('k1', 'Leche'), position: 0 });
  server.add('u1', 'item', 'k2', { ...item('k2', '   '), position: 1 });
  const local = withItems([item('i1', 'Huevos')]);
  const b = device({ server, session: null, state: local });
  await assert.rejects(b.syncer.login(sessionOf('u1')));
  assert.equal(b.box.state, local);
  assert.equal(loadSession(b.storage), null);
  assert.equal(b.storage.getItem(BEFORE_LOGIN_KEY), null);
  assert.equal(loadSyncState(b.storage).owner, null);
  assert.deepEqual(loadQueue(b.storage), []);
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['k1', 'k2']);
});

// A start whose `shopping.v1` could not be read: the same storage, and the empty state of load().
const restart = (a, server, { lost } = {}) => device({ server, storage: a.storage, state: emptyState(), lost });

test('a start whose state was lost pulls the account again and deletes nothing (ACC-1, I1)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  await a.syncer.run();
  const again = restart(a, server, { lost: true });
  assert.equal(loadSyncState(again.storage).cursor, '');
  await again.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i1', 'i2', 'settings']);
  assert.deepEqual(again.box.state.items.map((i) => i.name), ['Leche', 'Pan']);
});

test('a sync whose state holds none of the items and recipes of the account deletes nothing (SYNC-2)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  await a.syncer.run();
  const again = restart(a, server);
  await again.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i1', 'i2', 'settings']);
  assert.ok(console.error.mock.callCount() >= 1);
  // The merge puts the account back in place.
  assert.deepEqual(again.box.state.items.map((i) => i.name), ['Leche', 'Pan']);
});

test('a save on a state that lost the account queues no delete of it (SYNC-2)', async (t) => {
  t.mock.method(console, 'error', () => {});
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  await a.syncer.run();
  const again = restart(a, server);
  again.change(withItems([item('i9', 'Café')]));
  assert.deepEqual(loadQueue(again.storage).filter((c) => c.op === 'delete'), []);
  await again.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i1', 'i2', 'settings']);
});

test('the user can still delete every item, and an import can replace the account (SYNC-2, SYNC-9)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  a.change(withItems([]));
  await a.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key), ['settings']);
  const b = restart(a, server);
  b.change(withItems([item('i5', 'Café')]), { explicit: true });
  await b.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i5', 'settings']);
});

test('an import marked explicit replaces an account that the state never held (SYNC-9)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche'), item('i2', 'Pan')]));
  await a.syncer.run();
  const b = restart(a, server);
  b.change(withItems([item('i5', 'Café')]), { explicit: true });
  await b.syncer.run();
  assert.deepEqual(server.live('u1').map((row) => row.key).sort(), ['i5', 'settings']);
});

test('a delete that the server answers as gone checks the token: a refused refresh keeps it queued (SYNC-6, ACC-7)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  a.client.failPush = (_, change) => (change.op === 'delete' ? new PocketBaseError('gone', 404) : null);
  a.client.failRefresh = new PocketBaseError('auth', 401);
  a.change(withItems([]));
  assert.equal(await a.syncer.run(), 'auth');
  assert.deepEqual(loadQueue(a.storage).map((c) => [c.key, c.op]), [['i1', 'delete']]);
});

test('a delete that the server answers as gone after a good refresh leaves the queue (SYNC-6)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  a.client.failPush = (_, change) => (change.op === 'delete' ? new PocketBaseError('gone', 404) : null);
  a.change(withItems([]));
  const refreshes = a.client.calls.filter((c) => c === 'refresh').length;
  assert.equal(await a.syncer.run(), 'ok');
  assert.equal(a.client.calls.filter((c) => c === 'refresh').length, refreshes + 1);
  assert.deepEqual(loadQueue(a.storage), []);
});

const retryTimers = (box) => box.timers.filter(({ ms }) => ms !== 1500);

test('a rate limit mid-push keeps the queue, stays online and the retry sends the rest (SYNC-3)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPush = (n) => (n === 4 ? new PocketBaseError('rate', 429) : null);
  a.change(withItems(Array.from({ length: 9 }, (_, n) => item(`i${n}`, `Item ${n}`))));
  assert.equal(await a.syncer.run(), 'rate');
  assert.equal(loadQueue(a.storage).length, 7);
  assert.equal(a.box.statuses.at(-1).online, true);
  assert.equal(a.box.statuses.at(-1).pending, 7);
  assert.deepEqual(retryTimers(a.box).map(({ ms }) => ms), [5000]);
  assert.equal(await retryTimers(a.box)[0].fn(), 'ok');
  assert.equal(server.rows.length, 10);
  assert.deepEqual(loadQueue(a.storage), []);
  assert.equal(a.box.statuses.at(-1).online, true);
});

test('the retry delay grows with each stop and starts again after a good run (SYNC-3)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPull = new PocketBaseError('rate', 429);
  const delays = [];
  for (let n = 0; n < 6; n += 1) {
    await a.syncer.run();
    delays.push(retryTimers(a.box).at(-1).ms);
  }
  assert.deepEqual(delays, [5000, 15000, 30000, 60000, 60000, 60000]);
  a.client.failPull = null;
  assert.equal(await a.syncer.run(), 'ok');
  a.client.failPull = new PocketBaseError('rate', 429);
  await a.syncer.run();
  assert.equal(retryTimers(a.box).at(-1).ms, 5000);
});

test('a server error goes offline and also schedules a retry; a network error does not (SYNC-3, SYNC-11)', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.client.failPull = new PocketBaseError('server', 503);
  assert.equal(await a.syncer.run(), 'offline');
  assert.equal(a.box.statuses.at(-1).online, false);
  assert.deepEqual(retryTimers(a.box).map(({ ms }) => ms), [5000]);
  a.client.failPull = new PocketBaseError('network');
  assert.equal(await a.syncer.run(), 'offline');
  assert.equal(retryTimers(a.box).length, 1);
  a.client.failPull = null;
  assert.equal(await retryTimers(a.box)[0].fn(), 'ok');
  assert.equal(a.box.statuses.at(-1).online, true);
});

test('the status counts a run only when the server answered it (SYNC-11)', async () => {
  const server = fakeServer();
  const a = device({ server });
  const reached = () => a.box.statuses.at(-1).reached;
  a.client.failPull = new PocketBaseError('network');
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  assert.equal(a.box.statuses.at(-1).online, false);
  assert.equal(reached(), 0);
  a.client.failPull = new PocketBaseError('server', 503);
  await a.syncer.run();
  assert.equal(reached(), 0);
  a.client.failPull = new PocketBaseError('rate', 429);
  await a.syncer.run();
  assert.equal(reached(), 1);
  a.client.failPull = null;
  await a.syncer.run();
  assert.equal(reached(), 2);
  assert.equal(a.box.statuses.at(-1).lastSync, '2026-10-24T08:00:00.000Z');
});

// --- SHARE-6, SHARE-7: the own lane and the shared lane -------------------------------------------

const names = (state) => state.items.map((i) => i.name).sort();
const ownItems = (server, owner) => server.live(owner).filter((r) => r.kind === 'item').map((r) => r.data.name).sort();
const recipe = (id, name) => ({ id, name, products: ['Pasta'], url: '' });

// Owner o1 with a list on the server, and a member device u1 with a list of its own.
const sharedWorld = async (ownerState = withItems([item('o-i1', 'Leche')])) => {
  const server = fakeServer();
  const owner = device({ server, user: 'o1' });
  owner.change(ownerState);
  await owner.syncer.run();
  const member = device({ server, user: 'u1' });
  member.change(withItems([item('u-i1', 'Pan')]));
  await member.syncer.run();
  return { server, owner, member };
};

// The member of a share of o1, after the run that started the shared lane.
const joinedWorld = async (patch = {}, ownerState) => {
  const world = await sharedWorld(ownerState);
  const share = addShare(world.server, 'o1', 'u1', emailOf('u1'), patch);
  await world.member.syncer.run();
  return { ...world, share };
};

test('a run lists the shares after the refresh and before the push', async () => {
  const server = fakeServer();
  const a = device({ server });
  a.change(withItems([item('i1', 'Leche')]));
  await a.syncer.run();
  assert.deepEqual(a.client.calls.slice(0, 4), ['refresh', 'shares', 'push', 'push']);
  assert.equal(a.client.calls.at(-1), 'pull');
});

test('a login sets the space to the user and has no shared lane', async () => {
  const server = fakeServer();
  const a = device({ server, session: null });
  assert.equal(await a.syncer.login(sessionOf('u1')), 'synced');
  assert.equal(loadSyncState(a.storage).space, 'u1');
  assert.equal(a.syncer.status().shared, null);
  assert.equal(a.box.shared, null);
});

test('a member syncs the own space and the shared space in one run', async () => {
  const { server, member } = await sharedWorld();
  addShare(server, 'o1', 'u1');
  member.client.calls.length = 0;
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(member.client.calls, ['shares', 'pull', 'pull']);
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.deepEqual(names(member.box.shared), ['Leche']);
  assert.deepEqual(member.box.share, { owner: 'o1', ownerName: '', ownerEmail: emailOf('o1'), scope: 'all', id: 'sh1' });
  assert.deepEqual(member.syncer.status().shared, member.box.share);
  assert.equal(loadSyncState(member.storage, 'shared').space, 'o1');
  assert.equal(loadSyncState(member.storage).space, 'u1');
  assert.equal(member.syncer.status().pending, 0);
});

test('an accept on another device keeps the own list, sends its queue and adds the shared list', async () => {
  const { server, member } = await sharedWorld();
  member.change(withItems([item('u-i1', 'Pan'), item('u-i2', 'Sal')]));
  addShare(server, 'o1', 'u1');
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(names(member.box.state), ['Pan', 'Sal']);
  assert.deepEqual(names(member.box.shared), ['Leche']);
  assert.deepEqual(ownItems(server, 'u1'), ['Pan', 'Sal']);
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
  assert.deepEqual(loadQueue(member.storage), []);
  assert.deepEqual(loadQueue(member.storage, 'shared'), []);
});

test('an accept keeps the own state', async () => {
  const { server, owner, member } = await sharedWorld();
  await owner.syncer.invite(emailOf('u1'));
  await member.syncer.run();
  const before = member.box.state;
  assert.equal(await member.syncer.accept(server.shares[0].id), 'ok');
  assert.equal(member.box.state, before);
  assert.deepEqual(names(member.box.shared), ['Leche']);
});

test('a change of a shared item is pushed to the owner\'s space only', async () => {
  const { server, owner, member } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  assert.equal(member.syncer.status().pending, 1);
  assert.deepEqual(loadQueue(member.storage, 'shared').map((c) => c.key), ['m-i9']);
  assert.deepEqual(loadQueue(member.storage), []);
  await member.syncer.run();
  assert.deepEqual(member.client.pushed.filter((p) => p.key === 'm-i9').map((p) => p.space), ['o1']);
  await owner.syncer.run();
  assert.deepEqual(names(owner.box.state), ['Huevos', 'Leche']);
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.ok(!server.live('u1').some((r) => r.key === 'm-i9'));
});

test('a change of an own item is pushed to the own space only', async () => {
  const { server, member } = await joinedWorld();
  member.change(withItems([...member.box.state.items, item('u-i2', 'Sal')]));
  await member.syncer.run();
  assert.deepEqual(ownItems(server, 'u1'), ['Pan', 'Sal']);
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
  assert.deepEqual(names(member.box.shared), ['Leche']);
});

test("a member's settings change of the shared list patches the record of the owner's space", async () => {
  const { server, owner, member } = await joinedWorld();
  const own = server.rows.find((r) => r.owner === 'u1' && r.kind === 'settings');
  const before = JSON.stringify(own.data);
  member.changeShared({ ...member.box.shared, sort: 'name' });
  await member.syncer.run();
  await owner.syncer.run();
  assert.equal(owner.box.state.sort, 'name');
  assert.equal(JSON.stringify(own.data), before);
});

test('an end of the share drops the shared state and keeps the own state', async () => {
  const { server, member, share } = await joinedWorld();
  const before = member.box.state;
  share.cancelled = true;
  assert.equal(await member.syncer.run(), 'ok');
  assert.equal(member.box.shared, null);
  assert.equal(member.box.share, null);
  assert.equal(member.box.state, before);
  assert.equal(member.syncer.status().shared, null);
  assert.equal(member.box.statuses.at(-1).left, 0);
  assert.equal(loadSyncState(member.storage, 'shared').space, null);
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
});

test('a remove by the owner drops the shared queue and reports left', async () => {
  const { server, member, share } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  server.shares.splice(server.shares.indexOf(share), 1);
  assert.equal(await member.syncer.run(), 'ok');
  assert.equal(member.syncer.status().auth, false);
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.equal(member.box.shared, null);
  assert.equal(member.box.statuses.at(-1).left, 1);
  assert.equal(member.box.statuses.at(-1).shared, null);
  assert.deepEqual(loadQueue(member.storage, 'shared'), []);
  assert.ok(!server.rows.some((r) => r.key === 'm-i9'));
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
});

test('the start of the shared lane puts a state that queues nothing', async () => {
  const { member } = await joinedWorld();
  const pushes = member.client.pushes;
  await member.syncer.run();
  assert.equal(member.client.pushes, pushes);
  assert.deepEqual(loadQueue(member.storage), []);
  assert.deepEqual(loadQueue(member.storage, 'shared'), []);
});

test('the share list fails at the network: the run stops offline and keeps both lanes', async () => {
  const { server, member } = await sharedWorld();
  addShare(server, 'o1', 'u1');
  member.client.failShares = new PocketBaseError('network');
  assert.equal(await member.syncer.run(), 'offline');
  assert.equal(loadSyncState(member.storage, 'shared').space, null);
  assert.equal(member.box.shared, null);
  assert.deepEqual(names(member.box.state), ['Pan']);
});

test('leave sends the shared queue, then cancels', async () => {
  const { server, owner, member, share } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  assert.equal(await member.syncer.leave(share.id), 'ok');
  assert.ok(member.client.calls.indexOf('push') < member.client.calls.indexOf('cancel'));
  assert.ok(!member.client.calls.includes('remove'));
  await owner.syncer.run();
  assert.deepEqual(names(owner.box.state), ['Huevos', 'Leche']);
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.equal(member.box.shared, null);
  assert.deepEqual(server.shares.map((s) => s.cancelled), [true]);
  assert.equal(member.box.statuses.at(-1).left, 0);
});

test('a leave whose queue is not sent keeps the share and says so (SHARE-8)', async () => {
  const { server, member, share } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  member.client.failPush = () => new PocketBaseError('network');
  assert.deepEqual(await member.syncer.leave(share.id), { error: 'share.error.network' });
  assert.equal(server.shares[0].cancelled, false);
  assert.equal(loadQueue(member.storage, 'shared').length, 1);
  assert.deepEqual(names(member.box.shared), ['Huevos', 'Leche']);
});

test('decline cancels the invite, and setScope and reinvite go to the server', async () => {
  const { server, owner, member } = await sharedWorld();
  assert.equal(await owner.syncer.invite(emailOf('u1'), 'list'), 'ok');
  const [share] = server.shares;
  assert.equal(share.scope, 'list');
  await member.syncer.run();
  assert.equal(await member.syncer.decline(share.id), 'ok');
  assert.equal(share.cancelled, true);
  assert.equal(member.box.shared, null);
  assert.equal(await owner.syncer.reinvite(share.id), 'ok');
  assert.deepEqual([share.cancelled, share.member], [false, '']);
  assert.equal(await owner.syncer.setScope(share.id, 'all'), 'ok');
  assert.equal(share.scope, 'all');
  assert.deepEqual(owner.client.calls.filter((c) => ['invite', 'reinvite', 'scope'].includes(c)), ['invite', 'reinvite', 'scope']);
});

test('a narrowed scope drops recipes and meals and queues no delete', async () => {
  const ownerState = { ...withItems([item('o-i1', 'Leche')]), recipes: [recipe('r1', 'Pasta'), recipe('r2', 'Sopa')], sent: ['r1'], menu: [{ day: 0, meal: 'lunch', recipe: 'r1' }] };
  const { server, member, share } = await joinedWorld({}, ownerState);
  assert.equal(member.box.shared.recipes.length, 2);
  member.changeShared({ ...member.box.shared, recipes: [recipe('r1', 'Pasta'), recipe('r2', 'Sopa larga')] });
  share.scope = 'list';
  const pushed = member.client.pushed.length;
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(member.box.shared.recipes, []);
  assert.deepEqual(member.box.shared.menu, []);
  assert.deepEqual(names(member.box.shared), ['Leche']);
  assert.equal(member.box.share.scope, 'list');
  // SHARE-7: a narrowed scope is no end of the share: the drop counts in narrowed, not in left.
  assert.equal(member.box.statuses.at(-1).narrowed, 1);
  assert.equal(member.box.statuses.at(-1).left, 0);
  assert.deepEqual(member.client.pushed.slice(pushed), []);
  assert.deepEqual(loadQueue(member.storage, 'shared'), []);
  const sync = loadSyncState(member.storage, 'shared');
  assert.equal(sync.scope, 'list');
  for (const map of [sync.local, sync.server, sync.ids]) {
    assert.ok([...map.keys()].every((key) => key.startsWith('item:') || key.startsWith('settings:')), [...map.keys()].join());
  }
  assert.equal(server.live('o1').filter((r) => r.kind === 'recipe').length, 2);
  assert.equal(server.live('o1').find((r) => r.kind === 'recipe' && r.key === 'r2').data.name, 'Sopa');
  assert.equal(server.live('o1').filter((r) => r.kind === 'meal').length, 1);
});

test('under scope list a pulled settings record with an unknown sent recipe sends no settings', async () => {
  const ownerState = { ...withItems([item('o-i1', 'Leche')]), recipes: [recipe('r1', 'Pasta')], sent: ['r1'] };
  const { server, member } = await sharedWorld(ownerState);
  addShare(server, 'o1', 'u1', emailOf('u1'), { scope: 'list' });
  const pushed = member.client.pushed.length;
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(member.box.shared.sent, []);
  assert.deepEqual(member.box.shared.recipes, []);
  member.changeShared({ ...member.box.shared, sort: 'name' });
  assert.deepEqual(loadQueue(member.storage, 'shared'), []);
  await member.syncer.run();
  assert.deepEqual(member.client.pushed.slice(pushed), []);
  assert.deepEqual(server.live('o1').find((r) => r.kind === 'settings').data.sent, ['r1']);
});

test('a widened scope pulls the shared space in full', async () => {
  const ownerState = { ...withItems([item('o-i1', 'Leche')]), recipes: [recipe('r1', 'Pasta')] };
  const { member, share } = await joinedWorld({ scope: 'list' }, ownerState);
  assert.deepEqual(member.box.shared.recipes, []);
  await member.syncer.run();
  assert.deepEqual(member.box.shared.recipes, []);
  share.scope = 'all';
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(member.box.shared.recipes.map((r) => r.name), ['Pasta']);
  assert.equal(member.box.share.scope, 'all');
  assert.equal(loadSyncState(member.storage, 'shared').scope, 'all');
});

test('a v1.5.0 device in the shared space gets its own list back and keeps its shared queue', async () => {
  const { server, owner } = await sharedWorld();
  const share = addShare(server, 'o1', 'u1');
  // The member device of v1.5.0: its stored data is the space of o1, with one change not sent.
  const pulled = await owner.client.pull(tokenOf('o1'), '', 'o1');
  const sharedState = withItems([item('o-i1', 'Leche')]);
  const local = toRecords(sharedState);
  const ids = new Map(pulled.map((rec) => [recordKey(rec.kind, rec.key), rec.id]));
  const serverMap = new Map(pulled.map((rec) => [recordKey(rec.kind, rec.key), rec]));
  const storage = fakeStorage();
  saveSession(storage, sessionOf('u1'));
  saveSyncState(storage, { owner: 'u1', space: 'o1', shares: [share], cursor: pulled.at(-1).updated, server: serverMap, local, ids });
  const state = withItems([item('o-i1', 'Leche'), item('m-i9', 'Huevos')]);
  const queued = [{ kind: 'item', key: 'm-i9', op: 'upsert', data: toRecords(state).get('item:m-i9').data }];
  saveQueue(storage, queued);
  const member = device({ server, user: 'u1', storage, state });
  assert.deepEqual(member.box.state, emptyState());
  assert.equal(member.box.shared, state);
  assert.deepEqual(loadSharedState(storage), state);
  assert.deepEqual(loadQueue(storage), []);
  assert.deepEqual(loadQueue(storage, 'shared'), queued);
  const sharedSync = loadSyncState(storage, 'shared');
  assert.deepEqual([sharedSync.owner, sharedSync.space, sharedSync.cursor], ['u1', 'o1', pulled.at(-1).updated]);
  const ownSync = loadSyncState(storage);
  assert.deepEqual([ownSync.owner, ownSync.space, ownSync.cursor, ownSync.ids.size], ['u1', 'u1', '', 0]);
  assert.equal(member.syncer.status().pending, 1);
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.deepEqual(names(member.box.shared), ['Huevos', 'Leche']);
  assert.deepEqual(member.box.share.owner, 'o1');
  assert.deepEqual(ownItems(server, 'o1'), ['Huevos', 'Leche']);
  assert.deepEqual(ownItems(server, 'u1'), ['Pan']);
  assert.deepEqual(member.client.pushed.map((p) => [p.space, p.key]), [['o1', 'm-i9']]);
});

test('a v1.5.0 device in a shared space that ended drops the shared queue at its first run', async () => {
  const { server } = await sharedWorld();
  const storage = fakeStorage();
  saveSession(storage, sessionOf('u1'));
  const state = withItems([item('o-i1', 'Leche'), item('m-i9', 'Huevos')]);
  saveSyncState(storage, { owner: 'u1', space: 'o1', shares: [], cursor: '', server: new Map(), local: toRecords(withItems([item('o-i1', 'Leche')])), ids: new Map() });
  saveQueue(storage, [{ kind: 'item', key: 'm-i9', op: 'upsert', data: toRecords(state).get('item:m-i9').data }]);
  const member = device({ server, user: 'u1', storage, state });
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.equal(member.box.shared, null);
  assert.equal(member.box.statuses.at(-1).left, 1);
  assert.ok(!server.rows.some((r) => r.key === 'm-i9'));
});

test('a failed shared pull keeps the own pull of the run', async () => {
  const { server, member } = await joinedWorld();
  server.add('u1', 'item', 'u-i2', { ...item('u-i2', 'Sal'), position: 1 });
  const sharedBefore = member.box.shared;
  member.client.failPullOf = { space: 'o1', error: new PocketBaseError('network') };
  assert.equal(await member.syncer.run(), 'offline');
  assert.deepEqual(names(member.box.state), ['Pan', 'Sal']);
  assert.ok(loadSyncState(member.storage).local.has('item:u-i2'));
  assert.equal(member.box.shared, sharedBefore);
  member.client.failPullOf = null;
  member.client.calls.length = 0;
  assert.equal(await member.syncer.run(), 'ok');
  assert.deepEqual(names(member.box.state), ['Pan', 'Sal']);
});

test('invite and accept go through the server and sync', async () => {
  const { server, owner, member } = await sharedWorld();
  assert.equal(await owner.syncer.invite(' U1@example.test '), 'ok');
  assert.deepEqual(server.shares.map((s) => [s.owner, s.email, s.member]), [['o1', 'u1@example.test', '']]);
  assert.deepEqual(owner.syncer.status().shares.length, 1);
  await member.syncer.run();
  assert.equal(member.syncer.status().shares.length, 1);
  assert.equal(await member.syncer.accept(server.shares[0].id), 'ok');
  assert.deepEqual(names(member.box.shared), ['Leche']);
  assert.deepEqual(names(member.box.state), ['Pan']);
});

test('remove deletes the share and syncs', async () => {
  const { server, owner } = await sharedWorld();
  const share = addShare(server, 'o1', 'u1');
  assert.equal(await owner.syncer.remove(share.id), 'ok');
  assert.deepEqual(server.shares, []);
  assert.deepEqual(owner.syncer.status().shares, []);
});

test('invite maps the server errors to share.error keys', async () => {
  const server = fakeServer();
  const a = device({ server });
  const cases = [
    [new PocketBaseError('invalid', 400, { email: { code: 'share_self' } }), 'share.error.self'],
    [new PocketBaseError('invalid', 400, { email: { code: 'validation_not_unique' } }), 'share.error.taken'],
    [new PocketBaseError('invalid', 400, { email: { code: 'share_member' } }), 'share.error.taken'],
    [new PocketBaseError('invalid', 400, { email: { code: 'validation_invalid_email' } }), 'share.error.invalid'],
    [new PocketBaseError('network'), 'share.error.network'],
    [new PocketBaseError('server', 503), 'share.error.network'],
  ];
  for (const [error, key] of cases) {
    a.client.failShareCall = error;
    assert.deepEqual(await a.syncer.invite('x@example.test'), { error: key }, key);
  }
  assert.deepEqual(await a.syncer.invite('   '), { error: 'share.error.invalid' });
});

test('a logout clears the shared lane too', async () => {
  const { member } = await joinedWorld();
  assert.equal(await member.syncer.logout({ online: false }), 'done');
  assert.equal(member.box.shared, null);
  assert.equal(member.syncer.status().shared, null);
  assert.equal(member.storage.getItem(SHARED_STORAGE_KEY), null);
  assert.equal(loadSyncState(member.storage, 'shared').space, null);
});

// --- Final review: races between a running sync and a share --------------------------------------

test('a share request during a run waits for it, then syncs again, so the shared lane ends', async () => {
  const { member, share } = await joinedWorld();
  const held = holdOnce(member.client, 'pull');
  const running = member.syncer.run();
  await held.waiting;
  const removed = member.syncer.remove(share.id);
  held.release();
  await running;
  assert.equal(await removed, 'ok');
  assert.equal(member.box.shared, null);
  assert.deepEqual(names(member.box.state), ['Pan']);
});

test('a push refused in a shared space that ended ends the shared lane instead of an auth stop', async () => {
  const { server, member, share } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  member.client.hold = (name) => {
    if (name !== 'push') return null;
    member.client.hold = null;
    server.shares.splice(server.shares.indexOf(share), 1);
    return null;
  };
  assert.equal(await member.syncer.run(), 'ok');
  assert.equal(member.syncer.status().auth, false);
  assert.equal(member.box.shared, null);
  assert.deepEqual(names(member.box.state), ['Pan']);
  assert.equal(member.box.statuses.at(-1).left, 1);
});

test('a push refused in a shared space that did not end is an auth stop and keeps the queue', async () => {
  const { member } = await joinedWorld();
  member.changeShared(withItems([...member.box.shared.items, item('m-i9', 'Huevos')]));
  member.client.failPush = () => refusedRule();
  assert.equal(await member.syncer.run(), 'auth');
  assert.equal(member.syncer.status().auth, true);
  assert.deepEqual(names(member.box.shared), ['Huevos', 'Leche']);
  assert.equal(loadQueue(member.storage, 'shared').length, 1);
});

test('a start with no shared state pulls the shared space again and deletes nothing (ACC-1, SYNC-2)', async () => {
  const { server, member } = await joinedWorld();
  const again = device({ server, user: 'u1', storage: member.storage, state: member.box.state });
  again.changeShared(emptyState());
  assert.ok(loadQueue(again.storage, 'shared').every((c) => c.op !== 'delete'));
  assert.equal(await again.syncer.run(), 'ok');
  assert.deepEqual(names(again.box.shared), ['Leche']);
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
});

test('the SYNC-2 guard holds in the shared lane', async (t) => {
  const error = t.mock.method(console, 'error', () => {});
  const { server, member } = await joinedWorld();
  // The shared state fell back to the empty one at the start.
  const again = device({ server, user: 'u1', storage: member.storage, state: member.box.state, shared: emptyState() });
  again.changeShared(emptyState());
  assert.equal(error.mock.callCount(), 1);
  assert.deepEqual(loadQueue(again.storage, 'shared'), []);
  assert.equal(await again.syncer.run(), 'ok');
  assert.deepEqual(names(again.box.shared), ['Leche']);
  assert.deepEqual(ownItems(server, 'o1'), ['Leche']);
});
