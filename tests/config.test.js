import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl, PRODUCTION_API } from '#config';

test('apiUrl gives the local server on localhost and the production one elsewhere (ACC-12)', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) assert.equal(apiUrl(host), 'http://localhost:8090', host);
  for (const host of ['bodega.artisandevs.duckdns.org', 'polaris-works.github.io']) assert.equal(apiUrl(host), 'https://api.artisandevs.duckdns.org', host);
  assert.equal(apiUrl('bodega.artisandevs.duckdns.org'), PRODUCTION_API);
});
