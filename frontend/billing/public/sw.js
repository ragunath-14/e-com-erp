// Minimal service worker: exists so browsers treat the app as installable.
// It deliberately does NOT cache anything or intercept requests — billing and
// stock data must always come fresh from the server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
