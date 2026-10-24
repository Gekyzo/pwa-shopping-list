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
