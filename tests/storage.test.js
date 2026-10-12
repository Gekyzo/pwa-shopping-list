import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, CORRUPT_KEY, load, save, exportJson, importJson } from '../src/storage.js';
import { emptyState } from '../src/store.js';

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

const sample = () => ({
  version: 1,
  items: [
    { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: true, again: true },
    { id: 'b', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
  ],
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
  assert.deepEqual(importJson('nope'), { error: 'The file is not valid JSON.' });
});

test('importJson rejects another version', () => {
  const text = JSON.stringify({ ...sample(), version: 2 });
  assert.deepEqual(importJson(text), { error: 'The file is not a shopping list backup.' });
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
    assert.deepEqual(importJson(JSON.stringify(data)), { error: 'The file is not a shopping list backup.' });
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
      version: 1,
      items: [
        { id: 'a', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false },
        { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: false },
      ],
    },
  });
});
