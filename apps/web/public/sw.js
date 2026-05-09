// =============================================================================
// DigiPicks Service Worker — push notification delivery.
// Registered from main.tsx on app boot. Convex sends a JSON payload via
// web-push (see convex/push.ts). Click handler routes to the deep link.
// =============================================================================

self.addEventListener('install', (event) => {
  // Activate immediately on first install so users see push without a reload.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'DigiPicks', body: event.data.text() };
  }

  const title = payload.title || 'DigiPicks';
  const options = {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
    tag: payload.tag,
    renotify: Boolean(payload.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus an existing window if it's already open on this origin.
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.postMessage({ type: 'navigate', url });
            return;
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
