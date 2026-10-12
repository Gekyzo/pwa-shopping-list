import { addItem, bringToList, findByName, sortItems } from './store.js';

const NOT_FOUND = 'Receta no encontrada.';

const reject = (state, error) => ({ state, error });

const findRecipe = (state, id) => state.recipes.find((recipe) => recipe.id === id);

const patchRecipe = (state, id, patch) => ({
  state: { ...state, recipes: state.recipes.map((recipe) => (recipe.id === id ? { ...recipe, ...patch } : recipe)) },
});

const nameError = (state, name, ownId) => {
  if (!name) return 'Escribe un nombre.';
  const key = name.toLowerCase();
  const duplicate = state.recipes.find((recipe) => recipe.id !== ownId && recipe.name.toLowerCase() === key);
  return duplicate ? `La receta "${duplicate.name}" ya existe.` : null;
};

export const addRecipe = (state, rawName, newId = () => crypto.randomUUID()) => {
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name);
  if (error) return reject(state, error);
  const recipe = { id: newId(), name, products: [], url: '' };
  return { state: { ...state, recipes: [...state.recipes, recipe] }, id: recipe.id };
};

export const renameRecipe = (state, id, rawName) => {
  if (!findRecipe(state, id)) return reject(state, NOT_FOUND);
  const name = String(rawName ?? '').trim();
  const error = nameError(state, name, id);
  return error ? reject(state, error) : patchRecipe(state, id, { name });
};

export const deleteRecipe = (state, id) => {
  if (!findRecipe(state, id)) return reject(state, NOT_FOUND);
  const recipes = state.recipes.filter((recipe) => recipe.id !== id);
  return { state: { ...state, recipes, sent: state.sent.filter((sentId) => sentId !== id) } };
};

// True for an http or https address. No other scheme goes into a link of the screen.
export const isWebUrl = (text) => {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol);
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
  return isWebUrl(url) ? patchRecipe(state, id, { url }) : reject(state, 'El enlace no es una dirección web válida.');
};

export const addRecipeProduct = (state, id, rawName) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  const name = String(rawName ?? '').trim();
  if (!name) return reject(state, 'Escribe un producto.');
  const key = name.toLowerCase();
  const duplicate = recipe.products.find((product) => product.toLowerCase() === key);
  if (duplicate) return reject(state, `"${duplicate}" ya está en la receta.`);
  return patchRecipe(state, id, { products: [...recipe.products, name] });
};

export const removeRecipeProduct = (state, id, name) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  if (!recipe.products.includes(name)) return reject(state, 'Producto no encontrado.');
  return patchRecipe(state, id, { products: recipe.products.filter((product) => product !== name) });
};

// Puts each product of the recipe in Active as "to buy" and records the recipe in `sent`.
// `added` counts the items that were created or changed, `already` the items that were
// there and pending. A send that changes nothing returns the same state object.
export const sendRecipe = (state, id, newId) => {
  const recipe = findRecipe(state, id);
  if (!recipe) return reject(state, NOT_FOUND);
  if (!recipe.products.length) return reject(state, 'La receta no tiene productos.');
  let next = state;
  let added = 0;
  for (const product of recipe.products) {
    const existing = findByName(next, product);
    const result = existing ? bringToList(next, existing.id, 'active') : addItem(next, product, 'active', newId);
    if (result.error) return reject(state, result.error);
    if (!existing || result.changed) added += 1;
    next = result.state;
  }
  if (!next.sent.includes(id)) next = { ...next, sent: [...next.sent, id] };
  return { state: next, added, already: recipe.products.length - added };
};

// The Active list by sent recipe. An item of two recipes is in the two groups. `items`
// are the members still to buy, `total` counts the ticked members too, and `rest` holds
// the items to buy that are in no group.
export const recipeGroups = (state) => {
  const active = sortItems(state, state.items.filter((item) => item.list === 'active'));
  const grouped = new Set();
  const groups = state.sent
    .map((id) => findRecipe(state, id))
    .filter(Boolean)
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

export const setGrouped = (state, grouped) => ({ state: { ...state, grouped: Boolean(grouped) } });
