import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem, toggleBought } from '../src/store.js';
import {
  addRecipe,
  renameRecipe,
  deleteRecipe,
  addRecipeProduct,
  removeRecipeProduct,
  setRecipeUrl,
  sendRecipe,
  recipeGroups,
} from '../src/recipes.js';

let counter = 0;
const newId = () => `id-${++counter}`;

const withItem = (state, name, list, patch = {}) => {
  const { state: added } = addItem(state, name, list, newId);
  return { ...added, items: added.items.map((item) => (item.name === name ? { ...item, ...patch } : item)) };
};

const withRecipe = (state, name, products = []) => {
  const { state: created, id } = addRecipe(state, name, newId);
  return { id, state: products.reduce((current, product) => addRecipeProduct(current, id, product).state, created) };
};

const find = (state, name) => state.items.find((item) => item.name === name);

test('addRecipe adds an empty recipe and returns its id', () => {
  const start = emptyState();
  const { state, id, error } = addRecipe(start, '  Omelette ', newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.recipes, [{ id, name: 'Omelette', products: [], url: '' }]);
  assert.deepEqual(start, emptyState());
});

test('addRecipe rejects an empty name', () => {
  const start = emptyState();
  const result = addRecipe(start, '   ', newId);
  assert.equal(result.error, 'Escribe un nombre.');
  assert.equal(result.state, start);
});

test('addRecipe rejects a duplicate name without case distinction', () => {
  const { state } = withRecipe(emptyState(), 'Omelette');
  const result = addRecipe(state, 'omelette', newId);
  assert.equal(result.error, 'La receta "Omelette" ya existe.');
  assert.equal(result.state, state);
});

test('addRecipe accepts the name of an item', () => {
  const state = withItem(emptyState(), 'Bread', 'active');
  assert.equal(addRecipe(state, 'Bread', newId).error, undefined);
});

test('renameRecipe renames the recipe and keeps its products', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const result = renameRecipe(state, id, ' Tortilla ');
  assert.deepEqual(result.state.recipes, [{ id, name: 'Tortilla', products: ['Eggs'], url: '' }]);
  assert.equal(state.recipes[0].name, 'Omelette');
});

test('renameRecipe accepts a change of case of its own name', () => {
  const { state, id } = withRecipe(emptyState(), 'omelette');
  assert.equal(renameRecipe(state, id, 'Omelette').state.recipes[0].name, 'Omelette');
});

test('renameRecipe rejects an empty name, a duplicate and an unknown id', () => {
  const first = withRecipe(emptyState(), 'Omelette');
  const second = withRecipe(first.state, 'Soup');
  assert.equal(renameRecipe(second.state, second.id, ' ').error, 'Escribe un nombre.');
  assert.equal(renameRecipe(second.state, second.id, 'OMELETTE').error, 'La receta "Omelette" ya existe.');
  assert.equal(renameRecipe(second.state, 'nope', 'Stew').error, 'Receta no encontrada.');
});

test('deleteRecipe removes the recipe and leaves the items', () => {
  const { state, id } = withRecipe(withItem(emptyState(), 'Eggs', 'active'), 'Omelette', ['Eggs']);
  const result = deleteRecipe(state, id);
  assert.deepEqual(result.state.recipes, []);
  assert.equal(result.state.items, state.items);
  assert.equal(state.recipes.length, 1);
  assert.equal(deleteRecipe(state, 'nope').error, 'Receta no encontrada.');
});

test('addRecipeProduct appends a trimmed product', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const result = addRecipeProduct(state, id, '  Potatoes ');
  assert.deepEqual(result.state.recipes[0].products, ['Eggs', 'Potatoes']);
  assert.deepEqual(state.recipes[0].products, ['Eggs']);
});

test('addRecipeProduct rejects a name of spaces only', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const result = addRecipeProduct(state, id, '   ');
  assert.equal(result.error, 'Escribe un producto.');
  assert.equal(result.state, state);
});

test('addRecipeProduct rejects a duplicate without case distinction and an unknown recipe', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  assert.equal(addRecipeProduct(state, id, 'eggs').error, '"Eggs" ya está en la receta.');
  assert.equal(addRecipeProduct(state, 'nope', 'Salt').error, 'Receta no encontrada.');
});

test('addRecipeProduct accepts the same product in two recipes', () => {
  const first = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const second = withRecipe(first.state, 'Cake');
  assert.equal(addRecipeProduct(second.state, second.id, 'Eggs').error, undefined);
});

test('removeRecipeProduct removes one product', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs', 'Potatoes']);
  assert.deepEqual(removeRecipeProduct(state, id, 'Eggs').state.recipes[0].products, ['Potatoes']);
  assert.deepEqual(state.recipes[0].products, ['Eggs', 'Potatoes']);
});

test('removeRecipeProduct rejects an unknown product and an unknown recipe', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  assert.equal(removeRecipeProduct(state, id, 'Salt').error, 'Producto no encontrado.');
  assert.equal(removeRecipeProduct(state, 'nope', 'Eggs').error, 'Receta no encontrada.');
});

test('sendRecipe creates a one-time active item for each new product', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs', 'Potatoes']);
  const result = sendRecipe(state, id, newId);
  assert.equal(result.error, undefined);
  assert.deepEqual([result.added, result.already], [2, 0]);
  assert.deepEqual(
    result.state.items.map(({ id: itemId, ...rest }) => rest),
    [
      { name: 'Eggs', recurrent: false, list: 'active', bought: false, again: false },
      { name: 'Potatoes', recurrent: false, list: 'active', bought: false, again: false },
    ],
  );
  assert.deepEqual(state.items, []);
  assert.equal(result.state.recipes, state.recipes);
});

test('sendRecipe brings an item from next, unticks a bought item and leaves a pending item', () => {
  let items = withItem(emptyState(), 'Eggs', 'active');
  items = withItem(items, 'Potatoes', 'next');
  items = withItem(items, 'Onion', 'active', { bought: true, again: true });
  const { state, id } = withRecipe(items, 'Omelette', ['Eggs', 'Potatoes', 'Onion', 'Oil']);
  const result = sendRecipe(state, id, newId);
  assert.deepEqual([result.added, result.already], [3, 1]);
  assert.equal(result.state.items.length, 4);
  result.state.items.forEach((item) => {
    assert.deepEqual([item.list, item.bought, item.again], ['active', false, false], item.name);
  });
  assert.equal(find(result.state, 'Potatoes').recurrent, true);
  assert.equal(find(state, 'Potatoes').list, 'next');
});

test('sendRecipe matches an item without case distinction and creates no duplicate', () => {
  const { state, id } = withRecipe(withItem(emptyState(), 'Huevos', 'next'), 'Tortilla', ['huevos']);
  const result = sendRecipe(state, id, newId);
  assert.deepEqual(result.state.items.map((item) => [item.name, item.list]), [['Huevos', 'active']]);
  assert.deepEqual([result.added, result.already], [1, 0]);
});

test('sendRecipe unticks a ticked recurrent item and keeps it recurrent', () => {
  const items = withItem(emptyState(), 'Milk', 'active', { recurrent: true, bought: true });
  const { state, id } = withRecipe(items, 'Flan', ['Milk']);
  const result = sendRecipe(state, id, newId);
  assert.deepEqual(result.state.items[0], { ...state.items[0], bought: false });
  assert.deepEqual([result.added, result.already], [1, 0]);
});

test('sendRecipe a second time changes nothing and returns the same state', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs', 'Potatoes']);
  const first = sendRecipe(state, id, newId);
  const second = sendRecipe(first.state, id, newId);
  assert.equal(second.state, first.state);
  assert.deepEqual([second.added, second.already], [0, 2]);
});

test('sendRecipe rejects a recipe with no products and an unknown id', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette');
  const result = sendRecipe(state, id, newId);
  assert.equal(result.error, 'La receta no tiene productos.');
  assert.equal(result.state, state);
  assert.equal(sendRecipe(state, 'nope', newId).error, 'Receta no encontrada.');
});

test('sendRecipe records the recipe in sent one time', () => {
  const { state, id } = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const first = sendRecipe(state, id, newId);
  assert.deepEqual(first.state.sent, [id]);
  assert.deepEqual(sendRecipe(first.state, id, newId).state.sent, [id]);
  assert.deepEqual(state.sent, []);
});

test('sendRecipe of products that are all pending changes only sent', () => {
  const { state, id } = withRecipe(withItem(emptyState(), 'Eggs', 'active'), 'Omelette', ['Eggs']);
  const result = sendRecipe(state, id, newId);
  assert.deepEqual([result.added, result.already], [0, 1]);
  assert.equal(result.state.items, state.items);
  assert.deepEqual(result.state.sent, [id]);
});

test('deleteRecipe removes the recipe from sent', () => {
  const first = withRecipe(emptyState(), 'Omelette', ['Eggs']);
  const second = withRecipe(first.state, 'Flan', ['Milk']);
  const sent = sendRecipe(sendRecipe(second.state, first.id, newId).state, second.id, newId).state;
  assert.deepEqual(deleteRecipe(sent, first.id).state.sent, [second.id]);
  assert.deepEqual(sent.sent, [first.id, second.id]);
});

const names = (items) => items.map((item) => item.name);

// Omelette (Eggs, Potatoes) and Flan (Eggs, Milk) sent in that order, with Bread added by hand.
const twoSent = () => {
  const omelette = withRecipe(withItem(emptyState(), 'Bread', 'active'), 'Omelette', ['Eggs', 'Potatoes']);
  const flan = withRecipe(omelette.state, 'Flan', ['Eggs', 'Milk']);
  const state = sendRecipe(sendRecipe(flan.state, omelette.id, newId).state, flan.id, newId).state;
  return { state, omelette: omelette.id, flan: flan.id };
};

test('recipeGroups gives no group when no recipe was sent', () => {
  const { state } = withRecipe(withItem(emptyState(), 'Eggs', 'active'), 'Omelette', ['Eggs']);
  assert.deepEqual(recipeGroups(state), { groups: [], rest: state.items });
});

test('recipeGroups puts a shared item in each group and the other items in rest', () => {
  const { state } = twoSent();
  const { groups, rest } = recipeGroups(state);
  assert.deepEqual(
    groups.map(({ recipe, items, total }) => [recipe.name, names(items), total]),
    [
      ['Omelette', ['Eggs', 'Potatoes'], 2],
      ['Flan', ['Eggs', 'Milk'], 2],
    ],
  );
  assert.deepEqual(names(rest), ['Bread']);
  assert.equal(groups[0].items[0], groups[1].items[0]);
});

test('recipeGroups drops a ticked item from each group and keeps it in the totals', () => {
  const { state } = twoSent();
  const eggs = state.items.find((item) => item.name === 'Eggs');
  const ticked = toggleBought(state, eggs.id).state;
  const { groups, rest } = recipeGroups(ticked);
  assert.deepEqual(groups.map(({ items, total }) => [names(items), total]), [[['Potatoes'], 2], [['Milk'], 2]]);
  assert.deepEqual(names(rest), ['Bread']);
});

test('recipeGroups keeps a group whose items are all ticked', () => {
  const { state, id } = withRecipe(emptyState(), 'Toast', ['Bread']);
  const sent = sendRecipe(state, id, newId).state;
  const ticked = toggleBought(sent, sent.items[0].id).state;
  assert.deepEqual(recipeGroups(ticked).groups.map(({ items, total }) => [items, total]), [[[], 1]]);
});

test('recipeGroups matches an item added by hand without case distinction', () => {
  const { state, id } = withRecipe(emptyState(), 'Toast', ['Bread']);
  const sent = sendRecipe(state, id, newId).state;
  const withButter = addRecipeProduct(withItem(sent, 'BUTTER', 'active'), id, 'butter').state;
  assert.deepEqual(names(recipeGroups(withButter).groups[0].items), ['Bread', 'BUTTER']);
});

test('recipeGroups ignores an item in next, a recipe with no item and a stale id', () => {
  const { state, flan } = twoSent();
  const withNext = withItem(state, 'Sugar', 'next');
  const flanPlus = addRecipeProduct(withNext, flan, 'Sugar').state;
  assert.deepEqual(names(recipeGroups(flanPlus).groups[1].items), ['Eggs', 'Milk']);
  const empty = withRecipe(flanPlus, 'Soup', ['Leek']);
  const stale = { ...empty.state, sent: [...empty.state.sent, empty.id, 'gone'] };
  assert.deepEqual(recipeGroups(stale).groups.map(({ recipe }) => recipe.name), ['Omelette', 'Flan']);
});

test('recipeGroups does not change the state', () => {
  const { state } = twoSent();
  const copy = structuredClone(state);
  recipeGroups(state);
  assert.deepEqual(state, copy);
});

const LINK = 'https://bonviveur.com/es/recetas/garbanzos-con-chorizo';

test('setRecipeUrl stores a trimmed link and leaves the rest of the recipe', () => {
  const { state, id } = withRecipe(emptyState(), 'Chickpeas', ['Chorizo']);
  const result = setRecipeUrl(state, id, `  ${LINK} `);
  assert.deepEqual(result.state.recipes, [{ id, name: 'Chickpeas', products: ['Chorizo'], url: LINK }]);
  assert.equal(state.recipes[0].url, '');
});

test('setRecipeUrl adds https to a link with no scheme', () => {
  const { state, id } = withRecipe(emptyState(), 'Chickpeas');
  assert.equal(setRecipeUrl(state, id, 'bonviveur.com/es/recetas').state.recipes[0].url, 'https://bonviveur.com/es/recetas');
  assert.equal(setRecipeUrl(state, id, 'http://example.com').state.recipes[0].url, 'http://example.com');
});

test('setRecipeUrl removes the link with an empty text', () => {
  const { state, id } = withRecipe(emptyState(), 'Chickpeas');
  const linked = setRecipeUrl(state, id, LINK).state;
  assert.equal(setRecipeUrl(linked, id, '   ').state.recipes[0].url, '');
});

test('setRecipeUrl rejects a text that is not a web address and an unknown recipe', () => {
  const { state, id } = withRecipe(emptyState(), 'Chickpeas');
  ['javascript:alert(1)', 'ftp://example.com/x', 'data:text/html,x', 'two words'].forEach((text) => {
    const result = setRecipeUrl(state, id, text);
    assert.equal(result.error, 'El enlace no es una dirección web válida.', text);
    assert.equal(result.state, state);
  });
  assert.equal(setRecipeUrl(state, 'nope', LINK).error, 'Receta no encontrada.');
});
