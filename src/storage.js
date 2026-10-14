import { emptyState, GROUPS, SORTS } from '#store';
import { isWebUrl } from '#recipes';
import { DAYS, MEALS } from '#menu';

export const STORAGE_KEY = 'shopping.v1';
export const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`;

const LISTS = ['active', 'next'];

const unique = (values) => new Set(values).size === values.length;

const lower = (text) => text.toLowerCase();

// `shops` only groups a view, so a bad entry is dropped and the item stays valid.
const normalizeShops = (shops) => {
  if (!Array.isArray(shops)) return [];
  const seen = new Set();
  return shops
    .filter((shop) => typeof shop === 'string')
    .map((shop) => shop.trim())
    .filter((shop) => {
      if (shop === '' || seen.has(lower(shop))) return false;
      seen.add(lower(shop));
      return true;
    });
};

const normalizeItem = (item) => {
  if (typeof item !== 'object' || item === null) return null;
  const { id, name, recurrent, list, bought, again, shops } = item;
  const valid =
    typeof id === 'string' &&
    id !== '' &&
    typeof name === 'string' &&
    name.trim() !== '' &&
    LISTS.includes(list) &&
    [recurrent, bought, again].every((flag) => typeof flag === 'boolean');
  if (!valid) return null;
  const isBought = list === 'active' && bought;
  return {
    id,
    name: name.trim(),
    recurrent,
    list,
    bought: isBought,
    again: isBought && !recurrent && again,
    shops: normalizeShops(shops),
  };
};

// Each shop gets the spelling of its first use, so that two spellings do not make two groups.
const oneSpelling = (items) => {
  const first = new Map();
  for (const item of items) for (const shop of item.shops) if (!first.has(lower(shop))) first.set(lower(shop), shop);
  return items.map((item) => ({ ...item, shops: item.shops.map((shop) => first.get(lower(shop))) }));
};

// Versions 1 and 2 have `grouped`, a boolean for the recipe grouping.
const groupOf = (data) => {
  if (GROUPS.includes(data.group)) return data.group;
  return data.grouped === false ? 'none' : 'recipe';
};

const normalizeRecipe = (recipe) => {
  if (typeof recipe !== 'object' || recipe === null) return null;
  const { id, name, products, url } = recipe;
  const valid =
    typeof id === 'string' &&
    id !== '' &&
    typeof name === 'string' &&
    name.trim() !== '' &&
    Array.isArray(products) &&
    products.every((product) => typeof product === 'string' && product.trim() !== '');
  if (!valid) return null;
  const trimmed = products.map((product) => product.trim());
  if (!unique(trimmed.map(lower))) return null;
  // The link is optional: a value that is not a web address is dropped.
  const link = typeof url === 'string' && isWebUrl(url.trim()) ? url.trim() : '';
  return { id, name: name.trim(), products: trimmed, url: link };
};

// The menu only plans a fill, so a bad entry is dropped and the state stays valid: an entry with
// no known day, meal or recipe, and the second entry of one meal. Versions 1 to 3 have no menu.
const normalizeMenu = (rawMenu, known) => {
  if (!Array.isArray(rawMenu)) return [];
  const seen = new Set();
  return rawMenu
    .filter((entry) => typeof entry === 'object' && entry !== null)
    .map(({ day, meal, recipe }) => ({ day, meal, recipe }))
    .filter(({ day, meal, recipe }) => {
      const valid = Number.isInteger(day) && day >= 0 && day < DAYS && MEALS.includes(meal) && known.has(recipe);
      const key = `${day}-${meal}`;
      if (!valid || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.day - b.day || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal));
};

const VERSIONS = [1, 2, 3, 4];

// Returns a clean version 4 state, or null when the data is not a known state.
const normalizeState = (data) => {
  if (typeof data !== 'object' || data === null || !VERSIONS.includes(data.version) || !Array.isArray(data.items)) return null;
  // Version 1 has no recipes.
  const rawRecipes = data.version === 1 ? [] : data.recipes;
  if (!Array.isArray(rawRecipes)) return null;
  const items = data.items.map(normalizeItem);
  const recipes = rawRecipes.map(normalizeRecipe);
  if (items.includes(null) || recipes.includes(null)) return null;
  const valid =
    unique(items.map((item) => item.id)) &&
    unique(items.map((item) => lower(item.name))) &&
    unique(recipes.map((recipe) => recipe.id)) &&
    unique(recipes.map((recipe) => lower(recipe.name)));
  if (!valid) return null;
  // `sent` only groups the Active view, so a bad entry is dropped and the state stays valid.
  const known = new Set(recipes.map((recipe) => recipe.id));
  const rawSent = Array.isArray(data.sent) ? data.sent : [];
  const sent = [...new Set(rawSent.filter((id) => typeof id === 'string' && known.has(id)))];
  return {
    version: 4,
    items: oneSpelling(items),
    recipes,
    sent,
    group: groupOf(data),
    sort: SORTS.includes(data.sort) ? data.sort : 'custom',
    menu: normalizeMenu(data.menu, known),
  };
};

const parse = (text) => {
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { invalidJson: true };
  }
};

export const load = (storage) => {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null) return emptyState();
    const state = normalizeState(parse(text).data);
    if (state) return state;
    storage.setItem(CORRUPT_KEY, text);
  } catch {
    // Storage is not available: the app works in memory.
  }
  return emptyState();
};

export const save = (storage, state) => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

export const exportJson = (state) => JSON.stringify(state, null, 2);

export const importJson = (text) => {
  const { data, invalidJson } = parse(text);
  if (invalidJson) return { error: { key: 'error.invalidJson' } };
  const state = normalizeState(data);
  return state ? { state } : { error: { key: 'error.notBackup' } };
};

// The language that the user chose. It is a preference of the device, not a part of the state.
export const LANGUAGE_KEY = 'shopping.lang';

// The stored language when it is one of `supported`, else null: the app follows the phone.
export const loadLanguage = (storage, supported) => {
  try {
    const lang = storage.getItem(LANGUAGE_KEY);
    return supported.includes(lang) ? lang : null;
  } catch {
    return null;
  }
};

// `null` removes the choice.
export const saveLanguage = (storage, lang) => {
  try {
    if (lang === null) storage.removeItem(LANGUAGE_KEY);
    else storage.setItem(LANGUAGE_KEY, lang);
    return true;
  } catch {
    return false;
  }
};

// The hand that the user holds the phone with. It is a preference of the device, as the language is.
export const HAND_KEY = 'shopping.hand';

// The stored hand when it is `left`, else `right`.
export const loadHand = (storage) => {
  try {
    return storage.getItem(HAND_KEY) === 'left' ? 'left' : 'right';
  } catch {
    return 'right';
  }
};

// `right` is the hand of an app with no choice: it removes the key.
export const saveHand = (storage, hand) => {
  try {
    if (hand === 'left') storage.setItem(HAND_KEY, 'left');
    else storage.removeItem(HAND_KEY);
    return true;
  } catch {
    return false;
  }
};

// Set after the walkthrough of the first start closed. It is a preference of the device, as the
// hand is.
export const ONBOARDED_KEY = 'shopping.onboarded';

// A storage that cannot be read counts as seen, so the walkthrough does not show at each start.
export const loadOnboarded = (storage) => {
  try {
    return storage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true;
  }
};

export const saveOnboarded = (storage) => {
  try {
    storage.setItem(ONBOARDED_KEY, '1');
    return true;
  } catch {
    return false;
  }
};

// True when the storage holds a state, valid or not: the install is not new.
export const hasStoredState = (storage) => {
  try {
    return storage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};
