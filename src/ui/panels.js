import { postponedItems } from '#store';
import { recipeProgress } from '#recipes';
import { SLOTS, basketPreview, filledRecipes, pastWeeks, mealCount, weekDay } from '#menu';
import { storedBytes, kilobytes } from '#storage';
import { $, el, state, ui, t, thisWeek, shownWeek, pastShown, storage } from '#ui/context';
import { listState } from '#ui/view';
import { icon } from '#ui/controls';
import { showView } from '#ui/nav';
import { openRecipe } from '#ui/recipes';
import { bringBackButton, bringAll, postponedDetail } from '#ui/rows';
import { dateFormat, repeatInto } from '#ui/menu';

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

// Almacenamiento local (LIST-43): what the app keeps in the storage of the browser, from 1024px. On
// Menú it is the foot of the card Generación automática de cesta (MENU-21).
const renderStorage = (id, used) => {
  const bytes = storage ? storedBytes(storage) : null;
  $(id).hidden = bytes === null;
  if (bytes !== null) $(used).textContent = t('panels.storageUsed', { count: kilobytes(bytes) });
};

// The names of a past week before its `+N más`.
const NAMES = 3;

// Semanas anteriores (MENU-27): the last past weeks with a meal, each with its planned slots, the names
// of its meals and Repetir esta semana into the week in view, or into this week from a past week.
const renderWeeks = () => {
  const weeks = pastWeeks(state, thisWeek(), pastShown() ? shownWeek() : null);
  $('panel-weeks').hidden = weeks.length === 0;
  const to = pastShown() ? thisWeek() : shownWeek();
  $('panel-weeks-list').replaceChildren(...weeks.map(({ week, planned, names }) => {
    const range = dateFormat().formatRange(weekDay(week, 0), weekDay(week, 6));
    const full = planned === SLOTS;
    const more = names.length - NAMES;
    const repeat = el('button', { type: 'button', className: 'button outline wide side-panel-repeat', onclick: () => repeatInto(week, to) }, [
      icon('repeat', 'small'),
      el('span', { textContent: t('menu.repeat') }),
    ]);
    repeat.setAttribute('aria-label', t('panels.repeatWeek', { range }));
    return el('li', { className: 'side-panel-week' }, [
      el('span', { className: 'side-panel-name', textContent: range }),
      el('small', { className: full ? 'side-panel-count done' : 'side-panel-count', textContent: t(full ? 'panels.weekFull' : 'panels.weekMeals', { count: planned }) }),
      el('span', { className: 'side-panel-chips' }, [
        ...names.slice(0, NAMES).map((name) => el('span', { className: 'side-panel-chip', textContent: name })),
        ...(more > 0 ? [el('span', { className: 'side-panel-chips-more', textContent: t('panels.moreNames', { count: more }) })] : []),
      ]),
      repeat,
    ]);
  }));
};

// The text of a translation with the names of `names` in bold, as nodes.
const MARK = '\u0000';
const withNames = (key, params, names) => {
  const marked = Object.fromEntries(Object.keys(names).map((name) => [name, `${MARK}${name}${MARK}`]));
  return t(key, { ...params, ...marked })
    .split(MARK)
    .map((part, index) => (index % 2 ? el('strong', { className: 'side-panel-strong', textContent: names[part] }) : part));
};

// Generación automática de cesta (MENU-21): what Llenar cesta adds to Compra, from the recipes of the
// week in view, and the storage of the app at its foot.
const renderAuto = () => {
  const week = shownWeek();
  const products = basketPreview(state, week).length;
  const count = filledRecipes(state, week);
  const recipes = t('panels.fillRecipes', { count });
  const names = { fill: t('menu.fill'), list: t('list.active') };
  const key = count === 0 ? 'panels.fillNone' : products === 0 ? 'panels.fillDone' : 'panels.fillNote';
  $('panel-auto').hidden = false;
  $('panel-auto-note').replaceChildren(...withNames(key, { count: products, recipes }, names));
  renderStorage('panel-auto-storage', 'panel-auto-used');
};

// The panels of Compra and Menú, from 600px (DSV-9): below the content until 840px, then beside it.
// Compra shows them while its list has an item to buy or a postponed item, so that a list with only
// postponed items can still bring them back. Menú shows Semanas anteriores while a past week other
// than the week in view has a meal, and the card of the fill while the week in view, this week or a
// later one, has a meal (MENU-21, MENU-27).
export const renderPanels = () => {
  const compra = ui.view === 'active';
  const view = listState();
  const fill = ui.view === 'menu' && !pastShown() && mealCount(state, shownWeek()) > 0;
  const weeks = ui.view === 'menu' && pastWeeks(state, thisWeek(), pastShown() ? shownWeek() : null, 1).length > 0;
  const shown = compra ? view.items.some((item) => item.list === 'active' || item.list === 'postponed') : fill || weeks;
  $('panels').hidden = !shown;
  for (const id of ['panel-recipes', 'panel-postponed', 'panel-storage', 'panel-weeks', 'panel-auto']) $(id).hidden = true;
  if (!shown) return;
  if (compra) {
    renderRecipes(view);
    renderPostponed(view);
    renderStorage('panel-storage', 'panel-storage-used');
    return;
  }
  if (weeks) renderWeeks();
  if (fill) renderAuto();
};

export const bind = () => {
  $('postponed-all').addEventListener('click', bringAll);
};
