import * as store from '#store';
import {
  load,
  save,
  loadLanguage,
  saveLanguage,
  loadHand,
  saveHand,
  loadShopLists,
  saveShopLists,
  loadTripEnd,
  saveTripEnd,
  loadTheme,
  saveTheme,
  loadModules,
  saveModules,
  loadOnboarded,
  hasStoredState,
} from '#storage';
import { LANGUAGES, resolveLanguage, translator } from '#i18n';
import { shouldShow } from '#onboarding';

// The values that the views share. A view reads them through the import, a live binding, and
// changes them only through the setters of this module.

export const UNDO_MS = 5000;
export const MESSAGE_MS = 3000;
// The app opens by itself at an arrival, so its message stays longer.
export const ARRIVAL_MS = 10000;
// Width of one swipe-action of a row, the same as in styles.css.
export const SIDE_BUTTON = 64;
export const DRAG_START = 10;
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
export let t = translator(lang);
// The hand that holds the phone: `left` mirrors the controls, in styles.css.
export let hand = storage ? loadHand(storage) : 'right';
document.documentElement.dataset.hand = hand;

// The colours: `light` or `dark` override the phone, in styles.css; `system` follows it.
export let theme = storage ? loadTheme(storage) : 'system';
// `hide` takes the row of shop lists away from Actual and Próxima.
export let shopLists = storage ? loadShopLists(storage) : 'show';
// `keep` makes Aplazar the first choice of an item not bought at Terminar compra (TRIP-7).
export let tripEnd = storage ? loadTripEnd(storage) : 'save';
document.documentElement.dataset.theme = theme;

// The modules that the user turned off (MOD-2).
export let off = storage ? loadModules(storage) : [];
export const isOn = (id) => !off.includes(id);
export let navMotion = false;

// `t` for a text that names a list: the `list` parameter is a list id.
export const say = (key, params = {}) => t(key, params.list ? { ...params, list: t(`list.${params.list}`) } : params);

// The text of a message of a pure module.
export const textOf = ({ key, params }) => say(key, params);

// Read before the state. A stored state, valid or not, means that the install is not new.
const firstStart = storage ? shouldShow({ seen: loadOnboarded(storage), hasState: hasStoredState(storage) }) : false;

export let state = storage ? load(storage) : store.emptyState();

// The debug log (ENG-17): each change of the state, to paste a flow into a session. Only on the dev
// server (`npm run serve`), never on the deployed host.
export const DEV = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
const debugRow = (item) => `${item.name} [${item.list}${item.bought ? ' bought' : ''}${item.recurrent ? ' recurrent' : ''}${item.again ? ' again' : ''}${item.quantity ? ` qty=${item.quantity}` : ''}${item.shops.length ? ` shops=${item.shops.join('|')}` : ''}${item.aisle ? ` aisle=${item.aisle}` : ''}]`;
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
// `view` is the screen of the bottom menu; `target` is the list that the add sheet writes to.
export const ui = {
  view: 'active',
  // The install offer: `idle`, `available` or `installed` (INS-1).
  install: 'idle',
  openId: null,
  flashId: null,
  sheetOpen: false,
  // The sheet of the header button, with the group and the order of the list.
  arrangeOpen: false,
  // True while the sheet of the trip button of Actual is open.
  tripOpen: false,
  // True while the sheet of the aisles of Ajustes is open.
  aislesOpen: false,
  // The item whose edit sheet is open, or null.
  editId: null,
  // The meal whose sheet is open, as { day, meal }, or null.
  mealOpen: null,
  mealQuery: '',
  // The page of the walkthrough in view, or null while the walkthrough is closed.
  onboarding: firstStart ? 0 : null,
  target: 'active',
  boughtOpen: false,
  savedOpen: false,
  // The groups of a list that the user closed, as `<view>:<group key>`. Not stored.
  closedGroups: new Set(),
  // The recipe whose sheet is open, or null.
  recipeId: null,
  // The text of the search field, which Recetas shows always and a list shows on demand. It is
  // not stored.
  query: '',
  // True while the search field of Actual or of Próxima is open.
  searchOpen: false,
  // The shop list of each section: null for Todas, '' for Sin tienda, or a shop. Not stored.
  shop: { active: null, next: null },
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

export const commit = (next) => {
  if (DEV) {
    const lines = debugDiff(state, next);
    debugLog(`change (view ${ui.view})${lines.length ? '' : ': no change'}`, lines);
  }
  state = next;
  ui.animate = true;
  const saved = storage !== null && save(storage, state);
  render();
  return saved;
};

// Applies a store operation. `undoText` makes the change reversible for a few seconds.
export const apply = (result, { undoText = null } = {}) => {
  if (result.error) {
    showToast(textOf(result.error));
    return false;
  }
  const previous = state;
  const saved = commit(result.state);
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
  t = translator(lang);
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

export const setShopLists = (choice) => {
  shopLists = choice;
  if (storage) saveShopLists(storage, shopLists);
};

export const setTripEnd = (choice) => {
  tripEnd = choice === 'keep' ? 'keep' : 'save';
  if (storage) saveTripEnd(storage, tripEnd);
};

export const setModules = (next) => {
  off = next;
  if (storage) saveModules(storage, off);
};

// Set by a switch of Módulos, so that the render that follows animates the bottom bar (MOD-9).
export const setNavMotion = (on) => {
  navMotion = on;
};
