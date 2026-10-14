import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { direction, slideDirection, slideTo } from '#sections';
import { switchModule, visibleSections } from '#modules';
import { PARTICLE_SIZE, makeParticles, particleAt } from '#particles';
import { PAGES, isLast, step } from '#onboarding';
import { exportJson, exportFilename, importJson, saveOnboarded } from '#storage';
import { parseVersion, versionStatus } from '#version';
import { LANGUAGES, LANGUAGE_NAMES, intlTag } from '#i18n';
import {
  ARRIVAL_MS,
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
  setModules,
  setNavMotion,
} from '#ui/context';
import { inList, viewState, found, endSearch } from '#ui/view';
import { expand, pendingRows } from '#ui/motion';
import { icon } from '#ui/controls';
import { closeEdit, renderEdit, bind as bindEdit } from '#ui/edit';
import { reorder, endReorder, bind as bindDrag } from '#ui/drag';
import { moveRow } from '#ui/rows';
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

// Screen

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

bindList();

$('fab').addEventListener('click', openSheet);
$('veil').addEventListener('click', closeSheet);
bindArrange();
bindEdit();
$('add-name').addEventListener('input', renderSheet);
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
