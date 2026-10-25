import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USERS, PASSWORD, originOf, loginUrl, parseArgs, allowsOrigin, userBody, pairSession, loginPage, summary } from '../scripts/pair.mjs';
import { SESSION_KEY } from '../src/storage.js';
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

test('userBody makes a verified user with the shared password; access is a row of its own', () => {
  const body = userBody(USERS[0]);
  assert.equal(body.email, 'usera@example.test');
  assert.equal('approved' in body, false);
  assert.equal(body.verified, true);
  assert.equal(body.password, PASSWORD);
  assert.equal(body.passwordConfirm, PASSWORD);
});

test('the login page of a user is on its own origin', () => {
  assert.equal(loginUrl(USERS[0]), 'http://localhost:8081/.pair/a.html');
  assert.equal(loginUrl(USERS[1]), 'http://localhost:8082/.pair/b.html');
});

test('pairSession is the session that the app stores, approved', () => {
  const auth = { token: 'T', record: { id: 'u1', email: 'usera@example.test', name: 'User A', verified: true } };
  assert.deepEqual(pairSession(auth), { token: 'T', user: { id: 'u1', email: 'usera@example.test', name: 'User A', approved: true } });
});

test('loginPage stores the session under the key of the app, then opens the app', () => {
  const session = { token: 'T</script>', user: { id: 'u1', email: 'a@b.c', name: 'A', approved: true } };
  const page = loginPage(session);
  assert.match(page, /^<!doctype html>/);
  assert.ok(page.includes(`localStorage.setItem(${JSON.stringify(SESSION_KEY)}`));
  assert.match(page, /location\.replace\('\/'\)/);
  assert.equal(page.includes('T</script>'), false);
  const json = page.match(/setItem\("shopping\.session", (.*)\);/)[1];
  assert.deepEqual(JSON.parse(JSON.parse(json)), session);
});

test('summary names each URL and login page, and Mailpit', () => {
  const text = summary(USERS);
  assert.match(text, /User A: http:\/\/localhost:8081\/\.pair\/a\.html {2}usera@example\.test/);
  assert.match(text, /User B: http:\/\/localhost:8082\/\.pair\/b\.html {2}userb@example\.test/);
  assert.match(text, /Mailpit/);
});
