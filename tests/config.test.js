import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl, PRODUCTION_API } from '#config';

test('apiUrl gives the local server on localhost and the production one elsewhere (ACC-12)', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) assert.equal(apiUrl(host), 'http://localhost:8090', host);
  assert.equal(apiUrl('gekyzo.github.io'), 'https://artisandevs.duckdns.org');
  assert.equal(apiUrl('gekyzo.github.io'), PRODUCTION_API);
});
