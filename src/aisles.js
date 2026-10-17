import { activeItems } from '#store';

// An aisle is a section of the store, such as Dairy. `state.aisles` holds them in the order of
// the walk through the store, and `item.aisle` is one of them or ''.
const reject = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

// Two spellings of an aisle name are one aisle.
const keyOf = (name) => name.toLowerCase();

const findAisle = (state, name) => state.aisles.find((aisle) => keyOf(aisle) === keyOf(String(name ?? '')));

const withAisles = (state, aisles, rename = (aisle) => aisle) => ({
  state: {
    ...state,
    aisles,
    items: state.items.map((item) => {
      const aisle = item.aisle && rename(item.aisle);
      return aisle === item.aisle ? item : { ...item, aisle };
    }),
  },
});

// The error of a new name, or null. `own` is the aisle that the name replaces.
const nameError = (state, name, own) => {
  if (!name) return ['error.aisleRequired'];
  const duplicate = findAisle(state, name);
  return duplicate && duplicate !== own ? ['error.duplicateAisle', { name: duplicate }] : null;
};

export const addAisle = (state, rawName) => {
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  return error ? reject(state, ...error) : { state: { ...state, aisles: [...state.aisles, name] } };
};

// A rename also renames the aisle of each item that has it.
export const renameAisle = (state, from, rawName) => {
  const own = findAisle(state, from);
  if (!own) return reject(state, 'error.aisleNotFound');
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, own);
  if (error) return reject(state, ...error);
  if (name === own) return { state };
  return withAisles(state, state.aisles.map((aisle) => (aisle === own ? name : aisle)), (aisle) => (aisle === own ? name : aisle));
};

// The items of a deleted aisle keep no aisle.
export const deleteAisle = (state, name) => {
  const own = findAisle(state, name);
  if (!own) return reject(state, 'error.aisleNotFound');
  return withAisles(state, state.aisles.filter((aisle) => aisle !== own), (aisle) => (aisle === own ? '' : aisle));
};

// `step` is -1 for one place up and 1 for one place down. A step past an end changes nothing.
export const moveAisle = (state, name, step) => {
  const own = findAisle(state, name);
  if (!own) return reject(state, 'error.aisleNotFound');
  const from = state.aisles.indexOf(own);
  const to = from + step;
  if (to < 0 || to >= state.aisles.length) return { state };
  const aisles = [...state.aisles];
  [aisles[from], aisles[to]] = [aisles[to], aisles[from]];
  return { state: { ...state, aisles } };
};

// An empty name clears the aisle of the item.
export const setItemAisle = (state, id, name) => {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return reject(state, 'error.itemNotFound');
  const typed = String(name ?? '').trim();
  const aisle = typed ? findAisle(state, typed) : '';
  if (aisle === undefined) return reject(state, 'error.aisleNotFound');
  if (aisle === item.aisle) return { state };
  return { state: { ...state, items: state.items.map((entry) => (entry.id === id ? { ...entry, aisle } : entry)) } };
};

// Adds each name that is not an aisle yet, in the order of `names`.
export const addDefaultAisles = (state, names) => {
  const next = names.reduce((current, name) => addAisle(current, name).state, state);
  return { state: next.aisles.length === state.aisles.length ? state : next };
};

// A list by aisle, with the aisles in the order of the walk. `items` are the members still to buy
// and `total` counts the ticked members too. `rest` holds the items with no aisle.
export const aisleGroups = (state) => {
  const source = activeItems(state);
  const shown = (item) => !item.bought;
  const groups = state.aisles
    .map((aisle) => {
      const members = source.filter((item) => item.aisle === aisle);
      return { aisle, items: members.filter(shown), total: members.length };
    })
    .filter((group) => group.total > 0);
  return { groups, rest: source.filter((item) => shown(item) && !item.aisle) };
};
