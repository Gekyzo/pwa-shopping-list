import * as recipes from '#recipes';
import * as menu from '#menu';
import { intlTag } from '#i18n';
import { $, el, state, ui, t, lang, undoState, showToast, apply, render } from '#ui/context';
import { sendText, recipeFromDish } from '#ui/recipes';
import { showView } from '#ui/nav';

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

export const closeMenuMore = () => {
  ui.menuMoreOpen = false;
  render();
  $('trip-button').focus();
};

export const closeMeal = () => {
  ui.mealOpen = null;
  render();
};

// The recipe or the dish of a meal, or null.
const plannedOf = ({ day, meal }) => {
  const entry = menu.menuWeek(state)[day].meals.find((candidate) => candidate.meal === meal);
  return { recipe: entry.recipe, dish: entry.dish };
};

const mealNode = (day, { meal, recipe, dish }) => {
  const name = recipe?.name ?? dish ?? t('menu.choose');
  const label = dish ? `${t(`meal.${meal}`)} · ${t('menu.noRecipe')}` : t(`meal.${meal}`);
  const button = el(
    'button',
    { type: 'button', className: recipe ? 'meal' : dish ? 'meal dish' : 'meal free', onclick: () => openMeal(day, meal) },
    [el('small', { className: 'meal-label', textContent: label }), el('span', { className: 'meal-name', textContent: name })],
  );
  button.setAttribute('aria-label', `${mealTitle(day, meal)}: ${dish ? `${dish}, ${t('menu.noRecipe')}` : name}`);
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

export const dayNode = ({ day, meals }) =>
  el('li', { className: 'day' }, [
    // The long name shows from 600px or in the normal density; the short one in the compact density below 600px.
    el('h3', { className: 'day-title' }, [el('span', { className: 'day-long', textContent: dayName(day) }), shortDay(day)]),
    el('div', { className: 'meals' }, meals.map((entry) => mealNode(day, entry))),
  ]);

const fillBasket = () => {
  const result = menu.fillMenu(state);
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.menuFilled', { summary: sendText(result) }) });
  }
  // A second tap changes nothing: keep the undo of the fill that is still on the screen.
  else showToast(t('toast.menuNothing'), { undo: undoState });
};

export const renderMenuMore = () => {
  if (ui.view !== 'menu') ui.menuMoreOpen = false;
  $('menu-more').hidden = !ui.menuMoreOpen;
  $('menu-clear').disabled = menu.mealCount(state) === 0;
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
  const { recipe: current, dish } = plannedOf(open);
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
    const chip = el('button', {
      type: 'button',
      className: 'chip',
      textContent: recipe.name,
      onclick: () => {
        ui.mealOpen = null;
        apply(menu.setMeal(state, day, meal, recipe.id));
      },
    });
    chip.setAttribute('aria-pressed', String(recipe.id === current?.id));
    return chip;
  });
  $('meal-chips').replaceChildren(...chips);
  $('meal-recipe').hidden = !dish;
  $('meal-remove').hidden = !current && !dish;
  $('meal-actions').hidden = !current && !dish;
  mealHeight ??= $('meal-sheet').offsetHeight;
  $('meal-sheet').style.minHeight = `${mealHeight}px`;
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
  apply(menu.setDish(state, day, meal, name));
};

// The dish becomes a recipe, and its sheet opens in Recetas for the products.
const dishToRecipe = () => {
  const { dish } = plannedOf(ui.mealOpen);
  ui.mealOpen = null;
  recipeFromDish(dish, () => showView('recipes'));
};

export const bind = () => {
  $('menu-fill').addEventListener('click', fillBasket);
  $('menu-clear').addEventListener('click', () => {
    ui.menuMoreOpen = false;
    apply(menu.clearMenu(state), { undoText: t('toast.menuCleared') });
  });
  $('menu-more-veil').addEventListener('click', closeMenuMore);
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
    const { recipe, dish } = plannedOf(ui.mealOpen);
    const name = recipe?.name ?? dish ?? '';
    ui.mealOpen = null;
    apply(menu.clearMeal(state, day, meal), { undoText: t('toast.mealCleared', { name }) });
  });
};
