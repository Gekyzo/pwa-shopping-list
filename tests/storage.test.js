import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  load,
  save,
  exportJson,
  importJson,
  loadLanguage,
  saveLanguage,
} from '#storage';
import { emptyState } from '#store';

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};

const brokenStorage = () => ({
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
});

const sampleV1 = () => ({
  version: 1,
  items: [
    { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: true, again: true },
    { id: 'b', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
  ],
});

const sampleV2 = () => ({
  ...sampleV1(),
  version: 2,
  recipes: [{ id: 'r1', name: 'Omelette', products: ['Eggs', 'Potatoes'], url: 'https://example.com/omelette' }],
  sent: ['r1'],
  grouped: true,
  sort: 'custom',
});

const sample = () => {
  const { grouped, items, ...rest } = sampleV2();
  const [bread, milk] = items;
  return { ...rest, version: 3, items: [{ ...bread, shops: ['Lidl', 'Market'] }, { ...milk, shops: [] }], group: 'shop' };
};

// The items of an old state, as a version 3 state has them.
const withNoShops = (items) => items.map((item) => ({ ...item, shops: [] }));

test('save then load returns the same state', () => {
  const storage = fakeStorage();
  assert.equal(save(storage, sample()), true);
  assert.deepEqual(load(storage), sample());
});

test('load returns an empty state when the key is absent', () => {
  assert.deepEqual(load(fakeStorage()), emptyState());
});

test('load keeps corrupt JSON under the corrupt key and returns an empty state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{not json' });
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(CORRUPT_KEY), '{not json');
});

test('load treats valid JSON with an invalid shape as corrupt', () => {
  const text = JSON.stringify({ version: 1, items: [{ id: 'a' }] });
  const storage = fakeStorage({ [STORAGE_KEY]: text });
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(CORRUPT_KEY), text);
});

test('load and save survive a storage that throws', () => {
  assert.deepEqual(load(brokenStorage()), emptyState());
  assert.equal(save(brokenStorage(), sample()), false);
});

test('exportJson then importJson returns the same state', () => {
  assert.deepEqual(importJson(exportJson(sample())), { state: sample() });
});

test('importJson rejects text that is not JSON', () => {
  assert.deepEqual(importJson('nope'), { error: { key: 'error.invalidJson' } });
});

test('importJson rejects an unknown version', () => {
  const text = JSON.stringify({ ...sample(), version: 4 });
  assert.deepEqual(importJson(text), { error: { key: 'error.notBackup' } });
});

test('importJson rejects invalid items', () => {
  const invalid = [
    null,
    [],
    { version: 1 },
    { version: 1, items: 'x' },
    { version: 1, items: [{ ...sample().items[0], list: 'other' }] },
    { version: 1, items: [{ ...sample().items[0], name: '  ' }] },
    { version: 1, items: [{ ...sample().items[0], bought: 'yes' }] },
    { version: 1, items: [sample().items[0], { ...sample().items[1], id: 'a' }] },
    { version: 1, items: [sample().items[0], { ...sample().items[1], name: 'bread' }] },
  ];
  invalid.forEach((data) => {
    assert.deepEqual(importJson(JSON.stringify(data)), { error: { key: 'error.notBackup' } });
  });
});

test('importJson drops unknown fields and repairs the bought and again rules', () => {
  const data = {
    version: 1,
    extra: true,
    items: [
      { id: 'a', name: ' Milk ', recurrent: true, list: 'next', bought: true, again: true, note: 'x' },
      { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: true },
    ],
  };
  assert.deepEqual(importJson(JSON.stringify(data)), {
    state: {
      version: 3,
      items: [
        { id: 'a', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false, shops: [] },
        { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: false, shops: [] },
      ],
      recipes: [],
      sent: [],
      group: 'recipe',
      sort: 'custom',
    },
  });
});

const migratedV1 = () => ({ version: 3, items: withNoShops(sampleV1().items), recipes: [], sent: [], group: 'recipe', sort: 'custom' });

test('emptyState is a version 3 state with no items, no recipes and the recipe grouping', () => {
  assert.deepEqual(emptyState(), { version: 3, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom' });
});

test('load migrates a version 1 state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV1()) });
  assert.deepEqual(load(storage), migratedV1());
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson migrates a version 1 backup', () => {
  assert.deepEqual(importJson(JSON.stringify(sampleV1())), { state: migratedV1() });
});

test('load migrates a version 2 state', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV2()) });
  const { grouped, ...rest } = sampleV2();
  assert.deepEqual(load(storage), { ...rest, version: 3, items: withNoShops(sampleV2().items), group: 'recipe' });
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson reads the grouping of a version 2 backup', () => {
  const stateOf = (grouped) => importJson(JSON.stringify({ ...sampleV2(), grouped })).state;
  assert.equal(stateOf(false).group, 'none');
  [true, undefined, null, 'no', 0].forEach((value) => assert.equal(stateOf(value).group, 'recipe', String(value)));
  assert.equal('grouped' in stateOf(false), false);
});

test('importJson keeps a known group and turns any other value into the recipe grouping', () => {
  const groupOf = (group) => importJson(JSON.stringify({ ...sample(), group })).state.group;
  ['recipe', 'shop', 'none'].forEach((group) => assert.equal(groupOf(group), group));
  [undefined, null, 'aisle', 1, true].forEach((value) => assert.equal(groupOf(value), 'recipe', String(value)));
});

test('a known group wins over the old grouped field', () => {
  assert.equal(importJson(JSON.stringify({ ...sample(), group: 'shop', grouped: false })).state.group, 'shop');
});

test('importJson repairs the shops of an item', () => {
  const shopsOf = (shops) => {
    const [bread, milk] = sample().items;
    return importJson(JSON.stringify({ ...sample(), items: [{ ...bread, shops }, milk] })).state.items[0].shops;
  };
  [undefined, null, 'Lidl', 7, {}].forEach((value) => assert.deepEqual(shopsOf(value), [], String(value)));
  assert.deepEqual(shopsOf([' Lidl ', '', '  ', 7, null, 'lidl', 'Market']), ['Lidl', 'Market']);
});

test('importJson gives each shop the spelling of its first use', () => {
  const [bread, milk] = sample().items;
  const data = { ...sample(), items: [{ ...bread, shops: ['Lidl'] }, { ...milk, shops: ['market', 'LIDL'] }] };
  const { items } = importJson(JSON.stringify(data)).state;
  assert.deepEqual(items.map((item) => item.shops), [['Lidl'], ['market', 'Lidl']]);
});

test('importJson trims recipe names and products and drops unknown fields', () => {
  const data = { ...sample(), recipes: [{ id: 'r1', name: ' Omelette ', products: [' Eggs '], note: 'x' }] };
  assert.deepEqual(importJson(JSON.stringify(data)).state.recipes, [{ id: 'r1', name: 'Omelette', products: ['Eggs'], url: '' }]);
});

test('importJson accepts a recipe with no products and a recipe named as an item', () => {
  const data = { ...sample(), recipes: [{ id: 'r1', name: 'Bread', products: [] }] };
  assert.deepEqual(importJson(JSON.stringify(data)).state.recipes, [{ id: 'r1', name: 'Bread', products: [], url: '' }]);
});

test('importJson rejects invalid recipes', () => {
  const recipe = sample().recipes[0];
  const { recipes, ...withoutRecipes } = sample();
  const invalid = [
    withoutRecipes,
    { ...sample(), recipes: 'x' },
    { ...sample(), recipes: [null] },
    { ...sample(), recipes: [{ ...recipe, id: '' }] },
    { ...sample(), recipes: [{ ...recipe, name: '  ' }] },
    { ...sample(), recipes: [{ ...recipe, products: 'Eggs' }] },
    { ...sample(), recipes: [{ ...recipe, products: ['Eggs', 7] }] },
    { ...sample(), recipes: [{ ...recipe, products: ['Eggs', ' '] }] },
    { ...sample(), recipes: [{ ...recipe, products: ['Eggs', 'eggs'] }] },
    { ...sample(), recipes: [recipe, { ...recipe, name: 'Soup' }] },
    { ...sample(), recipes: [recipe, { ...recipe, id: 'r2', name: 'omelette' }] },
  ];
  invalid.forEach((data) => {
    assert.deepEqual(importJson(JSON.stringify(data)), { error: { key: 'error.notBackup' } });
  });
});

test('importJson gives an empty sent list to a version 2 state without one', () => {
  const { sent, ...withoutSent } = sample();
  assert.deepEqual(importJson(JSON.stringify(withoutSent)).state.sent, []);
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), sent: 'r1' })).state.sent, []);
});

test('importJson keeps in sent only the ids of recipes, one time each', () => {
  const recipes = [...sample().recipes, { id: 'r2', name: 'Soup', products: [] }];
  const data = { ...sample(), recipes, sent: ['r2', 'nope', 7, 'r1', 'r2', null] };
  assert.deepEqual(importJson(JSON.stringify(data)).state.sent, ['r2', 'r1']);
});

test('importJson keeps a web link of a recipe and drops any other value', () => {
  const urlOf = (url) => {
    const data = { ...sample(), recipes: [{ id: 'r1', name: 'Omelette', products: [], url }] };
    return importJson(JSON.stringify(data)).state.recipes[0].url;
  };
  assert.equal(urlOf(' https://example.com/a '), 'https://example.com/a');
  [undefined, 7, '', 'javascript:alert(1)', 'example.com', 'ftp://example.com'].forEach((url) => {
    assert.equal(urlOf(url), '', String(url));
  });
});

test('importJson keeps the name sort and turns any other value into custom', () => {
  const sortOf = (sort) => importJson(JSON.stringify({ ...sample(), sort })).state.sort;
  assert.equal(sortOf('name'), 'name');
  ['custom', 'added', undefined, null, 'price', 1, true].forEach((value) => assert.equal(sortOf(value), 'custom', String(value)));
});

test('the name sort survives save and load', () => {
  const storage = fakeStorage();
  save(storage, { ...sample(), sort: 'name' });
  assert.equal(load(storage).sort, 'name');
});

test('loadLanguage returns the stored language when it is supported', () => {
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: 'de' }), ['de', 'en']), 'de');
});

test('loadLanguage returns null for no value and for an unsupported value', () => {
  assert.equal(loadLanguage(fakeStorage(), ['de', 'en']), null);
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: 'xx' }), ['de', 'en']), null);
  assert.equal(loadLanguage(fakeStorage({ [LANGUAGE_KEY]: '' }), ['de', 'en']), null);
});

test('saveLanguage stores a language and null removes it', () => {
  const storage = fakeStorage();
  assert.equal(saveLanguage(storage, 'fr'), true);
  assert.equal(storage.getItem(LANGUAGE_KEY), 'fr');
  assert.equal(saveLanguage(storage, null), true);
  assert.equal(storage.getItem(LANGUAGE_KEY), null);
});

test('the language functions do not throw when the storage does', () => {
  assert.equal(loadLanguage(brokenStorage(), ['de']), null);
  assert.equal(saveLanguage(brokenStorage(), 'de'), false);
  assert.equal(saveLanguage(brokenStorage(), null), false);
});

test('the language is not part of the state', () => {
  const storage = fakeStorage();
  saveLanguage(storage, 'it');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});
