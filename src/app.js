import * as store from '#store';
import * as shops from '#shops';
import { listCounts } from '#lists';
import { bindSheetDrag } from '#ds/sheet';
import { shortcutStart, fabState, keyAction, keyMenuEcho, hashOfView, viewOfHash, historyDepth } from '#sections';
import { sheetOpen, closeTop, keysBlocked } from '#layers';
import {
  ARRIVAL_MS,
  $,
  el,
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
  setAfterCommit,
  render,
  commit,
  debugLog,
} from '#ui/context';
import { inList, listState, viewState } from '#ui/view';
import { rowKeys, bringIn, flash, snapshotRows, animateRows } from '#ui/motion';
import { closeEdit, renderEdit, bind as bindEdit } from '#ui/edit';
import { reorder, endReorder, bind as bindDrag } from '#ui/drag';
import { moveRow, openRowMenu, rowGroup } from '#ui/rows';
import { renderRecipe, closeRecipe, bind as bindRecipe } from '#ui/recipes';
import { renderPanels, bind as bindPanels } from '#ui/panels';
import { renderMeal, renderMenuActions, closeMeal, bind as bindMenu } from '#ui/menu';
import { renderArrange, closeArrange, bind as bindArrange } from '#ui/arrange';
import {
  headerOf,
  shopLabel,
  renderListChips,
  renderShopChips,
  renderRecipeChips,
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
import { startWhatsNew, isWhatsNewOpen, closeWhatsNew, bind as bindWhatsNew } from '#ui/whatsnew';
import { renderVersion, renderSample, renderTwinReach, readVersion, applyLanguage, bind as bindSettings } from '#ui/settings';
import { renderInstall, bind as bindInstall } from '#ui/install';
import { renderAisles, closeAisles, bind as bindAisles } from '#ui/aisles';
import { renderShare, closeShare, bind as bindShare } from '#ui/share';
import { showView, bind as bindNav } from '#ui/nav';
import { startMove } from '#ui/move';
import { bind as bindDevice } from '#ui/device';
import { features } from '#device';
import {
  syncer,
  renderSync,
  startAccount,
  finishOAuth,
  goOnline,
  goOffline,
  goVisible,
  isAccountOpen,
  accountClosable,
  closeAccount,
  bind as bindAccount,
} from '#ui/account';

// Screen

// The history holds the first entry, then one entry while a section other than Compra shows, then
// one while a layer is open (NAV-25, NAV-30): the back of the phone closes the layer, then goes to
// Compra, then leaves the app. Each entry has its place in `state.depth` and the hash of the section.
// A section or a layer closed in another way takes its entries away again: `skipPop` marks the pop
// of that `history.go()`, which closes nothing.
let depth = history.state?.depth ?? 0;
let skipPop = false;
const syncHistory = () => {
  // The link of a move (ADDR-5) keeps its hash until the move has read it.
  if (skipPop || location.hash.startsWith('#import=')) return;
  // An account screen that can close back to the list is a layer too, over each other one.
  const want = historyDepth(ui.view, accountClosable() || closeTop(ui) !== null);
  const url = `${location.pathname}${location.search}${hashOfView(ui.view)}`;
  if (want < depth) {
    skipPop = true;
    history.go(want - depth);
    return;
  }
  history.replaceState({ depth }, '', url);
  while (depth < want) history.pushState({ depth: ++depth }, '', url);
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
  ui.shop = shopLists === 'show' ? shops.validShop(listState(), ui.shop) : null;
  // The preview of Terminar compra counts the open items with the setting's choice (TRIP-7).
  const kept = tripEnd === 'keep' ? store.openItems(state).map((item) => item.id) : [];
  const summary = store.tripSummary(state, kept);
  const header = headerOf(store.tripSummary(viewState()));
  if (inList() && ui.shop !== null) header.title = shopLabel(ui.shop);

  renderListChips();
  renderShopChips();
  renderRecipeChips();
  $('title').textContent = header.title;
  $('subtitle').replaceChildren(...(header.strong ? [el('strong', { className: 'app-header-count', textContent: header.strong })] : []), header.subtitle);

  renderList(summary);
  renderDock();
  // Before the focus and the effects below: they also reach the rows of the recipe sheet.
  renderRecipe();

  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  renderSample();
  renderInstall();
  renderTwinReach();
  renderTrip();
  renderMenuActions();
  renderPanels();
  renderSync();

  // An action in the empty state replaces the add button. Below 600px the add button of the dock
  // takes the place of the fab (design-system.css), with the same label and the same conditions.
  // From 840px the recipe is a pane beside the list, not a sheet over it (REC-39): the add stays.
  // From 600px the add is the button of the header (NAV-24); the fab and the dock-add are hidden there.
  const recipePane = features(ui.device).recipePane && ui.recipeId !== null && !ui.sheetOpen;
  const noAdd = ['settings', 'menu'].includes(ui.view) || !$('empty-action').hidden || (sheetOpen(ui) && !recipePane);
  const addLabel = t(ui.view === 'recipes' ? 'add.recipe' : 'add.item');
  for (const id of ['fab', 'dock-add', 'header-add', 'nav-add']) {
    $(id).hidden = noAdd;
    $(id).setAttribute('aria-label', addLabel);
  }
  // The header names the add of a list with one word, as the desktop screen of Compra; its aria-label
  // keeps the whole name (NAV-24).
  $('header-add-text').textContent = ui.view === 'recipes' ? addLabel : t('add.short');
  $('nav-add-text').textContent = addLabel;
  document.querySelectorAll('.nav-item').forEach((button) => {
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  // The sidebar from 1024px counts the items left in Compra (NAV-26).
  // A pair of twins of a member counts once, as in Todas (SHARE-14).
  const left = listCounts(state).all;
  $('nav-count').textContent = left > 0 ? String(left) : '';

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
  renderShare();
  renderShopPick();
  showDockMatches();
  syncHistory();
};
// A start at the address of a section shows it (NAV-30); a shortcut below wins over it.
ui.view = viewOfHash(location.hash);
setRender(renderAll);
// A change of the width class renders again: the recipe pane and the dock follow it (NAV-28).
bindDevice(render);
// The sheets from 840px start below the header, level with the panels (DSV-6).
new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty('--header-height', `${Math.round(entry.borderBoxSize[0].blockSize)}px`);
}).observe(document.querySelector('.app-header'));

// Events

bindNav();
bindPanels();
bindOnboarding();
bindWhatsNew();
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
    syncHistory();
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
  if (ui.aislesOpen) closeAisles();
  if (ui.shareOpen) closeShare();
  if (ui.shopPickOpen) closeShopPick();
  if (isWhatsNewOpen()) closeWhatsNew();
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
  const to = history.state?.depth;
  if (skipPop) {
    skipPop = false;
    depth = to ?? 0;
    // A layer or a section that opened while the entries went away gets its own entry now.
    syncHistory();
    return;
  }
  // An address typed or opened by hand is a new entry with no state: it shows its section.
  if (to === undefined) {
    depth += 1;
    showView(viewOfHash(location.hash));
    return;
  }
  const back = to < depth;
  depth = to;
  // A forward goes back again to the entries of the screen.
  if (!back) {
    syncHistory();
    return;
  }
  // A screen that can go back to the list closes first. One that cannot close has no entry: the
  // back closes the layer below it, so the back never loops.
  if (accountClosable()) {
    closeAccount();
    return;
  }
  if (ui.onboarding !== null) return;
  endReorder(false);
  if (closeLayer() === null && ui.view !== 'active') showView('active');
  // A back that closed nothing keeps the entries of the screen.
  else syncHistory();
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
  // The account screens cover the app, the walkthrough too.
  if (isAccountOpen()) {
    if (event.key === 'Escape') closeAccount();
    return;
  }
  if (ui.onboarding !== null) {
    if (event.key === 'Escape') closeOnboarding();
    else if (event.key === 'ArrowRight') turnOnboarding(1);
    else if (event.key === 'ArrowLeft') turnOnboarding(-1);
    return;
  }
  // Ctrl+K or ⌘K opens the search of the list, as the search field of the header does (LIST-21).
  if (event.key?.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !$('search-button').hidden) {
    event.preventDefault();
    if (!ui.searchOpen) $('search-button').click();
    else $('query').focus();
    return;
  }
  if (event.key === 'Escape') {
    endReorder(false);
    closeLayer();
    return;
  }
  runKey(event);
});

// The keys of NAV-29: a section, the add, the search, and the actions of a focused item row.
let keyMenuAt = null;
// The contextmenu that the menu key or Shift+F10 sends after it opened a row lands on the focused
// action, out of the row: the menu of the browser must not cover the actions.
document.addEventListener('contextmenu', (event) => {
  if (!keyMenuEcho(keyMenuAt, Date.now())) return;
  keyMenuAt = null;
  event.preventDefault();
});
const visible = (id) => !$(id).hidden && $(id).offsetParent !== null;
const runKey = (event) => {
  const row = event.target.closest?.('.item-row[data-id]') ?? null;
  const action = keyAction({
    key: event.key,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
    inField: Boolean(event.target.closest?.('input, textarea, select, [contenteditable]')),
    layer: keysBlocked(ui, features(ui.device)) || reorder !== null,
    onRow: row !== null,
  });
  if (!action) return;
  event.preventDefault();
  if (action.type === 'view') showView(action.view);
  else if (action.type === 'add') {
    if (!$('fab').hidden) openSheet();
    else if (visible('empty-action')) $('empty-action').click();
  } else if (action.type === 'search') {
    const button = ['search-button', 'dock-search'].find(visible);
    if (button && !ui.searchOpen) $(button).click();
    else if (ui.searchOpen) $(visible('query') ? 'query' : 'dock-query').focus();
  } else if (action.type === 'rowMenu') {
    const { id } = row.dataset;
    const group = rowGroup(row.dataset);
    keyMenuAt = Date.now();
    openRowMenu(id, group);
    // The render builds the row again: the focus goes to its first action, for the keyboard.
    const selector = `.item-row[data-id="${CSS.escape(id)}"]${group === null ? ':not([data-swipe-group])' : `[data-swipe-group="${CSS.escape(group)}"]`} .item-row-actions button`;
    document.querySelector(selector)?.focus();
  }
  // The delete button of the side actions keeps the undo and the reach of a merged row (SHARE-16).
  else row.querySelector('.item-row-actions .danger')?.click();
};

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  // A Deshacer of a request that waits (SHARE-8) is a function: it cancels the request.
  if (typeof undoState === 'function') {
    undoState();
    hideToast();
    return;
  }
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
bindAccount();
bindShare();

// Each sheet closes by Listo of its head and by a drag down of its grab or head. Each close
// hides the layer at once, so the closing transition starts where the drag left the sheet.
const SHEET_CLOSE = {
  sheet: closeSheet,
  arrange: closeArrange,
  trip: closeTrip,
  meal: closeMeal,
  edit: closeEdit,
  aisles: closeAisles,
  share: closeShare,
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
// The return of the Google sign-in (ACC-5): `code` and `state` leave the URL at once, with the query below.
// A cancel at Google returns `error` and `state` with no `code`.
const oauthReturn = params.has('state') && (params.has('code') || params.has('error'))
  ? { code: params.get('code'), state: params.get('state') }
  : null;
// The query goes before a sheet opens: the entry of the sheet (syncHistory) then comes after an address
// with no query, and a reload opens nothing.
const used = ['arrival', 'open', 'moved', ...(oauthReturn ? ['code', 'state', 'error'] : [])];
if (used.some((name) => params.has(name))) {
  const rest = new URLSearchParams(params);
  for (const name of used) rest.delete(name);
  const query = rest.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
if (start) {
  ui.view = start.view;
  if (start.add && ui.onboarding === null) openSheet();
  else render();
}
if (!storage) showToast(t('error.noStorage'));
// ADDR-1, ADDR-5: before the account starts, so its route (ACC-1) sees the moved data.
// A failed move must not stop the start of the app.
await startMove({ moved: params.has('moved') }).catch((error) => console.error(error));
// The account and the sync (ACC-1, SYNC-3): each save queues its change, and the sync runs at the start,
// at `online` and at a change of the account.
if (syncer) {
  // SHARE-6: each part of a save queues in its own lane.
  setAfterCommit((own, shared, options) => {
    syncer.notify(own, options);
    if (shared) syncer.notifyShared(shared);
  });
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);
  document.addEventListener('visibilitychange', goVisible);
  if (oauthReturn) finishOAuth(oauthReturn);
  else startAccount();
}
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
  // The release notes of an update, once, after the running version is known (VER-20).
  startWhatsNew(running);
});
