const LISTS = ['active', 'next'];

// `custom` is the order of `items`: the insertion order, changed by the moves of the user.
export const SORTS = ['custom', 'name'];

// The groups of a list: by the recipes sent to Active, by the shops of each item, or none.
export const GROUPS = ['recipe', 'shop', 'none'];

// `sent` holds the ids of the recipes sent to Active in this trip. `group` is the choice of the
// user to show a list in groups, and `sort` the order of the two lists.
export const emptyState = () => ({ version: 4, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [] });

// An error is a message: the key of its text, with the parameters of the text. A `list`
// parameter holds a list id. The screen turns the message into text.
const reject = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

const findItem = (state, id) => state.items.find((item) => item.id === id);

const patchItem = (state, id, patch) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return ['error.nameRequired'];
  const key = name.toLowerCase();
  const duplicate = state.items.find((item) => item.id !== ownId && item.name.toLowerCase() === key);
  return duplicate ? ['error.duplicateItem', { name: duplicate.name, list: duplicate.list }] : null;
};

const inNextView = (item) => item.list === 'next' || (item.bought && (item.recurrent || item.again));

export const addItem = (state, rawName, list, newId = () => crypto.randomUUID()) => {
  if (!LISTS.includes(list)) return reject(state, 'error.unknownList');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, ...error);
  const item = { id: newId(), name, recurrent: list === 'next', list, bought: false, again: false, shops: [] };
  return { state: { ...state, items: [...state.items, item] } };
};

export const renameItem = (state, id, rawName) => {
  if (!findItem(state, id)) return reject(state, 'error.itemNotFound');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, ...error) : patchItem(state, id, { name });
};

export const toggleRecurrent = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  return patchItem(state, id, { recurrent: !item.recurrent, again: false });
};

export const toggleBought = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  if (item.list !== 'active') return reject(state, 'error.onlyActiveTick', { list: 'active' });
  return patchItem(state, id, { bought: !item.bought, again: false });
};

export const toggleAgain = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  if (!item.bought) return reject(state, 'error.tickFirst');
  if (item.recurrent) return reject(state, 'error.recurrentInNext', { list: 'next' });
  return patchItem(state, id, { again: !item.again });
};

export const deleteItem = (state, id) => {
  if (!findItem(state, id)) return reject(state, 'error.itemNotFound');
  return { state: { ...state, items: state.items.filter((item) => item.id !== id) } };
};

export const moveItem = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  const list = item.list === 'active' ? 'next' : 'active';
  return patchItem(state, id, { list, bought: false, again: false });
};

export const removeFromNext = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  if (!inNextView(item)) return reject(state, 'error.notInNext', { list: 'next' });
  if (item.list === 'next') return deleteItem(state, id);
  return patchItem(state, id, { recurrent: false, again: false });
};

export const canStartNewShopping = (state) => state.items.some((item) => item.bought || item.list === 'next');

export const startNewShopping = (state) => {
  if (!canStartNewShopping(state)) return reject(state, 'error.nothingToStart', { list: 'next' });
  const items = state.items
    .filter((item) => !item.bought || item.recurrent || item.again)
    .map((item) => ({ ...item, list: 'active', bought: false, again: false }));
  return { state: { ...state, items, sent: [] } };
};

export const setSort = (state, sort) =>
  SORTS.includes(sort) ? { state: { ...state, sort } } : reject(state, 'error.unknownSort');

export const setGroup = (state, group) =>
  GROUPS.includes(group) ? { state: { ...state, group } } : reject(state, 'error.unknownGroup');

// Gives the places that the items of `ids` have in `items` to the same items, in the order of
// `ids`. Each other item keeps its place. The same order returns the same state object.
// A move in the name order starts the custom order from the name order: the lists stay as the
// screen shows them, with the move.
export const reorderItems = (state, ids) => {
  const moved = new Set(ids);
  if (moved.size !== ids.length) return reject(state, 'error.invalidOrder');
  const byId = new Map(state.items.map((item) => [item.id, item]));
  if (ids.some((id) => !byId.has(id))) return reject(state, 'error.itemNotFound');
  const base = state.sort === 'name' ? { ...state, items: sortItems(state, state.items), sort: 'custom' } : state;
  let next = 0;
  const items = base.items.map((item) => (moved.has(item.id) ? byId.get(ids[next++]) : item));
  return items.every((item, index) => item === state.items[index]) && base === state ? { state } : { state: { ...base, items } };
};

// The order of two names, with no case and no accent distinction.
export const compareNames = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' });

const byName = (a, b) => compareNames(a.name, b.name);

// The items in the order that the user chose. The order of `state.items` is the insertion order.
export const sortItems = (state, items) => (state.sort === 'name' ? [...items].sort(byName) : items);

export const activeItems = (state) => {
  const active = sortItems(state, state.items.filter((item) => item.list === 'active'));
  return [...active.filter((item) => !item.bought), ...active.filter((item) => item.bought)];
};

export const nextItems = (state) =>
  sortItems(state, [
    ...state.items.filter((item) => item.list === 'next'),
    ...state.items.filter((item) => item.list === 'active' && inNextView(item)),
  ]);

// The form of a text for a search: no case and no accent distinction.
export const fold = (text) =>
  String(text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

// True when the name or one of the shops of the item contains the query. Each item for no query.
export const matchesItem = (item, query) => {
  const key = fold(query);
  return !key || [item.name, ...item.shops].some((text) => fold(text).includes(key));
};

// A list by group with only the items that match the query. A query takes away a group with no
// item left. `left` is the count of the items of the full group, as `total` is, so that the head
// of a group shows the same figures with a query and with none.
export const filterGroups = (view, query) => {
  const searching = Boolean(fold(query));
  const matches = (item) => matchesItem(item, query);
  const groups = view.groups
    .map((group) => ({ ...group, items: group.items.filter(matches), left: group.items.length }))
    .filter((group) => !searching || group.items.length > 0);
  return { groups, rest: view.rest.filter(matches) };
};

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
  if (!LISTS.includes(list)) return reject(state, 'error.unknownList');
  const item = findItem(state, id);
  if (!item) return reject(state, 'error.itemNotFound');
  const done = (result) => ({ ...result, changed: true });
  if (list === 'active') {
    if (item.list === 'next') return done(moveItem(state, id));
    if (item.bought) return done(toggleBought(state, id));
  } else if (!inNextView(item)) {
    return done(item.bought ? toggleAgain(state, id) : moveItem(state, id));
  }
  return { state, changed: false };
};

// Figures for the header and for the preview of `startNewShopping`:
// `back` items stay for the next trip, `gone` items are deleted, `incoming` items wait in Next.
export const tripSummary = (state) => {
  const active = state.items.filter((item) => item.list === 'active');
  const bought = active.filter((item) => item.bought);
  const back = bought.filter((item) => item.recurrent || item.again).length;
  return {
    total: active.length,
    left: active.length - bought.length,
    back,
    gone: bought.length - back,
    incoming: state.items.length - active.length,
  };
};

// The message of the toast that an arrival at the shop shows, or null when nothing is left to buy.
export const arrivalMessage = (state) => {
  const { left } = tripSummary(state);
  return left === 0 ? null : { key: 'toast.arrival', params: { count: left, list: 'active' } };
};
