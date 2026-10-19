import { addItem, bringToList, findByName, fold, sortItems } from '#store';

const NOT_FOUND = 'error.recipeNotFound';

// An error is a message, as in `store.js`.
const reject = (state, key, params) => ({ state, error: params ? { key, params } : { key } });

const findRecipe = (state, id) => state.recipes.find((recipe) => recipe.id === id);

const patchRecipe = (state, id, patch) => ({
  state: { ...state, recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...patch } : recipe)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return ['error.nameRequired'];
  const key = name.toLowerCase();
  const duplicate = state.recipes.find((recipe) => recipe.id !== ownId && recipe.name.toLowerCase() === key);
  return duplicate ? ['error.duplicateRecipe', { name: duplicate.name }] : null;
};

export const addRecipe = (state, rawName, newId = () => crypto.randomUUID()) => {
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, ...error);
  const recipe = { id: newId(), name, products: [], url: '' };
  return { state: { ...state, recipes: [...state.recipes, recipe] }, id: recipe.id };
};

export const renameRecipe = (state, id, rawName) => {
  if (!findRecipe(state, id)) return reject(state, NOT_FOUND);
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, ...error) : patchRecipe(state, id, { name });
};

export const deleteRecipe = (state, id) => {
  if (!findRecipe(state, id)) return reject(state, NOT_FOUND);
  const recipes = state.recipes.filter((recipe) => recipe.id !== id);
  const sent = state.sent.filter((sentId) => sentId !== id);
  // The meals of the recipe become empty.
  const menu = state.menu.filter((entry) => entry.recipe !== id);
  return { state: { ...state, recipes, sent, menu } };
};

// Labels of letters, digits and inner hyphens, two at least, with a last label of two letters at
// least. `URL` gives an international name in its ASCII form, so `xn--` labels pass.
const HOST = /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+(?:[a-z]{2,}|xn--[a-z\d-]+)$/i;

// True for an http or https address with a host name. No other scheme goes into a link of the
// screen. A browser parses a host with spaces with no error, so the text and the host are checked
// too.
export const isWebUrl = (text) => {
  if (/\s/.test(text)) return false;
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) && HOST.test(url.hostname);
  } catch {
    return false;
  }
};

// Sets the optional link of the recipe. An empty text removes it; a text with no scheme gets https.
export const setRecipeUrl = (state, id, rawUrl) => {
  if (!findRecipe(state, id)) return reject(state, NOT_FOUND);
  const text = String(rawUrl ?? '').trim();
  if (!text) return patchRecipe(state, id, { url: '' });
  const url = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`;
  return isWebUrl(url) ? patchRecipe(state, id, { url }) : reject(state, 'error.invalidLink');
};

export const addRecipeProduct = (state, id, rawName) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  const name = String(rawName ?? '').trim();
  if (!name) return reject(state, 'error.productRequired');
  const key = name.toLowerCase();
  const duplicate = recipe.products.find((product) => product.toLowerCase() === key);
  if (duplicate) return reject(state, 'error.duplicateProduct', { name: duplicate });
  return patchRecipe(state, id, { products: [...recipe.products, name] });
};

export const removeRecipeProduct = (state, id, name) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  if (!recipe.products.includes(name)) return reject(state, 'error.productNotFound');
  return patchRecipe(state, id, { products: recipe.products.filter((product) => product !== name) });
};

// Puts each product of the recipe in Active as "to buy" and records the recipe in `sent`.
// `added` counts the items that were created or changed, `already` the items that were
// there and pending. A send that changes nothing returns the same state object.
export const sendRecipe = (state, id, newId) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  if (!recipe.products.length) return reject(state, 'error.recipeEmpty');
  let next = state;
  let added = 0;
  for (const product of recipe.products) {
    const existing = findByName(next, product);
    const result = existing ? bringToList(next, existing.id) : addItem(next, product, newId);
    // The error of an item operation is a message already.
    if (result.error) return { state, error: result.error };
    if (!existing || result.changed) added += 1;
    next = result.state;
  }
  if (!next.sent.includes(id)) next = { ...next, sent: [...next.sent, id] };
  return { state: next, added, already: recipe.products.length - added };
};

// The names of the items of Active, ticked or not, in lower case.
const activeNames = (items) => new Set(items.filter((item) => item.list === 'active').map((item) => item.name.toLowerCase()));

const allIn = (recipe, names) => recipe.products.length > 0 && recipe.products.every((product) => names.has(product.toLowerCase()));

// True when each product of the recipe is an item of Active, ticked or not. A recipe with no
// products is never in the list.
export const inList = (state, recipe) => allIn(recipe, activeNames(state.items));

// The Active list by recipe: the sent recipes in send order, then each other recipe whose
// products are all in Active. An item of two recipes is in the two groups. `items` are the
// members still to buy, `total` counts the ticked members too, and `rest` holds the items
// to buy that are in no group.
export const recipeGroups = (state) => {
  const active = sortItems(state, state.items.filter((item) => item.list === 'active'));
  const inActive = activeNames(active);
  const complete = (recipe) => allIn(recipe, inActive);
  const sent = state.sent.map((id) => findRecipe(state, id)).filter(Boolean);
  const unsent = state.recipes.filter((recipe) => !state.sent.includes(recipe.id) && complete(recipe));
  const grouped = new Set();
  const groups = [...sent, ...unsent]
    .map((recipe) => {
      const products = new Set(recipe.products.map((product) => product.toLowerCase()));
      const members = active.filter((item) => products.has(item.name.toLowerCase()));
      members.forEach((item) => grouped.add(item.id));
      return { recipe, items: members.filter((item) => !item.bought), total: members.length };
    })
    .filter((group) => group.total > 0);
  const rest = active.filter((item) => !item.bought && !grouped.has(item.id));
  return { groups, rest };
};

// The names that the product field of a recipe offers for the query: the items, then the products
// of the recipes, one time each with no case distinction, less the products of the recipe. The
// exact match goes first, then the names that start with the query, as in `searchItems`.
export const productSuggestions = (state, id, query, limit = 5) => {
  const key = fold(query);
  if (!key) return [];
  const taken = new Set((findRecipe(state, id)?.products ?? []).map((product) => product.toLowerCase()));
  const names = new Map();
  for (const name of [...state.items.map((item) => item.name), ...state.recipes.flatMap((recipe) => recipe.products)]) {
    const lower = name.toLowerCase();
    if (!taken.has(lower) && !names.has(lower)) names.set(lower, name);
  }
  const rank = (name) => {
    const folded = fold(name);
    if (folded === key) return 0;
    return folded.startsWith(key) ? 1 : 2;
  };
  return [...names.values()]
    .filter((name) => fold(name).includes(key))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
};

// The items to buy that show in two recipe groups or more, from their id to the names of those
// recipes in group order. One row of each shows the other names, so it reads as one product.
export const sharedItems = ({ groups }) => {
  const byItem = new Map();
  for (const { recipe, items } of groups) {
    for (const item of items) byItem.set(item.id, [...(byItem.get(item.id) ?? []), recipe.name]);
  }
  return new Map([...byItem].filter(([, names]) => names.length > 1));
};

// The recipes whose name, or one of whose products, contains the query. All recipes for no query.
export const searchRecipes = (state, query) => {
  const key = fold(query);
  if (!key) return state.recipes;
  return state.recipes.filter((recipe) => [recipe.name, ...recipe.products].some((text) => fold(text).includes(key)));
};

// The sample recipe of the walkthrough. Its fixed id lets `Ajustes` find it after a rename.
export const SAMPLE_ID = 'sample-pasta';

export const hasSample = (state) => Boolean(findRecipe(state, SAMPLE_ID));

// Adds the sample recipe with the name and products of the screen language. It returns the same
// state when the sample exists or when its name is taken.
export const addSample = (state, { name: rawName, products: rawProducts }) => {
  const name = String(rawName ?? '').trim();
  if (hasSample(state) || nameError(state, name)) return { state };
  const products = rawProducts
    .map((product) => String(product ?? '').trim())
    .filter((product, index, all) => product && all.findIndex((other) => other.toLowerCase() === product.toLowerCase()) === index);
  return { state: { ...state, recipes: [...state.recipes, { id: SAMPLE_ID, name, products, url: '' }] } };
};

// Adds the sample recipe and sends its products to Active, as Empezar of the walkthrough does. It
// returns the same state when addSample adds nothing.
export const loadSample = (state, text, newId) => {
  const { state: added } = addSample(state, text);
  if (added === state) return { state };
  const sent = sendRecipe(added, SAMPLE_ID, newId);
  return sent.error ? { state: added } : { state: sent.state };
};
