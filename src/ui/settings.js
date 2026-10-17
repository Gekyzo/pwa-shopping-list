import { exportJson, exportFilename, importJson } from '#storage';
import { parseVersion, versionStatus } from '#version';
import { LANGUAGES, LANGUAGE_NAMES, intlTag } from '#i18n';
import { SAMPLE_ID, hasSample, deleteRecipe } from '#recipes';
import {
  REFRESH_MS,
  CHECK_MS,
  $,
  el,
  ui,
  state,
  t,
  lang,
  chosen,
  hand,
  theme,
  tripEnd,
  textOf,
  showToast,
  apply,
  render,
  setLanguage,
  setHand,
  setTheme,
  setTripEnd,
} from '#ui/context';
import { renderOnboarding } from '#ui/onboarding';

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
  $('update').hidden = checking || status !== 'outdated';
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

// Writes the fixed text of the page, then the text that a render builds.
export const applyLanguage = () => {
  document.documentElement.lang = lang;
  document.title = t('app.title');
  // The worker answers the manifest in this language (SW-13).
  const text = { type: 'manifest', lang, name: t('app.title'), description: t('app.description') };
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
  $('language').addEventListener('change', (event) => {
    setLanguage(event.target.value || null);
    applyLanguage();
  });

  $('hand').addEventListener('change', (event) => setHand(event.target.value));

  $('theme').addEventListener('change', (event) => setTheme(event.target.value));

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
