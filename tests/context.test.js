import { test } from 'node:test';
import assert from 'node:assert/strict';

// context.js reads the page at load; a stub of the page lets node load it. The storage is real
// enough to fail on demand.
const stub = () => new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub(), set: () => true });
const storage = {
  fail: false,
  map: new Map(),
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  },
  setItem(key, value) {
    if (this.fail) throw new Error('quota');
    this.map.set(key, value);
  },
  removeItem(key) {
    this.map.delete(key);
  },
};
Object.assign(globalThis, { document: stub(), window: { localStorage: storage }, location: { search: '', hostname: 'test' } });
const context = await import('#ui/context');
const { exportJson } = await import('#storage');

test('commit calls the after-commit function only when the save succeeded', () => {
  const calls = [];
  const next = { ...context.state, sort: 'name' };
  assert.equal(context.commit(next), true);
  context.setAfterCommit((state) => calls.push(state));
  storage.fail = true;
  assert.equal(context.commit({ ...next, sort: 'custom' }), false);
  assert.deepEqual(calls, []);
  storage.fail = false;
  assert.equal(context.commit(next), true);
  assert.deepEqual(calls, [next]);
  assert.equal(context.state, next);
});

test('commit renders before the after-commit function, and its error skips no render', (t) => {
  const order = [];
  t.mock.method(console, 'error', () => {});
  context.setRender(() => order.push('render'));
  context.setAfterCommit(() => {
    order.push('after');
    throw new Error('sync');
  });
  assert.equal(context.commit({ ...context.state, sort: 'custom' }), true);
  assert.deepEqual(order, ['render', 'after']);
  assert.equal(console.error.mock.callCount(), 1);
  context.setAfterCommit(null);
  context.setRender(() => {});
});

test('a state that the sync puts in place drops the undo of a change before it', () => {
  context.showToast('Borrado', { undo: context.state });
  assert.notEqual(context.undoState, null);
  context.replaceState({ ...context.state, sort: 'name' });
  assert.equal(context.undoState, null);
});

// SHARE-12: a member, with the share and the shared state of the shared lane.
const share = { owner: 'a', ownerName: 'Ana', ownerEmail: 'a@example.test', scope: 'list', id: 's1' };
const item = (id, name, extra = {}) => ({ id, name, list: 'active', bought: false, recurrent: false, quantity: '', shops: [], aisle: '', ...extra });
const member = () => {
  context.replaceState({ ...context.ownState(), items: [item('o1', 'Leche B')], recipes: [], menu: [], sent: [] });
  context.setSharing(share, { ...context.ownState(), items: [item('s1', 'Pan A')], recipes: [], menu: [], sent: [], sort: 'name' });
};
const stored = (key) => JSON.parse(storage.getItem(key));

test('commit saves the own part to shopping.v1 and the shared part to shopping.shared.v1', () => {
  member();
  const calls = [];
  context.setAfterCommit((own, shared, options) => calls.push({ own, shared, options }));
  const next = { ...context.state, items: context.state.items.map((one) => ({ ...one, bought: true })) };
  assert.equal(context.commit(next, { explicit: true }), true);
  assert.deepEqual(stored('shopping.v1').items.map((one) => [one.name, one.bought]), [['Leche B', true]]);
  assert.deepEqual(stored('shopping.shared.v1').items.map((one) => [one.name, one.bought]), [['Pan A', true]]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].own.items.map((one) => one.name), ['Leche B']);
  assert.deepEqual(calls[0].shared.items.map((one) => one.name), ['Pan A']);
  assert.equal(calls[0].shared.sort, 'name');
  assert.deepEqual(calls[0].options, { explicit: true });
  assert.equal(context.sharedBase, calls[0].shared);
  context.setAfterCommit(null);
});

test('the saved own part has no shared marker', () => {
  member();
  assert.equal(context.state.items.length, 2);
  context.commit({ ...context.state });
  for (const key of ['shopping.v1', 'shopping.shared.v1']) {
    for (const one of stored(key).items) assert.equal('shared' in one, false, key);
  }
  assert.equal(context.ownState().items.some((one) => 'shared' in one), false);
});

test('undo of a shared tick restores it in the shared part', () => {
  member();
  const before = context.state;
  const ticked = { ...before, items: before.items.map((one) => (one.name === 'Pan A' ? { ...one, bought: true } : one)) };
  context.apply({ state: ticked }, { undoText: 'Comprado' });
  assert.equal(stored('shopping.shared.v1').items[0].bought, true);
  context.commit(context.undoState);
  assert.equal(stored('shopping.shared.v1').items[0].bought, false);
  assert.deepEqual(stored('shopping.v1').items.map((one) => one.name), ['Leche B']);
});

test('export holds the own list only', () => {
  member();
  const exported = JSON.parse(exportJson(context.ownState()));
  assert.deepEqual(exported.items.map((one) => one.name), ['Leche B']);
});

test('the end of a share leaves the own list on the screen', () => {
  member();
  context.setSharing(null, null);
  assert.equal(context.sharing, null);
  assert.equal(context.sharedBase, null);
  assert.equal(storage.getItem('shopping.shared.v1'), null);
  assert.deepEqual(context.state.items.map((one) => one.name), ['Leche B']);
});

test('a change of the own part only keeps the shared part', () => {
  member();
  const result = context.onOwn((own) => ({ state: { ...own, items: [item('o2', 'Huevos')] } }));
  context.apply(result);
  assert.deepEqual(context.state.items.map((one) => one.name), ['Huevos', 'Pan A']);
  assert.deepEqual(stored('shopping.shared.v1').items.map((one) => one.name), ['Pan A']);
  context.setSharing(null, null);
});
