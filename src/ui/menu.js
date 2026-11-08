import * as recipes from '#recipes';
import * as menu from '#menu';
import { intlTag } from '#i18n';
import { listOf, listPart } from '#lists';
import { $, el, state, ui, t, lang, undoState, showToast, apply, render, onOwn, onListOf, fillMenus, repeatMenus, thisWeek, shownWeek, pastShown } from '#ui/context';
import { sendText, recipeFromDish } from '#ui/recipes';
import { showView } from '#ui/nav';
import { tagNode } from '#ui/rows';
import { icon } from '#ui/controls';
import { recipeTag } from '#ui/view';

const LISTS = ['own', 'shared'];

// MENU-20: each list has its own week, so a slot may hold two meals, one of each list. The meals of
// a slot are `{ which, shared, recipe, dish }`, the own one first. With no share the shared week is
// empty. The week is the one in view (MENU-23).
const week = () => {
  const weeks = LISTS.map((which) => menu.menuWeek(listPart(state, which), shownWeek()));
  return weeks[0].map(({ day, meals }) => ({
    day,
    meals: meals.map(({ meal }, index) => ({
      meal,
      planned: LISTS.flatMap((which, list) => {
        const { recipe, dish } = weeks[list][day].meals[index];
        return recipe || dish ? [{ which, shared: which === 'shared', recipe, dish }] : [];
      }),
    })),
  }));
};

// The name of a day of the week in the language of the screen. 1 January 2024 is a Monday.
const dayName = (day, weekday = 'long') => new Intl.DateTimeFormat(intlTag(lang), { weekday }).format(new Date(2024, 0, 1 + day));

const shortDay = (day) => {
  const node = el('span', { className: 'day-short', textContent: dayName(day, 'short') });
  node.setAttribute('aria-hidden', 'true');
  return node;
};

// The short date of the language, as `20 may` (MENU-25).
const shortDate = new Map();
const dateFormat = () => {
  if (!shortDate.has(lang)) shortDate.set(lang, new Intl.DateTimeFormat(intlTag(lang), { day: 'numeric', month: 'short' }));
  return shortDate.get(lang);
};

// The status line of a slot with one meal (MENU-25): a recipe or a dish, after a dot.
const statusNode = (planned) => {
  if (planned.length !== 1) return [];
  const dish = Boolean(planned[0].dish);
  const node = el('small', { className: dish ? 'meal-status dish' : 'meal-status', textContent: t(dish ? 'menu.statusDish' : 'menu.statusRecipe') });
  node.setAttribute('aria-hidden', 'true');
  return [node];
};

const mealTitle = (day, meal) => t('menu.title', { meal: t(`meal.${meal}`), day: dayName(day) });

const openMeal = (day, meal) => {
  Object.assign(ui, { mealOpen: { day, meal }, mealQuery: '' });
  render();
};

export const closeMeal = () => {
  ui.mealOpen = null;
  render();
};

// The meals of a slot, own first: none, one, or one of each list.
const plannedOf = ({ day, meal }) => week()[day].meals.find((candidate) => candidate.meal === meal).planned;

const plannedName = ({ recipe, dish }) => recipe?.name ?? dish;

// The name of a meal in the slot, with the tag of its list when the screen shows tags.
const plannedNode = (entry) => {
  const name = el('span', { className: 'meal-name', textContent: plannedName(entry) });
  const tag = recipeTag(entry);
  return tag === null ? name : el('span', { className: 'meal-entry' }, [name, tagNode(tag)]);
};

const plannedLabel = (entry) => {
  const tag = recipeTag(entry);
  return [plannedName(entry), ...(entry.dish ? [t('menu.noRecipe')] : []), ...(tag === null ? [] : [tag])].join(', ');
};

// MENU-23: a meal of a past week is a tile with no action; an empty one shows a dash.
const pastMealNode = (day, { meal, planned }) => {
  const names = planned.length ? planned.map(plannedNode) : [el('span', { className: 'meal-name', textContent: '—' })];
  const kind = !planned.length ? 'meal past free' : planned.every((entry) => entry.dish) ? 'meal past dish' : 'meal past';
  const node = el('div', { className: kind }, [el('small', { className: 'meal-label', textContent: t(`meal.${meal}`) }), ...names, ...statusNode(planned)]);
  node.setAttribute('role', 'group');
  node.setAttribute('aria-label', `${mealTitle(day, meal)}: ${planned.length ? planned.map(plannedLabel).join('; ') : t('menu.noMeal')}`);
  return node;
};

const mealNode = (day, { meal, planned }) => {
  if (pastShown()) return pastMealNode(day, { meal, planned });
  const dish = planned.length === 1 && planned[0].dish;
  const label = dish ? `${t(`meal.${meal}`)} · ${t('menu.noRecipe')}` : t(`meal.${meal}`);
  const kind = !planned.length ? 'meal free' : planned.every((entry) => entry.dish) ? 'meal dish' : 'meal';
  const names = planned.length ? planned.map(plannedNode) : [icon('plus-circle', 'meal-add'), el('span', { className: 'meal-name', textContent: t('menu.choose') })];
  // DSV-20: the kind of a planned meal as an icon at its top end, cutlery for a recipe, a pencil for a dish.
  const kindIcon = planned.length ? [icon(planned.every((entry) => entry.dish) ? 'edit' : 'utensils', 'small meal-icon')] : [];
  const button = el('button', { type: 'button', className: kind, onclick: () => openMeal(day, meal) }, [
    ...kindIcon,
    el('small', { className: 'meal-label', textContent: label }),
    ...names,
    ...statusNode(planned),
  ]);
  const text = planned.length ? planned.map(plannedLabel).join('; ') : t('menu.choose');
  button.setAttribute('aria-label', `${mealTitle(day, meal)}: ${text}`);
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

const dayNode = ({ day, meals }) =>
  el('li', { className: 'day' }, [
    // The long name shows from 600px or in the normal density; the short one in the compact density below 600px.
    el('h3', { className: 'day-title' }, [el('span', { className: 'day-long', textContent: dayName(day) }), shortDay(day), el('span', { className: 'day-date', textContent: dateFormat().format(menu.weekDay(shownWeek(), day)) })]),
    el('div', { className: 'meals' }, meals.map((entry) => mealNode(day, entry))),
  ]);

// The days of Menú. A past week that holds no meal any more, or a later week out of reach after a
// change of the clock, shows this week again.
export const weekNodes = () => {
  const shown = shownWeek();
  const lost = pastShown() ? !menu.menuWeeks(state).includes(shown) : shown > menu.addWeeks(thisWeek(), menu.FUTURE_WEEKS);
  if (lost) ui.week = null;
  return week().map(dayNode);
};

// MENU-20: Llenar cesta fills each list from its own menu; Vaciar menú empties the own menu only.
const fillBasket = () => {
  const result = fillMenus();
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.menuFilled', { summary: sendText(result) }) });
  }
  // A second tap changes nothing: keep the undo of the fill that is still on the screen.
  else showToast(t('toast.menuNothing'), { undo: undoState });
};

export const renderMenuActions = () => {
  $('menu-clear').disabled = menu.mealCount(listPart(state, 'own'), shownWeek()) === 0;
  // MENU-26: the planned slots of the week in view, of the 14, and the free ones.
  const planned = menu.plannedSlots(state, shownWeek());
  $('menu-summary').textContent = t('menu.summary', { planned, total: menu.SLOTS, free: menu.SLOTS - planned, count: menu.SLOTS - planned });
  // DSV-30: the bar of the planned slots on the desktop screen.
  $('menu-summary').style.setProperty('--planned', String(planned / menu.SLOTS));
  // MENU-23, MENU-24: a past week has Repetir esta semana in place of Llenar cesta and Vaciar menú.
  $('menu-split').hidden = pastShown();
  $('menu-repeat').hidden = !pastShown();
  renderWeekBar();
};

// `Esta semana`, `Semana que viene` or `Semana del 26 oct` in the language of the screen.
const weekLabel = (week) => {
  if (week === thisWeek()) return t('menu.thisWeek');
  if (week === menu.addWeeks(thisWeek(), 1)) return t('menu.comingWeek');
  const [year, month, day] = week.split('-').map(Number);
  const date = new Intl.DateTimeFormat(intlTag(lang), { day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
  return t('menu.weekOf', { date });
};

// MENU-23: the weeks of ‹ and ›, from the weeks that hold a meal of a list in view.
const steps = () => menu.weekSteps(menu.menuWeeks(state), shownWeek(), thisWeek());

const renderWeekBar = () => {
  const shown = ui.view === 'menu';
  $('menu-week').hidden = !shown;
  if (!shown) return;
  // MENU-25: the days of the week after its name, as `20–26 may`.
  const week = shownWeek();
  $('menu-week-label').replaceChildren(icon('calendar', 'small week-bar-icon'), weekLabel(week), ' ', el('span', { className: 'week-bar-range', textContent: dateFormat().formatRange(menu.weekDay(week, 0), menu.weekDay(week, 6)) }));
  const { earlier, later } = steps();
  $('menu-week-prev').disabled = earlier === null;
  $('menu-week-next').disabled = later === null;
};

// MENU-24: this week takes the meals of the week in view, then shows.
const repeatShown = () => {
  const result = repeatMenus(shownWeek());
  if (!result.error) ui.week = null;
  apply(result, { undoText: t('toast.weekRepeated', { count: result.count ?? 0 }) });
};

const showWeek = (week) => {
  ui.week = week === thisWeek() ? null : week;
  render();
};

// The height of the sheet at its first render while open: the results change, the sheet does not.
let mealHeight = null;

export const renderMeal = () => {
  const open = ui.mealOpen;
  $('meal').hidden = !open;
  if (!open) {
    mealHeight = null;
    $('meal-sheet').style.minHeight = '';
    return;
  }
  const { day, meal } = open;
  const title = mealTitle(day, meal);
  $('meal-title').textContent = title;
  $('meal-sheet').setAttribute('aria-label', title);
  const planned = plannedOf(open);
  const dish = planned.find((entry) => entry.dish);
  if ($('meal-query').value !== ui.mealQuery) $('meal-query').value = ui.mealQuery;
  const matches = recipes.searchRecipes(state, ui.mealQuery);
  const query = ui.mealQuery.trim();
  // With no recipe at all the field only takes a dish.
  const hint = !state.recipes.length && !query ? t('menu.typeDish') : matches.length ? '' : t('empty.noMatch', { query });
  $('meal-empty').hidden = !hint;
  $('meal-empty').textContent = hint;
  const newDish = dishOf(query);
  $('meal-dish').hidden = !newDish;
  $('meal-dish').textContent = newDish ? t('menu.addDish', { name: newDish }) : '';
  const chips = matches.map((recipe) => {
    const tag = recipeTag(recipe);
    // MENU-20: the meal goes to the list of the recipe, in place of the meal of that list only.
    const pick = () => {
      ui.mealOpen = null;
      apply(onListOf(listOf(recipe), (part) => menu.setMeal(part, shownWeek(), day, meal, recipe.id)));
    };
    const chip = el('button', { type: 'button', className: 'chip', onclick: pick }, tag === null ? [recipe.name] : [recipe.name, tagNode(tag)]);
    chip.setAttribute('aria-pressed', String(planned.some((entry) => entry.recipe?.id === recipe.id)));
    return chip;
  });
  $('meal-chips').replaceChildren(...chips);
  // MENU-20: a slot with two meals lists both, each with its tag and its own Quitar.
  const two = planned.length > 1;
  $('meal-planned').hidden = !two;
  $('meal-planned').replaceChildren(...(two ? planned.map((entry) => plannedRow(day, meal, entry)) : []));
  $('meal-recipe').hidden = !dish;
  $('meal-remove').hidden = planned.length !== 1;
  // The bar of the foot holds Crear receta of a dish and the Quitar of one meal: with neither it hides.
  $('meal-actions').hidden = !dish && planned.length !== 1;
  mealHeight ??= $('meal-sheet').offsetHeight;
  $('meal-sheet').style.minHeight = `${mealHeight}px`;
};

// A meal of a slot with two meals in the sheet: its name, its tag and its Quitar.
const plannedRow = (day, meal, entry) => {
  const name = plannedName(entry);
  const remove = el('button', { type: 'button', className: 'button icon', textContent: '✕', onclick: () => clearPlanned(day, meal, entry) });
  remove.setAttribute('aria-label', t('menu.removeMeal', { name }));
  const tag = recipeTag(entry);
  return el('li', { className: 'product' }, [el('span', { className: 'product-text', textContent: name }), ...(tag === null ? [] : [tagNode(tag)]), remove]);
};

// MENU-20: Quitar empties the meal of one list; the meal of the other list stays.
const clearPlanned = (day, meal, entry) => {
  ui.mealOpen = null;
  apply(onListOf(entry.which, (part) => menu.clearMeal(part, shownWeek(), day, meal)), { undoText: t('toast.mealCleared', { name: plannedName(entry) }) });
};

// The text of the field as a new dish: not empty and not the name of a recipe, or null.
const dishOf = (query) => {
  const key = query.toLowerCase();
  return query && !state.recipes.some((recipe) => recipe.name.toLowerCase() === key) ? query : null;
};

const addDish = () => {
  const name = dishOf(ui.mealQuery.trim());
  if (!name) return;
  const { day, meal } = ui.mealOpen;
  ui.mealOpen = null;
  // MENU-20: a dish goes to the own menu.
  apply(onOwn((own) => menu.setDish(own, shownWeek(), day, meal, name)));
};

// The dish becomes a recipe of its list, and its sheet opens in Recetas for the products.
const dishToRecipe = () => {
  const { dish, which } = plannedOf(ui.mealOpen).find((entry) => entry.dish);
  ui.mealOpen = null;
  recipeFromDish(dish, which, () => showView('recipes'), shownWeek());
};

export const bind = () => {
  $('menu-fill').addEventListener('click', fillBasket);
  $('menu-clear').addEventListener('click', () => apply(onOwn((own) => menu.clearMenu(own, shownWeek())), { undoText: t('toast.menuCleared') }));
  $('meal-veil').addEventListener('click', closeMeal);
  $('menu-week-prev').addEventListener('click', () => showWeek(steps().earlier));
  $('menu-repeat').addEventListener('click', repeatShown);
  $('menu-week-next').addEventListener('click', () => showWeek(steps().later));
  $('meal-query').addEventListener('input', (event) => {
    ui.mealQuery = event.target.value;
    renderMeal();
  });
  $('meal-query').addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    addDish();
  });
  $('meal-dish').addEventListener('click', addDish);
  $('meal-recipe').addEventListener('click', dishToRecipe);
  $('meal-remove').addEventListener('click', () => {
    const { day, meal } = ui.mealOpen;
    const [entry] = plannedOf(ui.mealOpen);
    if (entry) clearPlanned(day, meal, entry);
  });
};
