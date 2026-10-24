const CACHE = 'shopping-shell-v20';

const SHELL = [
  './',
  './index.html',
  './vendor/design-system/design-system.css',
  './vendor/design-system/sheet.js',
  './vendor/design-system/geist.woff2',
  './styles.css',
  './icons.svg',
  './manifest.webmanifest',
  './src/app.js',
  './src/install.js',
  './src/ui/install.js',
  './src/ui/add.js',
  './src/ui/arrange.js',
  './src/ui/context.js',
  './src/ui/controls.js',
  './src/ui/drag.js',
  './src/ui/edit.js',
  './src/ui/list.js',
  './src/ui/menu.js',
  './src/ui/motion.js',
  './src/ui/nav.js',
  './src/ui/onboarding.js',
  './src/ui/recipes.js',
  './src/ui/rows.js',
  './src/ui/settings.js',
  './src/ui/aisles.js',
  './src/ui/view.js',
  './src/store.js',
  './src/recipes.js',
  './src/menu.js',
  './src/shops.js',
  './src/aisles.js',
  './src/swipe.js',
  './src/sections.js',
  './src/layers.js',
  './src/onboarding.js',
  './src/reorder.js',
  './src/sheets.js',
  './src/suggest.js',
  './src/storage.js',
  './src/records.js',
  './src/sync.js',
  './src/pocketbase.js',
  './src/session.js',
  './src/syncer.js',
  './src/config.js',
  './src/version.js',
  './src/i18n.js',
  './src/locales/ca.js',
  './src/locales/de.js',
  './src/locales/en.js',
  './src/locales/es.js',
  './src/locales/fr.js',
  './src/locales/it.js',
  './src/locales/pt.js',
  './version.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/logo.png',
  './icons/shortcut-add.png',
  './icons/shortcut-active.png',
  './icons/shortcut-recipes.png',
  './icons/shortcut-menu.png',
];

// The text of the manifest in the language of the screen, which the page sends (`manifest`
// message). A cache of its own, so it outlives a deploy.
const MANIFEST = 'shopping-manifest';
const MANIFEST_TEXT = './manifest-text.json';
const LOCALIZED = ['lang', 'name', 'description'];

const named = (value) => typeof value === 'string' && value !== '';

// The name of each shortcut `./?open=<name>` from `text.shortcuts[<name>]`, when it is non-empty.
const localizeShortcuts = (shortcuts, names) => {
  if (!Array.isArray(shortcuts) || !names || typeof names !== 'object' || Array.isArray(names)) return shortcuts;
  return shortcuts.map((shortcut) => {
    const [, open] = /[?&]open=([^&#]+)/.exec(shortcut.url ?? '') ?? [];
    return open && Object.hasOwn(names, open) && named(names[open]) ? { ...shortcut, name: names[open] } : shortcut;
  });
};

// The manifest with each member of LOCALIZED that `text` holds as a non-empty string, and the
// names of its shortcuts.
const localizeManifest = (manifest, text) => ({
  ...manifest,
  ...Object.fromEntries(LOCALIZED.filter((key) => named(text?.[key])).map((key) => [key, text[key]])),
  ...(manifest.shortcuts && { shortcuts: localizeShortcuts(manifest.shortcuts, text?.shortcuts) }),
});

// `reload` goes past the HTTP cache, so the shell is never a mix of two deploys.
const fill = async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })));
};

self.addEventListener('install', (event) => {
  event.waitUntil(fill().then(() => self.skipWaiting()));
});

// The caches of an older shell. Another app on the same origin keeps its own caches.
const staleCaches = (keys) => keys.filter((key) => key.startsWith('shopping-') && key !== CACHE && key !== MANIFEST);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(staleCaches(keys).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Fetches a fresh copy past the HTTP cache and stores it for the next launch.
const refresh = async (cache, request) => {
  const response = await fetch(request.url, { cache: 'no-cache' });
  if (response.ok) await cache.put(request.url, response.clone());
  return response;
};

// Stale-while-revalidate: answer from the cache at once, refresh in the background.
const respond = async (event) => {
  const { request } = event;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request.url, { ignoreSearch: true });
  const fresh = refresh(cache, request);
  if (cached) {
    event.waitUntil(fresh.catch(() => {}));
    return cached;
  }
  try {
    return await fresh;
  } catch (error) {
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw error;
  }
};

const readManifestText = async () => {
  const stored = await (await caches.open(MANIFEST)).match(MANIFEST_TEXT);
  return stored ? stored.json() : null;
};

// The shell copy of the manifest, in the language that the page sent last.
const respondManifest = async (event) => {
  const response = await respond(event);
  try {
    const text = await readManifestText();
    if (!text) return response;
    const manifest = localizeManifest(await response.clone().json(), text);
    return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
  } catch {
    return response;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // The page reads the deployed version: the cache must not answer.
  if (url.searchParams.has('latest')) return;
  const manifest = url.pathname === new URL('./manifest.webmanifest', self.location).pathname;
  event.respondWith(manifest ? respondManifest(event) : respond(event));
});

// `Actualizar` of Ajustes: load the full shell of the new deploy, then answer on the port.
// The page sends the text of the manifest in the language of the screen at each start and
// change of language.
const storeManifestText = async ({ lang, name, description, shortcuts }) => {
  const cache = await caches.open(MANIFEST);
  const body = JSON.stringify({ lang, name, description, shortcuts });
  await cache.put(MANIFEST_TEXT, new Response(body, { headers: { 'Content-Type': 'application/json' } }));
};

self.addEventListener('message', (event) => {
  if (event.data?.type === 'manifest') {
    event.waitUntil(storeManifestText(event.data).catch(() => {}));
    return;
  }
  if (event.data?.type !== 'refresh') return;
  const [port] = event.ports;
  event.waitUntil(
    fill().then(
      () => port?.postMessage({ ok: true }),
      () => port?.postMessage({ ok: false }),
    ),
  );
});
