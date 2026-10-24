import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createSyncer } from '#syncer';
import { PocketBaseError } from '#pocketbase';
import { emptyState } from '#store';
import { normalizeState, BEFORE_LOGIN_KEY, STORAGE_KEY } from '#storage';
import { saveSession, loadSession, loadQueue, saveQueue, saveSyncState, loadSyncState, SESSION_KEY } from '#session';
import { recordKey } from '#records';

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
    live: (owner) => rows.filter((row) => row.owner === owner && !row.deleted),
    add: (owner, kind, key, data) => rows.push({ id: `pb${rows.length + 1}`, owner, kind, key, data, deleted: false, updated: stamp() }),
    copy,
  };
};

const ownerOf = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url')).id;

const fakeClient = (server, { approved = true } = {}) => {
  const calls = [];
  const client = {
    calls,
    failPush: null,
    failPull: null,
    failRefresh: null,
    approved,
    pushes: 0,
    refresh: async (token) => {
      calls.push('refresh');
      if (client.failRefresh) throw client.failRefresh;
      const id = ownerOf(token);
      return { token: tokenOf(id, calls.length), user: { id, email: `${id}@example.test`, name: id, approved: client.approved } };
    },
    pull: async (token, since) => {
      calls.push('pull');
      if (client.hold) await client.hold('pull');
      if (client.failPull) throw client.failPull;
      const owner = ownerOf(token);
      return server.rows
        .filter((row) => row.owner === owner && (!since || row.updated >= since))
        .sort((a, b) => (a.updated < b.updated ? -1 : 1))
        .map(({ owner: _, ...row }) => ({ ...row }));
    },
    push: async (token, change, ids) => {
      calls.push('push');
      if (client.hold) await client.hold('push');
      client.pushes += 1;
      const failure = client.failPush?.(client.pushes, change, token);
      if (failure) throw failure;
      const owner = ownerOf(token);
      const body = change.op === 'delete' ? { deleted: true, data: null } : { deleted: false, data: change.data };
      const id = ids.get(recordKey(change.kind, change.key));
      let row = id ? server.rows.find((r) => r.id === id) : null;
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
const device = ({ server, user = 'u1', state = emptyState(), session = sessionOf(user), synced = true, approved } = {}) => {
  const storage = fakeStorage();
  const client = fakeClient(server, { approved });
  if (session) saveSession(storage, session);
  if (session && synced) saveSyncState(storage, { owner: session.user.id, cursor: '', server: new Map(), local: new Map(), ids: new Map() });
  const box = { state, statuses: [], timers: [] };
  const syncer = createSyncer({
    client,
    storage,
    getState: () => box.state,
    setState: (next) => {
      box.state = next;
    },
    now: () => Date.parse('2026-10-24T08:00:00Z'),
    onStatus: (status) => box.statuses.push(status),
    setTimer: (fn, ms) => {
      box.timers.push({ fn, ms });
      return box.timers.length;
    },
    clearTimer: () => {},
  });
  return { storage, client, syncer, box, change: (next) => { box.state = next; syncer.notify(next); } };
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
  assert.deepEqual(status, { online: true, pending: 0, lastSync: '2026-10-24T08:00:00.000Z' });
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
  // The merge of an empty account adds the default settings record, which the second run sends.
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'pull']);
  assert.notEqual(loadSession(storage).token, sessionOf('u1').token);
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'pull', 'push', 'pull']);
  clock += 10 * 60_000 + 1;
  await syncer.run();
  assert.deepEqual(client.calls, ['refresh', 'pull', 'push', 'pull', 'refresh', 'pull']);
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
  assert.deepEqual(client.calls, ['refresh', 'pull', 'refresh', 'push', 'pull']);
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
