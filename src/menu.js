import { fold } from '#store';
import { addRecipe, sendRecipe } from '#recipes';

// A week of 7 days, Monday first (day 0), with two meals a day.
export const DAYS = 7;
export const MEALS = ['lunch', 'dinner'];

// MENU-22: the weeks that a put of a meal keeps, its own week included.
export const KEPT_WEEKS = 26;

// MENU-23: the weeks after this one that Menú can show.
export const FUTURE_WEEKS = 4;

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// The date of the Monday of the week of `date`, local time, `YYYY-MM-DD` (MENU-1).
export const weekOf = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return isoDate(monday);
};

// The Monday `count` weeks after `week` (before it for a negative count).
export const addWeeks = (week, count) => {
  const [year, month, day] = week.split('-').map(Number);
  return isoDate(new Date(year, month - 1, day + count * 7));
};

// The local date of day `day` (0 is Monday) of `week`, for the dates of Menú (MENU-25).
export const weekDay = (week, day) => {
  const [year, month, date] = week.split('-').map(Number);
  return new Date(year, month - 1, date + day);
};

// A date `YYYY-MM-DD` that is a Monday.
export const isWeek = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && weekOf(new Date(`${value}T12:00:00`)) === value;

// An error is a message, as in `store.js`.
const reject = (state, key) => ({ state, error: { key } });

const isMeal = (day, meal) => Number.isInteger(day) && day >= 0 && day < DAYS && MEALS.includes(meal);

// Week, then day, then meal. A week is a date `YYYY-MM-DD`, so the text order is the date order.
export const mealOrder = (a, b) =>
  (a.week < b.week ? -1 : a.week > b.week ? 1 : 0) || a.day - b.day || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal);

const findRecipe = (state, id) => state.recipes.find((recipe) => recipe.id === id);

const sameSlot = (entry, week, day, meal) => entry.week === week && entry.day === day && entry.meal === meal;

const without = (menu, week, day, meal) => menu.filter((entry) => !sameSlot(entry, week, day, meal));

const findEntry = (state, week, day, meal) => state.menu.find((entry) => sameSlot(entry, week, day, meal));

// The meals of one week.
const ofWeek = (state, week) => state.menu.filter((entry) => entry.week === week);

// MENU-22: a put drops the meals of the weeks before the last KEPT_WEEKS.
const put = (state, entry) => {
  const first = addWeeks(entry.week, 1 - KEPT_WEEKS);
  const kept = without(state.menu, entry.week, entry.day, entry.meal).filter((other) => other.week >= first);
  return { state: { ...state, menu: [...kept, entry].sort(mealOrder) } };
};

// Puts the recipe in the meal, in place of the recipe or the dish that the meal had.
export const setMeal = (state, week, day, meal, recipeId) => {
  if (!isWeek(week) || !isMeal(day, meal)) return reject(state, 'error.unknownMeal');
  if (!findRecipe(state, recipeId)) return reject(state, 'error.recipeNotFound');
  return put(state, { week, day, meal, recipe: recipeId });
};

// Puts a dish, a name with no recipe, in the meal.
export const setDish = (state, week, day, meal, rawName) => {
  if (!isWeek(week) || !isMeal(day, meal)) return reject(state, 'error.unknownMeal');
  const dish = String(rawName ?? '').trim();
  if (!dish) return reject(state, 'error.nameRequired');
  return put(state, { week, day, meal, dish });
};

// Turns the dish of that name into a recipe of that name, or takes the recipe of that name, and puts
// it in each meal of that dish in the week, with no case distinction. `id` is the recipe.
export const dishRecipe = (state, week, rawName, newId) => {
  const key = String(rawName ?? '').trim().toLowerCase();
  const isDish = (entry) => entry.week === week && entry.dish?.toLowerCase() === key;
  const dish = state.menu.find(isDish)?.dish;
  if (!dish) return reject(state, 'error.dishNotFound');
  const existing = state.recipes.find((recipe) => recipe.name.toLowerCase() === key);
  const created = existing ? { state, id: existing.id } : addRecipe(state, dish, newId);
  const id = created.id;
  const menu = created.state.menu.map((entry) => (isDish(entry) ? { week, day: entry.day, meal: entry.meal, recipe: id } : entry));
  return { state: { ...created.state, menu }, id };
};

// The dishes of the week whose name contains the query, one time each with the spelling of its first
// meal, in menu order, with the number of their meals. All dishes for no query.
export const menuDishes = (state, week, query = '') => {
  const search = fold(query);
  const byName = new Map();
  for (const { dish } of ofWeek(state, week).filter((entry) => entry.dish)) {
    const key = dish.toLowerCase();
    const found = byName.get(key);
    byName.set(key, found ? { ...found, meals: found.meals + 1 } : { name: dish, meals: 1 });
  }
  return [...byName.values()].filter(({ name }) => fold(name).includes(search));
};

export const clearMeal = (state, week, day, meal) => {
  const menu = without(state.menu, week, day, meal);
  return { state: menu.length === state.menu.length ? state : { ...state, menu } };
};

// Vaciar menú empties the meals of one week, also those of a gone recipe; the other weeks stay.
export const clearMenu = (state, week) => {
  const menu = state.menu.filter((entry) => entry.week !== week);
  return { state: menu.length === state.menu.length ? state : { ...state, menu } };
};

// MENU-10: the meals of a week that hold a dish or a recipe that exists. A meal whose recipe is
// gone (a delete on another device, then a sync) shows free, so it is not planned.
const plannedOf = (state, week) => ofWeek(state, week).filter((entry) => entry.dish || findRecipe(state, entry.recipe));

export const mealCount = (state, week) => plannedOf(state, week).length;

// MENU-26: the slots of a week, and the slots that hold a meal. A slot with a meal of each list
// counts once.
export const SLOTS = DAYS * MEALS.length;
export const plannedSlots = (state, week) => new Set(plannedOf(state, week).map((entry) => `${entry.day}:${entry.meal}`)).size;

// MENU-24: the meals of `from` in place of the meals of `to`, each in its day and meal. `count` is the
// number of meals copied. A week with no meal gives `error.menuEmpty`.
export const repeatWeek = (state, from, to) => {
  if (!isWeek(to)) return reject(state, 'error.unknownMeal');
  const copies = ofWeek(state, from).map((entry) => ({ ...entry, week: to }));
  if (!copies.length) return reject(state, 'error.menuEmpty');
  const first = addWeeks(to, 1 - KEPT_WEEKS);
  const kept = state.menu.filter((entry) => entry.week !== to && entry.week >= first);
  return { state: { ...state, menu: [...kept, ...copies].sort(mealOrder) }, count: copies.length };
};

// MENU-23: the weeks that hold a meal, oldest first, each one time.
export const menuWeeks = (state) => [...new Set(state.menu.map((entry) => entry.week))].sort();

// MENU-23: the weeks that ‹ and › show from the week `shown`, null for a disabled button. `weeks`
// holds the weeks with a meal and `today` is this week. Before this week the buttons jump between
// the weeks with a meal; from this week they step one week, up to FUTURE_WEEKS after it.
export const weekSteps = (weeks, shown, today) => {
  const past = weeks.filter((week) => week < today);
  const earlier = shown > today ? addWeeks(shown, -1) : (past.filter((week) => week < shown).at(-1) ?? null);
  const later = shown < today ? (past.find((week) => week > shown) ?? today) : shown < addWeeks(today, FUTURE_WEEKS) ? addWeeks(shown, 1) : null;
  return { earlier, later };
};

// The 7 days of a week, each with its two meals and the recipe and the dish of each meal, or null.
export const menuWeek = (state, week) =>
  Array.from({ length: DAYS }, (_, day) => ({
    day,
    meals: MEALS.map((meal) => {
      const entry = findEntry(state, week, day, meal);
      return { meal, recipe: entry?.recipe ? (findRecipe(state, entry.recipe) ?? null) : null, dish: entry?.dish ?? null };
    }),
  }));

const weekRecipes = (state, week) => [...new Set(ofWeek(state, week).filter((entry) => entry.recipe).map((entry) => entry.recipe))];

// MENU-21: the recipes of the week that give a product to Llenar cesta, each one time.
export const filledRecipes = (state, week) => weekRecipes(state, week).filter((id) => findRecipe(state, id)?.products.length).length;

// MENU-27: the past weeks of Semanas anteriores, newest first, at most `count`, with no week of
// `skip`: each week before `today` that holds a meal, its planned slots (MENU-26) and the names of
// its meals in menu order, each name one time with no case distinction.
export const pastWeeks = (state, today, skip = null, count = 3) =>
  menuWeeks(state)
    .filter((week) => week < today && week !== skip)
    .reverse()
    .slice(0, count)
    .map((week) => {
      const seen = new Set();
      const names = ofWeek(state, week)
        .sort(mealOrder)
        .map((entry) => (entry.recipe ? findRecipe(state, entry.recipe)?.name : entry.dish))
        .filter((name) => {
          const key = name?.toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      return { week, planned: plannedSlots(state, week), names };
    });

// Sends each recipe of the week to Active, one time, in menu order, as `sendRecipe` sends one.
// A dish and a recipe with no product are skipped. `added` and `already` are the sums of the sends. A fill
// that changes nothing returns the same state object.
export const fillMenu = (state, week, newId) => {
  if (!mealCount(state, week)) return reject(state, 'error.menuEmpty');
  const ids = weekRecipes(state, week);
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

// The products that `Llenar cesta` puts to buy, for the card Generación automática de cesta (MENU-21): in menu and
// product order, each name one time, those that are not to buy in Active yet. Empty when the fill
// has nothing to send.
export const basketPreview = (state, week) => {
  const result = fillMenu(state, week, () => 'preview');
  if (result.error) return [];
  const toBuy = (items) => new Set(items.filter((item) => item.list === 'active' && !item.bought).map((item) => item.name.toLowerCase()));
  const before = toBuy(state.items);
  const after = toBuy(result.state.items);
  const ids = weekRecipes(state, week);
  const products = ids.flatMap((id) => findRecipe(state, id)?.products ?? []);
  const seen = new Set();
  return products.filter((product) => {
    const key = product.toLowerCase();
    if (seen.has(key) || before.has(key) || !after.has(key)) return false;
    seen.add(key);
    return true;
  });
};
