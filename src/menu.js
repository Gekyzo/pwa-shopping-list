import { fold } from '#store';
import { addRecipe, sendRecipe } from '#recipes';

// A week of 7 days, Monday first (day 0), with two meals a day.
export const DAYS = 7;
export const MEALS = ['lunch', 'dinner'];

// An error is a message, as in `store.js`.
const reject = (state, key) => ({ state, error: { key } });

const isMeal = (day, meal) => Number.isInteger(day) && day >= 0 && day < DAYS && MEALS.includes(meal);

const order = (entry) => entry.day * MEALS.length + MEALS.indexOf(entry.meal);

const findRecipe = (state, id) => state.recipes.find((recipe) => recipe.id === id);

const without = (menu, day, meal) => menu.filter((entry) => entry.day !== day || entry.meal !== meal);

const findEntry = (state, day, meal) => state.menu.find((entry) => entry.day === day && entry.meal === meal);

const put = (state, entry) => ({
  state: { ...state, menu: [...without(state.menu, entry.day, entry.meal), entry].sort((a, b) => order(a) - order(b)) },
});

// Puts the recipe in the meal, in place of the recipe or the dish that the meal had.
export const setMeal = (state, day, meal, recipeId) => {
  if (!isMeal(day, meal)) return reject(state, 'error.unknownMeal');
  if (!findRecipe(state, recipeId)) return reject(state, 'error.recipeNotFound');
  return put(state, { day, meal, recipe: recipeId });
};

// Puts a dish, a name with no recipe, in the meal.
export const setDish = (state, day, meal, rawName) => {
  if (!isMeal(day, meal)) return reject(state, 'error.unknownMeal');
  const dish = String(rawName ?? '').trim();
  if (!dish) return reject(state, 'error.nameRequired');
  return put(state, { day, meal, dish });
};

// Turns the dish of that name into a recipe of that name, or takes the recipe of that name, and puts
// it in each meal of that dish, with no case distinction. `id` is the recipe.
export const dishRecipe = (state, rawName, newId) => {
  const key = String(rawName ?? '').trim().toLowerCase();
  const dish = state.menu.find((entry) => entry.dish?.toLowerCase() === key)?.dish;
  if (!dish) return reject(state, 'error.dishNotFound');
  const existing = state.recipes.find((recipe) => recipe.name.toLowerCase() === key);
  const created = existing ? { state, id: existing.id } : addRecipe(state, dish, newId);
  const id = created.id;
  const menu = created.state.menu.map((entry) => (entry.dish?.toLowerCase() === key ? { day: entry.day, meal: entry.meal, recipe: id } : entry));
  return { state: { ...created.state, menu }, id };
};

// The dishes of the menu whose name contains the query, one time each with the spelling of its first
// meal, in menu order, with the number of their meals. All dishes for no query.
export const menuDishes = (state, query = '') => {
  const search = fold(query);
  const byName = new Map();
  for (const { dish } of state.menu.filter((entry) => entry.dish)) {
    const key = dish.toLowerCase();
    const found = byName.get(key);
    byName.set(key, found ? { ...found, meals: found.meals + 1 } : { name: dish, meals: 1 });
  }
  return [...byName.values()].filter(({ name }) => fold(name).includes(search));
};

export const clearMeal = (state, day, meal) => {
  const menu = without(state.menu, day, meal);
  return { state: menu.length === state.menu.length ? state : { ...state, menu } };
};

export const clearMenu = (state) => ({ state: state.menu.length ? { ...state, menu: [] } : state });

export const mealCount = (state) => state.menu.length;

// The 7 days, each with its two meals and the recipe and the dish of each meal, or null.
export const menuWeek = (state) =>
  Array.from({ length: DAYS }, (_, day) => ({
    day,
    meals: MEALS.map((meal) => {
      const entry = findEntry(state, day, meal);
      return { meal, recipe: entry?.recipe ? (findRecipe(state, entry.recipe) ?? null) : null, dish: entry?.dish ?? null };
    }),
  }));

// Sends each recipe of the menu to Active, one time, in menu order, as `sendRecipe` sends one.
// A dish and a recipe with no product are skipped. `added` and `already` are the sums of the sends. A fill
// that changes nothing returns the same state object.
export const fillMenu = (state, newId) => {
  if (!state.menu.length) return reject(state, 'error.menuEmpty');
  const ids = [...new Set(state.menu.filter((entry) => entry.recipe).map((entry) => entry.recipe))];
  const planned = ids.map((id) => findRecipe(state, id)).filter((recipe) => recipe?.products.length);
  if (!planned.length) return reject(state, 'error.menuNoProducts');
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
