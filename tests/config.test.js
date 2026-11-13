import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiUrl, PRODUCTION_API } from '#config';

test('apiUrl gives the local server on localhost and the production one elsewhere (ACC-12)', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) assert.equal(apiUrl(host), 'http://localhost:8090', host);
  // The legacy host serves the same app until its retirement, and talks to the same API.
  for (const host of ['bodega.polarisworks.duckdns.org', 'bodega.artisandevs.duckdns.org', 'polaris-works.github.io']) {
    assert.equal(apiUrl(host), 'https://api.polarisworks.duckdns.org', host);
  }
  assert.equal(PRODUCTION_API, 'https://api.polarisworks.duckdns.org');
});
