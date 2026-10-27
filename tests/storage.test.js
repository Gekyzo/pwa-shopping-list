import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  HAND_KEY,
  SHOP_LISTS_KEY,
  TRIP_END_KEY,
  TWIN_REACH_KEY,
  load,
  loadState,
  save,
  exportJson,
  exportFilename,
  importJson,
  loadLanguage,
  saveLanguage,
  loadHand,
  saveHand,
  loadShopLists,
  saveShopLists,
  loadTripEnd,
  loadTwinReach,
  saveTwinReach,
  saveTripEnd,
  THEME_KEY,
  loadTheme,
  saveTheme,
  DENSITY_KEY,
  loadDensity,
  saveDensity,
  ONBOARDED_KEY,
  loadOnboarded,
  saveOnboarded,
  hasStoredState,
  SWIPE_HINT_KEY,
  SESSION_KEY,
  SYNC_KEY,
  QUEUE_KEY,
  BEFORE_LOGIN_KEY,
  SHARED_STORAGE_KEY,
  SHARED_SYNC_KEY,
  SHARED_QUEUE_KEY,
  loadSwipeHint,
  saveSwipeHint,
  SEEN_VERSION_KEY,
  loadSeen,
  saveSeen,
  APP_KEYS,
  OFFLINE_KEY,
  resetAll,
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
  return {
    ...rest,
    version: 9,
    items: [
      { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: true, shops: ['Lidl', 'Market'], quantity: '2', aisle: 'Bakery' },
      { id: 'b', name: 'Milk', recurrent: true, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
    ],
    group: 'shop',
    menu: [{ day: 0, meal: 'lunch', recipe: 'r1' }],
    aisles: ['Bakery', 'Dairy'],
  };
};

// A version 3 state has no menu.
const sampleV3 = () => {
  const { menu, ...rest } = sample();
  return { ...rest, version: 3 };
};

// The items of sampleV1 and sampleV2, as a version 9 state has them: the item of Next and the
// ticked item with again are both in Actual, not ticked, with no again field.
const migratedItems = () => [
  { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
  { id: 'b', name: 'Milk', recurrent: true, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
];

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

test('loadState says when the start fell back to the empty state from a stored state that cannot be read (ACC-1)', () => {
  assert.deepEqual(loadState(fakeStorage({ [STORAGE_KEY]: '{not json' })), { state: emptyState(), lost: true });
  assert.deepEqual(loadState(fakeStorage()), { state: emptyState(), lost: false });
  const storage = fakeStorage();
  save(storage, sample());
  assert.deepEqual(loadState(storage), { state: sample(), lost: false });
});

test('load and save survive a storage that throws', () => {
  assert.deepEqual(load(brokenStorage()), emptyState());
  assert.equal(save(brokenStorage(), sample()), false);
});

test('exportFilename names the file with the local date and time', () => {
  assert.equal(exportFilename(new Date(2026, 9, 14, 9, 5, 7)), 'compra-2026-10-14-090507.json');
});

test('exportFilename gives two exports of one day different names', () => {
  const morning = exportFilename(new Date(2026, 0, 2, 8, 0, 0));
  const evening = exportFilename(new Date(2026, 0, 2, 23, 59, 59));
  assert.equal(morning, 'compra-2026-01-02-080000.json');
  assert.equal(evening, 'compra-2026-01-02-235959.json');
});

test('exportJson then importJson returns the same state', () => {
  assert.deepEqual(importJson(exportJson(sample())), { state: sample() });
});

test('importJson rejects text that is not JSON', () => {
  assert.deepEqual(importJson('nope'), { error: { key: 'error.invalidJson' } });
});

test('importJson rejects an unknown version', () => {
  const text = JSON.stringify({ ...sample(), version: 10 });
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

test('importJson drops unknown fields, moves Next to Actual and drops again', () => {
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
      version: 9,
      items: [
        { id: 'a', name: 'Milk', recurrent: true, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
        { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
      ],
      recipes: [],
      sent: [],
      group: 'recipe',
      sort: 'custom',
      menu: [],
      aisles: [],
    },
  });
});

const migratedV1 = () => ({
  version: 9,
  items: migratedItems(),
  recipes: [],
  sent: [],
  group: 'recipe',
  sort: 'custom',
  menu: [],
  aisles: [],
});

test('emptyState is a version 9 state with no items, no recipes, no menu and the recipe grouping', () => {
  assert.deepEqual(emptyState(), { version: 9, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [], aisles: [] });
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
  assert.deepEqual(load(storage), { ...rest, version: 9, items: migratedItems(), group: 'recipe', menu: [], aisles: [] });
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
  ['recipe', 'shop', 'aisle', 'none'].forEach((group) => assert.equal(groupOf(group), group));
  [undefined, null, 'floor', 1, true].forEach((value) => assert.equal(groupOf(value), 'recipe', String(value)));
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

test('loadHand returns the stored hand', () => {
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'left' })), 'left');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'right' })), 'right');
});

test('loadHand returns right for no value and for an unknown value', () => {
  assert.equal(loadHand(fakeStorage()), 'right');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: 'both' })), 'right');
  assert.equal(loadHand(fakeStorage({ [HAND_KEY]: '' })), 'right');
});

test('saveHand stores left and right removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveHand(storage, 'left'), true);
  assert.equal(storage.getItem(HAND_KEY), 'left');
  assert.equal(saveHand(storage, 'right'), true);
  assert.equal(storage.getItem(HAND_KEY), null);
});

test('the hand functions do not throw when the storage does', () => {
  assert.equal(loadHand(brokenStorage()), 'right');
  assert.equal(saveHand(brokenStorage(), 'left'), false);
  assert.equal(saveHand(brokenStorage(), 'right'), false);
});

test('the hand is not part of the state', () => {
  const storage = fakeStorage();
  saveHand(storage, 'left');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadTripEnd returns save when stored and keep for no value and an unknown value', () => {
  assert.equal(loadTripEnd(fakeStorage({ [TRIP_END_KEY]: 'save' })), 'save');
  assert.equal(loadTripEnd(fakeStorage()), 'keep');
  assert.equal(loadTripEnd(fakeStorage({ [TRIP_END_KEY]: 'keep' })), 'keep');
  assert.equal(loadTripEnd(fakeStorage({ [TRIP_END_KEY]: 'other' })), 'keep');
});

test('saveTripEnd stores save and keep removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveTripEnd(storage, 'save'), true);
  assert.equal(storage.getItem(TRIP_END_KEY), 'save');
  assert.equal(saveTripEnd(storage, 'keep'), true);
  assert.equal(storage.getItem(TRIP_END_KEY), null);
  assert.equal(saveTripEnd(storage, 'other'), true);
  assert.equal(storage.getItem(TRIP_END_KEY), null);
});

test('loadTwinReach returns both when stored and own for no value and an unknown value', () => {
  assert.equal(TWIN_REACH_KEY, 'shopping.twinReach');
  assert.equal(loadTwinReach(fakeStorage({ [TWIN_REACH_KEY]: 'both' })), 'both');
  assert.equal(loadTwinReach(fakeStorage()), 'own');
  assert.equal(loadTwinReach(fakeStorage({ [TWIN_REACH_KEY]: 'own' })), 'own');
  assert.equal(loadTwinReach(fakeStorage({ [TWIN_REACH_KEY]: 'other' })), 'own');
});

test('saveTwinReach stores both and own removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveTwinReach(storage, 'both'), true);
  assert.equal(storage.getItem(TWIN_REACH_KEY), 'both');
  assert.equal(saveTwinReach(storage, 'own'), true);
  assert.equal(storage.getItem(TWIN_REACH_KEY), null);
  assert.equal(saveTwinReach(storage, 'other'), true);
  assert.equal(storage.getItem(TWIN_REACH_KEY), null);
});

test('the trip end save survives a save and a load, and keep goes back to the default', () => {
  const storage = fakeStorage();
  assert.equal(loadTripEnd(storage), 'keep');
  saveTripEnd(storage, 'save');
  assert.equal(loadTripEnd(storage), 'save');
  saveTripEnd(storage, 'keep');
  assert.equal(loadTripEnd(storage), 'keep');
});

test('the trip end functions do not throw when the storage does', () => {
  assert.equal(loadTripEnd(brokenStorage()), 'keep');
  assert.equal(saveTripEnd(brokenStorage(), 'keep'), false);
  assert.equal(saveTripEnd(brokenStorage(), 'save'), false);
});

test('the trip end is not part of the state', () => {
  const storage = fakeStorage();
  saveTripEnd(storage, 'save');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadShopLists returns hide when stored and show for no value and an unknown value', () => {
  assert.equal(loadShopLists(fakeStorage({ [SHOP_LISTS_KEY]: 'hide' })), 'hide');
  assert.equal(loadShopLists(fakeStorage()), 'show');
  assert.equal(loadShopLists(fakeStorage({ [SHOP_LISTS_KEY]: 'off' })), 'show');
});

test('saveShopLists stores hide and show removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveShopLists(storage, 'hide'), true);
  assert.equal(storage.getItem(SHOP_LISTS_KEY), 'hide');
  assert.equal(saveShopLists(storage, 'show'), true);
  assert.equal(storage.getItem(SHOP_LISTS_KEY), null);
});

test('the shop list functions do not throw when the storage does, and are not part of the state', () => {
  assert.equal(loadShopLists(brokenStorage()), 'show');
  assert.equal(saveShopLists(brokenStorage(), 'hide'), false);
  const storage = fakeStorage();
  saveShopLists(storage, 'hide');
  assert.deepEqual(load(storage), emptyState());
});

test('loadTheme returns the stored theme', () => {
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'light' })), 'light');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'dark' })), 'dark');
});

test('loadTheme returns system for no value and for an unknown value', () => {
  assert.equal(loadTheme(fakeStorage()), 'system');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: 'blue' })), 'system');
  assert.equal(loadTheme(fakeStorage({ [THEME_KEY]: '' })), 'system');
});

test('saveTheme stores light and dark and system removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveTheme(storage, 'dark'), true);
  assert.equal(storage.getItem(THEME_KEY), 'dark');
  assert.equal(saveTheme(storage, 'light'), true);
  assert.equal(storage.getItem(THEME_KEY), 'light');
  assert.equal(saveTheme(storage, 'system'), true);
  assert.equal(storage.getItem(THEME_KEY), null);
});

test('saveTheme removes the key for an unknown theme', () => {
  const storage = fakeStorage({ [THEME_KEY]: 'dark' });
  assert.equal(saveTheme(storage, 'blue'), true);
  assert.equal(storage.getItem(THEME_KEY), null);
});

test('the theme functions do not throw when the storage does', () => {
  assert.equal(loadTheme(brokenStorage()), 'system');
  assert.equal(saveTheme(brokenStorage(), 'dark'), false);
  assert.equal(saveTheme(brokenStorage(), 'system'), false);
});

test('the theme is not part of the state', () => {
  const storage = fakeStorage();
  saveTheme(storage, 'dark');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadDensity returns compact when it is stored', () => {
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: 'compact' })), 'compact');
});

test('loadDensity returns normal for no value and for an unknown value', () => {
  assert.equal(loadDensity(fakeStorage()), 'normal');
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: 'tiny' })), 'normal');
  assert.equal(loadDensity(fakeStorage({ [DENSITY_KEY]: '' })), 'normal');
});

test('saveDensity stores compact and normal removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveDensity(storage, 'compact'), true);
  assert.equal(storage.getItem(DENSITY_KEY), 'compact');
  assert.equal(saveDensity(storage, 'normal'), true);
  assert.equal(storage.getItem(DENSITY_KEY), null);
});

test('saveDensity removes the key for an unknown density', () => {
  const storage = fakeStorage({ [DENSITY_KEY]: 'compact' });
  assert.equal(saveDensity(storage, 'tiny'), true);
  assert.equal(storage.getItem(DENSITY_KEY), null);
});

test('the density functions do not throw when the storage does', () => {
  assert.equal(loadDensity(brokenStorage()), 'normal');
  assert.equal(saveDensity(brokenStorage(), 'compact'), false);
  assert.equal(saveDensity(brokenStorage(), 'normal'), false);
});

test('the density is not part of the state', () => {
  const storage = fakeStorage();
  saveDensity(storage, 'compact');
  assert.deepEqual(load(storage), emptyState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('loadOnboarded is true when the flag is stored', () => {
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: '1' })), true);
});

test('loadOnboarded is false for no value and for another value', () => {
  assert.equal(loadOnboarded(fakeStorage()), false);
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: '' })), false);
  assert.equal(loadOnboarded(fakeStorage({ [ONBOARDED_KEY]: 'true' })), false);
});

test('loadOnboarded is true for a storage that throws', () => {
  assert.equal(loadOnboarded(brokenStorage()), true);
});

test('saveOnboarded stores the flag', () => {
  const storage = fakeStorage();
  assert.equal(saveOnboarded(storage), true);
  assert.equal(storage.getItem(ONBOARDED_KEY), '1');
  assert.equal(loadOnboarded(storage), true);
});

test('saveOnboarded is false for a storage that throws', () => {
  assert.equal(saveOnboarded(brokenStorage()), false);
});

test('hasStoredState is true for a stored state', () => {
  const storage = fakeStorage();
  save(storage, emptyState());
  assert.equal(hasStoredState(storage), true);
});

test('hasStoredState is true for a stored text that is not a valid state', () => {
  assert.equal(hasStoredState(fakeStorage({ [STORAGE_KEY]: 'not json' })), true);
});

test('hasStoredState is false for no stored state and for a storage that throws', () => {
  assert.equal(hasStoredState(fakeStorage()), false);
  assert.equal(hasStoredState(fakeStorage({ [ONBOARDED_KEY]: '1' })), false);
  assert.equal(hasStoredState(brokenStorage()), false);
});

test('the flag of the walkthrough is not part of the stored state', () => {
  const storage = fakeStorage();
  saveOnboarded(storage);
  assert.deepEqual(load(storage), emptyState());
  assert.equal(exportJson(load(storage)).includes('onboarded'), false);
});

test('load migrates a version 3 state with an empty menu', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(sampleV3()) });
  assert.deepEqual(load(storage), { ...sample(), menu: [] });
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('importJson migrates a version 3 backup with an empty menu', () => {
  assert.deepEqual(importJson(JSON.stringify(sampleV3())).state, { ...sample(), menu: [] });
});

test('importJson keeps the valid meals of the menu in day and meal order and drops the others', () => {
  const recipes = [...sample().recipes, { id: 'r2', name: 'Flan', products: [], url: '' }];
  const menu = [
    { day: 3, meal: 'dinner', recipe: 'r2' },
    { day: 3, meal: 'lunch', recipe: 'r1' },
    { day: 3, meal: 'dinner', recipe: 'r1' },
    { day: 7, meal: 'lunch', recipe: 'r1' },
    { day: 1.5, meal: 'lunch', recipe: 'r1' },
    { day: '1', meal: 'lunch', recipe: 'r1' },
    { day: 2, meal: 'breakfast', recipe: 'r1' },
    { day: 2, meal: 'lunch', recipe: 'nope' },
    null,
    'x',
    { day: 0, meal: 'dinner', recipe: 'r1', extra: true },
  ];
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), recipes, menu })).state.menu, [
    { day: 0, meal: 'dinner', recipe: 'r1' },
    { day: 3, meal: 'lunch', recipe: 'r1' },
    { day: 3, meal: 'dinner', recipe: 'r2' },
  ]);
});

test('importJson keeps a dish of the menu and drops a bad one', () => {
  const menu = [
    { day: 1, meal: 'lunch', dish: '  Paella ' },
    { day: 1, meal: 'dinner', dish: '   ' },
    { day: 2, meal: 'lunch', dish: 7 },
    { day: 2, meal: 'dinner', dish: 'Gazpacho', recipe: 'r1' },
    { day: 3, meal: 'lunch', dish: 'x'.repeat(81) },
    { day: 4, meal: 'lunch', dish: 'Pisto', extra: true },
  ];
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), menu })).state.menu, [
    { day: 1, meal: 'lunch', dish: 'Paella' },
    { day: 4, meal: 'lunch', dish: 'Pisto' },
  ]);
});

test('load reads a version 8 state and keeps its menu', () => {
  const v8 = { ...sample(), version: 8 };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v8) })), sample());
});

test('importJson gives an empty menu to a version 4 state without a menu list', () => {
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), menu: 'x' })).state.menu, []);
  const { menu, ...withoutMenu } = sample();
  assert.deepEqual(importJson(JSON.stringify(withoutMenu)).state.menu, []);
});

test('load migrates a version 4 state with no quantity on each item', () => {
  const { items, ...rest } = sample();
  const v4 = { ...rest, version: 4, items: items.map(({ quantity, ...item }) => item) };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v4) })), {
    ...sample(),
    items: sample().items.map((item) => ({ ...item, quantity: '' })),
  });
});

test('importJson trims a quantity and reads a quantity that is not text as none', () => {
  const quantityOf = (quantity) => importJson(JSON.stringify({ ...sample(), items: [{ ...sample().items[0], quantity }] })).state.items[0].quantity;
  assert.equal(quantityOf(' 2 kg '), '2 kg');
  [2, null, undefined, ['2'], {}].forEach((value) => assert.equal(quantityOf(value), '', String(value)));
});

test('load migrates a version 5 state with no change of its items', () => {
  const v5 = { ...sample(), version: 5 };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v5) })), sample());
});

test('a saved item survives a save and a load, never ticked', () => {
  const [bread, milk] = sample().items;
  const state = { ...sample(), items: [{ ...bread, list: 'saved', bought: false }, milk] };
  const storage = fakeStorage();
  save(storage, state);
  assert.deepEqual(load(storage), state);
  const ticked = { ...state, items: [{ ...state.items[0], bought: true }, milk] };
  assert.deepEqual(importJson(JSON.stringify(ticked)).state.items[0], state.items[0]);
});

test('load migrates a version 6 state with no aisles', () => {
  const { aisles, items, ...rest } = sample();
  const v6 = { ...rest, version: 6, items: items.map(({ aisle, ...item }) => item) };
  assert.deepEqual(load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(v6) })), {
    ...sample(),
    aisles: [],
    items: sample().items.map((item) => ({ ...item, aisle: '' })),
  });
});

test('importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate', () => {
  const aisles = [' Bakery ', 3, '', 'bakery', 'Dairy', null];
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), aisles })).state.aisles, ['Bakery', 'Dairy']);
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), aisles: 'Bakery' })).state.aisles, []);
});

test('importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles', () => {
  const aisleOf = (aisle) => importJson(JSON.stringify({ ...sample(), items: [{ ...sample().items[0], aisle }] })).state.items[0].aisle;
  assert.equal(aisleOf(' bakery '), 'Bakery');
  [' ', 'Frozen', 3, null, undefined].forEach((value) => assert.equal(aisleOf(value), '', String(value)));
});

test('load migrates a version 7 state with an item of Next and a ticked item with again', () => {
  const { items, ...rest } = sample();
  const v7 = {
    ...rest,
    version: 7,
    items: [
      { id: 'a', name: 'Bread', recurrent: false, list: 'next', bought: false, again: false, shops: [], quantity: '', aisle: '' },
      { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: true, again: true, shops: [], quantity: '', aisle: '' },
      { id: 'c', name: 'Salt', recurrent: false, list: 'active', bought: true, again: false, shops: [], quantity: '', aisle: '' },
      { id: 'd', name: 'Rice', recurrent: false, list: 'saved', bought: false, again: false, shops: [], quantity: '', aisle: '' },
    ],
  };
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(v7) });
  const state = load(storage);
  assert.equal(state.version, 9);
  assert.deepEqual(state.items, [
    { id: 'a', name: 'Bread', recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
    { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, shops: [], quantity: '', aisle: '' },
    { id: 'c', name: 'Salt', recurrent: false, list: 'active', bought: true, shops: [], quantity: '', aisle: '' },
    { id: 'd', name: 'Rice', recurrent: false, list: 'saved', bought: false, shops: [], quantity: '', aisle: '' },
  ]);
  state.items.forEach((item) => assert.equal('again' in item, false, item.name));
  assert.equal(storage.getItem(CORRUPT_KEY), null);
});

test('a ticked recurrent item with again keeps its tick when a version 7 state loads', () => {
  const v7 = { ...sample(), version: 7, items: [{ ...sample().items[1], bought: true, again: true }] };
  const [item] = importJson(JSON.stringify(v7)).state.items;
  assert.equal(item.bought, true);
  assert.equal('again' in item, false);
});

test('importJson accepts an item with no again field and rejects again that is not a boolean', () => {
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), version: 7 })), { state: sample() });
  const bad = { ...sample(), version: 7, items: [{ ...sample().items[0], again: 'yes' }] };
  assert.deepEqual(importJson(JSON.stringify(bad)), { error: { key: 'error.notBackup' } });
});

test('save writes a version 9 state with no again field', () => {
  const storage = fakeStorage();
  save(storage, sample());
  const stored = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(stored.version, 9);
  assert.equal(stored.items.some((item) => 'again' in item), false);
});

test('loadSwipeHint is false when no hint was shown', () => {
  assert.equal(loadSwipeHint(fakeStorage()), false);
});

test('saveSwipeHint stores the hint, and loadSwipeHint then reads it as shown', () => {
  const storage = fakeStorage();
  assert.equal(saveSwipeHint(storage), true);
  assert.equal(storage.getItem(SWIPE_HINT_KEY), '1');
  assert.equal(loadSwipeHint(storage), true);
});

test('loadSwipeHint is false for another value', () => {
  assert.equal(loadSwipeHint(fakeStorage({ [SWIPE_HINT_KEY]: 'true' })), false);
});

test('loadSwipeHint is false and saveSwipeHint fails for a storage that throws', () => {
  assert.equal(loadSwipeHint(brokenStorage()), false);
  assert.equal(saveSwipeHint(brokenStorage()), false);
});

test('resetAll removes every key of the app and keeps the keys of other apps', () => {
  const storage = fakeStorage({
    ...Object.fromEntries(APP_KEYS.map((key) => [key, '1'])),
    'other.key': 'kept',
  });
  assert.equal(resetAll(storage), true);
  for (const key of APP_KEYS) assert.equal(storage.getItem(key), null, key);
  assert.equal(storage.getItem('other.key'), 'kept');
});

test('APP_KEYS holds the state, its corrupt copy and each preference of the device', () => {
  const keys = [STORAGE_KEY, CORRUPT_KEY, LANGUAGE_KEY, HAND_KEY, SHOP_LISTS_KEY, TRIP_END_KEY, TWIN_REACH_KEY, THEME_KEY, DENSITY_KEY, ONBOARDED_KEY, SWIPE_HINT_KEY, SEEN_VERSION_KEY, SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY, OFFLINE_KEY];
  assert.equal(OFFLINE_KEY, 'shopping.offline');
  assert.deepEqual([...APP_KEYS].sort(), [...keys].sort());
});

test('after resetAll the install counts as new', () => {
  const storage = fakeStorage();
  save(storage, sample());
  saveOnboarded(storage);
  resetAll(storage);
  assert.equal(hasStoredState(storage), false);
  assert.equal(loadOnboarded(storage), false);
  assert.deepEqual(load(storage), emptyState());
});

test('resetAll fails for a storage that throws', () => {
  assert.equal(resetAll(brokenStorage()), false);
});

test('SEEN_VERSION_KEY is a key of the app', () => {
  assert.equal(SEEN_VERSION_KEY, 'shopping.seen-version');
});

test('loadSeen gives the stored version, and null when there is none or the storage throws', () => {
  assert.equal(loadSeen(fakeStorage({ [SEEN_VERSION_KEY]: '1.2.3' })), '1.2.3');
  assert.equal(loadSeen(fakeStorage()), null);
  assert.equal(loadSeen(brokenStorage()), null);
});

test('saveSeen stores the version, and is false for a storage that throws', () => {
  const storage = fakeStorage();
  assert.equal(saveSeen(storage, '1.2.3'), true);
  assert.equal(loadSeen(storage), '1.2.3');
  assert.equal(saveSeen(brokenStorage(), '1.2.3'), false);
});
