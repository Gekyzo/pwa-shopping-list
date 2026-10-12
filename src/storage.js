import { emptyState } from './store.js';
import { isWebUrl } from './recipes.js';

export const STORAGE_KEY = 'shopping.v1';
export const CORRUPT_KEY = `${STORAGE_KEY}.corrupt`;

const LISTS = ['active', 'next'];

const normalizeItem = (item) => {
  if (typeof item !== 'object' || item === null) return null;
  const { id, name, recurrent, list, bought, again } = item;
  const valid =
    typeof id === 'string' &&
    id !== '' &&
    typeof name === 'string' &&
    name.trim() !== '' &&
    LISTS.includes(list) &&
    [recurrent, bought, again].every((flag) => typeof flag === 'boolean');
  if (!valid) return null;
  const isBought = list === 'active' && bought;
  return { id, name: name.trim(), recurrent, list, bought: isBought, again: isBought && !recurrent && again };
};

const unique = (values) => new Set(values).size === values.length;

const lower = (text) => text.toLowerCase();

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

const VERSIONS = [1, 2];

// Returns a clean version 2 state, or null when the data is not a known state.
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
  return { version: 2, items, recipes, sent, grouped: data.grouped !== false };
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
  if (invalidJson) return { error: 'El archivo no es un JSON válido.' };
  const state = normalizeState(data);
  return state ? { state } : { error: 'El archivo no es una copia de seguridad de la lista.' };
};
