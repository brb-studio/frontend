// Service worker: shows push notifications (new, moved or cancelled appointments) and opens the app
// when one is tapped. No caching: the app always loads fresh from the network.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let message = { title: "MagicStudio", body: "", url: "/", tag: undefined };
  try {
    message = { ...message, ...event.data.json() };
  } catch {
    // An unreadable payload still shows a notification: browsers require one for every push.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      renotify: Boolean(message.tag),
      icon: "/pwa/icon/192",
      badge: "/pwa/icon/192",
      data: { url: message.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin)
    .href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find(
          (w) => new URL(w.url).origin === self.location.origin,
        );
        if (open) return open.focus().then((w) => w.navigate(url));
        return self.clients.openWindow(url);
      }),
  );
});
