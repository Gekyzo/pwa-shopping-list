import { activeItems, nextItems, compareNames } from '#store';

const reject = (state, key) => ({ state, error: { key } });

// Two spellings of a shop name are one shop.
const keyOf = (name) => name.toLowerCase();

const hasShop = (item, name) => item.shops.some((shop) => keyOf(shop) === keyOf(name));

const namesOf = (items) => {
  const names = new Map();
  for (const item of items) for (const shop of item.shops) if (!names.has(keyOf(shop))) names.set(keyOf(shop), shop);
  return [...names.values()].sort(compareNames);
};

const setShops = (state, id, shops) => ({
  state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, shops } : item)) },
});

// The shops in use, in name order. A shop exists while an item has it.
export const shopNames = (state) => namesOf(state.items);

// The shops that the field of an item offers: the shops in use that the item does not have.
export const shopSuggestions = (state, id) => {
  const item = state.items.find((entry) => entry.id === id);
  return item ? shopNames(state).filter((shop) => !hasShop(item, shop)) : [];
};

// A name that is a shop in use takes the spelling of that shop. A shop that the item has
// already returns the same state object.
export const addItemShop = (state, id, rawName) => {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return reject(state, 'error.itemNotFound');
  const typed = String(rawName ?? '').trim();
  if (!typed) return reject(state, 'error.shopRequired');
  const name = shopNames(state).find((shop) => keyOf(shop) === keyOf(typed)) ?? typed;
  return hasShop(item, name) ? { state } : setShops(state, id, [...item.shops, name]);
};

export const removeItemShop = (state, id, name) => {
  const item = state.items.find((entry) => entry.id === id);
  if (!item) return reject(state, 'error.itemNotFound');
  if (!hasShop(item, name)) return { state };
  return setShops(state, id, item.shops.filter((shop) => keyOf(shop) !== keyOf(name)));
};

// A list by shop, with the shops in name order. An item of two shops is in the two groups.
// For Active, `items` are the members still to buy and `total` counts the ticked members too.
// `rest` holds the items with no shop.
export const shopGroups = (state, list) => {
  const active = list === 'active';
  const source = active ? activeItems(state) : nextItems(state);
  const shown = (item) => !active || !item.bought;
  const groups = namesOf(source).map((shop) => {
    const members = source.filter((item) => hasShop(item, shop));
    return { shop, items: members.filter(shown), total: members.length };
  });
  return { groups, rest: source.filter((item) => shown(item) && item.shops.length === 0) };
};
