const LISTS = ['active', 'next'];
const LIST_LABELS = { active: 'Actual', next: 'Próxima' };

export const emptyState = () => ({ version: 1, items: [] });

const reject = (state, error) => ({ state, error });

const findItem = (state, id) => state.items.find((item) => item.id === id);

const patchItem = (state, id, patch) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return 'Escribe un nombre.';
  const key = name.toLowerCase();
  const duplicate = state.items.find((item) => item.id !== ownId && item.name.toLowerCase() === key);
  return duplicate ? `"${duplicate.name}" ya está en ${LIST_LABELS[duplicate.list]}.` : null;
};

const inNextView = (item) => item.list === 'next' || (item.bought && (item.recurrent || item.again));

export const addItem = (state, rawName, list, newId = () => crypto.randomUUID()) => {
  if (!LISTS.includes(list)) return reject(state, 'Lista desconocida.');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, error);
  const item = { id: newId(), name, recurrent: list === 'next', list, bought: false, again: false };
  return { state: { ...state, items: [...state.items, item] } };
};

export const renameItem = (state, id, rawName) => {
  if (!findItem(state, id)) return reject(state, 'Artículo no encontrado.');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, error) : patchItem(state, id, { name });
};

export const toggleRecurrent = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  return patchItem(state, id, { recurrent: !item.recurrent, again: false });
};

export const toggleBought = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  if (item.list !== 'active') return reject(state, 'Solo se pueden marcar los artículos de Actual.');
  return patchItem(state, id, { bought: !item.bought, again: false });
};

export const toggleAgain = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  if (!item.bought) return reject(state, 'Marca primero el artículo.');
  if (item.recurrent) return reject(state, 'Un artículo recurrente ya está en Próxima.');
  return patchItem(state, id, { again: !item.again });
};

export const deleteItem = (state, id) => {
  if (!findItem(state, id)) return reject(state, 'Artículo no encontrado.');
  return { state: { ...state, items: state.items.filter((item) => item.id !== id) } };
};

export const moveItem = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  const list = item.list === 'active' ? 'next' : 'active';
  return patchItem(state, id, { list, bought: false, again: false });
};

export const removeFromNext = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  if (!inNextView(item)) return reject(state, 'El artículo no está en Próxima.');
  if (item.list === 'next') return deleteItem(state, id);
  return patchItem(state, id, { recurrent: false, again: false });
};

export const canStartNewShopping = (state) => state.items.some((item) => item.bought || item.list === 'next');

export const startNewShopping = (state) => {
  if (!canStartNewShopping(state)) return reject(state, 'Nada que empezar: marca un artículo o añade uno a Próxima.');
  const items = state.items
    .filter((item) => !item.bought || item.recurrent || item.again)
    .map((item) => ({ ...item, list: 'active', bought: false, again: false }));
  return { state: { ...state, items } };
};

export const activeItems = (state) => {
  const active = state.items.filter((item) => item.list === 'active');
  return [...active.filter((item) => !item.bought), ...active.filter((item) => item.bought)];
};

export const nextItems = (state) => [
  ...state.items.filter((item) => item.list === 'next'),
  ...state.items.filter((item) => item.list === 'active' && inNextView(item)),
];

const fold = (text) =>
  String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

// The item that a new name would duplicate.
export const findByName = (state, rawName) => {
  const key = String(rawName ?? '').trim().toLowerCase();
  return key ? state.items.find((item) => item.name.toLowerCase() === key) : undefined;
};

// Items whose name contains the query: exact match first, then prefix matches.
export const searchItems = (state, query, limit = 5) => {
  const key = fold(query);
  if (!key) return [];
  const rank = (item) => {
    const name = fold(item.name);
    if (name === key) return 0;
    return name.startsWith(key) ? 1 : 2;
  };
  return state.items
    .filter((item) => fold(item.name).includes(key))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
};

// Makes an existing item show as "to buy" in the given list. `changed` is false
// when the item is there already.
export const bringToList = (state, id, list) => {
  if (!LISTS.includes(list)) return reject(state, 'Lista desconocida.');
  const item = findItem(state, id);
  if (!item) return reject(state, 'Artículo no encontrado.');
  const done = (result) => ({ ...result, changed: true });
  if (list === 'active') {
    if (item.list === 'next') return done(moveItem(state, id));
    if (item.bought) return done(toggleBought(state, id));
  } else if (!inNextView(item)) {
    return done(item.bought ? toggleAgain(state, id) : moveItem(state, id));
  }
  return { state, changed: false };
};
