import * as store from '#store';
import * as shops from '#shops';
import { visibleSections } from '#modules';
import {
  ARRIVAL_MS,
  $,
  storage,
  t,
  shopLists,
  off,
  state,
  ui,
  undoState,
  clickGuardUntil,
  textOf,
  showToast,
  hideToast,
  setRender,
  render,
  commit,
} from '#ui/context';
import { inList, viewState } from '#ui/view';
import { expand, pendingRows, rowKeys, bringIn } from '#ui/motion';
import { closeEdit, renderEdit, bind as bindEdit } from '#ui/edit';
import { endReorder, bind as bindDrag } from '#ui/drag';
import { moveRow } from '#ui/rows';
import { renderRecipe, closeRecipe, bind as bindRecipe } from '#ui/recipes';
import { renderMeal, closeMeal, bind as bindMenu } from '#ui/menu';
import { renderArrange, bind as bindArrange } from '#ui/arrange';
import {
  headerOf,
  shopLabel,
  renderShopChips,
  renderList,
  renderTrip,
  closeSearch,
  closeTrip,
  bind as bindList,
} from '#ui/list';
import { renderSheet, closeSheet, bind as bindAdd } from '#ui/add';
import { closeOnboarding, turnOnboarding, bind as bindOnboarding } from '#ui/onboarding';
import { renderVersion, renderSample, readVersion, applyLanguage, bind as bindSettings } from '#ui/settings';
import { showNavButton, bind as bindNav } from '#ui/nav';

// Screen

const renderAll = () => {
  // A render builds new rows, so a lifted row loses its pointer and gets no release.
  endReorder(false);
  // The item of the edit sheet can go while the sheet is open: an undo, or an import.
  if (!state.items.some((item) => item.id === ui.editId)) ui.editId = null;
  if (!state.recipes.some((recipe) => recipe.id === ui.recipeId)) ui.recipeId = null;
  // A shop list whose chip went shows Todas.
  // A hidden row leaves no list filtered.
  for (const list of ['active', 'next']) {
    ui.shop[list] = shopLists === 'show' ? shops.validShop(state, list, ui.shop[list]) : null;
  }
  const summary = store.tripSummary(state);
  const next = store.nextItems(state);
  const scoped = viewState();
  const header = headerOf(store.tripSummary(scoped), store.nextItems(scoped));
  if (inList() && ui.shop[ui.view] !== null) header.title = shopLabel(ui.shop[ui.view]);

  renderShopChips();
  $('title').textContent = header.title;
  $('subtitle').textContent = header.subtitle;
  $('ring-text').textContent = header.ring;
  $('ring').style.setProperty('--pct', `${header.pct}%`);

  renderList(summary);
  // Before the focus and the effects below: they also reach the rows of the recipe sheet.
  renderRecipe();

  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  renderSample();
  const outcome = [t('settings.back', { count: summary.back }), t('settings.gone', { count: summary.gone })];
  $('finish-menu-text').textContent = outcome.join(' · ');
  renderTrip();

  $('fab').hidden =
    ['settings', 'menu'].includes(ui.view) || ui.sheetOpen || ui.arrangeOpen || ui.tripOpen || ui.editId !== null || ui.mealOpen !== null || ui.recipeId !== null;
  $('fab').setAttribute('aria-label', t(ui.view === 'recipes' ? 'add.recipe' : 'add.item'));
  $('next-count').textContent = next.length || '';
  const sections = visibleSections(off);
  document.querySelectorAll('.nav-item').forEach((button) => {
    showNavButton(button, sections.includes(button.dataset.view));
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (ui.focusProduct) $('recipe-products').querySelector('.product-name')?.focus();
  ui.focusProduct = false;
  bringIn(ui.bringKeys);
  ui.bringKeys.clear();
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
  ui.settleFrom = null;
  renderSheet();
  renderArrange();
  renderEdit();
  renderMeal();
};
setRender(renderAll);

// Events

bindNav();
bindOnboarding();
bindAdd();

// A tap out of the open row closes it, without a render, so that the tap still does its work.
document.addEventListener(
  'pointerdown',
  (event) => {
    const box = document.querySelector('.item-row-swipe.open');
    if (!box || box.contains(event.target)) return;
    Object.assign(ui, { openId: null, openSide: null });
    box.classList.remove('open');
    moveRow(box.querySelector('.item-row-body'), 0);
    box.querySelectorAll('.item-row-actions').forEach((side) => {
      side.inert = true;
    });
  },
  true,
);

document.addEventListener(
  'click',
  (event) => {
    if (Date.now() >= clickGuardUntil) return;
    event.preventDefault();
    event.stopPropagation();
  },
  true,
);

bindDrag();
bindList();
bindArrange();
bindEdit();
bindRecipe();

document.addEventListener('keydown', (event) => {
  if (ui.onboarding !== null) {
    if (event.key === 'Escape') closeOnboarding();
    else if (event.key === 'ArrowRight') turnOnboarding(1);
    else if (event.key === 'ArrowLeft') turnOnboarding(-1);
    return;
  }
  if (event.key !== 'Escape') return;
  endReorder(false);
  if (ui.sheetOpen) closeSheet();
  if (ui.arrangeOpen) {
    ui.arrangeOpen = false;
    render();
  }
  if (ui.editId !== null) closeEdit();
  if (ui.recipeId !== null) closeRecipe();
  if (ui.mealOpen !== null) closeMeal();
  if (ui.searchOpen) closeSearch();
  if (ui.tripOpen) closeTrip();
});

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  const before = new Set(pendingRows().map((node) => node.dataset.id));
  const keys = rowKeys();
  commit(undoState);
  hideToast();
  // The rows that the undo puts back open, as a ticked row closes. A recipe or a product also flashes.
  expand(pendingRows().filter((node) => !before.has(node.dataset.id)));
  bringIn(new Set([...rowKeys()].filter((key) => !keys.has(key))));
});

bindMenu();
bindSettings();

applyLanguage();
if (ui.onboarding !== null) $('onboarding-next').focus();
// An automation of the phone opens `?arrival` at the shop. The query goes away, so a reload is silent.
const params = new URLSearchParams(location.search);
if (params.has('arrival')) {
  const message = store.arrivalMessage(state);
  if (message) showToast(textOf(message), { ms: ARRIVAL_MS });
  params.delete('arrival');
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
if (!storage) showToast(t('error.noStorage'));
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
});
