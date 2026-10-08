/**
 * PET BASE service worker — handles Web Push notifications for the PWA.
 * Registered from the client so the app can deliver lock-screen
 * notifications even when the site is not open.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // ignore malformed payload, use defaults
  }
  const title = payload.title || "PET BASE";
  const options = {
    body: payload.message || "",
    icon: payload.icon || "/favicon.png",
    badge: "/favicon.png",
    dir: "ltr",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const url = new URL(target, self.location.origin);
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        if ("navigate" in client) {
          await client.navigate(url.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(url.href);
    })(),
  );
});