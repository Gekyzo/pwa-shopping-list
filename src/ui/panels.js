import { postponedItems } from '#store';
import { recipeProgress } from '#recipes';
import { basketPreview, mealCount } from '#menu';
import { $, el, state, ui, t, thisWeek } from '#ui/context';
import { listState } from '#ui/view';
import { icon } from '#ui/controls';
import { showView } from '#ui/nav';
import { openRecipe } from '#ui/recipes';
import { bringBackButton, bringAll, postponedDetail } from '#ui/rows';

// The rows a panel shows before its `y N más` line.
const ROWS = 6;

const rows = (list, entries) => {
  const shown = entries.slice(0, ROWS);
  const more = entries.length - shown.length;
  list.replaceChildren(...shown, ...(more > 0 ? [el('li', { className: 'side-panel-more', textContent: t('panels.more', { count: more }) })] : []));
};

const bar = (ratio, done) => {
  const track = el('span', { className: 'side-panel-bar' }, [el('span', { className: done ? 'side-panel-fill done' : 'side-panel-fill' })]);
  track.firstChild.style.width = `${ratio * 100}%`;
  return track;
};

const seeRecipe = (recipe) => {
  showView('recipes');
  openRecipe(recipe);
};

// Recetas en la lista (LIST-38): each recipe with a product in Compra, how many of its products are
// there, and a link to the recipe.
const renderRecipes = (view) => {
  const progress = recipeProgress(view);
  $('panel-recipes').hidden = progress.length === 0;
  $('panel-recipes-count').textContent = t('panels.active', { count: progress.length });
  rows($('panel-recipes-list'), progress.map(({ recipe, inList, total }) => {
    const done = inList === total;
    const see = el('button', { type: 'button', className: 'side-panel-link', onclick: () => seeRecipe(recipe) }, [
      el('span', { textContent: t('panels.see') }),
      icon('arrow-right', 'small'),
    ]);
    see.setAttribute('aria-label', t('panels.seeRecipe', { name: recipe.name }));
    return el('li', { className: 'side-panel-card' }, [
      el('span', { className: 'side-panel-name', textContent: recipe.name }),
      see,
      el('span', { className: done ? 'side-panel-value done' : 'side-panel-value', textContent: `${done ? '✓ ' : ''}${t('panels.ingredients', { done: inList, count: total })}` }),
      bar(inList / total, done),
    ]);
  }));
};

// Próxima compra (LIST-39): the postponed items, each with its bring back, and Mover todos.
const renderPostponed = (view) => {
  const items = postponedItems(view);
  $('panel-postponed').hidden = items.length === 0;
  rows($('panel-postponed-list'), items.map((item) => el('li', { className: 'side-panel-row' }, [
    el('span', { className: 'side-panel-name' }, [
      el('span', { textContent: item.name }),
      ...(postponedDetail(item) ? [el('small', { className: 'side-panel-detail', textContent: postponedDetail(item) })] : []),
    ]),
    bringBackButton(item),
  ])));
};

// Para la cesta (MENU-21): what Llenar cesta puts to buy.
const renderBasket = () => {
  const products = basketPreview(state, thisWeek());
  $('panel-basket').hidden = false;
  $('panel-basket-count').textContent = String(products.length);
  $('panel-basket-note').textContent = t('panels.basketNote', { fill: t('menu.fill') });
  const entries = products.map((name) => el('li', { className: 'side-panel-row' }, [el('span', { textContent: name })]));
  rows($('panel-basket-list'), entries.length ? entries : [el('li', { className: 'side-panel-more', textContent: t('recipe.inList') })]);
};

// The panels of Compra and Menú, from 600px (DSV-9): below the content until 840px, then beside it.
// Compra shows them while its list has an item to buy or a postponed item, so that a list with only
// postponed items can still bring them back; Menú while this week, in view, has a meal (MENU-23).
export const renderPanels = () => {
  const compra = ui.view === 'active';
  const view = listState();
  const shown = compra
    ? view.items.some((item) => item.list === 'active' || item.list === 'postponed')
    : ui.view === 'menu' && ui.pastWeek === null && mealCount(state, thisWeek()) > 0;
  $('panels').hidden = !shown;
  for (const id of ['panel-recipes', 'panel-postponed', 'panel-basket']) $(id).hidden = true;
  if (!shown) return;
  if (compra) {
    renderRecipes(view);
    renderPostponed(view);
  } else renderBasket();
};

export const bind = () => {
  $('postponed-all').addEventListener('click', bringAll);
};
