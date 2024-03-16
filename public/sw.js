const CHATGPT_NEXT_WEB_CACHE = 'chatgpt-next-web-cache';

globalThis.addEventListener('activate', (event) => {
  console.log('ServiceWorker activated.');
});

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CHATGPT_NEXT_WEB_CACHE).then((cache) => {
      return cache.addAll([]);
    }),
  );
});

globalThis.addEventListener('fetch', (e) => {});
