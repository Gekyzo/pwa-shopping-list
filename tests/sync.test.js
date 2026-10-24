import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, mergePulled, dedupe, cursorOf } from '#sync';
import { recordKey, fromRecords } from '#records';
import { normalizeState } from '#storage';

const item = (id, name) => ({ id, name, recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' });
const rec = (kind, key, data = {}) => ({ kind, key, data });
const itemRec = (id, name) => rec('item', id, { ...item(id, name), position: 0 });
const recipeRec = (id, name) => rec('recipe', id, { id, name, products: ['Pasta'], url: '', position: 0 });
const serverRec = (base, updated, deleted = false) => ({ ...base, id: `pb-${base.key}`, deleted, updated });
const mapOf = (recs) => new Map(recs.map((r) => [recordKey(r.kind, r.key), r]));

test('enqueue keeps one change per record, the last one', () => {
  const queue = [
    { kind: 'item', key: 'a', op: 'upsert', data: { n: 1 } },
    { kind: 'item', key: 'b', op: 'upsert', data: { n: 2 } },
  ];
  const next = enqueue(queue, [{ kind: 'item', key: 'a', op: 'delete' }, { kind: 'item', key: 'c', op: 'upsert', data: {} }]);
  assert.deepEqual(next.map((c) => `${c.key}:${c.op}`), ['b:upsert', 'a:delete', 'c:upsert']);
  assert.equal(queue.length, 2);
});

test('mergePulled takes a pulled record that has no queued change', () => {
  const pulled = [serverRec(itemRec('a', 'Pasta'), '2026-10-24 07:00:00.000Z')];
  const { local, server } = mergePulled({ local: new Map(), server: new Map(), queue: [], pulled });
  assert.equal(local.get('item:a').data.name, 'Pasta');
  assert.equal(server.get('item:a').id, 'pb-a');
  assert.equal(local.get('item:a').id, undefined);
});

test('mergePulled keeps a local record whose change is still queued', () => {
  const mine = itemRec('a', 'Mine');
  const local = mapOf([mine]);
  const queue = [{ kind: 'item', key: 'a', op: 'upsert', data: mine.data }];
  const pulled = [serverRec(itemRec('a', 'Theirs'), '2026-10-24 07:00:00.000Z')];
  const merged = mergePulled({ local, server: new Map(), queue, pulled });
  assert.equal(merged.local.get('item:a').data.name, 'Mine');
  assert.equal(merged.server.get('item:a').data.name, 'Theirs');
  assert.equal(local.get('item:a').data.name, 'Mine');
});

test('mergePulled removes a record pulled as deleted', () => {
  const local = mapOf([itemRec('a', 'Pasta'), itemRec('b', 'Leche')]);
  const pulled = [serverRec(itemRec('a', 'Pasta'), '2026-10-24 07:00:00.000Z', true)];
  const merged = mergePulled({ local, server: new Map(), queue: [], pulled });
  assert.deepEqual([...merged.local.keys()], ['item:b']);
  assert.equal(merged.server.get('item:a').deleted, true);
  assert.equal(local.size, 2);
});

test('dedupe keeps the newer of two items named Leche and leche, and deletes the other', () => {
  const a = itemRec('a', 'Leche');
  const b = itemRec('b', 'leche');
  const local = mapOf([a, b, itemRec('c', 'Pasta')]);
  const server = mapOf([serverRec(a, '2026-10-24 07:00:00.000Z'), serverRec(b, '2026-10-24 08:00:00.000Z')]);
  const result = dedupe(local, server);
  assert.deepEqual(result.removed, [{ kind: 'item', key: 'a', op: 'delete' }]);
  assert.deepEqual([...result.local.keys()].sort(), ['item:b', 'item:c']);
  assert.equal(local.size, 3);
  assert.notEqual(normalizeState(fromRecords(result.local)), null);
});

test('dedupe keeps a local item that is not on the server yet over a server one', () => {
  const a = itemRec('a', 'Leche');
  const b = itemRec('b', 'LECHE');
  const result = dedupe(mapOf([a, b]), mapOf([serverRec(a, '2026-10-24 09:00:00.000Z')]));
  assert.deepEqual(result.removed, [{ kind: 'item', key: 'a', op: 'delete' }]);
  assert.deepEqual([...result.local.keys()], ['item:b']);
});

test('dedupe settles a tie by the greater record key', () => {
  const a = itemRec('a', 'Leche');
  const b = itemRec('b', 'leche');
  const same = '2026-10-24 07:00:00.000Z';
  const both = dedupe(mapOf([a, b]), mapOf([serverRec(a, same), serverRec(b, same)]));
  assert.deepEqual(both.removed.map((c) => c.key), ['a']);
  const neither = dedupe(mapOf([b, a]), new Map());
  assert.deepEqual(neither.removed.map((c) => c.key), ['a']);
});

test('dedupe of two recipes with one name drops the menu entries that pointed at the loser after normalizeState', () => {
  const r1 = recipeRec('r1', 'Sopa');
  const r2 = recipeRec('r2', 'sopa');
  const local = mapOf([
    r1,
    r2,
    rec('meal', '0-lunch', { recipe: 'r1' }),
    rec('meal', '1-lunch', { recipe: 'r2' }),
    rec('settings', 'settings', { group: 'list', sort: 'manual', sent: ['r1', 'r2'], aisles: [] }),
  ]);
  const server = mapOf([serverRec(r1, '2026-10-24 07:00:00.000Z'), serverRec(r2, '2026-10-24 08:00:00.000Z')]);
  const result = dedupe(local, server);
  assert.deepEqual(result.removed, [{ kind: 'recipe', key: 'r1', op: 'delete' }]);
  const state = normalizeState(fromRecords(result.local));
  assert.notEqual(state, null);
  assert.deepEqual(state.recipes.map((r) => r.id), ['r2']);
  assert.deepEqual(state.menu.map((m) => m.day), [1]);
  assert.deepEqual(state.sent, ['r2']);
});

test('cursorOf gives the greatest updated, or the previous cursor when nothing was pulled', () => {
  const pulled = [
    serverRec(itemRec('a', 'A'), '2026-10-24 07:00:00.000Z'),
    serverRec(itemRec('b', 'B'), '2026-10-24 09:00:00.000Z'),
    serverRec(itemRec('c', 'C'), '2026-10-24 08:00:00.000Z'),
  ];
  assert.equal(cursorOf(pulled, ''), '2026-10-24 09:00:00.000Z');
  assert.equal(cursorOf(pulled, '2026-10-25 00:00:00.000Z'), '2026-10-25 00:00:00.000Z');
  assert.equal(cursorOf([], '2026-10-24 07:00:00.000Z'), '2026-10-24 07:00:00.000Z');
});
