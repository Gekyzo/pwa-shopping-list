import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  CORRUPT_KEY,
  LANGUAGE_KEY,
  HAND_KEY,
  SHOP_LISTS_KEY,
  load,
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
  THEME_KEY,
  loadTheme,
  saveTheme,
  MODULES_KEY,
  loadModules,
  saveModules,
  ONBOARDED_KEY,
  loadOnboarded,
  saveOnboarded,
  hasStoredState,
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
  return {
    ...rest,
    version: 5,
    items: [{ ...bread, shops: ['Lidl', 'Market'], quantity: '2' }, { ...milk, shops: [], quantity: '' }],
    group: 'shop',
    menu: [{ day: 0, meal: 'lunch', recipe: 'r1' }],
  };
};

// A version 3 state has no menu.
const sampleV3 = () => {
  const { menu, ...rest } = sample();
  return { ...rest, version: 3 };
};

// The items of an old state, as a version 5 state has them.
const withNoShops = (items) => items.map((item) => ({ ...item, shops: [], quantity: '' }));

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
  const text = JSON.stringify({ ...sample(), version: 6 });
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
      version: 5,
      items: [
        { id: 'a', name: 'Milk', recurrent: true, list: 'next', bought: false, again: false, shops: [], quantity: '' },
        { id: 'b', name: 'Soap', recurrent: false, list: 'active', bought: false, again: false, shops: [], quantity: '' },
      ],
      recipes: [],
      sent: [],
      group: 'recipe',
      sort: 'custom',
      menu: [],
    },
  });
});

const migratedV1 = () => ({
  version: 5,
  items: withNoShops(sampleV1().items),
  recipes: [],
  sent: [],
  group: 'recipe',
  sort: 'custom',
  menu: [],
});

test('emptyState is a version 5 state with no items, no recipes, no menu and the recipe grouping', () => {
  assert.deepEqual(emptyState(), { version: 5, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [] });
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
  assert.deepEqual(load(storage), { ...rest, version: 5, items: withNoShops(sampleV2().items), group: 'recipe', menu: [] });
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

test('importJson gives an empty menu to a version 4 state without a menu list', () => {
  assert.deepEqual(importJson(JSON.stringify({ ...sample(), menu: 'x' })).state.menu, []);
  const { menu, ...withoutMenu } = sample();
  assert.deepEqual(importJson(JSON.stringify(withoutMenu)).state.menu, []);
});

test('loadModules returns the stored ids in the order of MODULES', () => {
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '["recipes","next"]' })), ['next', 'recipes']);
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '["next"]' })), ['next']);
});

test('loadModules returns no module off for no value, bad JSON, a value that is not a list and unknown ids', () => {
  assert.deepEqual(loadModules(fakeStorage()), []);
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '{' })), []);
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '"next"' })), []);
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '{"next":true}' })), []);
  assert.deepEqual(loadModules(fakeStorage({ [MODULES_KEY]: '["shops",1,null]' })), []);
});

test('saveModules stores the ids and an empty list removes the key', () => {
  const storage = fakeStorage();
  assert.equal(saveModules(storage, ['next', 'recipes']), true);
  assert.equal(storage.getItem(MODULES_KEY), '["next","recipes"]');
  assert.equal(saveModules(storage, []), true);
  assert.equal(storage.getItem(MODULES_KEY), null);
});

test('saveModules keeps only known ids', () => {
  const storage = fakeStorage();
  assert.equal(saveModules(storage, ['shops', 'recipes']), true);
  assert.equal(storage.getItem(MODULES_KEY), '["recipes"]');
});

test('the module functions do not throw when the storage does', () => {
  assert.deepEqual(loadModules(brokenStorage()), []);
  assert.equal(saveModules(brokenStorage(), ['next']), false);
  assert.equal(saveModules(brokenStorage(), []), false);
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
