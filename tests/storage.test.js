import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, CORRUPT_KEY, load, save, exportJson, importJson } from '#storage';
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
});

const sampleV1 = () => ({
  version: 1,
  items: [
    { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: true, again: true },
    { id: 'b', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
  ],
});

const sample = () => ({
  ...sampleV1(),
  version: 2,
  recipes: [{ id: 'r1', name: 'Omelette', products: ['Eggs', 'Potatoes'], url: 'https://example.com/omelette' }],
  sent: ['r1'],
  grouped: true,
  sort: 'custom',
});

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
  assert.deepEqual(importJson('nope'), { error: 'El archivo no es un JSON válido.' });
});

test('importJson rejects an unknown version', () => {
  const text = JSON.stringify({ ...sample(), version: 3 });
  assert.deepEqual(importJson(text), { error: 'El archivo no es una copia de seguridad de la lista.' });
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
    assert.deepEqual(importJson(JSON.stringify(data)), { error: 'El archivo no es una copia de seguridad de la lista.' });
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
      version: 2,
      items: [
        { id: 'a', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
        { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: false },
      ],
      recipes: [],
      sent: [],
      grouped: true,
      sort: 'custom',
    },
  });
});

test('emptyState is a version 2 state with no recipes and no sent recipe', () => {
  assert.deepEqual(emptyState(), { version: 2, items: [], recipes: [], sent: [], grouped: true, sort: 'custom' });
});

test('load migrates a version 1 state and adds an empty recipe list', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV1()) });
  assert.deepEqual(load(storage), { ...sampleV1(), version: 2, recipes: [], sent: [], grouped: true, sort: 'custom' });
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson migrates a version 1 backup', () => {
  assert.deepEqual(importJson(JSON.stringify(sampleV1())), { state: { ...sampleV1(), version: 2, recipes: [], sent: [], grouped: true, sort: 'custom' } });
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
    assert.deepEqual(importJson(JSON.stringify(data)), { error: 'El archivo no es una copia de seguridad de la lista.' });
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

test('importJson keeps a grouping that is off and turns any other value on', () => {
  const groupedOf = (grouped) => importJson(JSON.stringify({ ...sample(), grouped })).state.grouped;
  assert.equal(groupedOf(false), false);
  [true, undefined, null, 'no', 0].forEach((value) => assert.equal(groupedOf(value), true, String(value)));
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
