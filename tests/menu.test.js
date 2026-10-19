import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem } from '#store';
import { addRecipe, addRecipeProduct } from '#recipes';
import { DAYS, MEALS, setMeal, setDish, dishRecipe, menuDishes, clearMeal, clearMenu, mealCount, menuWeek, fillMenu } from '#menu';

let counter = 0;
const newId = () => `id-${++counter}`;

const withRecipe = (state, name, products = []) => {
  const { state: created, id } = addRecipe(state, name, newId);
  return { id, state: products.reduce((current, product) => addRecipeProduct(current, id, product).state, created) };
};

// A state with the recipes Lentils (lentils, onion) and Omelette (eggs, onion) and Empty (no product).
const kitchen = () => {
  const lentils = withRecipe(emptyState(), 'Lentils', ['Lentils', 'Onion']);
  const omelette = withRecipe(lentils.state, 'Omelette', ['Eggs', 'Onion']);
  const empty = withRecipe(omelette.state, 'Empty');
  return { state: empty.state, lentils: lentils.id, omelette: omelette.id, empty: empty.id };
};

const plan = (state, entries) => entries.reduce((current, [day, meal, id]) => setMeal(current, day, meal, id).state, state);

test('the week has 7 days and 2 meals', () => {
  assert.equal(DAYS, 7);
  assert.deepEqual(MEALS, ['lunch', 'dinner']);
});

test('setMeal puts a recipe in a meal', () => {
  const { state: start, lentils } = kitchen();
  const before = structuredClone(start);
  const { state, error } = setMeal(start, 2, 'dinner', lentils);
  assert.equal(error, undefined);
  assert.deepEqual(state.menu, [{ day: 2, meal: 'dinner', recipe: lentils }]);
  assert.deepEqual(start, before);
});

test('setMeal replaces the recipe of a meal', () => {
  const { state: start, lentils, omelette } = kitchen();
  const state = plan(start, [[0, 'lunch', lentils], [0, 'lunch', omelette]]);
  assert.deepEqual(state.menu, [{ day: 0, meal: 'lunch', recipe: omelette }]);
});

test('setMeal keeps the entries in day and meal order', () => {
  const { state: start, lentils, omelette } = kitchen();
  const state = plan(start, [[3, 'lunch', lentils], [1, 'dinner', omelette], [1, 'lunch', lentils]]);
  assert.deepEqual(
    state.menu.map(({ day, meal }) => `${day}-${meal}`),
    ['1-lunch', '1-dinner', '3-lunch'],
  );
});

test('setMeal rejects a recipe that does not exist', () => {
  const { state: start } = kitchen();
  const result = setMeal(start, 0, 'lunch', 'nope');
  assert.deepEqual(result.error, { key: 'error.recipeNotFound' });
  assert.equal(result.state, start);
});

test('setMeal rejects a day or a meal that does not exist', () => {
  const { state: start, lentils } = kitchen();
  for (const [day, meal] of [[7, 'lunch'], [-1, 'lunch'], [1.5, 'lunch'], [0, 'breakfast']]) {
    const result = setMeal(start, day, meal, lentils);
    assert.deepEqual(result.error, { key: 'error.unknownMeal' }, `${day} ${meal}`);
    assert.equal(result.state, start);
  }
});

test('clearMeal empties a meal', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils], [0, 'dinner', omelette]]);
  const before = structuredClone(planned);
  const { state } = clearMeal(planned, 0, 'lunch');
  assert.deepEqual(state.menu, [{ day: 0, meal: 'dinner', recipe: omelette }]);
  assert.deepEqual(planned, before);
});

test('clearMeal of an empty meal returns the same state', () => {
  const { state: start } = kitchen();
  assert.equal(clearMeal(start, 4, 'dinner').state, start);
});

test('clearMenu empties the menu', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils], [5, 'dinner', omelette]]);
  const { state } = clearMenu(planned);
  assert.deepEqual(state.menu, []);
  assert.equal(state.recipes, planned.recipes);
  assert.equal(planned.menu.length, 2);
});

test('clearMenu of an empty menu returns the same state', () => {
  const { state: start } = kitchen();
  assert.equal(clearMenu(start).state, start);
});

test('mealCount counts the planned meals', () => {
  const { state: start, lentils } = kitchen();
  assert.equal(mealCount(start), 0);
  assert.equal(mealCount(plan(start, [[0, 'lunch', lentils], [6, 'dinner', lentils]])), 2);
});

test('menuWeek gives each day with its two meals and their recipes', () => {
  const { state: start, lentils, omelette } = kitchen();
  const state = plan(start, [[0, 'dinner', omelette], [6, 'lunch', lentils]]);
  const week = menuWeek(state);
  assert.equal(week.length, 7);
  assert.deepEqual(week.map(({ day }) => day), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(week[0].meals.map(({ meal, recipe }) => [meal, recipe?.name ?? null]), [['lunch', null], ['dinner', 'Omelette']]);
  assert.deepEqual(week[6].meals.map(({ meal, recipe }) => [meal, recipe?.name ?? null]), [['lunch', 'Lentils'], ['dinner', null]]);
});

test('fillMenu sends each recipe of the menu to Active, one time, in menu order', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[2, 'lunch', omelette], [0, 'lunch', lentils], [4, 'dinner', lentils]]);
  const before = structuredClone(planned);
  const { state, added, already, error } = fillMenu(planned, newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.items.map(({ name, list }) => [name, list]), [
    ['Lentils', 'active'],
    ['Onion', 'active'],
    ['Eggs', 'active'],
  ]);
  assert.deepEqual(state.sent, [lentils, omelette]);
  assert.equal(added, 3);
  // Onion is in the two recipes: the second send finds it to buy already.
  assert.equal(already, 1);
  assert.deepEqual(planned, before);
});

test('fillMenu brings a saved item and counts an item to buy as already there', () => {
  const { state: start, lentils } = kitchen();
  const withLentils = addItem(start, 'Lentils', newId).state;
  const withSaved = { ...withLentils, items: withLentils.items.map((item) => ({ ...item, list: 'saved' })) };
  const withActive = addItem(withSaved, 'Onion', newId).state;
  const planned = plan(withActive, [[0, 'lunch', lentils]]);
  const { state, added, already } = fillMenu(planned, newId);
  assert.deepEqual(state.items.map(({ name, list }) => [name, list]), [['Lentils', 'active'], ['Onion', 'active']]);
  assert.equal(added, 1);
  assert.equal(already, 1);
});

test('fillMenu skips a recipe with no product', () => {
  const { state: start, lentils, empty } = kitchen();
  const planned = plan(start, [[0, 'lunch', empty], [0, 'dinner', lentils]]);
  const { state, error } = fillMenu(planned, newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.sent, [lentils]);
});

test('fillMenu rejects an empty menu', () => {
  const { state: start } = kitchen();
  const result = fillMenu(start, newId);
  assert.deepEqual(result.error, { key: 'error.menuEmpty' });
  assert.equal(result.state, start);
});

test('fillMenu rejects a menu whose recipes have no product', () => {
  const { state: start, empty } = kitchen();
  const planned = plan(start, [[1, 'lunch', empty]]);
  const result = fillMenu(planned, newId);
  assert.deepEqual(result.error, { key: 'error.menuNoProducts' });
  assert.equal(result.state, planned);
});

test('a second fillMenu changes nothing and returns the same state', () => {
  const { state: start, lentils } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils]]);
  const { state: filled } = fillMenu(planned, newId);
  const again = fillMenu(filled, newId);
  assert.equal(again.state, filled);
  assert.equal(again.added, 0);
  assert.equal(again.already, 2);
});

test('setDish puts a dish by name in a meal, in place of its recipe', () => {
  const { state: start, lentils } = kitchen();
  const planned = plan(start, [[1, 'lunch', lentils]]);
  const before = structuredClone(planned);
  const { state, error } = setDish(planned, 1, 'lunch', '  Paella  ');
  assert.equal(error, undefined);
  assert.deepEqual(state.menu, [{ day: 1, meal: 'lunch', dish: 'Paella' }]);
  assert.equal(state.recipes, planned.recipes);
  assert.deepEqual(planned, before);
});

test('setMeal replaces the dish of a meal', () => {
  const { state: start, lentils } = kitchen();
  const state = setMeal(setDish(start, 0, 'dinner', 'Paella').state, 0, 'dinner', lentils).state;
  assert.deepEqual(state.menu, [{ day: 0, meal: 'dinner', recipe: lentils }]);
});

test('setDish rejects an empty name and a meal that does not exist', () => {
  const { state: start } = kitchen();
  const empty = setDish(start, 0, 'lunch', '   ');
  assert.deepEqual(empty.error, { key: 'error.nameRequired' });
  assert.equal(empty.state, start);
  const unknown = setDish(start, 7, 'lunch', 'Paella');
  assert.deepEqual(unknown.error, { key: 'error.unknownMeal' });
  assert.equal(unknown.state, start);
});

test('a dish counts as a planned meal and shows in menuWeek', () => {
  const { state: start, lentils } = kitchen();
  const state = setDish(plan(start, [[2, 'lunch', lentils]]), 2, 'dinner', 'Paella').state;
  assert.equal(mealCount(state), 2);
  assert.deepEqual(menuWeek(state)[2].meals, [
    { meal: 'lunch', recipe: state.recipes.find((recipe) => recipe.id === lentils), dish: null },
    { meal: 'dinner', recipe: null, dish: 'Paella' },
  ]);
});

test('fillMenu skips a dish', () => {
  const { state: start, lentils } = kitchen();
  const planned = setDish(plan(start, [[0, 'dinner', lentils]]), 0, 'lunch', 'Paella').state;
  const { state, error } = fillMenu(planned, newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.sent, [lentils]);
});

test('fillMenu rejects a menu of dishes only', () => {
  const { state: start } = kitchen();
  const planned = setDish(start, 0, 'lunch', 'Paella').state;
  const result = fillMenu(planned, newId);
  assert.deepEqual(result.error, { key: 'error.menuNoProducts' });
  assert.equal(result.state, planned);
});

test('dishRecipe creates the recipe and puts it in each meal of that dish', () => {
  const { state: start, lentils } = kitchen();
  const planned = [[0, 'lunch', 'Paella'], [3, 'dinner', 'paella'], [4, 'lunch', 'Gazpacho']].reduce(
    (current, [day, meal, name]) => setDish(current, day, meal, name).state,
    plan(start, [[1, 'lunch', lentils]]),
  );
  const before = structuredClone(planned);
  const { state, id, error } = dishRecipe(planned, 'Paella', () => 'paella-id');
  assert.equal(error, undefined);
  assert.equal(id, 'paella-id');
  assert.deepEqual(state.recipes.at(-1), { id: 'paella-id', name: 'Paella', products: [], url: '' });
  assert.deepEqual(state.menu, [
    { day: 0, meal: 'lunch', recipe: 'paella-id' },
    { day: 1, meal: 'lunch', recipe: lentils },
    { day: 3, meal: 'dinner', recipe: 'paella-id' },
    { day: 4, meal: 'lunch', dish: 'Gazpacho' },
  ]);
  assert.deepEqual(planned, before);
});

test('dishRecipe takes the recipe of the same name when it exists', () => {
  const { state: start, lentils } = kitchen();
  const planned = setDish(start, 5, 'dinner', 'LENTILS').state;
  const { state, id } = dishRecipe(planned, 'LENTILS', newId);
  assert.equal(id, lentils);
  assert.equal(state.recipes, planned.recipes);
  assert.deepEqual(state.menu, [{ day: 5, meal: 'dinner', recipe: lentils }]);
});

const withDishes = (state, entries) => entries.reduce((current, [day, meal, name]) => setDish(current, day, meal, name).state, state);

test('menuDishes gives each dish of the menu one time, in menu order, with its number of meals', () => {
  const { state: start, lentils } = kitchen();
  const state = withDishes(plan(start, [[0, 'lunch', lentils]]), [[4, 'lunch', 'Pisto'], [1, 'dinner', 'Paella'], [5, 'lunch', 'PAELLA']]);
  assert.deepEqual(menuDishes(state), [
    { name: 'Paella', meals: 2 },
    { name: 'Pisto', meals: 1 },
  ]);
});

test('menuDishes keeps the dishes whose name contains the query, with no case or accent distinction', () => {
  const { state: start } = kitchen();
  const state = withDishes(start, [[0, 'lunch', 'Paella'], [0, 'dinner', 'Crema de calabacín']]);
  assert.deepEqual(menuDishes(state, ' CALABACIN ').map(({ name }) => name), ['Crema de calabacín']);
  assert.deepEqual(menuDishes(state, 'xyz'), []);
  assert.deepEqual(menuDishes(kitchen().state), []);
});

test('dishRecipe turns a dish into a recipe by its name', () => {
  const { state: start } = kitchen();
  const planned = withDishes(start, [[0, 'lunch', 'Paella'], [2, 'dinner', 'paella']]);
  const { state, id } = dishRecipe(planned, 'PAELLA', () => 'paella-id');
  assert.equal(id, 'paella-id');
  assert.equal(state.recipes.at(-1).name, 'Paella');
  assert.deepEqual(state.menu, [
    { day: 0, meal: 'lunch', recipe: 'paella-id' },
    { day: 2, meal: 'dinner', recipe: 'paella-id' },
  ]);
});

test('dishRecipe rejects a name that is no dish of the menu', () => {
  const { state: start } = kitchen();
  const result = dishRecipe(start, 'Paella', newId);
  assert.deepEqual(result.error, { key: 'error.dishNotFound' });
  assert.equal(result.state, start);
});
