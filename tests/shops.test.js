import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, setSort } from '#store';
import {
  shopNames,
  shopSuggestions,
  addItemShop,
  removeItemShop,
  shopGroups,
  shopChips,
  inShop,
  shopState,
  validShop,
  nextShop,
  previousShop,
  withShop,
} from '#shops';

let counter = 0;
const newId = () => `id-${++counter}`;

// Each spec is [name, list, patch]: the list is 'active' or 'saved'.
const build = (...specs) =>
  specs.reduce((state, [name, list, patch = {}]) => {
    const { state: added } = addItem(state, name, newId);
    const items = added.items.map((item) => (item.name === name ? { ...item, list, ...patch } : item));
    return { ...added, items };
  }, emptyState());

const find = (state, name) => state.items.find((item) => item.name === name);
const names = (items) => items.map((item) => item.name);
const shape = ({ groups, rest }) => ({
  groups: groups.map(({ shop, items, total }) => [shop, names(items), total]),
  rest: names(rest),
});

test('addItemShop adds a trimmed shop to the item and does not change its input', () => {
  const start = build(['Milk', 'active'], ['Salt', 'active']);
  const { state, error } = addItemShop(start, find(start, 'Milk').id, '  Lidl ');
  assert.equal(error, undefined);
  assert.deepEqual(find(state, 'Milk').shops, ['Lidl']);
  assert.deepEqual(find(state, 'Salt').shops, []);
  assert.deepEqual(find(start, 'Milk').shops, []);
});

test('addItemShop keeps the order in which the shops were added', () => {
  const start = build(['Milk', 'active', { shops: ['Market'] }]);
  const { state } = addItemShop(start, find(start, 'Milk').id, 'Lidl');
  assert.deepEqual(find(state, 'Milk').shops, ['Market', 'Lidl']);
});

test('addItemShop rejects an empty name and an unknown item', () => {
  const start = build(['Milk', 'active']);
  for (const name of ['', '   ', null, undefined]) {
    const rejected = addItemShop(start, find(start, 'Milk').id, name);
    assert.equal(rejected.state, start);
    assert.deepEqual(rejected.error, { key: 'error.shopRequired' });
  }
  const unknown = addItemShop(start, 'nope', 'Lidl');
  assert.equal(unknown.state, start);
  assert.deepEqual(unknown.error, { key: 'error.itemNotFound' });
});

test('addItemShop takes the spelling of a shop in use', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }], ['Salt', 'active']);
  const { state } = addItemShop(start, find(start, 'Salt').id, ' LIDL ');
  assert.deepEqual(find(state, 'Salt').shops, ['Lidl']);
});

test('addItemShop returns the same state for a shop that the item has', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }]);
  const result = addItemShop(start, find(start, 'Milk').id, 'lidl');
  assert.equal(result.state, start);
  assert.equal(result.error, undefined);
});

test('removeItemShop removes a shop with no case distinction', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl', 'Market'] }]);
  const { state, error } = removeItemShop(start, find(start, 'Milk').id, 'LIDL');
  assert.equal(error, undefined);
  assert.deepEqual(find(state, 'Milk').shops, ['Market']);
  assert.deepEqual(find(start, 'Milk').shops, ['Lidl', 'Market']);
});

test('removeItemShop returns the same state for a shop that the item does not have', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }]);
  assert.equal(removeItemShop(start, find(start, 'Milk').id, 'Market').state, start);
  assert.deepEqual(removeItemShop(start, 'nope', 'Lidl'), { state: start, error: { key: 'error.itemNotFound' } });
});

test('shopNames gives each shop in use one time, in name order', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Zeta', 'árbol'] }],
    ['Salt', 'saved', { shops: ['beta', 'Zeta'] }],
    ['Rice', 'active'],
  );
  assert.deepEqual(shopNames(state), ['árbol', 'beta', 'Zeta']);
  assert.deepEqual(shopNames(emptyState()), []);
});

test('shopGroups puts an item of two shops in the two groups and leaves out a saved item', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Market'] }],
    ['Bread', 'active', { shops: ['Lidl', 'Market'] }],
    ['Salt', 'active'],
    ['Wine', 'saved', { shops: ['Cellar'] }],
  );
  assert.deepEqual(shape(shopGroups(state)), {
    groups: [
      ['Lidl', ['Bread'], 1],
      ['Market', ['Milk', 'Bread'], 2],
    ],
    rest: ['Salt'],
  });
});

test('a ticked item counts in the total and is not in the items or in the rest', () => {
  const state = build(
    ['Bread', 'active', { shops: ['Lidl', 'Market'], bought: true }],
    ['Milk', 'active', { shops: ['Market'] }],
    ['Oil', 'active', { bought: true }],
  );
  assert.deepEqual(shape(shopGroups(state)), {
    groups: [
      ['Lidl', [], 1],
      ['Market', ['Milk'], 2],
    ],
    rest: [],
  });
});

test('shopGroups uses the order of the list inside a group', () => {
  const state = build(['Milk', 'active', { shops: ['Lidl'] }], ['Bread', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(names(shopGroups(state).groups[0].items), ['Milk', 'Bread']);
  const sorted = setSort(state, 'name').state;
  assert.deepEqual(names(shopGroups(sorted).groups[0].items), ['Bread', 'Milk']);
});

test('shopGroups counts a ticked recurrent item in the total and leaves it out of the items', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Lidl'] }],
    ['Soap', 'active', { bought: true, recurrent: true, shops: ['Lidl', 'Market'] }],
    ['Salt', 'active'],
  );
  assert.deepEqual(shape(shopGroups(state)), {
    groups: [
      ['Lidl', ['Milk'], 2],
      ['Market', [], 1],
    ],
    rest: ['Salt'],
  });
});

test('shopGroups with no shops has no groups and all the items in rest', () => {
  const state = build(['Milk', 'active'], ['Salt', 'active'], ['Rice', 'saved', { shops: ['Lidl'] }]);
  assert.deepEqual(shape(shopGroups(state)), { groups: [], rest: ['Milk', 'Salt'] });
  assert.deepEqual(shape(shopGroups(emptyState())), { groups: [], rest: [] });
});

test('shopSuggestions gives the shops in use that the item does not have, in name order', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Lidl'] }],
    ['Salt', 'saved', { shops: ['Zeta', 'árbol', 'lidl'] }],
    ['Rice', 'active'],
  );
  assert.deepEqual(shopSuggestions(state, find(state, 'Milk').id), ['árbol', 'Zeta']);
  assert.deepEqual(shopSuggestions(state, find(state, 'Rice').id), ['árbol', 'Lidl', 'Zeta']);
});

test('shopSuggestions is empty for an unknown item and for no shops', () => {
  const state = build(['Milk', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(shopSuggestions(state, 'nope'), []);
  assert.deepEqual(shopSuggestions(state, find(state, 'Milk').id), []);
  assert.deepEqual(shopSuggestions(emptyState(), 'nope'), []);
});

test('shopChips is empty when no item of the view has a shop', () => {
  assert.deepEqual(shopChips(build(['Milk', 'active'])), []);
  assert.deepEqual(shopChips(build(['Milk', 'active'], ['Rice', 'saved', { shops: ['Lidl'] }])), []);
});

test('shopChips has Todas, the shops in name order and Sin tienda, with the items to buy', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Lidl', 'aldi'] }],
    ['Salt', 'active', { shops: ['Lidl'], bought: true }],
    ['Bread', 'active'],
    ['Rice', 'saved', { shops: ['Market'] }],
  );
  assert.deepEqual(shopChips(state), [
    { shop: null, count: 2 },
    { shop: 'aldi', count: 1 },
    { shop: 'Lidl', count: 1 },
    { shop: '', count: 1 },
  ]);
});

test('shopChips has no Sin tienda when each item has a shop and counts only the items to buy', () => {
  const state = build(['Rice', 'active', { shops: ['Market'], bought: true }], ['Milk', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(shopChips(state), [{ shop: null, count: 1 }, { shop: 'Lidl', count: 1 }, { shop: 'Market', count: 0 }]);
});

test('inShop takes each item for null, the items of a shop with no case distinction, and the items with no shop for an empty name', () => {
  const lidl = { shops: ['Lidl'] };
  const none = { shops: [] };
  assert.equal(inShop(lidl, null), true);
  assert.equal(inShop(lidl, 'lidl'), true);
  assert.equal(inShop(none, 'Lidl'), false);
  assert.equal(inShop(none, ''), true);
  assert.equal(inShop(lidl, ''), false);
});

test('shopState keeps only the items of the shop and returns the same state for null', () => {
  const start = build(['Milk', 'active', { shops: ['Lidl'] }], ['Bread', 'active']);
  assert.deepEqual(names(shopState(start, 'Lidl').items), ['Milk']);
  assert.deepEqual(names(shopState(start, '').items), ['Bread']);
  assert.equal(shopState(start, null), start);
});

test('validShop keeps a shop of the view in its current spelling and gives null for a shop that went', () => {
  const state = build(['Milk', 'active', { shops: ['Lidl'] }], ['Bread', 'active']);
  assert.equal(validShop(state, 'LIDL'), 'Lidl');
  assert.equal(validShop(state, 'Aldi'), null);
  assert.equal(validShop(state, ''), '');
  assert.equal(validShop(state, null), null);
  assert.equal(validShop(build(['Milk', 'active', { shops: ['Lidl'] }]), ''), null);
  assert.equal(validShop(build(['Milk', 'active']), 'Lidl'), null);
});

test('nextShop gives the next shop with an item to buy and its count, in chip order, wrapping', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Aldi'] }],
    ['Salt', 'active', { shops: ['Lidl'], bought: true }],
    ['Rice', 'active', { shops: ['Market'] }],
    ['Bread', 'active'],
  );
  assert.deepEqual(nextShop(state, 'Aldi'), { shop: 'Market', count: 1 });
  assert.deepEqual(nextShop(state, 'Market'), { shop: '', count: 1 });
  assert.deepEqual(nextShop(state, ''), { shop: 'Aldi', count: 1 });
});

test('nextShop skips a shop with nothing to buy and gives null when every other shop is done', () => {
  const done = build(['Salt', 'active', { shops: ['Lidl'], bought: true }]);
  assert.equal(nextShop(done, 'Lidl'), null);
  const only = build(['Milk', 'active', { shops: ['Aldi'] }], ['Salt', 'active', { shops: ['Lidl'], bought: true }]);
  assert.equal(nextShop(only, 'Aldi'), null);
  assert.deepEqual(nextShop(only, 'Lidl'), { shop: 'Aldi', count: 1 });
  assert.equal(nextShop(emptyState(), 'Lidl'), null);
});

test('nextShop counts an item of two shops in both', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Aldi', 'Lidl'] }],
    ['Rice', 'active', { shops: ['Lidl'] }],
    ['Salt', 'active', { shops: ['Aldi'], bought: true }],
  );
  assert.deepEqual(nextShop(state, 'Aldi'), { shop: 'Lidl', count: 2 });
  assert.deepEqual(nextShop(state, 'Lidl'), { shop: 'Aldi', count: 1 });
});

test('nextShop from Todas or from a shop that is gone gives the first shop with an item to buy', () => {
  const state = build(['Milk', 'active', { shops: ['Aldi'] }], ['Rice', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(nextShop(state, null), { shop: 'Aldi', count: 1 });
  assert.deepEqual(nextShop(state, 'Gone'), { shop: 'Aldi', count: 1 });
});

test('withShop adds the shop to the item of the result and leaves Todas, Sin tienda and errors alone', () => {
  const start = build(['Milk', 'active']);
  const id = find(start, 'Milk').id;
  assert.deepEqual(find(withShop({ state: start }, id, 'Lidl').state, 'Milk').shops, ['Lidl']);
  for (const shop of [null, '']) assert.equal(withShop({ state: start }, id, shop).state, start);
  const failed = { state: start, error: { key: 'error.nameRequired' } };
  assert.equal(withShop(failed, id, 'Lidl'), failed);
  assert.equal(withShop({ state: start, changed: false }, id, 'Lidl').changed, false);
});

test('previousShop gives the shop before with an item to buy, in chip order, wrapping', () => {
  const state = build(
    ['Milk', 'active', { shops: ['Aldi'] }],
    ['Salt', 'active', { shops: ['Lidl'], bought: true }],
    ['Rice', 'active', { shops: ['Market'] }],
    ['Bread', 'active'],
  );
  assert.deepEqual(previousShop(state, 'Market'), { shop: 'Aldi', count: 1 });
  assert.deepEqual(previousShop(state, 'Aldi'), { shop: '', count: 1 });
  assert.deepEqual(previousShop(state, ''), { shop: 'Market', count: 1 });
});

test('previousShop from Todas or from a shop that is gone gives the last shop with an item to buy', () => {
  const state = build(['Milk', 'active', { shops: ['Aldi'] }], ['Rice', 'active', { shops: ['Lidl'] }]);
  assert.deepEqual(previousShop(state, null), { shop: 'Lidl', count: 1 });
  assert.deepEqual(previousShop(state, 'Gone'), { shop: 'Lidl', count: 1 });
});

test('previousShop gives null when every other shop is done', () => {
  const only = build(['Milk', 'active', { shops: ['Aldi'] }], ['Salt', 'active', { shops: ['Lidl'], bought: true }]);
  assert.equal(previousShop(only, 'Aldi'), null);
  assert.deepEqual(previousShop(only, 'Lidl'), { shop: 'Aldi', count: 1 });
  assert.equal(previousShop(emptyState(), 'Lidl'), null);
});

test('previousShop does not change the state', () => {
  const state = build(['Milk', 'active', { shops: ['Aldi'] }], ['Rice', 'active', { shops: ['Lidl'] }]);
  const copy = structuredClone(state);
  previousShop(state, 'Lidl');
  assert.deepEqual(state, copy);
});
