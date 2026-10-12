import { emptyState } from './store.js';

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

// Returns a clean state, or null when the data is not a version 1 state.
const normalizeState = (data) => {
  if (typeof data !== 'object' || data === null || data.version !== 1 || !Array.isArray(data.items)) return null;
  const items = data.items.map(normalizeItem);
  if (items.includes(null)) return null;
  const idsAreUnique = unique(items.map((item) => item.id));
  const namesAreUnique = unique(items.map((item) => item.name.toLowerCase()));
  return idsAreUnique && namesAreUnique ? { version: 1, items } : null;
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
  if (invalidJson) return { error: 'The file is not valid JSON.' };
  const state = normalizeState(data);
  return state ? { state } : { error: 'The file is not a shopping list backup.' };
};
