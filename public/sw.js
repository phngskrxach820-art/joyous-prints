// Minimal pass-through service worker for Heng Photos PWA installability.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// no fetch handler → no caching, no preview interference
