// Only cache the install shell; game/auth/API requests always use the network.
const SHELL = "poke-emerald-shell-v2";
const SHELL_FILES = ["/offline.html", "/idle-mon-icon.png", "/idle-mon-icon-192.png"];
self.addEventListener("install", (event) => {
  if (["localhost", "127.0.0.1"].includes(self.location.hostname)) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  if (["localhost", "127.0.0.1"].includes(self.location.hostname)) {
    event.waitUntil(Promise.all([
      self.registration.unregister(),
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("idle-mon-shell-") || key.startsWith("poke-emerald-shell-")).map((key) => caches.delete(key)))),
    ]));
    return;
  }
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => (key.startsWith("idle-mon-shell-") || key.startsWith("poke-emerald-shell-")) && key !== SHELL).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", (event) => {
  if (["localhost", "127.0.0.1"].includes(self.location.hostname)) return;
  if (SHELL_FILES.includes(new URL(event.request.url).pathname) && event.request.method === "GET") {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
});
