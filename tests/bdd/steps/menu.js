// The steps of the menu, `src/menu.js`, and of the menus of a shared list (`src/lists.js`). A week
// is its Monday, `YYYY-MM-DD`; a day is its English name. Today is `world.today`.

import assert from 'node:assert/strict';
import {
  setMeal,
  setDish,
  clearMeal,
  clearMenu,
  mealCount,
  plannedSlots,
  SLOTS,
  menuDishes,
  dishRecipe,
  fillMenu,
  basketPreview,
  filledRecipes,
  repeatWeek,
  menuWeeks,
  weekSteps,
  weekOf,
  weekDay,
  pastWeeks,
} from '#menu';
import { fillLists, repeatLists, onList, split, combine } from '#lists';
import { apply, names, dateOf } from '../world.js';
import { findRecipe } from './recipes.js';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// The index of a day name; an unknown name gives -1, which the menu refuses.
const dayOf = (name) => DAY_NAMES.indexOf(name);

const thisWeek = (world) => weekOf(dateOf(world.today));
const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const put = (world, result) => {
  assert.equal(result.error, undefined, 'The put of the meal failed');
  world.state = result.state;
};

// The id of a recipe, or an id that no recipe has, so that the menu refuses it.
const recipeId = (world, name) => world.state.recipes.find((recipe) => recipe.name === name)?.id ?? `missing:${name}`;

export const defineMenuSteps = ({ Given, When, Then }) => {
  Given('the {word} of {word} in the week {string} is the recipe {string}', (world, meal, day, week, name) => {
    put(world, setMeal(world.state, week, dayOf(day), meal, findRecipe(world, name).id));
  });
  Given('the {word} of {word} in the week {string} is the dish {string}', (world, meal, day, week, dish) => {
    put(world, setDish(world.state, week, dayOf(day), meal, dish));
  });
  Given('the shared list has the {word} of {word} in the week {string} as the recipe {string}', (world, meal, day, week, name) => {
    const { own, shared } = split(world.state, world.shared.base, world.shared.scope);
    const recipe = shared.recipes.find((candidate) => candidate.name === name);
    assert.ok(recipe, `No recipe "${name}" in the shared list`);
    const result = setMeal(shared, week, dayOf(day), meal, recipe.id);
    assert.equal(result.error, undefined);
    world.shared.base = result.state;
    world.state = combine(own, result.state, world.shared.scope);
  });

  When('I put the recipe {string} in the {word} of {word} in the week {string}', (world, name, meal, day, week) => {
    const id = recipeId(world, name);
    apply(world, (state) => setMeal(state, week, dayOf(day), meal, id));
  });
  When('I put the dish {string} in the {word} of {word} in the week {string}', (world, dish, meal, day, week) => {
    apply(world, (state) => setDish(state, week, dayOf(day), meal, dish));
  });
  When('I empty the {word} of {word} in the week {string}', (world, meal, day, week) => {
    apply(world, (state) => clearMeal(state, week, dayOf(day), meal));
  });
  // A delete on another device reaches this one by a sync: the recipe goes, its meals stay.
  When('a sync removes the recipe {string} that another device deleted', (world, name) => {
    const { id } = findRecipe(world, name);
    world.state = { ...world.state, recipes: world.state.recipes.filter((recipe) => recipe.id !== id) };
  });
  When('I empty the menu of the week {string}',(world, week) => apply(world, (state) => clearMenu(state, week)));
  When('I fill the basket from the week {string}', (world, week) => apply(world, (state) => fillMenu(state, week, world.newId)));
  When('I turn the dish {string} of the week {string} into a recipe', (world, name, week) => {
    apply(world, (state) => dishRecipe(state, week, name, world.newId));
  });
  When('I repeat the week {string} into {string}', (world, from, to) => apply(world, (state) => repeatWeek(state, from, to)));

  When('I fill the basket of both lists from the week {string}', (world, week) => {
    const { base, scope } = world.shared;
    apply(world, (state) => {
      const result = fillLists(state, base, scope, week, world.newId);
      return result.error ? { state, error: result.error } : result;
    });
  });
  When('I repeat the week {string} into {string} in both lists', (world, from, to) => {
    const { base, scope } = world.shared;
    apply(world, (state) => {
      const result = repeatLists(state, base, scope, from, to);
      return result.error ? { state, error: result.error } : result;
    });
  });
  When('I empty the own menu of the week {string}', (world, week) => {
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, 'own', (part) => clearMenu(part, week), base, scope));
  });

  Then('the week of {string} is {string}', (world, date, week) => {
    assert.equal(weekOf(dateOf(date)), week);
  });
  Then('the days of the week {string} run from {string} to {string}', (world, week, first, last) => {
    assert.equal(isoDate(weekDay(week, 0)), first);
    assert.equal(isoDate(weekDay(week, 6)), last);
  });
  Then('the week {string} has {int} meal(s)', (world, week, count) => {
    assert.equal(mealCount(world.state, week), count);
  });
  Then('the week {string} has {int} planned slot(s) of {int}', (world, week, count, slots) => {
    assert.equal(plannedSlots(world.state, week), count);
    assert.equal(SLOTS, slots);
  });
  Then('the {word} list has {int} meal(s) in the week {string}', (world, which, count, week) => {
    const part = split(world.state, world.shared.base, world.shared.scope)[which];
    assert.equal(mealCount(part, week), count);
  });
  Then('the repeat copied {int} meal(s)', (world, count) => {
    assert.equal(world.result.error, undefined);
    assert.equal(world.result.count, count);
  });
  Then('the basket of the week {string} adds {string}', (world, week, text) => {
    assert.deepEqual(basketPreview(world.state, week), names(text));
  });
  Then('the week {string} fills from {int} recipe(s)', (world, week, count) => {
    assert.equal(filledRecipes(world.state, week), count);
  });
  Then('from the week {string} the week bar steps to {string} and {string}', (world, shown, earlier, later) => {
    const steps = weekSteps(menuWeeks(world.state), shown, thisWeek(world));
    assert.deepEqual(steps, { earlier: earlier === 'none' ? null : earlier, later: later === 'none' ? null : later });
  });
  Then('the past weeks shown from the week {string} are:', (world, shown, table) => {
    const weeks = pastWeeks(world.state, thisWeek(world), shown).map(({ week, planned, names: list }) => ({
      week,
      planned: String(planned),
      names: list.join(', '),
    }));
    assert.deepEqual(weeks, table.hashes);
  });

  // The meals of every week, in menu order. A recipe shows by its name.
  Then('the menu is:', (world, table) => {
    const byId = new Map(world.state.recipes.map((recipe) => [recipe.id, recipe.name]));
    const shown = world.state.menu.map((entry) => ({
      week: entry.week,
      day: DAY_NAMES[entry.day],
      meal: entry.meal,
      recipe: entry.recipe ? byId.get(entry.recipe) ?? entry.recipe : '',
      dish: entry.dish ?? '',
    }));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the dishes of the week {string} are:', (world, week, table) => {
    const shown = menuDishes(world.state, week).map(({ name, meals }) => ({ name, meals: String(meals) }));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the dishes of the week {string} found for {string} are {string}', (world, week, query, text) => {
    assert.deepEqual(menuDishes(world.state, week, query).map(({ name }) => name), names(text));
  });
};
