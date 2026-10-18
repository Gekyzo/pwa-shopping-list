import * as store from '#store';
import * as shops from '#shops';
import { bindSheetDrag } from '#ds/sheet';
import { shortcutStart, fabState } from '#sections';
import { sheetOpen, closeTop } from '#layers';
import {
  ARRIVAL_MS,
  $,
  scroller,
  storage,
  t,
  shopLists,
  tripEnd,
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
  debugLog,
} from '#ui/context';
import { inList, viewState } from '#ui/view';
import { rowKeys, bringIn, flash, snapshotRows, animateRows } from '#ui/motion';
import { closeEdit, renderEdit, bind as bindEdit } from '#ui/edit';
import { endReorder, bind as bindDrag } from '#ui/drag';
import { moveRow } from '#ui/rows';
import { renderRecipe, closeRecipe, bind as bindRecipe } from '#ui/recipes';
import { renderMeal, renderMenuMore, closeMeal, closeMenuMore, bind as bindMenu } from '#ui/menu';
import { renderArrange, closeArrange, bind as bindArrange } from '#ui/arrange';
import {
  headerOf,
  shopLabel,
  renderShopChips,
  renderDock,
  renderShopPick,
  showDockMatches,
  closeShopPick,
  renderList,
  renderTrip,
  closeSearch,
  closeTrip,
  bind as bindList,
} from '#ui/list';
import { renderSheet, openSheet, closeSheet, bind as bindAdd } from '#ui/add';
import { closeOnboarding, turnOnboarding, bind as bindOnboarding } from '#ui/onboarding';
import { renderVersion, renderSample, readVersion, applyLanguage, bind as bindSettings } from '#ui/settings';
import { renderInstall, bind as bindInstall } from '#ui/install';
import { renderAisles, closeAisles, bind as bindAisles } from '#ui/aisles';
import { bind as bindNav } from '#ui/nav';

// Screen

// While a layer is open, one entry of the history stands for it, so the back of the phone closes the
// layer and not the app (NAV-25). A layer closed in another way takes its entry away again: `skipPop`
// marks the pop of that `history.back()`, which closes nothing. One entry at most.
let backEntry = false;
let skipPop = false;
const holdBack = () => {
  if (skipPop) return;
  const open = closeTop(ui) !== null;
  if (open && !backEntry) {
    history.pushState({ layer: true }, '');
    backEntry = true;
  } else if (!open && backEntry) {
    backEntry = false;
    skipPop = true;
    history.back();
  }
};

let debugView = null;
const renderAll = () => {
  if (ui.view !== debugView) debugLog(`view ${(debugView = ui.view)}`);
  const before = ui.animate ? snapshotRows() : null;
  ui.animate = false;
  // A render builds new rows, so a lifted row loses its pointer and gets no release.
  endReorder(false);
  // The item of the edit sheet can go while the sheet is open: an undo, or an import.
  if (!state.items.some((item) => item.id === ui.editId)) ui.editId = null;
  if (!state.recipes.some((recipe) => recipe.id === ui.recipeId)) ui.recipeId = null;
  // A shop list whose chip went shows Todas.
  // A hidden row leaves no list filtered.
  ui.shop = shopLists === 'show' ? shops.validShop(state, ui.shop) : null;
  // The preview of Terminar compra counts the open items with the setting's choice (TRIP-7).
  const kept = tripEnd === 'keep' ? store.openItems(state).map((item) => item.id) : [];
  const summary = store.tripSummary(state, kept);
  const header = headerOf(store.tripSummary(viewState()));
  if (inList() && ui.shop !== null) header.title = shopLabel(ui.shop);

  renderShopChips();
  $('title').textContent = header.title;
  $('subtitle').textContent = header.subtitle;
  $('ring').hidden = header.ring === null;
  $('ring-text').textContent = header.ring ?? '';
  $('ring').style.setProperty('--pct', `${header.pct}%`);

  renderDock();
  renderList(summary);
  // Before the focus and the effects below: they also reach the rows of the recipe sheet.
  renderRecipe();

  $('settings').hidden = ui.view !== 'settings';
  document.querySelector('.icon.corner').hidden = !['active', 'recipes'].includes(ui.view);
  renderVersion();
  renderSample();
  renderInstall();
  renderTrip();
  renderMenuMore();

  // An action in the empty state replaces the add button.
  $('fab').hidden = ['settings', 'menu'].includes(ui.view) || !$('empty-action').hidden || sheetOpen(ui);
  $('fab').setAttribute('aria-label', t(ui.view === 'recipes' ? 'add.recipe' : 'add.item'));
  document.querySelectorAll('.nav-item').forEach((button) => {
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (ui.focusProduct) $('recipe-products').querySelector('.product-name')?.focus();
  ui.focusProduct = false;
  bringIn(ui.bringKeys);
  ui.bringKeys.clear();
  if (before) animateRows(before);
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
  ui.settleFrom = null;
  renderSheet();
  renderArrange();
  renderEdit();
  renderMeal();
  renderAisles();
  renderShopPick();
  showDockMatches();
  holdBack();
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
    holdBack();
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

// The open sheet closes by its own close; one sheet is open at a time.
const closeSheets = () => {
  if (ui.sheetOpen) closeSheet();
  if (ui.arrangeOpen) closeArrange();
  if (ui.editId !== null) closeEdit();
  if (ui.recipeId !== null) closeRecipe();
  if (ui.mealOpen !== null) closeMeal();
  if (ui.tripOpen) closeTrip();
  if (ui.menuMoreOpen) closeMenuMore();
  if (ui.aislesOpen) closeAisles();
  if (ui.shopPickOpen) closeShopPick();
};

// Closes the top layer (closeTop): a sheet, an open row, then the search. Gives what it closed.
const closeLayer = () => {
  const top = closeTop(ui);
  if (top === 'sheet') closeSheets();
  else if (top === 'row') {
    Object.assign(ui, { openId: null, openSide: null });
    render();
  } else if (top === 'search') closeSearch();
  return top;
};

// The back of the phone closes the top layer first (popstate below).
window.addEventListener('popstate', () => {
  if (skipPop) {
    skipPop = false;
    // A layer that opened while the entry went away gets its own entry now.
    holdBack();
    return;
  }
  backEntry = false;
  if (ui.onboarding !== null) return;
  endReorder(false);
  closeLayer();
});

// The add button collapses while the list scrolls down, and opens on a scroll up or at the top.
let fab = 'open';
let fabFrom = 0;
let lastY = 0;
scroller.addEventListener(
  'scroll',
  () => {
    const y = scroller.scrollTop;
    if (y < lastY) fabFrom = y;
    fab = fabState(y < lastY ? lastY : fabFrom, y, fab);
    lastY = y;
    $('fab').classList.toggle('collapsed', fab === 'collapsed');
  },
  { passive: true },
);

document.addEventListener('keydown', (event) => {
  if (ui.onboarding !== null) {
    if (event.key === 'Escape') closeOnboarding();
    else if (event.key === 'ArrowRight') turnOnboarding(1);
    else if (event.key === 'ArrowLeft') turnOnboarding(-1);
    return;
  }
  if (event.key !== 'Escape') return;
  endReorder(false);
  closeLayer();
});

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  const keys = rowKeys();
  debugLog('undo');
  // The render of the commit opens the rows that the undo puts back (animateRows). A recipe or a
  // product also flashes.
  commit(undoState);
  hideToast();
  flash(new Set([...rowKeys()].filter((key) => !keys.has(key))));
});

bindMenu();
bindSettings();
bindInstall();
bindAisles();

// Each sheet closes by Listo of its head and by a drag down of its grab or head. Each close
// hides the layer at once, so the closing transition starts where the drag left the sheet.
const SHEET_CLOSE = {
  sheet: closeSheet,
  arrange: closeArrange,
  trip: closeTrip,
  meal: closeMeal,
  'menu-more': closeMenuMore,
  edit: closeEdit,
  aisles: closeAisles,
  recipe: closeRecipe,
  'shop-pick': closeShopPick,
};
for (const [id, close] of Object.entries(SHEET_CLOSE)) {
  $(id).querySelector('.sheet-head .button').addEventListener('click', close);
  bindSheetDrag($(id), { close });
}

applyLanguage();
if (ui.onboarding !== null) $('onboarding-title').focus();
// An automation of the phone opens `?arrival` at the shop. The query goes away, so a reload is silent.
const params = new URLSearchParams(location.search);
if (params.has('arrival')) {
  const message = store.arrivalMessage(state);
  if (message) showToast(textOf(message), { ms: ARRIVAL_MS });
}
// A shortcut of the launcher opens `?open=<name>`. The walkthrough of a first start stays on top
// and gets no sheet below it.
const start = shortcutStart(params.get('open'));
// The query goes before a sheet opens: the entry of the sheet (holdBack) then comes after an address
// with no query, and a reload opens nothing.
if (params.has('arrival') || params.has('open')) {
  const rest = new URLSearchParams(params);
  rest.delete('arrival');
  rest.delete('open');
  const query = rest.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
if (start) {
  ui.view = start.view;
  if (start.add && ui.onboarding === null) openSheet();
  else render();
}
if (!storage) showToast(t('error.noStorage'));
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
});
