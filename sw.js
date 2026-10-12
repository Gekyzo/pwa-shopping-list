const CACHE = 'shopping-shell-v2';

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/store.js',
  './src/recipes.js',
  './src/storage.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
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
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(respond(event));
});
