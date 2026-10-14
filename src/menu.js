import { sendRecipe } from '#recipes';

// A week of 7 days, Monday first (day 0), with two meals a day.
export const DAYS = 7;
export const MEALS = ['lunch', 'dinner'];

// An error is a message, as in `store.js`.
const reject = (state, key) => ({ state, error: { key } });

const isMeal = (day, meal) => Number.isInteger(day) && day >= 0 && day < DAYS && MEALS.includes(meal);

const order = (entry) => entry.day * MEALS.length + MEALS.indexOf(entry.meal);

const findRecipe = (state, id) => state.recipes.find((recipe) => recipe.id === id);

const without = (menu, day, meal) => menu.filter((entry) => entry.day !== day || entry.meal !== meal);

// Puts the recipe in the meal, in place of the recipe that the meal had.
export const setMeal = (state, day, meal, recipeId) => {
  if (!isMeal(day, meal)) return reject(state, 'error.unknownMeal');
  if (!findRecipe(state, recipeId)) return reject(state, 'error.recipeNotFound');
  const menu = [...without(state.menu, day, meal), { day, meal, recipe: recipeId }].sort((a, b) => order(a) - order(b));
  return { state: { ...state, menu } };
};

// An empty meal returns the same state object.
export const clearMeal = (state, day, meal) => {
  const menu = without(state.menu, day, meal);
  return { state: menu.length === state.menu.length ? state : { ...state, menu } };
};

export const clearMenu = (state) => ({ state: state.menu.length ? { ...state, menu: [] } : state });

export const mealCount = (state) => state.menu.length;

// The 7 days, each with its two meals and the recipe of each meal, or null.
export const menuWeek = (state) =>
  Array.from({ length: DAYS }, (_, day) => ({
    day,
    meals: MEALS.map((meal) => {
      const entry = state.menu.find((candidate) => candidate.day === day && candidate.meal === meal);
      return { meal, recipe: entry ? (findRecipe(state, entry.recipe) ?? null) : null };
    }),
  }));

// Sends each recipe of the menu to Active, one time, in menu order, as `sendRecipe` sends one.
// A recipe with no product is skipped. `added` and `already` are the sums of the sends. A fill
// that changes nothing returns the same state object.
export const fillMenu = (state, newId) => {
  if (!state.menu.length) return reject(state, 'error.menuEmpty');
  const ids = [...new Set(state.menu.map((entry) => entry.recipe))];
  const planned = ids.map((id) => findRecipe(state, id)).filter((recipe) => recipe?.products.length);
  if (!planned.length) return reject(state, 'error.recipeEmpty');
  let next = state;
  let added = 0;
  let already = 0;
  for (const recipe of planned) {
    const result = sendRecipe(next, recipe.id, newId);
    if (result.error) return { state, error: result.error };
    next = result.state;
    added += result.added;
    already += result.already;
  }
  return { state: next, added, already };
};
