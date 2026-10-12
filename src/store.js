const LISTS = ['active', 'next'];
const LIST_LABELS = { active: 'Active', next: 'Next' };

export const emptyState = () => ({ version: 1, items: [] });

const reject = (state, error) => ({ state, error });

const findItem = (state, id) => state.items.find((item) => item.id === id);

const patchItem = (state, id, patch) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return 'Enter a name.';
  const key = name.toLowerCase();
  const duplicate = state.items.find((item) => item.id !== ownId && item.name.toLowerCase() === key);
  return duplicate ? `"${duplicate.name}" is already in ${LIST_LABELS[duplicate.list]}.` : null;
};

const inNextView = (item) => item.list === 'next' || (item.bought && (item.recurrent || item.again));

export const addItem = (state, rawName, list, newId = () => crypto.randomUUID()) => {
  if (!LISTS.includes(list)) return reject(state, 'Unknown list.');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, error);
  const item = { id: newId(), name, recurrent: list === 'next', list, bought: false, again: false };
  return { state: { ...state, items: [...state.items, item] } };
};

export const renameItem = (state, id, rawName) => {
  if (!findItem(state, id)) return reject(state, 'Item not found.');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, error) : patchItem(state, id, { name });
};

export const toggleRecurrent = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Item not found.');
  return patchItem(state, id, { recurrent: !item.recurrent, again: false });
};

export const toggleBought = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Item not found.');
  if (item.list !== 'active') return reject(state, 'Only items in Active can be ticked.');
  return patchItem(state, id, { bought: !item.bought, again: false });
};

export const toggleAgain = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Item not found.');
  if (!item.bought) return reject(state, 'Tick the item first.');
  if (item.recurrent) return reject(state, 'A recurrent item is in Next already.');
  return patchItem(state, id, { again: !item.again });
};

export const deleteItem = (state, id) => {
  if (!findItem(state, id)) return reject(state, 'Item not found.');
  return { state: { ...state, items: state.items.filter((item) => item.id !== id) } };
};

export const moveItem = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Item not found.');
  const list = item.list === 'active' ? 'next' : 'active';
  return patchItem(state, id, { list, bought: false, again: false });
};

export const removeFromNext = (state, id) => {
  const item = findItem(state, id);
  if (!item) return reject(state, 'Item not found.');
  if (!inNextView(item)) return reject(state, 'The item is not in Next.');
  if (item.list === 'next') return deleteItem(state, id);
  return patchItem(state, id, { recurrent: false, again: false });
};

export const canStartNewShopping = (state) => state.items.some((item) => item.bought || item.list === 'next');

export const startNewShopping = (state) => {
  if (!canStartNewShopping(state)) return reject(state, 'Nothing to start: tick an item or add one to Next.');
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
