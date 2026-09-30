// Service worker for the installable app (PWA). Deliberately small and safe:
//  - Pages are always fetched from the network first, so staff get every new release
//    immediately; the saved copy is only used when there is no connection.
//  - Only this site's own static files (the app's code, icons) are stored.
//  - Nothing from Firebase is ever stored here — no patient, billing or login data.
const CACHE = 'aarambh-shell-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

const OFFLINE_PAGE =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>AArambh — offline</title><body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#F5F9FC;color:#1A2B3C;text-align:center;padding:24px">' +
  '<div><h1 style="font-size:22px;margin:0 0 8px">You are offline</h1><p style="margin:0 0 16px;color:#5A7184">AArambh needs an internet connection. Check your connection and try again.</p>' +
  '<button onclick="location.reload()" style="background:#0A6EBD;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-size:15px;font-weight:600">Try again</button></div>';

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase, fonts, etc. are never intercepted

  // Opening or reloading a page: network first, saved shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) (await caches.open(CACHE)).put('/index.html', response.clone());
          return response;
        } catch {
          return (await caches.match('/index.html')) || new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
      })()
    );
    return;
  }

  // The app's own code and icons have unique file names per release, so a saved copy is
  // always the right one.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
        return response;
      })()
    );
  }
});
