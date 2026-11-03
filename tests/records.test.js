import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRecords, fromRecords, diffRecords, recordKey } from '#records';
import { normalizeState } from '#storage';
import { emptyState } from '#store';

// The Monday of the week of the meals of the tests.
const W = '2026-11-02';

const item = (id, name, extra = {}) => ({ id, name, recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '', ...extra });
const recipe = (id, name) => ({ id, name, products: ['Pasta'], url: '' });

const sample = () => ({
  ...emptyState(),
  items: [item('a', 'Pasta'), item('b', 'Leche')],
  recipes: [recipe('r1', 'Sopa')],
  menu: [{ week: W, day: 0, meal: 'lunch', dish: 'Sopa' }],
  sort: 'name',
  aisles: ['Frutas'],
});

test('toRecords gives one record per item, recipe and meal, and one settings record', () => {
  const records = toRecords(sample());
  assert.deepEqual(
    [...records.keys()].sort(),
    ['item:a', 'item:b', 'meal:2026-11-02-0-lunch', 'recipe:r1', 'settings:settings'],
  );
  assert.deepEqual(records.get('settings:settings').data, { group: 'recipe', sort: 'name', sent: [], aisles: ['Frutas'] });
  assert.deepEqual(records.get('meal:2026-11-02-0-lunch').data, { dish: 'Sopa' });
  assert.equal(records.get(recordKey('item', 'a')).key, 'a');
});

test('item data carries its position in the list', () => {
  const records = toRecords(sample());
  assert.equal(records.get('item:a').data.position, 0);
  assert.equal(records.get('item:b').data.position, 1);
});

test('fromRecords of toRecords returns the same state', () => {
  const state = normalizeState({ ...sample(), recipes: [recipe('r1', 'Sopa')], sent: ['r1'], menu: [{ week: W, day: 1, meal: 'dinner', recipe: 'r1' }, { week: W, day: 0, meal: 'lunch', dish: 'Sopa' }] });
  assert.deepEqual(normalizeState(fromRecords(toRecords(state))), state);
});

test('fromRecords orders items and recipes by position', () => {
  const records = toRecords({ ...sample(), recipes: [recipe('r1', 'Sopa'), recipe('r2', 'Tarta')] });
  records.get('item:a').data.position = 5;
  records.get('recipe:r1').data.position = 3;
  const state = fromRecords(records);
  assert.deepEqual(state.items.map((i) => i.id), ['b', 'a']);
  assert.deepEqual(state.recipes.map((r) => r.id), ['r2', 'r1']);
  assert.equal('position' in state.items[0], false);
});

test('diffRecords of equal maps is empty', () => {
  assert.deepEqual(diffRecords(toRecords(sample()), toRecords(sample())), []);
});

test('diffRecords gives an upsert for a ticked item and a delete for a removed recipe', () => {
  const prev = toRecords(sample());
  const state = sample();
  state.items[0].bought = true;
  state.recipes = [];
  const changes = diffRecords(prev, toRecords(state));
  assert.deepEqual(changes.map(({ kind, key, op }) => [kind, key, op]), [
    ['recipe', 'r1', 'delete'],
    ['item', 'a', 'upsert'],
  ]);
  assert.equal(changes[1].data.bought, true);
  assert.equal('data' in changes[0], false);
});

test('diffRecords of a moved item gives upserts only for items whose position changed', () => {
  const state = { ...sample(), items: [item('a', 'A'), item('b', 'B'), item('c', 'C')] };
  const moved = { ...state, items: [state.items[1], state.items[0], state.items[2]] };
  const changes = diffRecords(toRecords(state), toRecords(moved));
  assert.deepEqual(changes.map((c) => c.key), ['a', 'b']);
  assert.ok(changes.every((c) => c.op === 'upsert'));
});

test('diffRecords ignores the order of the keys of data', () => {
  const a = new Map([['item:x', { kind: 'item', key: 'x', data: { p: 1, q: 2 } }]]);
  const b = new Map([['item:x', { kind: 'item', key: 'x', data: { q: 2, p: 1 } }]]);
  assert.deepEqual(diffRecords(a, b), []);
});

test('fromRecords reads a meal record of the version 9 key with no week, and normalizeState dates it', () => {
  const records = new Map([['meal:3-dinner', { kind: 'meal', key: '3-dinner', data: { dish: 'Sopa' } }]]);
  assert.deepEqual(fromRecords(records).menu, [{ day: 3, meal: 'dinner', dish: 'Sopa' }]);
  const state = normalizeState(fromRecords(records), new Date(2026, 10, 4));
  assert.deepEqual(state.menu, [{ week: '2026-11-02', day: 3, meal: 'dinner', dish: 'Sopa' }]);
  assert.deepEqual([...toRecords(state).keys()].filter((key) => key.startsWith('meal:')), ['meal:2026-11-02-3-dinner']);
});
