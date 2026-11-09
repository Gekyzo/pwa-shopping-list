import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateShell } from '#update';
import { fakeServiceWorkers } from './fakes.js';

const run = (options) => {
  const { container, refreshes } = fakeServiceWorkers(options);
  return updateShell({ container, timeout: 30 }).then((result) => ({ result, refreshes, container }));
};

test('updateShell reloads at once with no worker in control', async () => {
  assert.equal((await run({ controlled: false })).result, 'reload');
});

test('updateShell waits for a new worker to take control and sends it no refresh', async () => {
  const { result, refreshes } = await run({ next: 'installs', answer: 'fail' });
  assert.equal(result, 'reload');
  assert.deepEqual(refreshes, []);
});

test('updateShell fails when the new worker goes redundant, before the wait ends', async () => {
  const started = Date.now();
  assert.equal((await run({ next: 'fails' })).result, 'failed');
  assert.ok(Date.now() - started < 30);
});

test('updateShell fails when the new worker never takes control within the wait', async () => {
  assert.equal((await run({ next: 'stalls' })).result, 'failed');
});

test('updateShell asks the worker in control to refresh when the host has the same sw.js', async () => {
  assert.equal((await run({ next: 'same', answer: 'ok' })).result, 'reload');
  assert.equal((await run({ next: 'same', answer: 'fail' })).result, 'failed');
  assert.equal((await run({ next: 'same', answer: 'none' })).result, 'failed');
});

test('updateShell falls back to the refresh when the check of sw.js throws', async () => {
  const { result, refreshes } = await run({ next: 'offline', answer: 'ok' });
  assert.equal(result, 'reload');
  assert.deepEqual(refreshes, [{ type: 'refresh' }]);
});


test('updateShell ends within the wait when the check of sw.js never ends', async () => {
  const started = Date.now();
  const { result, refreshes } = await run({ next: 'hangs', answer: 'none' });
  assert.equal(result, 'failed');
  assert.deepEqual(refreshes, [{ type: 'refresh' }]);
  assert.ok(Date.now() - started < 60, `took ${Date.now() - started} ms`);
});
