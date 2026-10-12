import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem } from '../src/store.js';
import {
  addRecipe,
  renameRecipe,
  deleteRecipe,
  addRecipeProduct,
  removeRecipeProduct,
  sendRecipe,
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
  assert.deepEqual(state.recipes, [{ id, name: 'Omelette', products: [] }]);
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
  assert.deepEqual(result.state.recipes, [{ id, name: 'Tortilla', products: ['Eggs'] }]);
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
