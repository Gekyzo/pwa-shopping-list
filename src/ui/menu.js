import * as recipes from '#recipes';
import * as menu from '#menu';
import { intlTag } from '#i18n';
import { listOf, listPart } from '#lists';
import { $, el, state, ui, t, lang, undoState, showToast, apply, render, onOwn, onListOf } from '#ui/context';
import { sendText, recipeFromDish } from '#ui/recipes';
import { showView } from '#ui/nav';
import { tagNode } from '#ui/rows';
import { recipeTag } from '#ui/view';

const LISTS = ['own', 'shared'];

// MENU-20: each list has its own week, so a slot may hold two meals, one of each list. The meals of
// a slot are `{ which, shared, recipe, dish }`, the own one first. With no share the shared week is
// empty.
const week = () => {
  const weeks = LISTS.map((which) => menu.menuWeek(listPart(state, which)));
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

const mealNode = (day, { meal, planned }) => {
  const dish = planned.length === 1 && planned[0].dish;
  const label = dish ? `${t(`meal.${meal}`)} · ${t('menu.noRecipe')}` : t(`meal.${meal}`);
  const kind = !planned.length ? 'meal free' : planned.every((entry) => entry.dish) ? 'meal dish' : 'meal';
  const names = planned.length ? planned.map(plannedNode) : [el('span', { className: 'meal-name', textContent: t('menu.choose') })];
  const button = el('button', { type: 'button', className: kind, onclick: () => openMeal(day, meal) }, [
    el('small', { className: 'meal-label', textContent: label }),
    ...names,
  ]);
  const text = planned.length ? planned.map(plannedLabel).join('; ') : t('menu.choose');
  button.setAttribute('aria-label', `${mealTitle(day, meal)}: ${text}`);
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

const dayNode = ({ day, meals }) =>
  el('li', { className: 'day' }, [
    // The long name shows from 600px or in the normal density; the short one in the compact density below 600px.
    el('h3', { className: 'day-title' }, [el('span', { className: 'day-long', textContent: dayName(day) }), shortDay(day)]),
    el('div', { className: 'meals' }, meals.map((entry) => mealNode(day, entry))),
  ]);

// The days of Menú.
export const weekNodes = () => week().map(dayNode);

// MENU-20: Llenar cesta and Vaciar menú act on the own menu only.
const fillBasket = () => {
  const result = onOwn((own) => menu.fillMenu(own));
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.menuFilled', { summary: sendText(result) }) });
  }
  // A second tap changes nothing: keep the undo of the fill that is still on the screen.
  else showToast(t('toast.menuNothing'), { undo: undoState });
};

export const renderMenuActions = () => {
  $('menu-clear').disabled = menu.mealCount(listPart(state, 'own')) === 0;
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
      apply(onListOf(listOf(recipe), (part) => menu.setMeal(part, day, meal, recipe.id)));
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
  $('meal-actions').hidden = !planned.length;
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
  apply(onListOf(entry.which, (part) => menu.clearMeal(part, day, meal)), { undoText: t('toast.mealCleared', { name: plannedName(entry) }) });
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
  apply(onOwn((own) => menu.setDish(own, day, meal, name)));
};

// The dish becomes a recipe of its list, and its sheet opens in Recetas for the products.
const dishToRecipe = () => {
  const { dish, which } = plannedOf(ui.mealOpen).find((entry) => entry.dish);
  ui.mealOpen = null;
  recipeFromDish(dish, which, () => showView('recipes'));
};

export const bind = () => {
  $('menu-fill').addEventListener('click', fillBasket);
  $('menu-clear').addEventListener('click', () => apply(onOwn((own) => menu.clearMenu(own)), { undoText: t('toast.menuCleared') }));
  $('meal-veil').addEventListener('click', closeMeal);
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
