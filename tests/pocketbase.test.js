import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient, PocketBaseError, isUniqueViolation } from '#pocketbase';
import { recordKey } from '#records';

const URL_ = 'https://pb.test';
const jwt = (id) => `h.${btoa(JSON.stringify({ id }))}.s`;
const TOKEN = jwt('user1');
// The space differs from the user of the token: a member writes the space of the owner (SHARE-6).
const SPACE = 'space1';
const reply = (status, body) => ({ ok: status < 400, status, json: async () => body });
const userRecord = { id: 'user1', email: 'a@b.c', name: 'Ana', approved: true };
const serverRow = (over = {}) => ({
  id: 'r1', collectionId: 'c', owner: 'user1', kind: 'item', key: 'a', data: { n: 1 }, deleted: false,
  updated: '2026-10-24 08:00:00.000Z', ...over,
});
// The access row of the user for the shopping app (ACC-4); no status: no row.
const access = (status) => reply(200, { items: status ? [{ id: 'acc1', user: 'user1', app: 'app1', status }] : [], page: 1, totalPages: status ? 1 : 0 });
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
  const { calls, client } = fake(reply(200, { token: 'T', record: { ...userRecord, extra: 1 } }), access('approved'));
  const session = await client.authWithPassword('a@b.c', 'pw');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].url.pathname, '/api/collections/users/auth-with-password');
  assert.deepEqual(calls[0].body, { identity: 'a@b.c', password: 'pw' });
  assert.deepEqual(session, { token: 'T', user: userRecord });
});

test('requestAccess creates the user then logs in', async () => {
  const { calls, client } = fake(reply(200, userRecord), reply(200, { token: 'T', record: { ...userRecord, approved: false } }), access('pending'));
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
  const { calls, client } = fake(reply(200, { token: 'T', record: userRecord }), access('approved'));
  const session = await client.oauthFinish({ code: 'c', state: 'S' }, { provider: 'google', state: 'S', codeVerifier: 'V' }, 'https://app.test/');
  assert.equal(calls[0].url.pathname, '/api/collections/users/auth-with-oauth2');
  assert.deepEqual(calls[0].body, { provider: 'google', code: 'c', codeVerifier: 'V', redirectURL: 'https://app.test/' });
  assert.equal(session.token, 'T');
});

test('refresh posts the token and requestPasswordReset resolves with nothing', async () => {
  const { calls, client } = fake(reply(200, { token: 'T2', record: userRecord }), access('approved'), reply(204, null));
  assert.equal((await client.refresh('T')).token, 'T2');
  assert.equal(calls[0].headers.Authorization, 'T');
  assert.equal(await client.requestPasswordReset('a@b.c'), undefined);
  assert.equal(calls[2].url.pathname, '/api/collections/users/request-password-reset');
  assert.deepEqual(calls[2].body, { email: 'a@b.c' });
});

test('a session reads the access row of the shopping app with the new token (ACC-4)', async () => {
  const { calls, client } = fake(reply(200, { token: 'T', record: userRecord }), access('approved'));
  const session = await client.authWithPassword('a@b.c', 'pw');
  assert.equal(calls[1].method, 'GET');
  assert.equal(calls[1].url.pathname, '/api/collections/app_access/records');
  assert.equal(calls[1].url.searchParams.get('filter'), 'user = "user1" && app.slug = "shopping"');
  assert.equal(calls[1].headers.Authorization, 'T');
  assert.equal(session.user.approved, true);
});

test('a pending or revoked row is not approved, whatever the user record says (ACC-4)', async () => {
  for (const status of ['pending', 'revoked']) {
    const { client } = fake(reply(200, { token: 'T', record: { ...userRecord, approved: true } }), access(status));
    assert.equal((await client.refresh('T')).user.approved, false, status);
  }
});

test('with no row the client asks for access with a pending row of the shopping app (ACC-3)', async () => {
  const { calls, client } = fake(
    reply(200, { token: 'T', record: userRecord }),
    access(null),
    reply(200, { items: [{ id: 'app1', slug: 'shopping' }], page: 1, totalPages: 1 }),
    reply(200, { id: 'acc1', user: 'user1', app: 'app1', status: 'pending' }),
  );
  const session = await client.oauthFinish({ code: 'c', state: 'S' }, { provider: 'google', state: 'S', codeVerifier: 'V' }, 'u');
  assert.equal(calls[2].url.pathname, '/api/collections/apps/records');
  assert.equal(calls[2].url.searchParams.get('filter'), 'slug = "shopping"');
  assert.equal(calls[3].method, 'POST');
  assert.equal(calls[3].url.pathname, '/api/collections/app_access/records');
  assert.deepEqual(calls[3].body, { user: 'user1', app: 'app1', status: 'pending' });
  assert.equal(session.user.approved, false);
});

test('a row made meanwhile (a duplicate) is read again', async () => {
  const dup = reply(400, { data: { user: { code: 'validation_not_unique' } }, message: 'Failed to create record.', status: 400 });
  const { calls, client } = fake(
    reply(200, { token: 'T', record: userRecord }),
    access(null),
    reply(200, { items: [{ id: 'app1', slug: 'shopping' }], page: 1, totalPages: 1 }),
    dup,
    access('approved'),
  );
  assert.equal((await client.refresh('T')).user.approved, true);
  assert.equal(calls.length, 5);
});

test('a server with no shopping app is an invalid error', async () => {
  const { client } = fake(reply(200, { token: 'T', record: userRecord }), access(null), reply(200, { items: [], page: 1, totalPages: 0 }));
  await assert.rejects(client.refresh('T'), { type: 'invalid' });
});

test('pull follows every page and sends the cursor in the filter', async () => {
  const { calls, client } = fake(
    reply(200, { items: [serverRow()], page: 1, totalPages: 2 }),
    reply(200, { items: [serverRow({ id: 'r2', key: 'b' })], page: 2, totalPages: 2 }),
  );
  const pulled = await client.pull(TOKEN, '2026-10-24 07:00:00.000Z', SPACE);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.searchParams.get('filter'), 'owner = "space1" && updated >= "2026-10-24 07:00:00.000Z"');
  assert.equal(calls[0].url.searchParams.get('sort'), 'updated');
  assert.equal(calls[0].url.searchParams.get('perPage'), '500');
  assert.equal(calls[1].url.searchParams.get('page'), '2');
  assert.equal(calls[0].headers.Authorization, TOKEN);
  assert.deepEqual(pulled.map((r) => r.id), ['r1', 'r2']);
  assert.deepEqual(Object.keys(pulled[0]), ['id', 'kind', 'key', 'data', 'deleted', 'updated']);
});

test('pull with an empty cursor filters by the space only and an empty server gives an empty list', async () => {
  const { calls, client } = fake(reply(200, { items: [], page: 1, totalPages: 0 }));
  assert.deepEqual(await client.pull(TOKEN, '', SPACE), []);
  assert.equal(calls[0].url.searchParams.get('filter'), 'owner = "space1"');
});

test('pull with no space is an auth error and sends nothing', async () => {
  const { calls, client } = fake();
  await assert.rejects(client.pull(TOKEN, '', ''), { type: 'auth' });
  assert.equal(calls.length, 0);
});

test('push posts a new record with the owner, then patches it when its id is known', async () => {
  const { calls, client } = fake(reply(200, serverRow()), reply(200, serverRow({ data: { n: 2 } })));
  const ids = new Map();
  const first = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, ids, SPACE);
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(calls[0].body, { owner: 'space1', kind: 'item', key: 'a', deleted: false, data: { n: 1 } });
  ids.set(recordKey('item', 'a'), first.id);
  await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 2 } }, ids, SPACE);
  assert.equal(calls[1].method, 'PATCH');
  assert.equal(calls[1].url.pathname, '/api/collections/shopping_records/records/r1');
  assert.deepEqual(calls[1].body, { deleted: false, data: { n: 2 } });
});

test('push of a change refused by the unique index patches the existing record', async () => {
  const { calls, client } = fake(unique, reply(200, { items: [serverRow()], totalPages: 1 }), reply(200, serverRow({ data: { n: 3 } })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 3 } }, new Map(), SPACE);
  // Both spaces of a member hold `settings:settings` and the meal keys: the lookup names the space.
  assert.equal(calls[1].url.searchParams.get('filter'), 'owner = "space1" && kind = "item" && key = "a"');
  assert.equal(calls[2].method, 'PATCH');
  assert.equal(calls[2].url.pathname, '/api/collections/shopping_records/records/r1');
  assert.deepEqual(rec.data, { n: 3 });
});

test('push of an upsert whose known id answers 404 creates the record', async () => {
  const { calls, client } = fake(reply(404, { data: {} }), reply(200, serverRow({ id: 'r9' })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, new Map([['item:a', 'r1']]), SPACE);
  assert.deepEqual(calls.map((c) => c.method), ['PATCH', 'POST']);
  assert.equal(calls[1].body.owner, 'space1');
  assert.equal(rec.id, 'r9');
});

test('push of an upsert whose known id answers 404 patches the record found by kind and key', async () => {
  const { calls, client } = fake(reply(404, {}), unique, reply(200, { items: [serverRow({ id: 'r7' })], totalPages: 1 }), reply(200, serverRow({ id: 'r7' })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } }, new Map([['item:a', 'r1']]), SPACE);
  assert.deepEqual(calls.map((c) => c.method), ['PATCH', 'POST', 'GET', 'PATCH']);
  assert.equal(calls[3].url.pathname, '/api/collections/shopping_records/records/r7');
  assert.equal(rec.id, 'r7');
});

test('push of a delete whose known id answers 404 and has no record throws gone, so the token is checked', async () => {
  const { calls, client } = fake(reply(404, {}), reply(200, { items: [], totalPages: 0 }));
  await assert.rejects(client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map([['item:a', 'r1']]), SPACE), { type: 'gone', status: 404 });
  assert.equal(calls.length, 2);
});

test('a push with no space is an auth error and sends nothing', async () => {
  const { calls, client } = fake();
  await assert.rejects(client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: {} }, new Map(), ''), { type: 'auth' });
  assert.equal(calls.length, 0);
});

test('a delete with no known id looks the record up in the space', async () => {
  const { calls, client } = fake(reply(200, { items: [], totalPages: 0 }));
  await client.push(TOKEN, { kind: 'settings', key: 'settings', op: 'delete' }, new Map(), SPACE);
  assert.equal(calls[0].url.searchParams.get('filter'), 'owner = "space1" && kind = "settings" && key = "settings"');
});

const shareRow = (over = {}) => ({
  id: 's1', collectionId: 'c', owner: 'owner1', email: 'b@b.c', ownerEmail: 'a@b.c', member: '',
  created: '2026-10-25 08:00:00.000Z', updated: '2026-10-25 08:00:00.000Z', ...over,
});

test('listShares follows every page and maps each share, a pending one with an empty member', async () => {
  const { calls, client } = fake(
    reply(200, { items: [shareRow()], page: 1, totalPages: 2 }),
    reply(200, { items: [shareRow({ id: 's2', member: 'user1' })], page: 2, totalPages: 2 }),
  );
  const shares = await client.listShares(TOKEN);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].url.pathname, '/api/collections/shopping_shares/records');
  assert.equal(calls[0].url.searchParams.get('sort'), 'created');
  assert.equal(calls[0].headers.Authorization, TOKEN);
  assert.deepEqual(shares, [
    { id: 's1', owner: 'owner1', email: 'b@b.c', ownerEmail: 'a@b.c', ownerName: '', member: '', scope: 'all', cancelled: false },
    { id: 's2', owner: 'owner1', email: 'b@b.c', ownerEmail: 'a@b.c', ownerName: '', member: 'user1', scope: 'all', cancelled: false },
  ]);
});

test('invite, acceptShare and removeShare send their method, path and body', async () => {
  const { calls, client } = fake(reply(200, shareRow()), reply(200, shareRow({ member: 'user1' })), reply(204, null));
  assert.equal((await client.invite(TOKEN, 'owner1', 'b@b.c')).id, 's1');
  assert.equal((await client.acceptShare(TOKEN, 's1', 'user1')).member, 'user1');
  assert.equal(await client.removeShare(TOKEN, 's1'), undefined);
  assert.deepEqual(calls.map((c) => [c.method, c.url.pathname, c.body]), [
    ['POST', '/api/collections/shopping_shares/records', { owner: 'owner1', email: 'b@b.c', scope: 'all' }],
    ['PATCH', '/api/collections/shopping_shares/records/s1', { member: 'user1' }],
    ['DELETE', '/api/collections/shopping_shares/records/s1', undefined],
  ]);
});

test('invite sends the scope, and the other share requests send their body', async () => {
  const { calls, client } = fake(reply(200, shareRow()), reply(200, shareRow()), reply(200, shareRow()), reply(200, shareRow()));
  await client.invite(TOKEN, 'owner1', 'b@b.c', 'list');
  await client.cancelShare(TOKEN, 's1');
  await client.setShareScope(TOKEN, 's1', 'all');
  await client.reinvite(TOKEN, 's1');
  assert.deepEqual(calls.map((c) => [c.method, c.url.pathname, c.body]), [
    ['POST', '/api/collections/shopping_shares/records', { owner: 'owner1', email: 'b@b.c', scope: 'list' }],
    ['PATCH', '/api/collections/shopping_shares/records/s1', { cancelled: true }],
    ['PATCH', '/api/collections/shopping_shares/records/s1', { scope: 'all' }],
    ['PATCH', '/api/collections/shopping_shares/records/s1', { cancelled: false, member: '' }],
  ]);
});

test('a share maps scope and cancelled, with the defaults all and false', async () => {
  const { client } = fake(reply(200, shareRow({ ownerName: 'Ana', scope: 'list', cancelled: true })), reply(200, shareRow({ scope: '' })));
  const [full] = [await client.invite(TOKEN, 'o', 'b@b.c', 'list')];
  assert.deepEqual([full.ownerName, full.scope, full.cancelled], ['Ana', 'list', true]);
  const bare = await client.invite(TOKEN, 'o', 'b@b.c', 'all');
  assert.deepEqual([bare.ownerName, bare.scope, bare.cancelled], ['', 'all', false]);
});

test('a refused invite keeps the field errors of the server', async () => {
  const { client } = fake(reply(400, { data: { email: { code: 'share_self' } } }));
  await assert.rejects(client.invite(TOKEN, 'owner1', 'a@b.c'), (error) => error.type === 'invalid' && error.fields.email.code === 'share_self');
});

test('pull stops when the answer has no totalPages', async () => {
  const { calls, client } = fake(reply(200, { items: [serverRow()] }));
  assert.equal((await client.pull(TOKEN, '', SPACE)).length, 1);
  assert.equal(calls.length, 1);
});

test('a 400 with no field error is not a unique violation', async () => {
  const { calls, client } = fake(reply(400, { data: {}, message: 'Failed to create record.', status: 400 }));
  await assert.rejects(client.push(TOKEN, { kind: 'item', key: 'a', op: 'upsert', data: {} }, new Map(), SPACE), { type: 'invalid' });
  assert.equal(calls.length, 1);
  assert.equal(isUniqueViolation(new PocketBaseError('invalid', 400, {})), false);
});

test('a delete is a patch with deleted true', async () => {
  const { calls, client } = fake(reply(200, serverRow({ deleted: true })));
  const rec = await client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map([['item:a', 'r1']]), SPACE);
  assert.equal(calls[0].method, 'PATCH');
  // SYNC-6: the tombstone keeps its data.
  assert.deepEqual(calls[0].body, { deleted: true });
  assert.equal(rec.deleted, true);
});

test('a delete with no known id finds the record, or resolves null and creates nothing', async () => {
  const found = fake(reply(200, { items: [serverRow()], totalPages: 1 }), reply(200, serverRow({ deleted: true })));
  await found.client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map(), SPACE);
  assert.equal(found.calls[1].method, 'PATCH');
  const none = fake(reply(200, { items: [], totalPages: 0 }));
  assert.equal(await none.client.push(TOKEN, { kind: 'item', key: 'a', op: 'delete' }, new Map(), SPACE), null);
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
  assert.deepEqual(log[0].body, { clientId: 'cid', subscriptions: ['shopping_records', 'shopping_shares'] });
  FakeSource.last.emit('shopping_records', { action: 'update', record: serverRow() });
  FakeSource.last.emit('shopping_records', { action: 'delete', record: serverRow({ id: 'r2' }) });
  assert.deepEqual(seen.map((r) => [r.id, r.deleted]), [['r1', false], ['r2', true]]);
  // SHARE-6: an event of a share starts a sync too; it carries no record.
  FakeSource.last.emit('shopping_shares', { action: 'update', record: shareRow() });
  assert.equal(seen.length, 3);
  assert.equal(seen[2], null);
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

test('a 429 is a rate error, a 5xx is a server error', async () => {
  const { client } = fake(reply(429, { message: 'Too Many Requests.' }), reply(503, {}));
  const change = { kind: 'item', key: 'a', op: 'upsert', data: {} };
  await assert.rejects(client.push(TOKEN, change, new Map([[recordKey('item', 'a'), 'r1']]), SPACE), { type: 'rate', status: 429 });
  await assert.rejects(client.pull(TOKEN, '', SPACE), { type: 'server', status: 503 });
});
