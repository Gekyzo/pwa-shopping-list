const CACHE = 'shopping-shell-v4';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/store.js',
  './src/recipes.js',
  './src/swipe.js',
  './src/sections.js',
  './src/reorder.js',
  './src/storage.js',
  './src/version.js',
  './version.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

// `reload` goes past the HTTP cache, so the shell is never a mix of two deploys.
const fill = async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })));
};

self.addEventListener('install', (event) => {
  event.waitUntil(fill().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // The page reads the deployed version: the cache must not answer.
  if (url.searchParams.has('latest')) return;
  event.respondWith(respond(event));
});

// `Actualizar` of Ajustes: load the full shell of the new deploy, then answer on the port.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'refresh') return;
  const [port] = event.ports;
  event.waitUntil(
    fill().then(
      () => port?.postMessage({ ok: true }),
      () => port?.postMessage({ ok: false }),
    ),
  );
});
