import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as menu from '#menu';
import { direction, slideDirection, slideTo } from '#sections';
import { switchModule, visibleSections } from '#modules';
import { PARTICLE_SIZE, makeParticles, particleAt } from '#particles';
import { PAGES, isLast, step } from '#onboarding';
import { exportJson, exportFilename, importJson, saveOnboarded } from '#storage';
import { parseVersion, versionStatus } from '#version';
import { LANGUAGES, LANGUAGE_NAMES, intlTag } from '#i18n';
import {
  ARRIVAL_MS,
  LEAVE_MS,
  REFRESH_MS,
  CHECK_MS,
  $,
  el,
  storage,
  scroller,
  chosen,
  lang,
  t,
  hand,
  theme,
  shopLists,
  off,
  navMotion,
  state,
  ui,
  undoState,
  clickGuardUntil,
  isOn,
  say,
  textOf,
  showToast,
  hideToast,
  setRender,
  render,
  commit,
  apply,
  guardClick,
  setLanguage,
  setHand,
  setTheme,
  setShopLists,
  setModules,
  setNavMotion,
} from '#ui/context';
import { inList, viewState, found, searching, arrangeChoices, shownGroup, endSearch } from '#ui/view';
import { collapse, expand, pendingRows, rowTops, slide, groupOnlyRows } from '#ui/motion';
import { icon } from '#ui/controls';
import { closeEdit, renderEdit, bind as bindEdit } from '#ui/edit';
import { reorder, endReorder, bind as bindDrag } from '#ui/drag';
import { itemNode, boughtSection, groupHead, moveRow } from '#ui/rows';
import { recipeNode } from '#ui/recipes';
import { dayNode, renderMeal, closeMeal, bind as bindMenu } from '#ui/menu';

// True while the groups of Actual close, before the list becomes flat.
let ungrouping = false;

const finishTrip = (undoText = t('toast.finished')) => {
  if (!apply(store.startNewShopping(state), { undoText })) return;
  Object.assign(ui, { view: 'active', editingId: null, openId: null, tripOpen: false });
  render();
};

// Rows

// The rows of a list below the shop of each item. A row of a shop has the group id `shop:<name>`.
const shopNodes = (list) => {
  const { groups, rest } = store.filterGroups(shops.shopGroups(viewState(), list), ui.query);
  const count = ({ left, total }) => {
    if (list !== 'active') return '';
    return left ? `${total - left}/${total}` : '✓';
  };
  const grouped = groups.flatMap((group) => [
    groupHead(group.shop, count(group)),
    ...group.items.map((item) => itemNode(item, `shop:${group.shop}`)),
  ]);
  const others = rest.length ? [groupHead(t('group.noShop'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

// The items of Actual still to buy: flat, below the recipe that asks for each one, or below
// the shop of each one.
const pendingNodes = () => {
  const group = shownGroup();
  if (group === 'shop') return shopNodes('active');
  if (group === 'none') {
    return store.activeItems(viewState()).filter((item) => !item.bought && found(item)).map((item) => itemNode(item));
  }
  const { groups, rest } = store.filterGroups(recipes.recipeGroups(viewState()), ui.query);
  const grouped = groups.flatMap(({ recipe, items, total, left }) => [
    groupHead(recipe.name, left ? `${total - left}/${total}` : '✓'),
    ...items.map((item) => itemNode(item, recipe.id)),
  ]);
  const others = rest.length ? [groupHead(t('group.others'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

const listNodes = (items) => {
  if (ui.view !== 'active') return shownGroup() === 'shop' ? shopNodes('next') : items.filter(found).map((item) => itemNode(item));
  const bought = items.filter((item) => item.bought && found(item));
  return bought.length ? [...pendingNodes(), ...boughtSection(bought)] : pendingNodes();
};

const renderArrange = () => {
  const { recipe, shop, sort } = arrangeChoices();
  const group = recipe || shop;
  // The choice of the row of shop lists shows when the view has the row to show.
  const lists = inList() && shops.shopChips(state, ui.view).length > 0;
  if (!group && !sort && !lists) ui.arrangeOpen = false;
  $('arrange-button').hidden = !group && !sort && !lists;
  $('arrange-button').setAttribute('aria-expanded', String(ui.arrangeOpen));
  $('arrange').hidden = !ui.arrangeOpen;
  $('arrange-group').hidden = !group;
  $('arrange-sort').hidden = !sort;
  $('arrange-lists').hidden = !lists;
  document.querySelectorAll('#arrange-lists button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lists === shopLists));
  });
  const shows = { recipe, shop, none: true };
  // The view shows no group for a choice that it cannot show.
  const pressed = shownGroup();
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.hidden = !shows[button.dataset.group];
    button.setAttribute('aria-pressed', String(button.dataset.group === pressed));
  });
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sort === state.sort));
  });
};

// Screen

const finishText = ({ back, gone }) => `${t('finish.back', { count: back })} ${t('finish.gone', { count: gone })}`;

const activeSubtitle = ({ total, left }) => {
  if (!total) return t('header.empty');
  if (!left) return t('header.allBought');
  return t('header.left', { count: left });
};

const headerOf = (summary, next) => {
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle'), ring: '⚙', pct: 0 };
  if (ui.view === 'menu') {
    const count = menu.mealCount(state);
    const subtitle = count ? t('header.menuMeals', { count }) : t('header.noMeals');
    return { title: t('nav.menu'), subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'recipes') {
    const count = state.recipes.length;
    const subtitle = count ? t('count.recipes', { count }) : t('header.noRecipes');
    return { title: t('nav.recipes'), subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'next') {
    const boughtToday = next.length - summary.incoming;
    const parts = [next.length ? t('count.items', { count: next.length }) : t('header.nothingReady')];
    if (boughtToday) parts.push(t('header.boughtToday', { count: boughtToday }));
    return { title: t('header.next'), subtitle: parts.join(' · '), ring: String(next.length), pct: 0 };
  }
  const { total, left } = summary;
  const pct = total ? Math.round(((total - left) / total) * 100) : 0;
  return { title: t('header.today'), subtitle: activeSubtitle(summary), ring: `${total - left}/${total}`, pct };
};

const EMPTY_KEYS = { active: 'empty.active', next: 'empty.next', recipes: 'empty.recipes', menu: 'empty.menu' };

const emptyText = () => {
  if (searching()) return t(ui.view === 'recipes' ? 'empty.noMatch' : 'empty.noItemMatch', { query: ui.query.trim() });
  return EMPTY_KEYS[ui.view] ? t(EMPTY_KEYS[ui.view]) : '';
};

// One field serves the three sections: Recetas shows it when it has a recipe, and a list shows it
// after a tap on the search button, which a list with no item does not have.
const renderSearch = (items, searchable) => {
  const canOpen = inList() && items.length > 0;
  if (!canOpen) ui.searchOpen = false;
  const shown = searchable || ui.searchOpen;
  if (!shown) ui.query = '';
  $('search-button').hidden = !canOpen;
  $('search-button').setAttribute('aria-expanded', String(ui.searchOpen));
  $('search').hidden = !shown;
  const label = t(inList() ? 'search.items' : 'recipes.search');
  $('query').placeholder = label;
  $('query').setAttribute('aria-label', label);
  // The field is not built again by a render, so it keeps the cursor. Write it only after a reset.
  if ($('query').value !== ui.query) $('query').value = ui.query;
};

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  // With no recipe there is nothing to plan: the empty text says where to create one.
  if (ui.view === 'menu') return state.recipes.length ? menu.menuWeek(state).map(dayNode) : [];
  return ui.view === 'recipes' ? recipes.searchRecipes(state, ui.query).map(recipeNode) : listNodes(items);
};

// A shop list of Actual with nothing to buy, while other items are still to buy, points to the
// next shop list that has some.
const renderShopDone = (summary) => {
  const shop = ui.shop.active;
  const done = ui.view === 'active' && shop !== null && !searching() && summary.left > 0 &&
    store.tripSummary(viewState()).left === 0;
  $('shop-done').hidden = !done;
  if (!done) return;
  const next = shops.nextShop(state, shop);
  $('shop-done-text').textContent = t('shops.nothingLeft', { shop: shopLabel(shop) });
  $('shop-done-next').textContent = shopLabel(next);
  $('shop-done-next').onclick = () => {
    ui.shop.active = next;
    render();
  };
};

const renderList = (summary) => {
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : store.nextItems(scoped);
  const searchable = ui.view === 'recipes' && state.recipes.length > 0;
  renderSearch(items, searchable);
  const nodes = nodesOf(items);
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'next' && nodes.length) {
    $('items').append(el('p', { className: 'hint', textContent: t('next.hint') }));
  }

  $('empty').hidden = ui.view === 'settings' || nodes.length > 0;
  $('empty-text').textContent = emptyText();
  $('bring').hidden = !(isOn('next') && ui.view === 'active' && summary.incoming > 0) || searching();
  $('bring').textContent = say('empty.bring', { count: summary.incoming, list: 'next' });

  $('menu-actions').hidden = !(ui.view === 'menu' && state.recipes.length > 0);
  $('menu-clear').disabled = menu.mealCount(state) === 0;

  $('finish').hidden = !(ui.view === 'active' && ui.shop.active === null && summary.total > 0 && summary.left === 0);
  renderShopDone(summary);
  $('finish-text').textContent = finishText(summary);
};

const VERSION_KEYS = { current: 'version.current', unknown: 'version.unknown' };

const renderVersion = () => {
  const { running, latest, checking } = ui.version;
  const status = versionStatus(running, latest);
  const dateForm = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  const date = running && new Date(running.date).toLocaleString(intlTag(lang), dateForm);
  $('version').textContent = running ? t('version.running', { version: running.version, date }) : t('version.none');
  const text = checking
    ? t('version.checking')
    : status === 'outdated' ? t('version.available', { version: latest.version }) : t(VERSION_KEYS[status]);
  $('version-status').dataset.status = checking ? 'checking' : status;
  $('version-status').title = text;
  $('version-status-text').textContent = text;
  $('update').hidden = checking || status !== 'outdated';
};

const readVersion = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return response.ok ? parseVersion(await response.json()) : null;
  } catch {
    return null;
  }
};

// The time value in the URL goes past the cache of the host; the service worker lets `latest` through.
const checkVersion = async () => {
  ui.version.checking = true;
  renderVersion();
  const latest = await readVersion(`./version.json?latest=${Date.now()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CHECK_MS),
  });
  Object.assign(ui.version, { latest, checking: false });
  renderVersion();
};

// Asks the service worker to load the shell of the new deploy. Resolves to false when it cannot.
const refreshShell = () =>
  new Promise((resolve) => {
    const worker = navigator.serviceWorker?.controller;
    if (!worker) {
      resolve(true);
      return;
    }
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), REFRESH_MS);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(Boolean(event.data?.ok));
    };
    worker.postMessage({ type: 'refresh' }, [channel.port2]);
  });

// The trip button of the header and its sheet.
const renderTrip = () => {
  if (ui.view !== 'active') ui.tripOpen = false;
  $('trip-button').hidden = ui.view !== 'active';
  $('finish-menu').disabled = !store.canStartNewShopping(state);
  $('trip-button').setAttribute('aria-expanded', String(ui.tripOpen));
  $('trip').hidden = !ui.tripOpen;
};

const shopLabel = (shop) => (shop === null ? t('shops.all') : shop === '' ? t('group.noShop') : shop);

// The row of the shop lists of Actual and Próxima. A count of Actual is the items to buy.
const renderShopChips = () => {
  const chips = inList() && shopLists === 'show' ? shops.shopChips(state, ui.view) : [];
  $('shop-chips').hidden = chips.length === 0;
  const count = (value) => (ui.view === 'active' && value === 0 ? '✓' : String(value));
  const buttons = chips.map(({ shop, count: value }) => {
    const pick = () => {
      Object.assign(ui, { openId: null, openSide: null, editingId: null });
      ui.shop[ui.view] = shop;
      render();
    };
    const button = el('button', { type: 'button', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('span', { className: 'chip-count', textContent: count(value) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop[ui.view]));
    return button;
  });
  $('shop-chips').replaceChildren(...buttons);
};

const renderAll = () => {
  // A render builds new rows, so a lifted row loses its pointer and gets no release.
  endReorder(false);
  // The item of the edit sheet can go while the sheet is open: an undo, or an import.
  if (!state.items.some((item) => item.id === ui.editId)) ui.editId = null;
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

  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  const outcome = [t('settings.back', { count: summary.back }), t('settings.gone', { count: summary.gone })];
  $('finish-menu-text').textContent = outcome.join(' · ');
  renderTrip();

  $('fab').hidden =
    ['settings', 'menu'].includes(ui.view) || ui.sheetOpen || ui.arrangeOpen || ui.tripOpen || ui.editId !== null || ui.mealOpen !== null;
  $('fab').setAttribute('aria-label', t(ui.view === 'recipes' ? 'add.recipe' : 'add.item'));
  $('next-count').textContent = next.length || '';
  const sections = visibleSections(off);
  document.querySelectorAll('.bnav button').forEach((button) => {
    showNavButton(button, sections.includes(button.dataset.view));
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  $('items').querySelector('.rename')?.focus();
  if (ui.focusProduct) $('items').querySelector('.product-name')?.focus();
  ui.focusProduct = false;
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
  ui.settleFrom = null;
  renderSheet();
  renderArrange();
  renderEdit();
  renderMeal();
};
setRender(renderAll);

// The time of the dust of a button, and of the close or the open of its place in the bar.
const DUST_MS = 900;
const PLACE_MS = 300;

// The pixels of a button of the bottom bar: its icon, then its label, in their colours.
const drawButton = async (button) => {
  const box = button.getBoundingClientRect();
  const canvas = el('canvas', { width: Math.ceil(box.width), height: Math.ceil(box.height) });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const icon = button.querySelector('svg');
  const place = icon.getBoundingClientRect();
  const look = getComputedStyle(icon);
  const copy = icon.cloneNode(true);
  Object.entries({
    xmlns: 'http://www.w3.org/2000/svg',
    width: place.width,
    height: place.height,
    fill: 'none',
    stroke: look.color,
    'stroke-width': look.strokeWidth,
    'stroke-linecap': look.strokeLinecap,
    'stroke-linejoin': look.strokeLinejoin,
  }).forEach(([name, value]) => copy.setAttribute(name, value));
  const image = new Image();
  image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  await image.decode();
  context.drawImage(image, place.left - box.left, place.top - box.top, place.width, place.height);
  const label = button.querySelector('span');
  const text = label.getBoundingClientRect();
  const font = getComputedStyle(label);
  context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  context.fillStyle = font.color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label.textContent, text.left - box.left + text.width / 2, text.top - box.top + text.height / 2);
  return { box, image: context.getImageData(0, 0, canvas.width, canvas.height) };
};

// Plays the dust of a picture at `box` on a canvas over the page: the particles leave, or with
// `back` they come in and settle. Resolves at the end, or at once when `run` is cancelled.
const playDust = ({ box, image }, back, run) =>
  new Promise((resolve) => {
    const particles = makeParticles(image);
    const pad = 80;
    const canvas = el('canvas', { className: 'dust', width: box.width + 2 * pad, height: box.height + 2 * pad });
    Object.assign(canvas.style, { left: `${box.left - pad}px`, top: `${box.top - pad}px` });
    document.body.append(canvas);
    const context = canvas.getContext('2d');
    run.stops.push(() => {
      canvas.remove();
      resolve();
    });
    const start = performance.now();
    const frame = (now) => {
      if (run.cancelled) return;
      const t = Math.min(1, (now - start) / DUST_MS);
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        const { x, y, alpha } = particleAt(particle, back ? 1 - t : t);
        if (alpha <= 0) return;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.fillRect(pad + x, pad + y, PARTICLE_SIZE, PARTICLE_SIZE);
      });
      if (t < 1) requestAnimationFrame(frame);
      else {
        canvas.remove();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });

// The open or the close of the place of a button in the bar.
const movePlace = (button, open, run, delay = 0) => {
  const frames = [{ flexGrow: 0, minWidth: 0 }, { flexGrow: 1, minWidth: 0 }];
  const motion = button.animate(frames, {
    duration: PLACE_MS,
    delay,
    easing: 'ease',
    direction: open ? 'normal' : 'reverse',
    fill: 'both',
  });
  run.stops.push(() => motion.cancel());
  return motion.finished.catch(() => {});
};

// The effects of the bar that run, by button. Each entry is the run that a later change cancels.
const navRuns = new Map();

const endRun = (button) => {
  const run = navRuns.get(button);
  if (!run) return;
  run.cancelled = true;
  run.stops.forEach((stop) => stop());
  button.style.opacity = '';
  button.style.overflow = '';
  navRuns.delete(button);
};

// A button that goes breaks into dust, then its place closes. A button that comes back opens its
// place, then its dust comes in and settles (MOD-9).
const runNavEffect = async (button, shown) => {
  const run = { shown, cancelled: false, stops: [] };
  navRuns.set(button, run);
  button.hidden = false;
  button.style.overflow = 'hidden';
  try {
    if (shown) {
      button.style.opacity = '0';
      await movePlace(button, true, run);
      if (run.cancelled) return;
      const picture = await drawButton(button);
      if (run.cancelled) return;
      await playDust(picture, true, run);
    } else {
      const picture = await drawButton(button);
      if (run.cancelled) return;
      button.style.opacity = '0';
      await Promise.all([playDust(picture, false, run), movePlace(button, false, run, DUST_MS * 0.35)]);
    }
  } catch {
    // A picture that cannot be drawn ends the effect: the button takes its place at once.
  }
  if (run.cancelled) return;
  endRun(button);
  button.hidden = !shown;
};

// Shows or hides the button of a section in the bottom bar. With `navMotion` the change is the
// effect of runNavEffect; a button keeps its effect until the effect ends or a change cancels it.
const showNavButton = (button, shown) => {
  const run = navRuns.get(button);
  if (run ? run.shown === shown : shown === !button.hidden) return;
  endRun(button);
  if (!navMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    button.hidden = !shown;
    return;
  }
  runNavEffect(button, shown);
};

// Writes the fixed text of the page, then the text that a render builds.
const applyLanguage = () => {
  document.documentElement.lang = lang;
  document.title = t('app.title');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    node.dataset.i18nAttr.split(',').forEach((pair) => {
      const [name, key] = pair.split(':');
      node.setAttribute(name, t(key));
    });
  });
  const option = (value, text) => el('option', { value, textContent: text, selected: value === (chosen ?? '') });
  $('language').replaceChildren(
    option('', t('settings.automatic')),
    ...LANGUAGES.map((code) => option(code, LANGUAGE_NAMES[code])),
  );
  const handOption = (value, key) => el('option', { value, textContent: t(key), selected: value === hand });
  $('hand').replaceChildren(handOption('right', 'settings.handRight'), handOption('left', 'settings.handLeft'));
  const themeOption = (value, key) => el('option', { value, textContent: t(key), selected: value === theme });
  $('theme').replaceChildren(
    themeOption('system', 'settings.automatic'),
    themeOption('light', 'settings.themeLight'),
    themeOption('dark', 'settings.themeDark'),
  );
  document.querySelectorAll('[data-module]').forEach((box) => {
    box.checked = isOn(box.dataset.module);
  });
  render();
  renderOnboarding();
};

// Onboarding

const renderOnboarding = () => {
  const open = ui.onboarding !== null;
  $('onboarding').hidden = !open;
  // The walkthrough covers the app: no tap, no slide and no focus goes below it.
  document.querySelectorAll('.head, main, .fab, .bnav').forEach((node) => {
    node.inert = open;
  });
  if (!open) return;
  const page = PAGES[ui.onboarding];
  // An SVG element has no `hidden` property, so the attribute is set.
  document.querySelectorAll('#onboarding svg[data-page]').forEach((drawing) => {
    drawing.toggleAttribute('hidden', drawing.dataset.page !== page);
  });
  $('onboarding-title').textContent = t(`onboarding.${page}.title`);
  $('onboarding-text').textContent = t(`onboarding.${page}.text`, { active: t('list.active'), next: t('list.next') });
  $('onboarding-dots').replaceChildren(...PAGES.map((id) => el('span', { className: id === page ? 'on' : '' })));
  $('onboarding-dots').setAttribute('aria-label', t('onboarding.page', { page: ui.onboarding + 1, total: PAGES.length }));
  $('onboarding-skip').hidden = isLast(ui.onboarding);
  $('onboarding-next').textContent = t(isLast(ui.onboarding) ? 'onboarding.start' : 'onboarding.next');
};

const openOnboarding = () => {
  ui.onboarding = 0;
  renderOnboarding();
  $('onboarding-next').focus();
};

// A close marks the walkthrough as seen. With no storage it shows only from Ajustes.
const closeOnboarding = () => {
  ui.onboarding = null;
  if (storage) saveOnboarded(storage);
  renderOnboarding();
  if (ui.view === 'settings') $('show-onboarding').focus();
};

// Shows the next page for 1 and the previous one for -1. The page comes in from its side.
const turnOnboarding = (way) => {
  const index = step(ui.onboarding, way);
  if (index === ui.onboarding) return;
  ui.onboarding = index;
  renderOnboarding();
  // The skip button goes away on the last page, and the focus must not go with it.
  $('onboarding-next').focus();
  const page = $('onboarding-page');
  page.classList.remove('enter-next', 'enter-previous');
  // The read of the width starts the animation again when a change follows another one.
  void page.offsetWidth;
  page.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

// Add sheet

const whereText = (item) => {
  const inNextView = item.list === 'next' || (item.bought && (item.recurrent || item.again));
  if (ui.target === 'active') {
    if (item.list === 'next') return say('where.inNextBring', { list: 'next' });
    return t(item.bought ? 'where.boughtRepeat' : 'where.inList');
  }
  if (inNextView) return say('where.inNext', { list: 'next' });
  if (item.bought) return say('where.boughtAddNext', { list: 'next' });
  return say('where.inActiveMove', { list: 'active' });
};

const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  const label = t(forRecipe ? 'add.recipeName' : 'add.itemLabel');
  $('seg').hidden = forRecipe || !isOn('next');
  $('add-submit').textContent = t(forRecipe ? 'add.create' : 'add.submit');
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', t(forRecipe ? 'add.recipe' : 'add.item'));
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  document.querySelectorAll('#seg button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.target === ui.target));
  });
  const text = $('add-name').value.trim();
  const rows = store.searchItems(state, text).map((item) =>
    el('li', {}, [
      el('button', { type: 'button', onclick: () => useExisting(item) }, [
        el('span', { className: 'suggestion-name', textContent: item.name }),
        el('span', { className: 'suggestion-where', textContent: whereText(item) }),
      ]),
    ]));
  if (text && !store.findByName(state, text)) {
    rows.push(
      el('li', {}, [el('button', { type: 'button', className: 'create', textContent: t('add.createNamed', { name: text }), onclick: submitAdd })]),
    );
  }
  $('suggestions').replaceChildren(...rows);
};

const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, target: ui.view === 'next' && isOn('next') ? 'next' : 'active', openId: null, editingId: null });
  $('add-name').value = '';
  render();
  $('add-name').focus();
};

const closeSheet = () => {
  ui.sheetOpen = false;
  render();
};

// The shop that an add from the sheet puts on its item: the shop list in view, if any.
const pickedShop = () => (inList() ? ui.shop[ui.view] : null);

// Puts an item that exists already into the target list, in place of a duplicate. From a shop
// list the item also gets the shop, which is a change too.
const useExisting = (item) => {
  const brought = store.bringToList(state, item.id, ui.target);
  const result = shops.withShop(brought, item.id, pickedShop());
  if (result.state !== brought.state) result.changed = true;
  const params = { name: item.name, list: ui.target };
  $('add-name').value = '';
  if (ui.target === ui.view) ui.flashId = item.id;
  if (!result.error) endSearch();
  if (result.changed) apply(result, { undoText: say('toast.existsNowIn', params) });
  else {
    render();
    showToast(result.error ? textOf(result.error) : say('error.duplicateItem', params));
  }
  $('add-name').focus();
};

const submitRecipe = () => {
  const input = $('add-name');
  const result = recipes.addRecipe(state, input.value);
  if (result.error) {
    showToast(textOf(result.error));
    input.focus();
    return;
  }
  // The new recipe shows expanded, with the cursor in its product field.
  Object.assign(ui, { sheetOpen: false, openRecipeId: result.id, focusProduct: true, query: '' });
  apply(result);
};

const submitAdd = () => {
  if (ui.view === 'recipes') {
    submitRecipe();
    return;
  }
  const input = $('add-name');
  const existing = store.findByName(state, input.value);
  if (existing) {
    useExisting(existing);
    return;
  }
  const name = input.value.trim();
  const added = store.addItem(state, input.value, ui.target);
  const result = added.error ? added : shops.withShop(added, added.state.items.at(-1).id, pickedShop());
  if (!result.error) endSearch();
  if (apply(result)) {
    input.value = '';
    renderSheet();
    showToast(say('toast.addedTo', { name, list: ui.target }));
  }
  input.focus();
};

// Events

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Lets the content of the new section come in from the side that it is on in the bottom bar.
const enter = (way) => {
  scroller.classList.remove('enter-next', 'enter-previous');
  if (!way) return;
  // The read of the width starts the animation again when a change follows another one.
  void scroller.offsetWidth;
  scroller.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

// A child of the list area that shows later, as a banner does, must not come in from a side.
scroller.addEventListener('animationend', (event) => {
  if (event.animationName === 'enter') scroller.classList.remove('enter-next', 'enter-previous');
});

const showView = (view) => {
  const way = direction(ui.view, view, visibleSections(off));
  // The field is shared: the focus of a list search must not go with it to Recetas.
  $('query').blur();
  Object.assign(ui, { view, editingId: null, openId: null, query: '', searchOpen: false, mealOpen: null });
  render();
  enter(way);
  if (ui.view === 'settings') checkVersion();
};

document.querySelectorAll('.bnav button').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

// A horizontal slide that starts out of the rows changes the section. A row keeps its drag for its
// side menus, and a text field keeps its drag for the selection.
let sectionSlide = null;
document.addEventListener('pointerdown', (event) => {
  sectionSlide = null;
  const sheet = ui.sheetOpen || ui.arrangeOpen || ui.tripOpen || ui.editId !== null || ui.mealOpen !== null;
  if (!event.isPrimary || event.button !== 0 || reorder || sheet) return;
  if (!event.target.closest('.head, main') || event.target.closest('.swipe, .shop-chips, input, textarea')) return;
  sectionSlide = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
});
document.addEventListener('pointerup', (event) => {
  if (sectionSlide?.pointerId !== event.pointerId) return;
  const view = slideTo(ui.view, event.clientX - sectionSlide.x, event.clientY - sectionSlide.y, visibleSections(off));
  sectionSlide = null;
  if (!view) return;
  // The click that follows a slide must not press the button below the finger.
  guardClick();
  showView(view);
});
document.addEventListener('pointercancel', () => {
  sectionSlide = null;
});

$('onboarding-next').addEventListener('click', () => {
  if (isLast(ui.onboarding)) closeOnboarding();
  else turnOnboarding(1);
});
$('onboarding-skip').addEventListener('click', closeOnboarding);
$('show-onboarding').addEventListener('click', openOnboarding);

// A horizontal slide on the walkthrough changes its page, with the measures of the section slide.
let onboardingSlide = null;
$('onboarding').addEventListener('pointerdown', (event) => {
  const primary = event.isPrimary && event.button === 0;
  onboardingSlide = primary ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY } : null;
});
$('onboarding').addEventListener('pointerup', (event) => {
  if (onboardingSlide?.pointerId !== event.pointerId) return;
  const way = slideDirection(event.clientX - onboardingSlide.x, event.clientY - onboardingSlide.y);
  onboardingSlide = null;
  if (!way) return;
  // The click that follows a slide must not press the button below the finger.
  guardClick();
  turnOnboarding(way);
});
$('onboarding').addEventListener('pointercancel', () => {
  onboardingSlide = null;
});

document.querySelectorAll('#seg button').forEach((button) => {
  button.addEventListener('click', () => {
    ui.target = button.dataset.target;
    renderSheet();
    $('add-name').focus();
  });
});

// A tap out of the open row closes it, without a render, so that the tap still does its work.
document.addEventListener(
  'pointerdown',
  (event) => {
    const box = document.querySelector('.swipe.open');
    if (!box || box.contains(event.target)) return;
    Object.assign(ui, { openId: null, openSide: null });
    box.classList.remove('open');
    moveRow(box.querySelector('.row'), 0);
    box.querySelectorAll('.side').forEach((side) => {
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

$('query').addEventListener('input', (event) => {
  Object.assign(ui, { query: event.target.value, editingId: null, openId: null });
  render();
});

const closeSearch = () => {
  endSearch();
  render();
};

// The press must not take the focus out of the field: the blur would close the search, and the
// click would then open it again.
$('search-button').addEventListener('mousedown', (event) => event.preventDefault());
$('search-button').addEventListener('click', () => {
  if (ui.searchOpen) {
    closeSearch();
    return;
  }
  Object.assign(ui, { searchOpen: true, openId: null, editingId: null });
  render();
  $('query').focus();
});
// An empty field of a list that loses the focus closes. The field of Recetas stays.
$('query').addEventListener('blur', () => {
  if (ui.searchOpen && !ui.query.trim()) closeSearch();
});

$('fab').addEventListener('click', openSheet);
$('veil').addEventListener('click', closeSheet);
$('arrange-button').addEventListener('click', () => {
  Object.assign(ui, { arrangeOpen: true, openId: null, editingId: null });
  render();
});
$('arrange-veil').addEventListener('click', () => {
  ui.arrangeOpen = false;
  render();
});
bindEdit();
// The sheet stays open after a choice, so that the group and the order change in one visit.
document.querySelectorAll('#arrange-group button').forEach((button) => {
  button.addEventListener('click', () => {
    const { group } = button.dataset;
    // A tap on the choice that the view shows changes nothing: the stored choice can be a
    // grouping that only the other list shows.
    if (group === shownGroup() && !ungrouping) return;
    // The rows that stay move to their new place.
    const set = () => {
      const before = rowTops();
      commit(store.setGroup(state, group).state);
      return before;
    };
    // The view can show no group for a choice that it cannot show.
    const flat = shownGroup() === 'none';
    if (group !== 'none' || flat) {
      const opens = group !== 'none' && flat;
      // A tap on a grouping while the groups close keeps them.
      ungrouping = false;
      const before = set();
      // `slide` reads the places after `expand` starts, so the two effects add up to one move.
      if (opens) expand(groupOnlyRows());
      slide(before);
      return;
    }
    if (ungrouping) return;
    ungrouping = true;
    // Show the choice at once; the render after the effect writes the same value.
    document.querySelectorAll('#arrange-group button').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === button));
    });
    // The groups close before the list becomes flat.
    collapse(groupOnlyRows(), () => {
      if (!ungrouping) return;
      ungrouping = false;
      slide(set());
    });
  });
});
document.querySelectorAll('#arrange-sort button').forEach((button) => {
  button.addEventListener('click', () => {
    const before = rowTops();
    commit(store.setSort(state, button.dataset.sort).state);
    slide(before);
  });
});
// The row of shop lists from open to closed. Its padding and its line close with it.
const chipFrames = (row) => {
  const { paddingTop, paddingBottom, borderBottomWidth } = getComputedStyle(row);
  const still = { overflow: 'hidden' };
  return [
    { height: `${row.offsetHeight}px`, paddingTop, paddingBottom, borderBottomWidth, opacity: 1, ...still },
    { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px', opacity: 0, ...still },
  ];
};

// Ocultar closes the row before the render takes it away, so that the list moves up with it;
// Mostrar opens the row that the render brings back.
const changeShopLists = (choice) => {
  if (choice === shopLists) return;
  setShopLists(choice);
  const row = $('shop-chips');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (choice === 'show' || row.hidden || still) {
    render();
    if (choice === 'show' && !row.hidden && !still) {
      row.animate(chipFrames(row).reverse(), { duration: LEAVE_MS, easing: 'ease-out' });
    }
    return;
  }
  renderArrange();
  const closing = row.animate(chipFrames(row), { duration: LEAVE_MS, easing: 'ease-in', fill: 'forwards' });
  closing.finished.then(() => {
    const before = rowTops();
    render();
    closing.cancel();
    slide(before);
  });
};
document.querySelectorAll('#arrange-lists button').forEach((button) => {
  button.addEventListener('click', () => changeShopLists(button.dataset.lists === 'hide' ? 'hide' : 'show'));
});
$('add-name').addEventListener('input', renderSheet);
$('trip-button').addEventListener('click', () => {
  Object.assign(ui, { tripOpen: true, openId: null, editingId: null });
  render();
  $('finish-menu').focus();
});
const closeTrip = () => {
  ui.tripOpen = false;
  render();
  $('trip-button').focus();
};
$('trip-veil').addEventListener('click', closeTrip);
$('add').addEventListener('submit', (event) => {
  event.preventDefault();
  submitAdd();
});
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
  if (ui.mealOpen !== null) closeMeal();
  if (ui.searchOpen) closeSearch();
  if (ui.tripOpen) closeTrip();
});

$('finish-button').addEventListener('click', () => finishTrip());
$('finish-menu').addEventListener('click', () => finishTrip());
$('bring').addEventListener('click', () => finishTrip(say('toast.brought', { list: 'next' })));

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  const before = new Set(pendingRows().map((node) => node.dataset.id));
  commit(undoState);
  hideToast();
  // The rows that the undo puts back open, as a ticked row closes.
  expand(pendingRows().filter((node) => !before.has(node.dataset.id)));
});

bindMenu();

$('export').addEventListener('click', () => {
  download(exportFilename(new Date()), exportJson(state));
});

$('import').addEventListener('click', () => $('import-file').click());

$('language').addEventListener('change', (event) => {
  setLanguage(event.target.value || null);
  applyLanguage();
});

$('hand').addEventListener('change', (event) => setHand(event.target.value));

$('theme').addEventListener('change', (event) => setTheme(event.target.value));

document.querySelectorAll('[data-module]').forEach((box) => {
  box.addEventListener('change', () => {
    setModules(switchModule(off, box.dataset.module, box.checked));
    // The switch-off of Próxima brings its items to Actual (MOD-6).
    const result = box.dataset.module === 'next' && !box.checked ? store.bringAllToActual(state) : { state };
    setNavMotion(true);
    if (result.state !== state) apply(result, { undoText: say('toast.brought', { list: 'next' }) });
    else render();
    setNavMotion(false);
  });
});

$('update').addEventListener('click', async () => {
  $('update').disabled = true;
  if (await refreshShell()) {
    location.reload();
    return;
  }
  $('update').disabled = false;
  showToast(t('error.updateFailed'));
});

$('import-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const result = importJson(await file.text());
  if (result.error) {
    showToast(textOf(result.error));
    return;
  }
  const found = {
    items: t('count.items', { count: result.state.items.length }),
    recipes: t('count.recipes', { count: result.state.recipes.length }),
  };
  if (!window.confirm(t('import.confirm', found))) return;
  apply(result, { undoText: t('toast.imported') });
});

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
