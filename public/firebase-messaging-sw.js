// EN: Initializes Firebase messaging in the web service worker and routes notification clicks to an existing or new application window.
// UK: Ініціалізує Firebase Messaging у веб-працівнику та спрямовує натискання сповіщення до наявного або нового вікна застосунку.

/* global firebase */
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location.href).searchParams);
firebase.initializeApp(config);
firebase.messaging();

self.addEventListener('notificationclick', /* EN: Handles a web notification click and forwards its action URL to the application. UK: Обробляє натискання вебсповіщення та передає його адресу дії застосунку. */ (event) => {
  event.notification.close();
  const actionUrl = event.notification?.data?.FCM_MSG?.data?.actionUrl;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(/* EN: Reuses an open application window when possible, otherwise opens the notification destination. UK: За можливості використовує відкрите вікно застосунку, інакше відкриває адресу зі сповіщення. */ (windows) => {
    const existing = windows[0];
    if (existing) {
      existing.postMessage({ type: 'HIT_TRACKER_NOTIFICATION_OPENED', actionUrl });
      return existing.focus();
    }
    return clients.openWindow(actionUrl || '/notifications');
  }));
});
