// The steps of the menu, `src/menu.js`. A week is its Monday, `YYYY-MM-DD`; a day is its English
// name.

import assert from 'node:assert/strict';
import { setMeal, setDish, menuDishes } from '#menu';
import { names } from '../world.js';
import { findRecipe } from './recipes.js';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const dayOf = (name) => {
  const day = DAY_NAMES.indexOf(name);
  assert.ok(day >= 0, `No day named ${name}`);
  return day;
};

const put = (world, result) => {
  assert.equal(result.error, undefined, 'The put of the meal failed');
  world.state = result.state;
};

export const defineMenuSteps = ({ Given, Then }) => {
  Given('the {word} of {word} in the week {string} is the recipe {string}', (world, meal, day, week, name) => {
    put(world, setMeal(world.state, week, dayOf(day), meal, findRecipe(world, name).id));
  });
  Given('the {word} of {word} in the week {string} is the dish {string}', (world, meal, day, week, dish) => {
    put(world, setDish(world.state, week, dayOf(day), meal, dish));
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
