// Fakes that several tests share. Not a test file: `node --test` runs only `*.test.js`.

import { PocketBaseError } from '#pocketbase';
import { recordKey } from '#records';

// A `localStorage` in memory, with `length` and `key` for the code that walks the keys, and
// `keys()` for a test that reads them all.
export const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    keys: () => [...data.keys()],
  };
};

// A storage that the browser denies: each access throws.
export const brokenStorage = () => {
  const deny = () => {
    throw new Error('denied');
  };
  return {
    getItem: deny,
    setItem: deny,
    removeItem: deny,
    get length() {
      return deny();
    },
    key: deny,
  };
};

export const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
// A JWT whose `exp` is far in the future; the fake server reads the user id from it.
export const tokenOf = (id, n = 0) => `${base64url({ alg: 'none' })}.${base64url({ id, exp: 4_000_000_000, n })}.sig`;
export const sessionOf = (id, approved = true) => ({ token: tokenOf(id), user: { id, email: `${id}@example.test`, name: id, approved } });


// An in-memory server: it assigns ids and increasing `updated` strings. A push with no id creates a
// new row, as a POST does, so a resent change shows up as a duplicate.
export const fakeServer = () => {
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

export const emailOf = (id) => `${id}@example.test`;

// The rule of the server (SHARE-1, SHARE-11): a user acts on their own space, and on the space of a
// share whose member they are and that is not cancelled; with scope `list` on items and settings only.
const mayAct = (server, user, space, kind) =>
  space === user ||
  server.shares.some((s) => s.owner === space && s.member === user && !s.cancelled && (s.scope === 'all' || kind === 'item' || kind === 'settings'));

// PocketBase answers a refused rule as it answers a guest: a 400 with no field error.
export const refusedRule = () => new PocketBaseError('invalid', 400, {});

export const addShare = (server, owner, member = '', email = emailOf(member), patch = {}) => {
  const share = { id: `sh${server.shares.length + 1}`, owner, email, ownerEmail: emailOf(owner), member, ownerName: '', scope: 'all', cancelled: false, ...patch };
  server.shares.push(share);
  return share;
};

export const fakeClient = (server, { approved = true } = {}) => {
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
