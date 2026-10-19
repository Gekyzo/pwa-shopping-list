import { exportJson, exportFilename, importJson, resetAll } from '#storage';
import { parseVersion, versionStatus } from '#version';
import { LANGUAGES, LANGUAGE_NAMES, intlTag } from '#i18n';
import { SAMPLE_ID, hasSample, deleteRecipe } from '#recipes';
import { SHORTCUTS } from '#sections';
import {
  REFRESH_MS,
  CHECK_MS,
  $,
  el,
  ui,
  state,
  storage,
  t,
  lang,
  chosen,
  hand,
  theme,
  density,
  tripEnd,
  textOf,
  showToast,
  apply,
  render,
  setLanguage,
  setHand,
  setTheme,
  setDensity,
  setTripEnd,
} from '#ui/context';
import { renderOnboarding } from '#ui/onboarding';

// The value of a row of Preferencias is the text of the option that the select has.
const renderValues = () => {
  for (const id of ['language', 'hand', 'theme', 'density']) {
    const select = $(id);
    $(`${id}-value`).textContent = select.selectedOptions[0]?.textContent ?? '';
  }
};

// Borrar datos de ejemplo shows while the sample recipe exists (ONB-14).
export const renderSample = () => {
  $('delete-sample').hidden = !hasSample(state);
};

const VERSION_KEYS = { current: 'version.current', unknown: 'version.unknown' };

export const renderVersion = () => {
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
  const outdated = !checking && status === 'outdated';
  $('update-banner').hidden = !outdated;
  if (outdated) {
    $('update-title').textContent = t('version.available', { version: latest.version });
    $('update-text').textContent = t('settings.updateReady', { version: running.version });
  }
};

export const readVersion = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return response.ok ? parseVersion(await response.json()) : null;
  } catch {
    return null;
  }
};

// The time value in the URL goes past the cache of the host; the service worker lets `latest` through.
export const checkVersion = async () => {
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

// The text of each shortcut of the launcher (SHORT-3).
const SHORTCUT_KEYS = { add: 'add.item', active: 'list.active', recipes: 'nav.recipes', menu: 'nav.menu' };

// Writes the fixed text of the page, then the text that a render builds.
export const applyLanguage = () => {
  document.documentElement.lang = lang;
  document.title = t('app.title');
  // The worker answers the manifest in this language (SW-13).
  const shortcuts = Object.fromEntries(SHORTCUTS.map((name) => [name, t(SHORTCUT_KEYS[name])]));
  const text = { type: 'manifest', lang, name: t('app.title'), description: t('app.description'), shortcuts };
  navigator.serviceWorker?.ready.then((registration) => registration.active?.postMessage(text)).catch(() => {});
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
  const densityOption = (value, key) => el('option', { value, textContent: t(key), selected: value === density });
  $('density').replaceChildren(densityOption('normal', 'settings.densityNormal'), densityOption('compact', 'settings.densityCompact'));
  renderValues();
  renderTripEnd();
  render();
  renderOnboarding();
};

const renderTripEnd = () => {
  document.querySelectorAll('[data-trip-end]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.tripEnd === tripEnd));
  });
};

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const bind = () => {
  $('export').addEventListener('click', () => {
    download(exportFilename(new Date()), exportJson(state));
  });

  $('import').addEventListener('click', () => $('import-file').click());
  $('delete-sample').addEventListener('click', () => {
    // The button goes with the recipe, so the focus goes to the button above it.
    $('show-onboarding').focus();
    apply(deleteRecipe(state, SAMPLE_ID), { undoText: t('toast.sampleDeleted') });
  });
  // The app starts again as a new install, with the walkthrough (BACKUP-7). With no storage the data is
  // only in memory, so the reload alone clears it.
  $('reset').addEventListener('click', () => {
    if (!window.confirm(t('reset.confirm'))) return;
    if (storage && !resetAll(storage)) {
      showToast(t('error.resetFailed'));
      return;
    }
    location.reload();
  });
  $('language').addEventListener('change', (event) => {
    setLanguage(event.target.value || null);
    applyLanguage();
  });

  $('hand').addEventListener('change', (event) => setHand(event.target.value));

  $('theme').addEventListener('change', (event) => setTheme(event.target.value));

  $('density').addEventListener('change', (event) => setDensity(event.target.value));

  for (const id of ['hand', 'theme', 'density']) $(id).addEventListener('change', renderValues);

  $('trip-end').addEventListener('click', (event) => {
    const button = event.target.closest('[data-trip-end]');
    if (!button) return;
    setTripEnd(button.dataset.tripEnd);
    renderTripEnd();
    render();
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
};
