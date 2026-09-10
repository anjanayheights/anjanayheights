self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: '🔔 New Anjanay Heights Lead', body: 'A new lead has arrived.' }; }
  const title = data.title || '🔔 New Anjanay Heights Lead';
  const options = {
    body: data.body || 'Open CRM to follow up now.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'anjanay-lead',
    requireInteraction: true,
    data: { url: data.url || '/admin/sales-engine' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/sales-engine';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ('focus' in client) { client.navigate(url); return client.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
