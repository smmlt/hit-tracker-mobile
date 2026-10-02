/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location.href).searchParams);
firebase.initializeApp(config);
firebase.messaging();

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification?.data?.FCM_MSG?.data?.actionUrl;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows[0];
    if (existing) {
      existing.postMessage({ type: 'HIT_TRACKER_NOTIFICATION_OPENED', actionUrl });
      return existing.focus();
    }
    return clients.openWindow(actionUrl || '/notifications');
  }));
});
