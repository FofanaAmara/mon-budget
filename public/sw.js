const CACHE_NAME = "mes-finances-static-v3";
const STATIC_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) => key.startsWith("mes-finances-") && key !== CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Private pages, RSC responses, auth and APIs always use the network.
// Never consult an old HTML cache when offline or after changing account.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !STATIC_ASSETS.includes(url.pathname) ||
    url.search
  )
    return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(event.request)),
    ),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "Mes Finances", body: "Rappel de dépense" };
  event.waitUntil(
    self.registration.showNotification(data.title || "Mes Finances", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "budget-reminder",
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // Resolve the signed-in person's last space on the server; no financial data in the notification.
  event.waitUntil(clients.openWindow("/"));
});
