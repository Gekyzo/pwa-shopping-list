import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, PocketBaseError, isUniqueViolation } from '#pocketbase';
import { recordKey } from '#records';

const URL_ = 'https://pb.test';
const jwt = (id) => `h.${btoa(JSON.stringify({ id }))}.s`;
const TOKEN = jwt('user1');
const reply = (status, body) => ({ ok: status < 400, status, json: async () => body });
const userRecord = { id: 'user1', email: 'a@b.c', name: 'Ana', approved: true };
const serverRow = (over = {}) => ({
  id: 'r1', collectionId: 'c', owner: 'user1', kind: 'item', key: 'a', data: { n: 1 }, deleted: false,
  updated: '2026-10-24 08:00:00.000Z', ...over,
});
const unique = reply(400, {
  data: { key: { code: 'validation_not_unique' }, kind: { code: 'validation_not_unique' }, owner: { code: 'validation_not_unique' } },
  message: 'Failed to create record.', status: 400,
});

// A fake fetch that records each request and answers from a list of replies, in order.
const fake = (...replies) => {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: new globalThis.URL(url), method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
    const next = replies.shift();
    if (next instanceof Error) throw next;
    return next;
  };
  return { calls, client: createClient({ url: URL_, fetch }) };
};

test('authWithPassword posts identity and password and returns the session', async () => {
  const { calls, client } = fake(reply(200, { token: 'T', record: { ...userRecord, extra: 1 } }));
  const session = await client.authWithPassword('a@b.c', 'pw');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url.pathname, '/api/collections/users/auth-with-password');
  assert.deepEqual(calls[0].body, { identity: 'a@b.c', password: 'pw' });
  assert.deepEqual(session, { token: 'T', user: userRecord });
});

test('requestAccess creates the user then logs in', async () => {
  const { calls, client } = fake(reply(200, userRecord), reply(200, { token: 'T', record: { ...userRecord, approved: false } }));
  const session = await client.requestAccess({ name: 'Ana', email: 'a@b.c', password: 'pw' });
  assert.equal(calls[0].url.pathname, '/api/collections/users/records');
  assert.deepEqual(calls[0].body, { email: 'a@b.c', password: 'pw', passwordConfirm: 'pw', name: 'Ana' });
  assert.equal(calls[1].url.pathname, '/api/collections/users/auth-with-password');
  assert.equal(session.user.approved, false);
});

const methods = reply(200, {
  oauth2: { providers: [{ name: 'github', authURL: 'x' }, { name: 'google', state: 'S', codeVerifier: 'V', authURL: 'https://g.test/auth?redirect_uri=' }] },
});

test('oauthStart appends the encoded redirect URL to the authURL of google', async () => {
  const { calls, client } = fake(methods);
  const started = await client.oauthStart('https://app.test/x?a=1');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].url.pathname, '/api/collections/users/auth-methods');
  assert.equal(started.url, 'https://g.test/auth?redirect_uri=https%3A%2F%2Fapp.test%2Fx%3Fa%3D1');
  assert.deepEqual(started.pending, { provider: 'google', state: 'S', codeVerifier: 'V' });
});

test('oauthStart without a google provider is an invalid error', async () => {
  const { client } = fake(reply(200, { oauth2: { providers: [] } }));
  await assert.rejects(client.oauthStart('u'), { type: 'invalid' });
});

test('oauthFinish rejects a state that does not match, with no request', async () => {
  const { calls, client } = fake();
  await assert.rejects(client.oauthFinish({ code: 'c', state: 'X' }, { provider: 'google', state: 'S', codeVerifier: 'V' }, 'u'), { type: 'state' });
  assert.equal(calls.length, 0);
});

test('oauthFinish exchanges the code and sends no createData', async () => {
  const { calls, client } = fake(reply(200, { token: 'T', record: userRecord }));
  const session = await client.oauthFinish({ code: 'c', state: 'S' }, { provider: 'google', state: 'S', codeVerifier: 'V' }, 'https://app.test/');
  assert.equal(calls[0].url.pathname, '/api/collections/users/auth-with-oauth2');
  assert.deepEqual(calls[0].body, { provider: 'google', code: 'c', codeVerifier: 'V', redirectURL: 'https://app.test/' });
  assert.equal(session.token, 'T');
});

test('refresh posts the token and requestPasswordReset resolves with nothing', async () => {
  const { calls, client } = fake(reply(200, { token: 'T2', record: userRecord }), reply(204, null));
  assert.equal((await client.refresh('T')).token, 'T2');
  assert.equal(calls[0].headers.Authorization, 'T');
  assert.equal(await client.requestPasswordReset('a@b.c'), undefined);
  assert.equal(calls[1].url.pathname, '/api/collections/users/request-password-reset');
  assert.deepEqual(calls[1].body, { email: 'a@b.c' });
});

test('pull follows every page and sends the cursor in the filter', async () => {
  const { calls, client } = fake(
    reply(200, { items: [serverRow()], page: 1, totalPages: 2 }),
    reply(200, { items: [serverRow({ id: 'r2', key: 'b' })], page: 2, totalPages: 2 }),
  );
  const pulled = await client.pull(TOKEN, '2026-10-24 07:00:00.000Z');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.searchParams.get('filter'), 'updated >= "2026-10-24 07:00:00.000Z"');
  assert.equal(calls[0].url.searchParams.get('sort'), 'updated');
  assert.equal(calls[0].url.searchParams.get('perPage'), '500');
  assert.equal(calls[1].url.searchParams.get('page'), '2');
  assert.equal(calls[0].headers.Authorization, TOKEN);
  assert.deepEqual(pulled.map((r) => r.id), ['r1', 'r2']);
  assert.deepEqual(Object.keys(pulled[0]), ['id', 'kind', 'key', 'data', 'deleted', 'updated']);
});

test('pull with an empty cursor sends no filter and an empty server gives an empty list', async () => {
  const { calls, client } = fake(reply(200, { items: [], page: 1, totalPages: 0 }));
  assert.deepEqual(await client.pull(TOKEN, ''), []);
  assert.equal(calls[0].url.searchParams.has('filter'), false);
});

test('push posts a new record with the owner, then patches it when its id is known', async () => {
  const { calls, client } = fake(reply(200, serverRow()), reply(200, serverRow({ data: { n: 2 } })));
  const ids = new Map();
  const first = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, ids);
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(calls[0].body, { owner: 'user1', kind: 'item', key: 'a', deleted: false, data: { n: 1 } });
  ids.set(recordKey('item', 'a'), first.id);
  await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 2 } }, ids);
  assert.equal(calls[1].method, 'PATCH');
  assert.equal(calls[1].url.pathname, '/api/collections/shopping_records/records/r1');
  assert.deepEqual(calls[1].body, { deleted: false, data: { n: 2 } });
});

test('push of a change refused by the unique index patches the existing record', async () => {
  const { calls, client } = fake(unique, reply(200, { items: [serverRow()], totalPages: 1 }), reply(200, serverRow({ data: { n: 3 } })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 3 } }, new Map());
  assert.equal(calls[1].url.searchParams.get('filter'), 'kind = "item" && key = "a"');
  assert.equal(calls[2].method, 'PATCH');
  assert.equal(calls[2].url.pathname, '/api/collections/shopping_records/records/r1');
  assert.deepEqual(rec.data, { n: 3 });
});

test('push of an upsert whose known id answers 404 creates the record', async () => {
  const { calls, client } = fake(reply(404, { data: {} }), reply(200, serverRow({ id: 'r9' })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, new Map([['item:a', 'r1']]));
  assert.deepEqual(calls.map((c) => c.method), ['PATCH', 'POST']);
  assert.equal(calls[1].body.owner, 'user1');
  assert.equal(rec.id, 'r9');
});

test('push of an upsert whose known id answers 404 patches the record found by kind and key', async () => {
  const { calls, client } = fake(reply(404, {}), unique, reply(200, { items: [serverRow({ id: 'r7' })], totalPages: 1 }), reply(200, serverRow({ id: 'r7' })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, new Map([['item:a', 'r1']]));
  assert.deepEqual(calls.map((c) => c.method), ['PATCH', 'POST', 'GET', 'PATCH']);
  assert.equal(calls[3].url.pathname, '/api/collections/shopping_records/records/r7');
  assert.equal(rec.id, 'r7');
});

test('push of a delete whose known id answers 404 and has no record throws gone, so the token is checked', async () => {
  const { calls, client } = fake(reply(404, {}), reply(200, { items: [], totalPages: 0 }));
  await assert.rejects(client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map([['item:a', 'r1']])), { type: 'gone', status: 404 });
  assert.equal(calls.length, 2);
});

test('a token with no readable id is an auth error and sends no create', async () => {
  const { calls, client } = fake();
  await assert.rejects(client.push('garbage', { kind: 'item', key: 'a', op: 'upsert', data: {} }, new Map()), { type: 'auth' });
  assert.equal(calls.length, 0);
});

test('the id of a token is read from a base64url payload with no padding', async () => {
  const payload = btoa(JSON.stringify({ id: 'user?>>', exp: 1 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  assert.ok(/[-_]/.test(payload));
  const { calls, client } = fake(reply(200, serverRow()));
  await client.push(`h.${payload}.s`, { kind: 'item', key: 'a', op: 'upsert', data: {} }, new Map());
  assert.equal(calls[0].body.owner, 'user?>>');
});

test('pull stops when the answer has no totalPages', async () => {
  const { calls, client } = fake(reply(200, { items: [serverRow()] }));
  assert.equal((await client.pull(TOKEN, '')).length, 1);
  assert.equal(calls.length, 1);
});

test('a 400 with no field error is not a unique violation', async () => {
  const { calls, client } = fake(reply(400, { data: {}, message: 'Failed to create record.', status: 400 }));
  await assert.rejects(client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: {} }, new Map()), { type: 'invalid' });
  assert.equal(calls.length, 1);
  assert.equal(isUniqueViolation(new PocketBaseError('invalid', 400, {})), false);
});

test('a delete is a patch with deleted true', async () => {
  const { calls, client } = fake(reply(200, serverRow({ deleted: true })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map([['item:a', 'r1']]));
  assert.equal(calls[0].method, 'PATCH');
  // SYNC-6: the tombstone keeps its data.
  assert.deepEqual(calls[0].body, { deleted: true });
  assert.equal(rec.deleted, true);
});

test('a delete with no known id finds the record, or resolves null and creates nothing', async () => {
  const found = fake(reply(200, { items: [serverRow()], totalPages: 1 }), reply(200, serverRow({ deleted: true })));
  await found.client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map());
  assert.equal(found.calls[1].method, 'PATCH');
  const none = fake(reply(200, { items: [], totalPages: 0 }));
  assert.equal(await none.client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map()), null);
  assert.equal(none.calls.length, 1);
});

test('a fetch TypeError is a network error, a 401 an auth error, a 400 an invalid error', async () => {
  const errors = [];
  for (const answer of [new TypeError('Failed to fetch'), reply(401, {}), reply(403, {}), reply(400, { data: { email: { code: 'x' } } }), reply(503, {})]) {
    await fake(answer).client.refresh('T').catch((error) => errors.push(error));
  }
  assert.ok(errors.every((error) => error instanceof PocketBaseError));
  assert.deepEqual(errors.map((error) => error.type), ['network', 'auth', 'auth', 'invalid', 'server']);
  assert.deepEqual(errors.map((error) => error.status), [0, 401, 403, 400, 503]);
  assert.deepEqual(errors[3].fields, { email: { code: 'x' } });
});

class FakeSource {
  static last;
  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.closed = false;
    FakeSource.last = this;
  }
  addEventListener(name, listener) {
    this.listeners[name] = listener;
  }
  emit(name, data) {
    return this.listeners[name]({ data: JSON.stringify(data) });
  }
  close() {
    this.closed = true;
  }
}

test('subscribe posts the clientId of PB_CONNECT and passes record events on', async () => {
  const seen = [];
  const log = [];
  const fetch = async (url, init) => {
    log.push({ url, method: init.method, headers: init.headers, body: JSON.parse(init.body) });
    return reply(204, null);
  };
  const client = createClient({ url: URL_, fetch, EventSource: FakeSource });
  const stop = client.subscribe(TOKEN, (rec) => seen.push(rec));
  assert.equal(FakeSource.last.url, `${URL_}/api/realtime`);
  await FakeSource.last.emit('PB_CONNECT', { clientId: 'cid' });
  assert.equal(log[0].method, 'POST');
  assert.equal(log[0].url, `${URL_}/api/realtime`);
  assert.equal(log[0].headers.Authorization, TOKEN);
  assert.deepEqual(log[0].body, { clientId: 'cid', subscriptions: ['shopping_records'] });
  FakeSource.last.emit('shopping_records', { action: 'update', record: serverRow() });
  FakeSource.last.emit('shopping_records', { action: 'delete', record: serverRow({ id: 'r2' }) });
  assert.deepEqual(seen.map((r) => [r.id, r.deleted]), [['r1', false], ['r2', true]]);
  stop();
  assert.equal(FakeSource.last.closed, true);
});

test('subscribe drops a malformed event but does not swallow an error of the consumer', () => {
  const client = createClient({ url: URL_, fetch: async () => reply(204, null), EventSource: FakeSource });
  const seen = [];
  client.subscribe(TOKEN, (rec) => {
    seen.push(rec);
    throw new Error('consumer');
  });
  FakeSource.last.listeners.shopping_records({ data: 'not json' });
  assert.equal(seen.length, 0);
  assert.throws(() => FakeSource.last.emit('shopping_records', { action: 'update', record: serverRow() }), /consumer/);
});

test('subscribe reads the token at each PB_CONNECT and calls onReconnect at each one after the first', async () => {
  const tokens = [];
  const fetch = async (url, init) => {
    tokens.push(init.headers.Authorization);
    return reply(204, null);
  };
  const client = createClient({ url: URL_, fetch, EventSource: FakeSource });
  let token = 'first';
  let reconnects = 0;
  client.subscribe(() => token, () => {}, { onReconnect: () => { reconnects += 1; } });
  await FakeSource.last.emit('PB_CONNECT', { clientId: 'a' });
  assert.equal(reconnects, 0);
  token = 'second';
  await FakeSource.last.emit('PB_CONNECT', { clientId: 'b' });
  assert.deepEqual(tokens, ['first', 'second']);
  assert.equal(reconnects, 1);
});
