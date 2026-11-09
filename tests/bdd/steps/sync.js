// The steps of the account, the sync and the shares (18-account-sync.md, 19-sharing.md): devices that
// sync with one fake server, as `tests/syncer.test.js` drives them, and the pure rules of
// `src/session.js`, `src/shares.js`, `src/records.js` and `src/config.js`.

import assert from 'node:assert/strict';
import { createSyncer } from '#syncer';
import { PocketBaseError, createClient } from '#pocketbase';
import { emptyState, addItem, renameItem, deleteItem, setGroup } from '#store';
import { addRecipe, renameRecipe } from '#recipes';
import { normalizeState, saveTwinReach } from '#storage';
import { toRecords, fromRecords, diffRecords, recordKey } from '#records';
import { cursorOf } from '#sync';
import { weekOf } from '#menu';
import { apiUrl } from '#config';
import {
  loadSession, saveSession, loadSyncState, saveSyncState, loadQueue, saveQueue, loadSharedState,
  tokenExpired, routeAtStart, loadOffline, saveOffline, dropOffline, BEFORE_LOGIN_KEY, QUEUE_KEY,
} from '#session';
import { sharedSpace, shareCase, pendingInvite, otherScope, listName, scopeOf, personState } from '#shares';
import { fakeStorage, fakeClient, sessionOf, tokenOf, base64url, emailOf, addShare } from '../../fakes.js';
import { names, yesNo } from '../world.js';

// The errors of the server, as the client throws them. `bug` is an error that is not of the client.
const ERRORS = {
  network: () => new PocketBaseError('network'),
  rate: () => new PocketBaseError('rate', 429),
  server: () => new PocketBaseError('server', 503),
  auth: () => new PocketBaseError('auth', 401),
  rule: () => new PocketBaseError('invalid', 400, {}),
  'bad-data': () => new PocketBaseError('invalid', 400, { data: { code: 'validation_json_size_limit' } }),
  gone: () => new PocketBaseError('gone', 404),
  bug: () => new TypeError('a bug'),
};

const errorOf = (word) => {
  assert.ok(ERRORS[word], `Unknown error "${word}"`);
  return ERRORS[word]();
};

const expiredToken = (id) => `${base64url({})}.${base64url({ id, exp: 1 })}.sig`;

// The syncer logs a refused state and an error of a sync with console.error. The scenarios expect
// three kinds: the refusal of SYNC-2 (a text that starts with `sync:`), an error of the client
// (`PocketBaseError`) and the `bug` that a scenario injects. Any other log is a real fault of the
// syncer or of a fake, so the step fails instead of hiding it behind an `offline` result.
const expectedLog = (value) =>
  (typeof value === 'string' && value.startsWith('sync:')) ||
  value instanceof PocketBaseError ||
  (value instanceof TypeError && value.message === 'a bug');

const quiet = async (fn) => {
  const original = console.error;
  const unexpected = [];
  console.error = (...values) => unexpected.push(...values.filter((value) => !expectedLog(value)));
  try {
    return await fn();
  } finally {
    console.error = original;
    assert.deepEqual(unexpected, [], `The sync logged an error that no scenario expects: ${unexpected.join('; ')}`);
  }
};

const unquote = (text = '') => (text === '""' ? '' : text);

// A device: its storage, its state and the syncer. A timer runs only when a step says so.
const makeDevice = (world, name, { user = null, approved = true, synced = true, storage: given, state = emptyState(), lost = false } = {}) => {
  const storage = given ?? fakeStorage();
  const client = fakeClient(world.server, { approved });
  if (user && !given) {
    saveSession(storage, sessionOf(user, approved));
    if (synced) saveSyncState(storage, { owner: user, cursor: '', server: new Map(), local: new Map(), ids: new Map() });
  }
  const box = { state, shared: null, share: null, statuses: [], timers: [] };
  const syncer = createSyncer({
    client,
    storage,
    getState: () => box.state,
    setState: (next) => {
      box.state = next;
    },
    getShared: () => box.shared,
    setShared: (next, share) => {
      box.shared = next;
      box.share = share;
    },
    now: () => world.clock,
    onStatus: (status) => box.statuses.push(status),
    setTimer: (fn, ms) => {
      const timer = { fn, ms, due: true };
      box.timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      if (timer) timer.due = false;
    },
    lost,
  });
  const device = { name, user, storage, client, syncer, box, mark: 0, pushMark: 0, cursor: '', result: null, login: null, logout: null, error: null, request: null };
  world.devices.set(name, device);
  return device;
};

const deviceOf = (world, name) => {
  const device = world.devices.get(name);
  assert.ok(device, `No device "${name}"`);
  return device;
};

// The start of an action: the requests, the pushes and the cursor after it are its own.
const act = (device) => {
  device.mark = device.client.calls.length;
  device.pushMark = device.client.pushed.length;
  device.cursor = loadSyncState(device.storage).cursor;
};

const sync = async (device) => {
  act(device);
  device.result = await quiet(() => device.syncer.run());
};

const change = (device, next, options) => quiet(() => {
  device.box.state = next;
  device.syncer.notify(next, options);
});

const changeShared = (device, next) => quiet(() => {
  device.box.shared = next;
  device.syncer.notifyShared(next);
});

const label = (world, id, text) => world.labels.set(id, text);

const byName = (entities, name) => {
  const entity = entities.find((candidate) => candidate.name === name);
  assert.ok(entity, `No "${name}"`);
  return entity;
};

const result = (outcome) => {
  assert.equal(outcome.error, undefined, `The operation failed with ${outcome.error?.key}`);
  return outcome.state;
};

const addTo = (world, state, name) => {
  const next = result(addItem(state, name, world.newId));
  const item = next.items.at(-1);
  label(world, item.id, item.name);
  return next;
};

const renameIn = (world, state, from, to) => {
  const { id } = byName(state.items, from);
  label(world, id, to);
  return result(renameItem(state, id, to));
};

const itemNames = (state) => (state?.items ?? []).map((item) => item.name);

const sameNames = (actual, text) => assert.deepEqual([...actual].sort(), names(text).sort());

// A change of the queue as a text: `delete item Leche`, `upsert settings`.
const changeText = (world, change) => {
  if (change.kind === 'settings') return `${change.op} settings`;
  const name = change.data?.name ?? world.labels.get(change.key) ?? change.key;
  return `${change.op} ${change.kind} ${name}`;
};

const pushText = (world, push) => {
  const name = push.kind === 'settings' ? '' : ` ${world.labels.get(push.key) ?? push.key}`;
  return `${push.kind}${name} to ${push.space}`;
};

const newItem = (id, name) => ({ id, name, recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' });

const seed = (world, user, kind, key, data) => world.server.add(user, kind, key, data);

const shareOf = (world, user) => {
  const share = world.server.shares.find((candidate) => candidate.member === user || candidate.email === emailOf(user));
  assert.ok(share, `No share of "${user}"`);
  return share;
};

const holdOnce = (client, op) => {
  let release;
  let entered;
  const gate = new Promise((resolve) => (release = resolve));
  const waiting = new Promise((resolve) => (entered = resolve));
  client.hold = (name) => {
    if (name !== op) return null;
    client.hold = null;
    entered();
    return gate;
  };
  return { release, waiting };
};

const dueSyncs = (device) => device.box.timers.filter((timer) => timer.due && timer.ms === 1500);
const dueRetries = (device) => device.box.timers.filter((timer) => timer.due && timer.ms !== 1500);

const fire = async (device, timer) => {
  assert.ok(timer, 'No timer is due');
  timer.due = false;
  act(device);
  device.result = await quiet(() => timer.fn());
};

const restart = (world, name, { state, lost = false }) => {
  const old = deviceOf(world, name);
  makeDevice(world, name, { user: old.user, storage: old.storage, state: state ?? old.box.state, lost });
};

const login = async (device, session, options) => {
  act(device);
  device.user = session.user.id;
  try {
    device.login = await quiet(() => device.syncer.login(session, options));
    device.error = null;
  } catch (error) {
    device.login = null;
    device.error = error;
  }
};

const shareRequest = async (device, request) => {
  act(device);
  device.request = await quiet(request);
};

const status = (device) => device.syncer.status();

const userOf = (id, email = emailOf(id)) => ({ id, email });

const SESSIONS = {
  approved: () => sessionOf('ana'),
  expired: () => ({ ...sessionOf('ana'), token: expiredToken('ana') }),
  waiting: () => sessionOf('ana', false),
  none: () => null,
};

const defineDeviceSteps = ({ Given, When, Then }) => {
  Given('a device {string} signed in as {string}', (world, name, user) => {
    makeDevice(world, name, { user });
  });
  Given('a device {string} with no session', (world, name) => {
    makeDevice(world, name);
  });
  Given('a device {string} with no session and {int} change(s) queued', (world, name, count) => {
    const storage = fakeStorage();
    saveQueue(storage, Array.from({ length: count }, (_, n) => ({ kind: 'item', key: `q${n}`, op: 'delete' })));
    makeDevice(world, name, { storage });
  });
  Given('the list of {string} is in view', (world, name) => {
    world.state = deviceOf(world, name).box.state;
  });

  // The actions of a user on a device: each is a save of the state.
  When('{string} adds {string}', (world, name, item) => {
    const device = deviceOf(world, name);
    return change(device, addTo(world, device.box.state, item));
  });
  When('{string} adds {string} and syncs', async (world, name, item) => {
    const device = deviceOf(world, name);
    await change(device, addTo(world, device.box.state, item));
    await sync(device);
  });
  When('{string} adds the recipe {string} and syncs', async (world, name, recipe) => {
    const device = deviceOf(world, name);
    const next = result(addRecipe(device.box.state, recipe, world.newId));
    label(world, next.recipes.at(-1).id, recipe);
    await change(device, next);
    await sync(device);
  });
  When('{string} deletes {string}', (world, name, item) => {
    const device = deviceOf(world, name);
    return change(device, result(deleteItem(device.box.state, byName(device.box.state.items, item).id)));
  });
  When('{string} renames {string} to {string}', (world, name, from, to) => {
    const device = deviceOf(world, name);
    return change(device, renameIn(world, device.box.state, from, to));
  });
  When('{string} saves the list of the scenario and syncs', async (world, name) => {
    const device = deviceOf(world, name);
    world.state.items.forEach((item) => label(world, item.id, item.name));
    world.state.recipes.forEach((recipe) => label(world, recipe.id, recipe.name));
    await change(device, world.state);
    await sync(device);
  });
  When('{string} imports a list with {string}', (world, name, text) => {
    const device = deviceOf(world, name);
    const state = names(text).reduce((next, item) => addTo(world, next, item), emptyState());
    return change(device, state, { explicit: true });
  });

  When('{string} syncs', (world, name) => sync(deviceOf(world, name)));
  When('{string} starts again', (world, name) => restart(world, name, {}));
  When('{string} starts again with an empty list', (world, name) => restart(world, name, { state: emptyState() }));
  When('{string} starts again after its stored list was lost', (world, name) => restart(world, name, { state: emptyState(), lost: true }));
  When('the sync due on {string} runs', (world, name) => {
    const device = deviceOf(world, name);
    return fire(device, dueSyncs(device).at(-1));
  });
  When('the retry of {string} runs', (world, name) => {
    const device = deviceOf(world, name);
    return fire(device, dueRetries(device).at(-1));
  });
  When('{string} starts a sync that waits at the {word}', async (world, name, op) => {
    const device = deviceOf(world, name);
    act(device);
    device.held = holdOnce(device.client, op);
    device.running = device.syncer.run();
    await device.held.waiting;
  });
  When('{string} starts one more sync', (world, name) => {
    const device = deviceOf(world, name);
    device.second = device.syncer.run();
  });
  When('the waiting sync of {string} goes on', async (world, name) => {
    const device = deviceOf(world, name);
    device.held.release();
    device.result = await quiet(() => device.running);
  });

  When('{string} logs in as {string}', (world, name, user) => login(deviceOf(world, name), sessionOf(user)));
  When('{string} logs in as {string}, waiting for approval', (world, name, user) => login(deviceOf(world, name), sessionOf(user, false)));
  When('{string} logs in as {string}, discarding the changes not sent', (world, name, user) =>
    login(deviceOf(world, name), sessionOf(user), { discard: true }));
  When('the server refuses the old token of {string}', (world, name) => {
    const device = deviceOf(world, name);
    device.fresh = { ...sessionOf(device.user), token: tokenOf(device.user, 99) };
    device.client.failPush = (n, change, token) => (token === device.fresh.token ? null : errorOf('auth'));
  });
  When('{string} logs in as {string} again, while the sync waits', async (world, name) => {
    const device = deviceOf(world, name);
    const done = quiet(() => device.syncer.login(device.fresh));
    device.held.release();
    device.login = await done;
    await quiet(() => device.running);
  });
  When('{string} logs out online', async (world, name) => {
    const device = deviceOf(world, name);
    act(device);
    device.logout = await quiet(() => device.syncer.logout({ online: true }));
  });
  When('{string} logs out offline, discarding the changes not sent', async (world, name) => {
    const device = deviceOf(world, name);
    act(device);
    device.logout = await quiet(() => device.syncer.logout({ online: false, discard: true }));
  });
  // SYNC-10: Borrar todos los datos stops the sync first, as `stopSync` of src/ui/account.js does.
  When('{string} stops the sync for a reset', async (world, name) => {
    const device = deviceOf(world, name);
    act(device);
    await quiet(() => device.syncer.logout({ online: false, discard: true }));
  });

  // The server and the network.
  Given('the account of {string} on the server has the items {string}', (world, user, text) => {
    names(text).forEach((name, position) => {
      const id = world.newId();
      label(world, id, name);
      seed(world, user, 'item', id, { ...newItem(id, name), position });
    });
  });
  Given('the account of {string} on the server has the items {string} grouped by {word}', (world, user, text, group) => {
    names(text).forEach((name, position) => {
      const id = world.newId();
      label(world, id, name);
      seed(world, user, 'item', id, { ...newItem(id, name), position });
    });
    seed(world, user, 'settings', 'settings', { group, sort: 'custom', sent: [], aisles: [] });
  });
  Given('the account of {string} on the server has the meal {string} with the dish {string}', (world, user, key, dish) => {
    seed(world, user, 'meal', key, { dish });
  });
  Given('the account of {string} on the server has an item record with no name', (world, user) => {
    const { name: _, ...data } = newItem('bad-1', 'x');
    seed(world, user, 'item', 'bad-1', { ...data, position: 9 });
  });
  Given('the account of {string} on the server has an item record whose id is not its key', (world, user) => {
    seed(world, user, 'item', 'bad-2', { ...newItem('other', 'Sal'), position: 9 });
  });
  Given('the account of {string} on the server has an item record that the validation refuses', (world, user) => {
    seed(world, user, 'item', 'bad-3', { ...newItem('bad-3', 'Bad'), list: 'bogus', position: 9 });
  });
  Given('the server loses the record of {string}', (world, name) => {
    const at = world.server.rows.findIndex((row) => row.data?.name === name);
    assert.ok(at >= 0, `No record of "${name}"`);
    world.server.rows.splice(at, 1);
  });
  Given('the server says that {string} is no longer approved', (world, user) => {
    for (const device of world.devices.values()) if (device.user === user) device.client.approved = false;
  });
  Given('{int} minute(s) pass(es)', (world, minutes) => {
    world.clock += minutes * 60_000;
  });
  Given('the token of {string} expires', (world, name) => {
    const device = deviceOf(world, name);
    saveSession(device.storage, { ...loadSession(device.storage), token: expiredToken(device.user) });
  });
  Given('the refresh of {string} fails with {word}', (world, name, word) => {
    deviceOf(world, name).client.failRefresh = errorOf(word);
  });
  Given('the refresh of {string} works again', (world, name) => {
    deviceOf(world, name).client.failRefresh = null;
  });
  Given('the server refuses the pushes of {string} with {word}', (world, name, word) => {
    deviceOf(world, name).client.failPush = () => errorOf(word);
  });
  Given('the server refuses the push number {int} of {string} with {word}', (world, number, name, word) => {
    const { client } = deviceOf(world, name);
    const at = client.pushes + number;
    client.failPush = (n) => (n === at ? errorOf(word) : null);
  });
  Given('the network of {string} fails at the push number {int}', (world, name, number) => {
    const { client } = deviceOf(world, name);
    const at = client.pushes + number;
    client.failPush = (n) => (n === at ? errorOf('network') : null);
  });
  Given('the server takes the pushes of {string} again', (world, name) => {
    deviceOf(world, name).client.failPush = null;
  });
  Given('the server answers the deletes of {string} as gone', (world, name) => {
    deviceOf(world, name).client.failPush = (n, change) => (change.op === 'delete' ? errorOf('gone') : null);
  });
  Given('{string} loses the network', (world, name) => {
    const { client } = deviceOf(world, name);
    Object.assign(client, {
      failRefresh: errorOf('network'),
      failShares: errorOf('network'),
      failPull: errorOf('network'),
      failPush: () => errorOf('network'),
      failShareCall: errorOf('network'),
    });
  });
  Given('{string} gets the network back', (world, name) => {
    const { client } = deviceOf(world, name);
    Object.assign(client, { failRefresh: null, failShares: null, failPull: null, failPush: null, failShareCall: null });
  });
  Given('the storage of {string} refuses the key {string}', (world, name, key) => {
    const { storage } = deviceOf(world, name);
    const setItem = storage.setItem;
    storage.setItem = (itemKey, value) => {
      if (itemKey === key) throw new Error('denied');
      return setItem(itemKey, value);
    };
  });
  Given('the key {string} of {string} holds {string}', (world, key, name, value) => {
    deviceOf(world, name).storage.setItem(key, value);
  });

  // What a device shows and keeps.
  Then('{string} sees the items {string}', (world, name, text) => {
    assert.deepEqual(itemNames(deviceOf(world, name).box.state), names(text));
  });
  Then('{string} sees the recipes {string}', (world, name, text) => {
    assert.deepEqual(deviceOf(world, name).box.state.recipes.map((recipe) => recipe.name), names(text));
  });
  Then('{string} has {int} meal(s)', (world, name, count) => {
    assert.equal(deviceOf(world, name).box.state.menu.length, count);
  });
  Then('{string} groups the list by {word}', (world, name, group) => {
    assert.equal(deviceOf(world, name).box.state.group, group);
  });
  Then('{string} has the dish {string} in the lunch of Monday of the week of today', (world, name, dish) => {
    const week = weekOf(new Date());
    assert.deepEqual(deviceOf(world, name).box.state.menu, [{ week, day: 0, meal: 'lunch', dish }]);
  });
  Then('the queue of {string} holds {int} change(s)', (world, name, count) => {
    assert.equal(loadQueue(deviceOf(world, name).storage).length, count);
  });
  Then('the queue of {string} holds the changes {string}', (world, name, text) => {
    assert.deepEqual(loadQueue(deviceOf(world, name).storage).map((queued) => changeText(world, queued)), names(text));
  });
  Then('the queue of {string} holds no delete', (world, name) => {
    assert.deepEqual(loadQueue(deviceOf(world, name).storage).filter((queued) => queued.op === 'delete'), []);
  });
  Then('the queue of {string} moves the meal {string} into the week of today', (world, name, key) => {
    const queued = loadQueue(deviceOf(world, name).storage).map(({ op, kind, key: at }) => `${op} ${kind} ${at}`);
    assert.deepEqual(queued, [`delete meal ${key}`, `upsert meal ${weekOf(new Date())}-${key}`]);
  });
  Then('the key {string} of {string} holds the queue', (world, key, name) => {
    const device = deviceOf(world, name);
    assert.equal(key, QUEUE_KEY);
    assert.equal(JSON.parse(device.storage.getItem(key)).length, status(device).pending);
  });
  Then('the key {string} of {string} holds the text {string}', (world, key, name, value) => {
    assert.equal(deviceOf(world, name).storage.getItem(key), value);
  });
  Then('the key {string} of {string} is not stored', (world, key, name) => {
    assert.equal(deviceOf(world, name).storage.getItem(key), null);
  });
  Then('the saved session of {string} is the one of {string}', (world, name, user) => {
    assert.equal(loadSession(deviceOf(world, name).storage)?.user.id, user);
  });
  Then('the list kept from before the login of {string} has the items {string}', (world, name, text) => {
    assert.deepEqual(itemNames(JSON.parse(deviceOf(world, name).storage.getItem(BEFORE_LOGIN_KEY))), names(text));
  });
  Then('the cursor of {string} did not move', (world, name) => {
    const device = deviceOf(world, name);
    assert.equal(loadSyncState(device.storage).cursor, device.cursor);
  });

  // What a device did.
  Then('{string} made the requests {string}', (world, name, text) => {
    const device = deviceOf(world, name);
    assert.deepEqual(device.client.calls.slice(device.mark), names(text));
  });
  Then('{string} made no request', (world, name) => {
    const device = deviceOf(world, name);
    assert.deepEqual(device.client.calls.slice(device.mark), []);
  });
  Then('{string} pushed {string}', (world, name, text) => {
    const device = deviceOf(world, name);
    assert.deepEqual(device.client.pushed.slice(device.pushMark).map((push) => pushText(world, push)), names(text));
  });
  Then('the sync of {string} ends with {word}', (world, name, outcome) => {
    assert.equal(deviceOf(world, name).result, outcome);
  });
  Then('the sync of {string} needs a login: {word}', (world, name, answer) => {
    assert.equal(status(deviceOf(world, name)).auth, yesNo(answer));
  });
  Then('the login of {string} gives {word}', (world, name, outcome) => {
    const device = deviceOf(world, name);
    assert.equal(device.error, null, `The login failed: ${device.error?.message}`);
    assert.equal(device.login, outcome);
  });
  Then('the login of {string} failed', (world, name) => {
    assert.ok(deviceOf(world, name).error, 'The login did not fail');
  });
  Then('the logout of {string} gives {word}', (world, name, outcome) => {
    assert.equal(deviceOf(world, name).logout, outcome);
  });
  Then('{string} has a sync due in {int} ms', (world, name, ms) => {
    assert.equal(deviceOf(world, name).box.timers.filter((timer) => timer.due && timer.ms === ms).length, 1);
  });
  Then('the retries due on {string} are {string}', (world, name, text) => {
    assert.deepEqual(dueRetries(deviceOf(world, name)).map((timer) => String(timer.ms)), names(text));
  });
  Then('the two syncs of {string} are one', (world, name) => {
    const device = deviceOf(world, name);
    assert.equal(device.second, device.running);
  });
  Then('{string} is online: {word}', (world, name, answer) => {
    assert.equal(status(deviceOf(world, name)).online, yesNo(answer));
  });
  Then('{string} reached the server {int} time(s)', (world, name, count) => {
    assert.equal(status(deviceOf(world, name)).reached, count);
  });

  // What the server holds.
  Then('the space of {string} on the server holds the items {string}', (world, user, text) => {
    sameNames(world.server.live(user).filter((row) => row.kind === 'item').map((row) => row.data.name), text);
  });
  Then('the records of {string} on the server are {string}', (world, user, text) => {
    const rows = world.server.rows.filter((row) => row.owner === user);
    assert.deepEqual(rows.map((row) => row.kind).sort(), names(text));
    assert.equal(world.server.rows.length, rows.length, 'A record has another owner');
  });
  Then('the server record of {string} is deleted and keeps its data', (world, name) => {
    const row = world.server.rows.find((candidate) => candidate.data?.name === name);
    assert.ok(row, `No record of "${name}"`);
    assert.equal(row.deleted, true);
  });
  Then('the server has no record of {string}', (world, name) => {
    assert.equal(world.server.rows.some((row) => row.data?.name === name), false);
  });
  Then('the server holds {int} record for each item of {string}', (world, count, user) => {
    const keys = world.server.rows.filter((row) => row.owner === user && row.kind === 'item').map((row) => row.key);
    for (const key of new Set(keys)) assert.equal(keys.filter((other) => other === key).length, count, `The item ${key}`);
  });
  Then('the recipes of the space of {string} on the server are {string}', (world, user, text) => {
    sameNames(world.server.live(user).filter((row) => row.kind === 'recipe').map((row) => row.data.name), text);
  });
};

// ACC-3: a fetch that answers as PocketBase does for the access rows of the apps of one account.
const accessServer = (world, user) => async (url, init) => {
  const { pathname, searchParams } = new URL(url);
  const reply = (body) => ({ ok: true, status: 200, json: async () => body });
  if (pathname === '/api/collections/users/auth-refresh') return reply({ token: 'T', record: { id: user, email: emailOf(user), name: user } });
  if (pathname === '/api/collections/apps/records') {
    return reply({ items: world.access.apps.filter((app) => searchParams.get('filter') === `slug = "${app.slug}"`) });
  }
  if (pathname === '/api/collections/app_access/records' && init.method === 'GET') {
    const rows = world.access.rows.filter((row) => searchParams.get('filter') === `user = "${row.user}" && app.slug = "${row.app}"`);
    return reply({ items: rows });
  }
  if (pathname === '/api/collections/app_access/records' && init.method === 'POST') {
    const body = JSON.parse(init.body);
    const app = world.access.apps.find((candidate) => candidate.id === body.app);
    const row = { user: body.user, app: app.slug, status: body.status };
    world.access.rows.push(row);
    return reply(row);
  }
  throw new Error(`Unexpected request ${init.method} ${pathname}`);
};

const defineAccountSteps = ({ Given, When, Then }) => {
  Given('the access row of {string} for the app {string} is {word}', (world, user, app, status) => {
    world.access.rows.push({ user, app, status });
  });
  When('{string} signs in to the server', async (world, user) => {
    world.session = await createClient({ url: 'https://pb.test', fetch: accessServer(world, user) }).refresh('T');
  });
  Then('the session is approved: {word}', (world, answer) => {
    assert.equal(world.session.user.approved, yesNo(answer));
  });
  Then('the access rows of {string} are {string}', (world, user, text) => {
    const rows = world.access.rows.filter((row) => row.user === user).map((row) => `${row.app} ${row.status}`);
    assert.deepEqual(rows, names(text));
  });
  Then('a start with the session {word}, local data {word} and the offline flag {word} opens {word}', (world, session, data, flag, route) => {
    const given = SESSIONS[session]();
    if (given) saveSession(world.storage, given);
    if (yesNo(flag)) saveOffline(world.storage);
    assert.equal(routeAtStart({ session: loadSession(world.storage), hasLocalData: yesNo(data), offline: loadOffline(world.storage) }), route);
  });
  Given('the session of {string} is saved', (world, user) => {
    saveSession(world.storage, sessionOf(user));
  });
  Then('the saved session is the one of {string}', (world, user) => {
    assert.deepEqual(loadSession(world.storage), sessionOf(user));
  });
  Then('there is no saved session', (world) => {
    assert.equal(loadSession(world.storage), null);
  });

  When('I use the app with no account', (world) => {
    world.result = { saved: saveOffline(world.storage) };
  });
  When('I remove the offline flag', (world) => {
    dropOffline(world.storage);
  });
  Then('the offline flag is {word}', (world, word) => {
    assert.ok(['on', 'off'].includes(word));
    assert.equal(loadOffline(world.storage), word === 'on');
  });
  Then('the offline flag could not be saved', (world) => {
    assert.equal(world.result.saved, false);
  });

  Then('a token whose exp is {int} s away counts as expired: {word}', (world, seconds, answer) => {
    const token = `${base64url({ alg: 'none' })}.${base64url({ id: 'ana', exp: world.clock / 1000 + seconds })}.sig`;
    assert.equal(tokenExpired(token, world.clock), yesNo(answer));
  });
  Then('a token {string} counts as expired: {word}', (world, token, answer) => {
    assert.equal(tokenExpired(token, world.clock), yesNo(answer));
  });

  Then('the API URL for the host {string} is {string}', (world, host, url) => {
    assert.equal(apiUrl(host), url);
  });

  Then('the records of the state are:', (world, table) => {
    const rows = [...toRecords(world.state).values()].map(({ kind, key, data }) => ({ kind, key, name: data.name ?? '' }));
    assert.deepEqual(rows, table.hashes);
  });
  Then('the settings record holds the fields {string}', (world, text) => {
    assert.deepEqual(Object.keys(toRecords(world.state).get(recordKey('settings', 'settings')).data).sort(), names(text));
  });

  // The twin reach of SHARE-16 is a preference of the device.
  When('I choose {word} for an item in both lists', (world, choice) => {
    saveTwinReach(world.storage, choice);
  });
};

const defineShareSteps = ({ Given, When, Then }) => {
  // The shares of the server, as a step of a scenario sets them.
  Given('{string} shares the list with {string}', (world, owner, member) => {
    addShare(world.server, owner, member);
  });
  Given('{string} shares the list with {string} with scope {word}', (world, owner, member, scope) => {
    addShare(world.server, owner, member, emailOf(member), { scope });
  });
  Given('{string} invited {string}', (world, owner, email) => {
    addShare(world.server, owner, '', email);
  });
  Given('{string} removed {string} from the share', (world, owner, user) => {
    world.server.shares.splice(world.server.shares.indexOf(shareOf(world, user)), 1);
  });
  Given('{string} set the scope of the share of {string} to {word}', (world, owner, user, scope) => {
    shareOf(world, user).scope = scope;
  });
  Given('{string} left the share', (world, user) => {
    shareOf(world, user).cancelled = true;
  });
  Given('the server refuses the share requests of {string} with the code {string}', (world, name, code) => {
    deviceOf(world, name).client.failShareCall = new PocketBaseError('invalid', 400, { email: { code, message: 'x' } });
  });
  Given('the share requests of {string} fail with {word}', (world, name, word) => {
    deviceOf(world, name).client.failShareCall = errorOf(word);
  });
  Given('the pulls of the space of {string} fail on {string} with {word}', (world, space, name, word) => {
    deviceOf(world, name).client.failPullOf = { space, error: errorOf(word) };
  });

  // The share requests of a device.
  When('{string} invites {string}', (world, name, email) => {
    const device = deviceOf(world, name);
    return shareRequest(device, () => device.syncer.invite(email));
  });
  When('{string} accepts the invite', (world, name) => {
    const device = deviceOf(world, name);
    const invite = pendingInvite(status(device).shares, userOf(device.user));
    assert.ok(invite, 'No invite');
    return shareRequest(device, () => device.syncer.accept(invite.id));
  });
  When('{string} declines the invite', (world, name) => {
    const device = deviceOf(world, name);
    const invite = pendingInvite(status(device).shares, userOf(device.user));
    assert.ok(invite, 'No invite');
    return shareRequest(device, () => device.syncer.decline(invite.id));
  });
  When('{string} leaves the share', (world, name) => {
    const device = deviceOf(world, name);
    const { id } = status(device).shared;
    return shareRequest(device, () => device.syncer.leave(id));
  });
  When('{string} removes the share of {string}', (world, name, user) => {
    const device = deviceOf(world, name);
    const { id } = shareOf(world, user);
    return shareRequest(device, () => device.syncer.remove(id));
  });
  When('{string} sets the scope of the share of {string} to {word}', (world, name, user, scope) => {
    const device = deviceOf(world, name);
    const { id } = shareOf(world, user);
    return shareRequest(device, () => device.syncer.setScope(id, scope));
  });
  When('{string} invites {string} again', (world, name, user) => {
    const device = deviceOf(world, name);
    const { id } = shareOf(world, user);
    return shareRequest(device, () => device.syncer.reinvite(id));
  });

  // The saves of the shared part on a device.
  When('{string} adds {string} to the shared list', (world, name, item) => {
    const device = deviceOf(world, name);
    return changeShared(device, addTo(world, device.box.shared, item));
  });
  When('{string} renames the shared item {string} to {string}', (world, name, from, to) => {
    const device = deviceOf(world, name);
    return changeShared(device, renameIn(world, device.box.shared, from, to));
  });
  When('{string} renames the shared recipe {string} to {string}', (world, name, from, to) => {
    const device = deviceOf(world, name);
    const { id } = byName(device.box.shared.recipes, from);
    return changeShared(device, result(renameRecipe(device.box.shared, id, to)));
  });
  When('{string} groups the shared list by {word}', (world, name, group) => {
    const device = deviceOf(world, name);
    return changeShared(device, result(setGroup(device.box.shared, group)));
  });
  // SHARE-7: the share ends after the list of the shares and before the push of the shared lane.
  When('{string} syncs while {string} removes {string} before the push', (world, name, owner, user) => {
    const device = deviceOf(world, name);
    device.client.hold = (op) => {
      if (op !== 'push') return null;
      device.client.hold = null;
      world.server.shares.splice(world.server.shares.indexOf(shareOf(world, user)), 1);
      return null;
    };
    return sync(device);
  });

  // SHARE-13: a device of v1.5.0 holds the shared space in the own keys.
  Given('a device {string} of v1.5.0 that {string} left in the space of {string} with the list {string} and {string} not sent', (world, name, user, owner, text, extra) => {
    const pulled = world.server.live(owner).map(({ owner: _, ...rec }) => rec);
    const id = (rec) => recordKey(rec.kind, rec.key);
    const base = normalizeState(fromRecords(new Map(pulled.map((rec) => [id(rec), { kind: rec.kind, key: rec.key, data: rec.data }]))));
    assert.deepEqual(itemNames(base), names(text));
    const state = addTo(world, base, extra);
    const storage = fakeStorage();
    saveSession(storage, sessionOf(user));
    saveSyncState(storage, {
      owner: user,
      space: owner,
      shares: world.server.shares.map((share) => ({ ...share })),
      cursor: cursorOf(pulled, ''),
      server: new Map(pulled.map((rec) => [id(rec), rec])),
      local: toRecords(base),
      ids: new Map(pulled.map((rec) => [id(rec), rec.id])),
    });
    saveQueue(storage, diffRecords(toRecords(base), toRecords(state)));
    makeDevice(world, name, { user, storage, state });
  });

  // What a device of a member shows and keeps.
  Then('{string} sees the shared items {string}', (world, name, text) => {
    assert.deepEqual(itemNames(deviceOf(world, name).box.shared), names(text));
  });
  Then('{string} sees the shared recipes {string}', (world, name, text) => {
    assert.deepEqual((deviceOf(world, name).box.shared?.recipes ?? []).map((recipe) => recipe.name), names(text));
  });
  Then('the shared list of {string} has {int} meal(s)', (world, name, count) => {
    assert.equal(deviceOf(world, name).box.shared.menu.length, count);
  });
  Then('the shared list of {string} groups by {word}', (world, name, group) => {
    assert.equal(deviceOf(world, name).box.shared.group, group);
  });
  Then('the shared queue of {string} holds {int} change(s)', (world, name, count) => {
    assert.equal(loadQueue(deviceOf(world, name).storage, 'shared').length, count);
  });
  Then('{string} syncs the space of {string} besides the own', (world, name, owner) => {
    assert.equal(status(deviceOf(world, name)).shared?.owner, owner);
  });
  Then('{string} has no shared list', (world, name) => {
    const device = deviceOf(world, name);
    assert.equal(status(device).shared, null);
    assert.equal(device.box.shared, null);
  });
  Then('{string} knows of no share', (world, name) => {
    assert.deepEqual(status(deviceOf(world, name)).shares, []);
  });
  Then('{string} lost {int} change(s) as left and {int} as narrowed', (world, name, left, narrowed) => {
    const last = deviceOf(world, name).box.statuses.at(-1);
    assert.deepEqual({ left: last.left, narrowed: last.narrowed }, { left, narrowed });
  });
  Then('the shared keys of {string} hold the items {string} and {int} change(s)', (world, name, text, count) => {
    const { storage } = deviceOf(world, name);
    assert.deepEqual(itemNames(loadSharedState(storage)), names(text));
    assert.equal(loadQueue(storage, 'shared').length, count);
  });
  Then('the cursor of the own lane of {string} is empty', (world, name) => {
    assert.equal(loadSyncState(deviceOf(world, name).storage).cursor, '');
  });
  Then('the share request of {string} succeeds', (world, name) => {
    assert.equal(deviceOf(world, name).request, 'ok');
  });
  Then('the share request of {string} fails with {string}', (world, name, key) => {
    assert.deepEqual(deviceOf(world, name).request, { error: key });
  });

  // What the server holds of the shares.
  Then('the share of {string} is {word}', (world, user, word) => {
    const share = shareOf(world, user);
    if (word === 'active') assert.equal(share.cancelled, false);
    else assert.equal(personState(share), word);
  });
  Then('the share of {string} has the scope {word}', (world, user, scope) => {
    assert.equal(shareOf(world, user).scope, scope);
  });
  Then('the server has no share of {string}', (world, user) => {
    assert.equal(world.server.shares.some((share) => share.member === user || share.email === emailOf(user)), false);
  });

  // The pure rules of src/shares.js.
  Given('the shares are:', (world, table) => {
    world.shares = table.hashes.map((row) => ({
      id: row.id,
      owner: row.owner,
      email: row.email,
      ownerEmail: emailOf(row.owner),
      ownerName: '',
      member: unquote(row.member),
      ...(row.scope ? { scope: row.scope } : {}),
      cancelled: yesNo(unquote(row.cancelled) || 'no'),
    }));
  });
  Then('the pending invite of {string} with the email {string} is {string}', (world, user, email, id) => {
    assert.equal(pendingInvite(world.shares, userOf(user, email))?.id ?? 'none', id);
  });
  Then('the sheet of {string} shows the case {word}', (world, user, which) => {
    assert.equal(shareCase(world.shares, userOf(user)).case, which);
  });
  Then('the invite of {string} is blocked: {word}', (world, user, answer) => {
    assert.equal(shareCase(world.shares, userOf(user)).blocked, yesNo(answer));
  });
  Then('the people of the sheet of {string} are:', (world, user, table) => {
    const { people } = shareCase(world.shares, userOf(user));
    assert.deepEqual(people.map((person) => ({ email: person.email, state: person.state, scope: scopeOf(person) })), table.hashes);
  });
  Then('the space that {string} syncs besides the own is none', (world, user) => {
    assert.equal(sharedSpace(world.shares, user), null);
  });
  Then('the space that {string} syncs besides the own is the one of {string} with scope {word}', (world, user, owner, scope) => {
    const space = sharedSpace(world.shares, user);
    assert.deepEqual({ owner: space?.owner, scope: space?.scope }, { owner, scope });
  });
  Then('a tap on the scope {word} sets {word}', (world, from, to) => {
    assert.equal(otherScope(from), to);
  });
  Then('the name of the shared list of an owner named {string} with the email {string} is {string}', (world, ownerName, ownerEmail, name) => {
    assert.equal(listName({ ownerName, ownerEmail }), name);
  });
};

export const defineSyncSteps = (registry) => {
  defineDeviceSteps(registry);
  defineAccountSteps(registry);
  defineShareSteps(registry);
};
