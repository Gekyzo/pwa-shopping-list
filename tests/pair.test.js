import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USERS, PASSWORD, originOf, parseArgs, allowsOrigin, userBody, summary } from '../scripts/pair.mjs';
import { apiUrl, LOCAL_API } from '../src/config.js';

test('the two users have their own origin, which the app points at the local API', () => {
  const origins = USERS.map(originOf);
  assert.equal(new Set(origins).size, USERS.length);
  for (const origin of origins) assert.equal(apiUrl(new URL(origin).hostname), LOCAL_API);
});

test('parseArgs reads --reset and --open', () => {
  assert.deepEqual(parseArgs([]), { reset: false, open: false });
  assert.deepEqual(parseArgs(['--reset', '--open']), { reset: true, open: true });
});

test('parseArgs refuses an unknown option', () => {
  assert.throws(() => parseArgs(['--rest']), /unknown option --rest/);
});

test('allowsOrigin accepts the same origin or any origin only', () => {
  assert.equal(allowsOrigin('http://localhost:8081', 'http://localhost:8081'), true);
  assert.equal(allowsOrigin('*', 'http://localhost:8081'), true);
  assert.equal(allowsOrigin('http://localhost:8080', 'http://localhost:8081'), false);
  assert.equal(allowsOrigin(null, 'http://localhost:8081'), false);
});

test('userBody makes an approved, verified user with the shared password', () => {
  const body = userBody(USERS[0]);
  assert.equal(body.email, 'usera@example.test');
  assert.equal(body.approved, true);
  assert.equal(body.verified, true);
  assert.equal(body.password, PASSWORD);
  assert.equal(body.passwordConfirm, PASSWORD);
});

test('summary names each URL and login, and Mailpit', () => {
  const text = summary(USERS);
  assert.match(text, /User A: http:\/\/localhost:8081 {2}usera@example\.test/);
  assert.match(text, /User B: http:\/\/localhost:8082 {2}userb@example\.test/);
  assert.match(text, /Mailpit/);
});
