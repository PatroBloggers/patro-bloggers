// Service worker de Patro Bloggers (necesario para instalar la web como aplicación).
// Todo se pide siempre a la red, así que nunca se enseña contenido viejo. Solo si no hay conexión
// se muestra la página "Sin conexión", que se guarda al instalar junto con sus estilos y scripts.
const CACHE = 'patro-bloggers-v1';
const OFFLINE_URL = new URL('sin-conexion/', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch(OFFLINE_URL, { cache: 'reload' });
      const html = await response.clone().text();
      await cache.put(OFFLINE_URL, response);
      // Ficheros que usa la página sin conexión (estilos, scripts, escudo...)
      const assets = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js|svg|png|webp))"/g)].map(
        (match) => new URL(match[1], OFFLINE_URL).href,
      );
      await cache.addAll([...new Set(assets)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(async () => {
      if (request.mode === 'navigate') return (await caches.match(OFFLINE_URL)) ?? Response.error();
      return (await caches.match(request)) ?? Response.error();
    }),
  );
});
