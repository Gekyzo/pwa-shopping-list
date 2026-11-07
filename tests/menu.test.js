import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, addItem } from '#store';
import { addRecipe, addRecipeProduct } from '#recipes';
import { DAYS, MEALS, KEPT_WEEKS, FUTURE_WEEKS, weekSteps, weekOf, addWeeks, weekDay, isWeek, menuWeeks, repeatWeek, setMeal, setDish, dishRecipe, menuDishes, clearMeal, clearMenu, mealCount, plannedSlots, SLOTS, menuWeek, fillMenu, basketPreview } from '#menu';

// The Monday of the week of the tests.
const W = '2026-11-02';

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

const plan = (state, entries) => entries.reduce((current, [day, meal, id]) => setMeal(current, W, day, meal, id).state, state);

test('the week has 7 days and 2 meals', () => {
  assert.equal(DAYS, 7);
  assert.deepEqual(MEALS, ['lunch', 'dinner']);
});

test('setMeal puts a recipe in a meal', () => {
  const { state: start, lentils } = kitchen();
  const before = structuredClone(start);
  const { state, error } = setMeal(start, W, 2, 'dinner', lentils);
  assert.equal(error, undefined);
  assert.deepEqual(state.menu, [{ week: W, day: 2, meal: 'dinner', recipe: lentils }]);
  assert.deepEqual(start, before);
});

test('setMeal replaces the recipe of a meal', () => {
  const { state: start, lentils, omelette } = kitchen();
  const state = plan(start, [[0, 'lunch', lentils], [0, 'lunch', omelette]]);
  assert.deepEqual(state.menu, [{ week: W, day: 0, meal: 'lunch', recipe: omelette }]);
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
  const result = setMeal(start, W, 0, 'lunch', 'nope');
  assert.deepEqual(result.error, { key: 'error.recipeNotFound' });
  assert.equal(result.state, start);
});

test('setMeal rejects a day or a meal that does not exist', () => {
  const { state: start, lentils } = kitchen();
  for (const [day, meal] of [[7, 'lunch'], [-1, 'lunch'], [1.5, 'lunch'], [0, 'breakfast']]) {
    const result = setMeal(start, W, day, meal, lentils);
    assert.deepEqual(result.error, { key: 'error.unknownMeal' }, `${day} ${meal}`);
    assert.equal(result.state, start);
  }
});

test('clearMeal empties a meal', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils], [0, 'dinner', omelette]]);
  const before = structuredClone(planned);
  const { state } = clearMeal(planned, W, 0, 'lunch');
  assert.deepEqual(state.menu, [{ week: W, day: 0, meal: 'dinner', recipe: omelette }]);
  assert.deepEqual(planned, before);
});

test('clearMeal of an empty meal returns the same state', () => {
  const { state: start } = kitchen();
  assert.equal(clearMeal(start, W, 4, 'dinner').state, start);
});

test('clearMenu empties the menu', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils], [5, 'dinner', omelette]]);
  const { state } = clearMenu(planned, W);
  assert.deepEqual(state.menu, []);
  assert.equal(state.recipes, planned.recipes);
  assert.equal(planned.menu.length, 2);
});

test('clearMenu of an empty menu returns the same state', () => {
  const { state: start } = kitchen();
  assert.equal(clearMenu(start, W).state, start);
});

test('mealCount counts the planned meals', () => {
  const { state: start, lentils } = kitchen();
  assert.equal(mealCount(start, W), 0);
  assert.equal(mealCount(plan(start, [[0, 'lunch', lentils], [6, 'dinner', lentils]]), W), 2);
});

test('menuWeek gives each day with its two meals and their recipes', () => {
  const { state: start, lentils, omelette } = kitchen();
  const state = plan(start, [[0, 'dinner', omelette], [6, 'lunch', lentils]]);
  const week = menuWeek(state, W);
  assert.equal(week.length, 7);
  assert.deepEqual(week.map(({ day }) => day), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(week[0].meals.map(({ meal, recipe }) => [meal, recipe?.name ?? null]), [['lunch', null], ['dinner', 'Omelette']]);
  assert.deepEqual(week[6].meals.map(({ meal, recipe }) => [meal, recipe?.name ?? null]), [['lunch', 'Lentils'], ['dinner', null]]);
});

test('fillMenu sends each recipe of the menu to Active, one time, in menu order', () => {
  const { state: start, lentils, omelette } = kitchen();
  const planned = plan(start, [[2, 'lunch', omelette], [0, 'lunch', lentils], [4, 'dinner', lentils]]);
  const before = structuredClone(planned);
  const { state, added, already, error } = fillMenu(planned, W, newId);
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
  const { state, added, already } = fillMenu(planned, W, newId);
  assert.deepEqual(state.items.map(({ name, list }) => [name, list]), [['Lentils', 'active'], ['Onion', 'active']]);
  assert.equal(added, 1);
  assert.equal(already, 1);
});

test('fillMenu skips a recipe with no product', () => {
  const { state: start, lentils, empty } = kitchen();
  const planned = plan(start, [[0, 'lunch', empty], [0, 'dinner', lentils]]);
  const { state, error } = fillMenu(planned, W, newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.sent, [lentils]);
});

test('fillMenu rejects an empty menu', () => {
  const { state: start } = kitchen();
  const result = fillMenu(start, W, newId);
  assert.deepEqual(result.error, { key: 'error.menuEmpty' });
  assert.equal(result.state, start);
});

test('fillMenu rejects a menu whose recipes have no product', () => {
  const { state: start, empty } = kitchen();
  const planned = plan(start, [[1, 'lunch', empty]]);
  const result = fillMenu(planned, W, newId);
  assert.deepEqual(result.error, { key: 'error.menuNoProducts' });
  assert.equal(result.state, planned);
});

test('a second fillMenu changes nothing and returns the same state', () => {
  const { state: start, lentils } = kitchen();
  const planned = plan(start, [[0, 'lunch', lentils]]);
  const { state: filled } = fillMenu(planned, W, newId);
  const again = fillMenu(filled, W, newId);
  assert.equal(again.state, filled);
  assert.equal(again.added, 0);
  assert.equal(again.already, 2);
});

test('setDish puts a dish by name in a meal, in place of its recipe', () => {
  const { state: start, lentils } = kitchen();
  const planned = plan(start, [[1, 'lunch', lentils]]);
  const before = structuredClone(planned);
  const { state, error } = setDish(planned, W, 1, 'lunch', '  Paella  ');
  assert.equal(error, undefined);
  assert.deepEqual(state.menu, [{ week: W, day: 1, meal: 'lunch', dish: 'Paella' }]);
  assert.equal(state.recipes, planned.recipes);
  assert.deepEqual(planned, before);
});

test('setMeal replaces the dish of a meal', () => {
  const { state: start, lentils } = kitchen();
  const state = setMeal(setDish(start, W, 0, 'dinner', 'Paella').state, W, 0, 'dinner', lentils).state;
  assert.deepEqual(state.menu, [{ week: W, day: 0, meal: 'dinner', recipe: lentils }]);
});

test('setDish rejects an empty name and a meal that does not exist', () => {
  const { state: start } = kitchen();
  const empty = setDish(start, W, 0, 'lunch', '   ');
  assert.deepEqual(empty.error, { key: 'error.nameRequired' });
  assert.equal(empty.state, start);
  const unknown = setDish(start, W, 7, 'lunch', 'Paella');
  assert.deepEqual(unknown.error, { key: 'error.unknownMeal' });
  assert.equal(unknown.state, start);
});

test('a dish counts as a planned meal and shows in menuWeek', () => {
  const { state: start, lentils } = kitchen();
  const state = setDish(plan(start, [[2, 'lunch', lentils]]), W, 2, 'dinner', 'Paella').state;
  assert.equal(mealCount(state, W), 2);
  assert.deepEqual(menuWeek(state, W)[2].meals, [
    { meal: 'lunch', recipe: state.recipes.find((recipe) => recipe.id === lentils), dish: null },
    { meal: 'dinner', recipe: null, dish: 'Paella' },
  ]);
});

test('fillMenu skips a dish', () => {
  const { state: start, lentils } = kitchen();
  const planned = setDish(plan(start, [[0, 'dinner', lentils]]), W, 0, 'lunch', 'Paella').state;
  const { state, error } = fillMenu(planned, W, newId);
  assert.equal(error, undefined);
  assert.deepEqual(state.sent, [lentils]);
});

test('fillMenu rejects a menu of dishes only', () => {
  const { state: start } = kitchen();
  const planned = setDish(start, W, 0, 'lunch', 'Paella').state;
  const result = fillMenu(planned, W, newId);
  assert.deepEqual(result.error, { key: 'error.menuNoProducts' });
  assert.equal(result.state, planned);
});

test('dishRecipe creates the recipe and puts it in each meal of that dish', () => {
  const { state: start, lentils } = kitchen();
  const planned = [[0, 'lunch', 'Paella'], [3, 'dinner', 'paella'], [4, 'lunch', 'Gazpacho']].reduce(
    (current, [day, meal, name]) => setDish(current, W, day, meal, name).state,
    plan(start, [[1, 'lunch', lentils]]),
  );
  const before = structuredClone(planned);
  const { state, id, error } = dishRecipe(planned, W, 'Paella', () => 'paella-id');
  assert.equal(error, undefined);
  assert.equal(id, 'paella-id');
  assert.deepEqual(state.recipes.at(-1), { id: 'paella-id', name: 'Paella', products: [], url: '' });
  assert.deepEqual(state.menu, [
    { week: W, day: 0, meal: 'lunch', recipe: 'paella-id' },
    { week: W, day: 1, meal: 'lunch', recipe: lentils },
    { week: W, day: 3, meal: 'dinner', recipe: 'paella-id' },
    { week: W, day: 4, meal: 'lunch', dish: 'Gazpacho' },
  ]);
  assert.deepEqual(planned, before);
});

test('dishRecipe takes the recipe of the same name when it exists', () => {
  const { state: start, lentils } = kitchen();
  const planned = setDish(start, W, 5, 'dinner', 'LENTILS').state;
  const { state, id } = dishRecipe(planned, W, 'LENTILS', newId);
  assert.equal(id, lentils);
  assert.equal(state.recipes, planned.recipes);
  assert.deepEqual(state.menu, [{ week: W, day: 5, meal: 'dinner', recipe: lentils }]);
});

const withDishes = (state, entries) => entries.reduce((current, [day, meal, name]) => setDish(current, W, day, meal, name).state, state);

test('menuDishes gives each dish of the menu one time, in menu order, with its number of meals', () => {
  const { state: start, lentils } = kitchen();
  const state = withDishes(plan(start, [[0, 'lunch', lentils]]), [[4, 'lunch', 'Pisto'], [1, 'dinner', 'Paella'], [5, 'lunch', 'PAELLA']]);
  assert.deepEqual(menuDishes(state, W), [
    { name: 'Paella', meals: 2 },
    { name: 'Pisto', meals: 1 },
  ]);
});

test('menuDishes keeps the dishes whose name contains the query, with no case or accent distinction', () => {
  const { state: start } = kitchen();
  const state = withDishes(start, [[0, 'lunch', 'Paella'], [0, 'dinner', 'Crema de calabacín']]);
  assert.deepEqual(menuDishes(state, W, ' CALABACIN ').map(({ name }) => name), ['Crema de calabacín']);
  assert.deepEqual(menuDishes(state, W, 'xyz'), []);
  assert.deepEqual(menuDishes(kitchen().state, W), []);
});

test('dishRecipe turns a dish into a recipe by its name', () => {
  const { state: start } = kitchen();
  const planned = withDishes(start, [[0, 'lunch', 'Paella'], [2, 'dinner', 'paella']]);
  const { state, id } = dishRecipe(planned, W, 'PAELLA', () => 'paella-id');
  assert.equal(id, 'paella-id');
  assert.equal(state.recipes.at(-1).name, 'Paella');
  assert.deepEqual(state.menu, [
    { week: W, day: 0, meal: 'lunch', recipe: 'paella-id' },
    { week: W, day: 2, meal: 'dinner', recipe: 'paella-id' },
  ]);
});

test('dishRecipe rejects a name that is no dish of the menu', () => {
  const { state: start } = kitchen();
  const result = dishRecipe(start, W, 'Paella', newId);
  assert.deepEqual(result.error, { key: 'error.dishNotFound' });
  assert.equal(result.state, start);
});

test('basketPreview lists the products the fill puts to buy, in menu order, each one time (MENU-21)', () => {
  const { state, lentils, omelette } = kitchen();
  const planned = plan(state, [[0, 'lunch', omelette], [1, 'dinner', lentils]]);
  assert.deepEqual(basketPreview(planned, W), ['Eggs', 'Onion', 'Lentils']);
});

test('basketPreview leaves out a product already to buy, and keeps one that is bought or saved', () => {
  const { state, lentils } = kitchen();
  let planned = plan(state, [[0, 'lunch', lentils]]);
  planned = addItem(planned, 'onion', newId).state;
  assert.deepEqual(basketPreview(planned, W), ['Lentils']);
  const bought = { ...planned, items: planned.items.map((item) => ({ ...item, bought: true })) };
  assert.deepEqual(basketPreview(bought, W), ['Lentils', 'Onion']);
});

test('basketPreview is empty with no menu, only dishes, or recipes with no product', () => {
  const { state, empty } = kitchen();
  assert.deepEqual(basketPreview(state, W), []);
  assert.deepEqual(basketPreview(plan(state, [[0, 'lunch', empty]]), W), []);
  assert.deepEqual(basketPreview(setDish(state, W, 0, 'lunch', 'Pizza').state, W), []);
});

// MENU-1, MENU-22, MENU-23: dated weeks.
const LAST = '2026-10-26';

test('weekOf gives the Monday of the week of a date, in local time', () => {
  assert.equal(weekOf(new Date(2026, 10, 2)), '2026-11-02');
  assert.equal(weekOf(new Date(2026, 10, 8, 23, 59)), '2026-11-02');
  assert.equal(weekOf(new Date(2026, 10, 9, 0, 0)), '2026-11-09');
  assert.equal(weekOf(new Date(2026, 0, 1)), '2025-12-29');
});

test('addWeeks steps whole weeks across a month and a year', () => {
  assert.equal(addWeeks('2026-11-02', -1), '2026-10-26');
  assert.equal(addWeeks('2025-12-29', 1), '2026-01-05');
  assert.equal(addWeeks('2026-11-02', 0), '2026-11-02');
});

test('isWeek takes only a date that is a Monday', () => {
  assert.ok(isWeek('2026-11-02'));
  for (const value of ['2026-11-03', '2026-13-02', '02-11-2026', '', null, 20261102]) assert.equal(isWeek(value), false, String(value));
});

test('a meal of another week does not fill the slot of this week', () => {
  const { state: start, lentils, omelette } = kitchen();
  const last = setMeal(start, LAST, 0, 'lunch', lentils).state;
  const state = setMeal(last, W, 0, 'lunch', omelette).state;
  assert.deepEqual(state.menu, [
    { week: LAST, day: 0, meal: 'lunch', recipe: lentils },
    { week: W, day: 0, meal: 'lunch', recipe: omelette },
  ]);
  assert.equal(mealCount(state, W), 1);
  assert.equal(mealCount(state, '2026-11-09'), 0);
  assert.equal(menuWeek(state, '2026-11-09')[0].meals[0].recipe, null);
});

test('setMeal and setDish reject a week that is not a Monday', () => {
  const { state: start, lentils } = kitchen();
  assert.deepEqual(setMeal(start, '2026-11-03', 0, 'lunch', lentils).error, { key: 'error.unknownMeal' });
  assert.deepEqual(setDish(start, undefined, 0, 'lunch', 'Paella').error, { key: 'error.unknownMeal' });
});

test('clearMenu, fillMenu and menuDishes act on one week only', () => {
  const { state: start, lentils } = kitchen();
  const last = setDish(setMeal(start, LAST, 1, 'lunch', lentils).state, LAST, 2, 'lunch', 'Paella').state;
  assert.equal(clearMenu(last, W).state, last);
  assert.deepEqual(fillMenu(last, W, newId).error, { key: 'error.menuEmpty' });
  assert.deepEqual(menuDishes(last, W), []);
  assert.deepEqual(menuDishes(last, LAST), [{ name: 'Paella', meals: 1 }]);
  const planned = setMeal(last, W, 0, 'dinner', lentils).state;
  assert.deepEqual(clearMenu(planned, W).state.menu, last.menu);
});

test('dishRecipe turns the dishes of its week only', () => {
  const { state: start } = kitchen();
  const both = setDish(setDish(start, LAST, 0, 'lunch', 'Paella').state, W, 1, 'lunch', 'Paella').state;
  const { state, id } = dishRecipe(both, W, 'Paella', () => 'paella-id');
  assert.equal(id, 'paella-id');
  assert.deepEqual(state.menu, [
    { week: LAST, day: 0, meal: 'lunch', dish: 'Paella' },
    { week: W, day: 1, meal: 'lunch', recipe: 'paella-id' },
  ]);
});

test(`a put keeps the meals of the last ${KEPT_WEEKS} weeks and drops the older ones`, () => {
  const { state: start, lentils } = kitchen();
  const oldest = addWeeks(W, 1 - KEPT_WEEKS);
  const tooOld = addWeeks(W, -KEPT_WEEKS);
  const past = [tooOld, oldest].reduce((current, week) => setMeal(current, week, 0, 'lunch', lentils).state, start);
  const state = setMeal(past, W, 0, 'lunch', lentils).state;
  assert.deepEqual(menuWeeks(state), [oldest, W]);
});

test('menuWeeks gives each week with a meal one time, oldest first', () => {
  const { state: start, lentils } = kitchen();
  assert.deepEqual(menuWeeks(start), []);
  const state = [[W, 0], [LAST, 3], [W, 2], [LAST, 1]].reduce((current, [week, day]) => setMeal(current, week, day, 'lunch', lentils).state, start);
  assert.deepEqual(menuWeeks(state), [LAST, W]);
});

test('repeatWeek puts the meals of a past week in place of the meals of this week (MENU-24)', () => {
  const { state: start, lentils, omelette } = kitchen();
  const past = setDish(setMeal(start, LAST, 0, 'lunch', lentils).state, LAST, 3, 'dinner', 'Sopa').state;
  const planned = setMeal(setMeal(past, W, 0, 'lunch', omelette).state, W, 5, 'lunch', omelette).state;
  const before = structuredClone(planned);
  const { state, count, error } = repeatWeek(planned, LAST, W);
  assert.equal(error, undefined);
  assert.equal(count, 2);
  assert.deepEqual(state.menu, [
    { week: LAST, day: 0, meal: 'lunch', recipe: lentils },
    { week: LAST, day: 3, meal: 'dinner', dish: 'Sopa' },
    { week: W, day: 0, meal: 'lunch', recipe: lentils },
    { week: W, day: 3, meal: 'dinner', dish: 'Sopa' },
  ]);
  assert.deepEqual(planned, before);
});

test('repeatWeek rejects a week with no meal and a target that is not a Monday', () => {
  const { state: start, lentils } = kitchen();
  const planned = setMeal(start, W, 0, 'lunch', lentils).state;
  const empty = repeatWeek(planned, LAST, W);
  assert.deepEqual(empty.error, { key: 'error.menuEmpty' });
  assert.equal(empty.state, planned);
  assert.deepEqual(repeatWeek(planned, W, '2026-11-03').error, { key: 'error.unknownMeal' });
});

test('weekDay gives the local date of each day of a week, across a month and a year', () => {
  assert.deepEqual([0, 6].map((day) => weekDay('2026-11-02', day).toDateString()), ['Mon Nov 02 2026', 'Sun Nov 08 2026']);
  assert.equal(weekDay('2026-12-28', 4).toDateString(), 'Fri Jan 01 2027');
  assert.equal(weekDay('2026-03-30', 6).toDateString(), 'Sun Apr 05 2026');
});

test('the slots of a week are 14, and a planned slot counts once (MENU-26)', () => {
  const { state, lentils, omelette } = kitchen();
  assert.equal(SLOTS, 14);
  assert.equal(plannedSlots(state, W), 0);
  const planned = plan(state, [[0, 'lunch', lentils], [0, 'dinner', omelette], [3, 'lunch', lentils]]);
  assert.equal(plannedSlots(planned, W), 3);
  assert.equal(plannedSlots(planned, addWeeks(W, 1)), 0);
});

test('a slot with a meal of each list counts once (MENU-26, MENU-20)', () => {
  const { state, lentils, omelette } = kitchen();
  const own = plan(state, [[1, 'lunch', lentils]]);
  const both = { ...own, menu: [...own.menu, { ...own.menu[0], recipe: omelette, shared: true }] };
  assert.equal(plannedSlots(both, W), 1);
  assert.equal(plannedSlots(own, W), 1);
  assert.equal(own.menu.length, 1);
});

test(`weekSteps steps one week at a time from this week up to ${FUTURE_WEEKS} weeks after it (MENU-23)`, () => {
  const next = addWeeks(W, 1);
  const last = addWeeks(W, FUTURE_WEEKS);
  assert.deepEqual(weekSteps([], W, W), { earlier: null, later: next });
  assert.deepEqual(weekSteps([], next, W), { earlier: W, later: addWeeks(W, 2) });
  assert.deepEqual(weekSteps([], last, W), { earlier: addWeeks(last, -1), later: null });
});

test('weekSteps jumps between the past weeks with a meal, and from the last one to this week', () => {
  const older = addWeeks(W, -5);
  const weeks = [older, LAST, W, addWeeks(W, 2)];
  assert.deepEqual(weekSteps(weeks, W, W), { earlier: LAST, later: addWeeks(W, 1) });
  assert.deepEqual(weekSteps(weeks, LAST, W), { earlier: older, later: W });
  assert.deepEqual(weekSteps(weeks, older, W), { earlier: null, later: LAST });
});

test('a put in a later week keeps the meals of this week', () => {
  const { state: start, lentils, omelette } = kitchen();
  const now = setMeal(start, W, 0, 'lunch', lentils).state;
  const later = addWeeks(W, FUTURE_WEEKS);
  const state = setMeal(now, later, 0, 'lunch', omelette).state;
  assert.deepEqual(menuWeeks(state), [W, later]);
  assert.equal(mealCount(state, W), 1);
});
