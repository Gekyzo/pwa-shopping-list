import * as recipes from '#recipes';
import * as menu from '#menu';
import { intlTag } from '#i18n';
import { $, el, state, ui, t, lang, undoState, showToast, apply, render } from '#ui/context';
import { sendText } from '#ui/recipes';

// The name of a day of the week in the language of the screen. 1 January 2024 is a Monday.
const dayName = (day) => new Intl.DateTimeFormat(intlTag(lang), { weekday: 'long' }).format(new Date(2024, 0, 1 + day));

const mealTitle = (day, meal) => t('menu.title', { meal: t(`meal.${meal}`), day: dayName(day) });

const openMeal = (day, meal) => {
  Object.assign(ui, { mealOpen: { day, meal }, mealQuery: '' });
  render();
};

export const closeMeal = () => {
  ui.mealOpen = null;
  render();
};

const mealNode = (day, { meal, recipe }) => {
  const button = el(
    'button',
    { type: 'button', className: recipe ? 'meal' : 'meal free', onclick: () => openMeal(day, meal) },
    [el('small', { textContent: t(`meal.${meal}`) }), el('span', { textContent: recipe ? recipe.name : t('menu.choose') })],
  );
  button.setAttribute('aria-label', `${mealTitle(day, meal)}: ${recipe ? recipe.name : t('menu.choose')}`);
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

export const dayNode = ({ day, meals }) =>
  el('li', { className: 'day' }, [
    el('h3', { textContent: dayName(day) }),
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

export const renderMeal = () => {
  const open = ui.mealOpen;
  $('meal').hidden = !open;
  if (!open) return;
  const { day, meal } = open;
  const title = mealTitle(day, meal);
  $('meal-title').textContent = title;
  $('meal-sheet').setAttribute('aria-label', title);
  const current = menu.menuWeek(state)[day].meals.find((entry) => entry.meal === meal).recipe;
  if ($('meal-query').value !== ui.mealQuery) $('meal-query').value = ui.mealQuery;
  const matches = recipes.searchRecipes(state, ui.mealQuery);
  $('meal-empty').hidden = matches.length > 0;
  $('meal-empty').textContent = matches.length ? '' : t('empty.noMatch', { query: ui.mealQuery.trim() });
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
  $('meal-remove').hidden = !current;
};

export const bind = () => {
  $('menu-fill').addEventListener('click', fillBasket);
  $('menu-clear').addEventListener('click', () => apply(menu.clearMenu(state), { undoText: t('toast.menuCleared') }));
  $('meal-veil').addEventListener('click', closeMeal);
  $('meal-query').addEventListener('input', (event) => {
    ui.mealQuery = event.target.value;
    renderMeal();
  });
  $('meal-remove').addEventListener('click', () => {
    const { day, meal } = ui.mealOpen;
    const name = menu.menuWeek(state)[day].meals.find((entry) => entry.meal === meal).recipe?.name ?? '';
    ui.mealOpen = null;
    apply(menu.clearMeal(state, day, meal), { undoText: t('toast.mealCleared', { name }) });
  });
};
