// The steps of Actualizar (VER-8), `updateShell` of `src/update.js` with a fake
// `navigator.serviceWorker`. The wait is short, so a worker that never answers fails at once.

import assert from 'node:assert/strict';
import { updateShell } from '#update';
import { fakeServiceWorkers } from '../../fakes.js';

const WAIT_MS = 30;

const NEXT = {
  'a new sw.js whose worker installs': 'installs',
  'a new sw.js whose worker fails its install': 'fails',
  'a new sw.js whose worker never takes control': 'stalls',
  'the same sw.js': 'same',
};
const ANSWERS = { 'refreshes the shell': 'ok', 'fails its refresh': 'fail', 'never answers': 'none' };

export const defineUpdateSteps = ({ Given, When, Then }) => {
  Given('a worker of the old deploy is in control', (world) => {
    world.workers = { controlled: true, next: 'same', answer: 'ok' };
  });
  Given('no worker is in control', (world) => {
    world.workers = { controlled: false };
  });
  Given(/the host has (a new sw\.js whose worker (?:installs|fails its install|never takes control)|the same sw\.js)/, (world, text) => {
    world.workers.next = NEXT[text];
  });
  Given('the check of sw.js never ends', (world) => {
    world.workers.next = 'hangs';
  });
  Given('the check of sw.js fails', (world) => {
    world.workers.next = 'offline';
  });
  Given(/the worker in control (refreshes the shell|fails its refresh|never answers)/, (world, text) => {
    world.workers.answer = ANSWERS[text];
  });

  When('I tap Actualizar', async (world) => {
    const { container, refreshes } = fakeServiceWorkers(world.workers);
    world.refreshes = refreshes;
    world.update = await updateShell({ container, timeout: WAIT_MS });
  });

  Then('the update gives {word}', (world, result) => {
    assert.equal(world.update, result);
  });
  Then('the old worker got no refresh', (world) => {
    assert.deepEqual(world.refreshes, []);
  });
  Then('the old worker got a refresh', (world) => {
    assert.deepEqual(world.refreshes, [{ type: 'refresh' }]);
  });
};
