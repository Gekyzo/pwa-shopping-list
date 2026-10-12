import { addItem, bringToList, findByName } from './store.js';

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
  const recipe = { id: newId(), name, products: [] };
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
  return { state: { ...state, recipes: state.recipes.filter((recipe) => recipe.id !== id) } };
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

// Puts each product of the recipe in Active as "to buy". `added` counts the items
// that were created or changed, `already` the items that were there and pending.
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
  return { state: next, added, already: recipe.products.length - added };
};
