import * as store from '#store';
import {
  loadState,
  save,
  loadLanguage,
  saveLanguage,
  loadHand,
  saveHand,
  loadShopLists,
  saveShopLists,
  loadTripEnd,
  saveTripEnd,
  loadTwinReach,
  saveTwinReach,
  loadTheme,
  saveTheme,
  loadDensity,
  saveDensity,
  loadOnboarded,
  hasStoredState,
} from '#storage';
import { loadSharedState, saveSharedState } from '#session';
import { combine, split, onList, reorderList, fillLists } from '#lists';
import { LANGUAGES, PSEUDO, resolveLanguage, translator } from '#i18n';
import { shouldShow } from '#onboarding';

// The values that the views share. A view reads them through the import, a live binding, and
// changes them only through the setters of this module.

export const UNDO_MS = 5000;
export const MESSAGE_MS = 3000;
// The app opens by itself at an arrival, so its message stays longer.
export const ARRIVAL_MS = 10000;
// Width of one swipe-action of a row, the same as in design-system.css.
export const SIDE_BUTTON = 72;
export const DRAG_START = 10;
// The wait before the first row of Compra shows that it slides, and the length of that slide (ROW-14).
export const HINT_WAIT_MS = 600;
export const HINT_SHIFT = 24;
export const CLICK_GUARD_MS = 350;
// The hold of a finger that lifts a row for a manual order.
export const HOLD_MS = 400;
// The distance from an edge of the list where a lifted row scrolls it, and the scroll of one frame.
export const EDGE = 56;
export const EDGE_STEP = 8;
export const LEAVE_MS = 200;
// The wait for the service worker to load the new deploy.
export const REFRESH_MS = 15000;
// The wait for the deployed version: a weak network can leave the request open.
export const CHECK_MS = 8000;

export const $ = (id) => document.getElementById(id);

export const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

export const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

export const scroller = document.querySelector('main');

// The choice of the user, or null to follow the phone.
export let chosen = storage ? loadLanguage(storage, LANGUAGES) : null;
export let lang = resolveLanguage(navigator.languages, chosen);
// Only `?lang=pseudo` selects the pseudo-locale (LANG-18): never saved, and `lang` stays a real code.
const pseudoLocale = new URLSearchParams(location.search).get('lang') === PSEUDO;
const translatorFor = (code) => translator(pseudoLocale ? PSEUDO : code);
export let t = translatorFor(lang);
// The hand that holds the phone: `left` mirrors the controls, in styles.css.
export let hand = storage ? loadHand(storage) : 'right';
document.documentElement.dataset.hand = hand;

// The colours: `light` or `dark` override the phone, in styles.css; `system` follows it.
export let theme = storage ? loadTheme(storage) : 'system';
// `hide` takes the row of shop lists away from Compra.
export let shopLists = storage ? loadShopLists(storage) : 'show';
// `save` makes Descartar the first choice of an item not bought at Terminar compra (TRIP-7).
export let tripEnd = storage ? loadTripEnd(storage) : 'keep';
// `both` makes a tick or a delete of a merged row of Todas reach the shared twin too (SHARE-16).
export let twinReach = storage ? loadTwinReach(storage) : 'own';
document.documentElement.dataset.theme = theme;
// `compact` takes space out of the rows of a list, in styles.css.
export let density = storage ? loadDensity(storage) : 'normal';
document.documentElement.dataset.density = density;

// `t` for a text that names a list: the `list` parameter is a list id.
export const say = (key, params = {}) => t(key, params.list ? { ...params, list: t(`list.${params.list}`) } : params);

// The text of a message of a pure module.
export const textOf = ({ key, params }) => say(key, params);

// Read before the state. A stored state, valid or not, means that the install is not new.
const firstStart = storage ? shouldShow({ seen: loadOnboarded(storage), hasState: hasStoredState(storage) }) : false;

const loaded = storage ? loadState(storage) : { state: store.emptyState(), lost: false };
// SHARE-12: for a member, `state` is the combined state of the own part and the shared part.
export let state = loaded.state;
// The share whose member is the user, `{ owner, ownerName, ownerEmail, scope, id }`, or null. The
// syncer gives it (account.js); until then the shared part stays out of the screen.
export let sharing = null;
// The shared part as last saved, or null. Read now: the syncer reads it at its construction.
export let sharedBase = storage ? loadSharedState(storage) : null;
// ACC-1: the stored state could not be read at this start; the sync pulls the account again.
export const stateLost = loaded.lost;

// The debug log (ENG-17): each change of the state, to paste a flow into a session. Only on the dev
// server (`npm run serve`), never on the deployed host.
export const DEV = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const debugRow = (item) => `${item.name} [${item.list}${item.bought ? ' bought' : ''}${item.recurrent ? ' recurrent' : ''}${item.quantity ? ` qty=${item.quantity}` : ''}${item.shops.length ? ` shops=${item.shops.join('|')}` : ''}${item.aisle ? ` aisle=${item.aisle}` : ''}]`;
const debugDiff = (before, after) => {
  const old = new Map(before.items.map((item) => [item.id, debugRow(item)]));
  const now = new Map(after.items.map((item) => [item.id, debugRow(item)]));
  const lines = [];
  for (const [id, row] of now) if (!old.has(id)) lines.push(`  + ${row}`);
  for (const [id, row] of old) if (!now.has(id)) lines.push(`  - ${row}`);
  for (const [id, row] of now) if (old.has(id) && old.get(id) !== row) lines.push(`  ~ ${old.get(id)} -> ${row}`);
  for (const key of ['sent', 'group', 'sort', 'version']) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) lines.push(`  ${key}: ${JSON.stringify(before[key])} -> ${JSON.stringify(after[key])}`);
  }
  return lines;
};
// In the console, `copy(shoppingLog.join('\n'))` puts the whole log on the clipboard.
if (DEV) window.shoppingLog = [];
export const debugLog = (label, lines = []) => {
  if (!DEV) return;
  const text = `[shopping] ${new Date().toLocaleTimeString()} ${label}${lines.length ? `\n${lines.join('\n')}` : ''}`;
  window.shoppingLog.push(text);
  console.log(text);
};
if (DEV) debugLog(`start v${state.version}`, state.items.map((item) => `  = ${debugRow(item)}`));
// `view` is the screen of the bottom menu.
export const ui = {
  view: 'active',
  // The install offer: `idle`, `available` or `installed` (INS-1).
  install: 'idle',
  openId: null,
  flashId: null,
  sheetOpen: false,
  // The sheet of the header button, with the group and the order of the list.
  arrangeOpen: false,
  // True while the sheet of the trip button of Compra is open.
  tripOpen: false,
  // True while the shop picker of the dock is open.
  shopPickOpen: false,
  // True while the sheet of the aisles of Ajustes is open.
  aislesOpen: false,
  shareOpen: false,
  // True while the sheet of the release notes is open (VER-21).
  whatsNewOpen: false,
  // The item whose edit sheet is open, or null.
  editId: null,
  // SHARE-16: the shared twin of the item of the edit sheet, when it opened from a merged row.
  editTwin: null,
  // The meal whose sheet is open, as { day, meal }, or null.
  mealOpen: null,
  mealQuery: '',
  // The page of the walkthrough in view, or null while the walkthrough is closed.
  onboarding: firstStart ? 0 : null,
  boughtOpen: false,
  // The groups of a list that the user closed, as `<view>:<group key>`. Not stored.
  closedGroups: new Set(),
  // The recipe whose sheet is open, or null.
  recipeId: null,
  // The text of the search field, which Recetas shows always and a list shows on demand. It is
  // not stored.
  query: '',
  // True while the search field of Compra is open.
  searchOpen: false,
  // The shop list of Compra: null for Todas, '' for Sin tienda, or a shop. Not stored.
  shop: null,
  // SHARE-14: the list chip of a member: null for Todas, 'own' or 'shared'. Not stored.
  listChoice: null,
  // The group where the row actions are open: a recipe id, `shop:<name>`, or null out of a group.
  openGroup: null,
  // The side menu of the open item row: 'end' (slide left) or null.
  openSide: null,
  // Where the last drag left its row, so that the next render moves the row from there.
  settleFrom: null,
  focusProduct: false,
  // True when the next render must open the new rows and close the rows that are gone.
  animate: false,
  // The ids of the ticked items whose rows are closing. A render in that time builds them closed.
  leaving: new Set(),
  // The keys of the recipe and product rows that the next render opens and flashes.
  bringKeys: new Set(),
  // `running` is the version of the cached shell; `latest` is the deployed one, read when Ajustes opens.
  version: { running: null, latest: null, checking: false },
};
let toastTimer = null;
export let undoState = null;

export const showToast = (text, { undo = null, ms = undo ? UNDO_MS : MESSAGE_MS } = {}) => {
  debugLog(`toast: ${text}${undo ? ' (with undo)' : ''}`);
  clearTimeout(toastTimer);
  undoState = undo;
  $('toast-text').textContent = text;
  $('toast-undo').hidden = !undo;
  $('toast').hidden = false;
  toastTimer = setTimeout(hideToast, ms);
};

export const hideToast = () => {
  clearTimeout(toastTimer);
  undoState = null;
  $('toast').hidden = true;
};

// The render of the whole screen. app.js registers it, so that a view renders without importing app.js.
let renderer = () => {};
export const setRender = (fn) => {
  renderer = fn;
};
export const render = () => renderer();

// The function that a save calls, with the saved own part and the saved shared part (null with no
// share): the sync queues each change in its lane (SYNC-2, SYNC-3, SHARE-6).
let afterCommit = null;
export const setAfterCommit = (fn) => {
  afterCommit = fn;
};

// SHARE-12: the shared part that the screen shows, and its scope. With no share both are null, so
// `combine` and `split` give the own state as it is.
const shownBase = () => (sharing ? sharedBase : null);
const scope = () => sharing?.scope ?? null;

// The own part of the state: the backup (SYNC-9), the walkthrough and the sync of the own lane.
export const ownState = () => split(state, shownBase(), scope()).own;

// Runs a store operation on the own part only, and gives the combined state of its result.
export const onOwn = (op) => onList(state, 'own', op, shownBase(), scope());

// Runs a store operation on one list, 'own' or 'shared', as onOwn does.
export const onListOf = (which, op) => onList(state, which, op, shownBase(), scope());

// The manual move of the items of `ids`, in the list that holds them (SHARE-15).
export const reorderOf = (ids) => reorderList(state, ids, shownBase(), scope());

// Llenar cesta: each list from its own menu (MENU-20).
export const fillMenus = () => fillLists(state, shownBase(), scope());

// `options` go to the after-commit function: an import is `explicit` (SYNC-9).
export const commit = (next, options = {}) => {
  if (DEV) {
    const lines = debugDiff(state, next);
    debugLog(`change (view ${ui.view})${lines.length ? '' : ': no change'}`, lines);
  }
  state = next;
  ui.animate = true;
  // SHARE-12: the split takes the markers away, so that no part saves or syncs one.
  const { own, shared } = split(state, shownBase(), scope());
  const saved = storage !== null && save(storage, own) && (shared === null || saveSharedState(storage, shared));
  if (saved && shared) sharedBase = shared;
  render();
  // After the render: an error of the sync never leaves the screen behind the state.
  if (saved && afterCommit) {
    try {
      afterCommit(own, shared, options);
    } catch (error) {
      console.error(error);
    }
  }
  return saved;
};

// The own part that the sync puts in place (SYNC-2): saved and rendered, with no after-commit
// function, so that it queues nothing. The shared part stays as it is.
export const replaceState = (next) => {
  // Deshacer would put back the state of before the merge, and send it as a change of the user.
  if (undoState) hideToast();
  state = combine(next, shownBase(), scope());
  if (storage) save(storage, next);
  render();
};

// SHARE-12: the share and the shared part that the sync puts in place, or (null, null) at the end of
// the share. Saved and rendered with no after-commit function, as replaceState.
export const setSharing = (share, shared) => {
  if (undoState) hideToast();
  const own = ownState();
  sharing = share;
  sharedBase = shared;
  // SHARE-14: with no share there are no list chips.
  if (!share) ui.listChoice = null;
  if (storage) saveSharedState(storage, shared);
  state = combine(own, shownBase(), scope());
  render();
};

// Saves a text as a JSON file of the device.
export const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Applies a store operation. `undoText` makes the change reversible for a few seconds.
export const apply = (result, { undoText = null, explicit = false } = {}) => {
  if (result.error) {
    showToast(textOf(result.error));
    return false;
  }
  const previous = state;
  const saved = commit(result.state, { explicit });
  if (!saved) showToast(t('error.notSaved'));
  else if (undoText) showToast(undoText, { undo: previous });
  else hideToast();
  return true;
};

// The click that follows a drag, a drop or a slide must not press the button below the finger.
export let clickGuardUntil = 0;
export const guardClick = () => {
  clickGuardUntil = Date.now() + CLICK_GUARD_MS;
};

// With no storage a choice lasts until the app closes.
export const setLanguage = (code) => {
  chosen = code;
  if (storage) saveLanguage(storage, chosen);
  lang = resolveLanguage(navigator.languages, chosen);
  t = translatorFor(lang);
};

export const setHand = (value) => {
  hand = value === 'left' ? 'left' : 'right';
  if (storage) saveHand(storage, hand);
  document.documentElement.dataset.hand = hand;
};

export const setTheme = (value) => {
  theme = ['light', 'dark'].includes(value) ? value : 'system';
  if (storage) saveTheme(storage, theme);
  document.documentElement.dataset.theme = theme;
};

export const setDensity = (value) => {
  density = value === 'compact' ? 'compact' : 'normal';
  if (storage) saveDensity(storage, density);
  document.documentElement.dataset.density = density;
};

export const setShopLists = (choice) => {
  shopLists = choice;
  if (storage) saveShopLists(storage, shopLists);
};

export const setTripEnd = (choice) => {
  tripEnd = choice === 'save' ? 'save' : 'keep';
  if (storage) saveTripEnd(storage, tripEnd);
};

export const setTwinReach = (choice) => {
  twinReach = choice === 'both' ? 'both' : 'own';
  if (storage) saveTwinReach(storage, twinReach);
};
