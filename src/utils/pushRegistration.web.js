import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const metadata = () => ({
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION,
  deviceModel: navigator.userAgent.slice(0, 200),
  locale: navigator.language,
  osVersion: navigator.platform,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

const configured = () => Object.values(config).every(Boolean)
  && Boolean(process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY);

async function messagingRegistration() {
  if (!configured() || !(await isSupported())) return null;
  const query = new URLSearchParams(config).toString();
  const serviceWorkerRegistration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${query}`,
    { scope: '/' },
  );
  const app = getApps().length ? getApp() : initializeApp(config);
  return { messaging: getMessaging(app), serviceWorkerRegistration };
}

export async function getPushRegistration(requestPermission = false) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ...metadata(), permissionStatus: 'unknown', platform: 'web', provider: 'fcm' };
  }
  let permission = Notification.permission;
  if (requestPermission && permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ...metadata(),
      permissionStatus: permission === 'denied' ? 'denied' : 'unknown',
      platform: 'web',
      provider: 'fcm',
    };
  }
  const registration = await messagingRegistration();
  if (!registration) throw new Error('Firebase web messaging is not configured.');
  const token = await getToken(registration.messaging, {
    serviceWorkerRegistration: registration.serviceWorkerRegistration,
    vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
  });
  if (!token) throw new Error('Firebase did not return a push token.');
  return {
    ...metadata(),
    permissionStatus: 'granted',
    platform: 'web',
    provider: 'fcm',
    token,
  };
}

export function addPushListeners(onOpen, onReceive) {
  let unsubscribe = () => {};
  void messagingRegistration().then((registration) => {
    if (registration) unsubscribe = onMessage(registration.messaging, (payload) => {
      onReceive(payload);
      const actionUrl = payload.data?.actionUrl;
      const title = payload.notification?.title;
      if (title && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: payload.notification?.body,
          icon: '/favicon.png',
          image: payload.notification?.image,
        });
        notification.onclick = () => onOpen(actionUrl);
      }
    });
  }).catch(() => {});
  const handleWorkerMessage = (event) => {
    if (event.data?.type === 'HIT_TRACKER_NOTIFICATION_OPENED') onOpen(event.data.actionUrl);
  };
  navigator.serviceWorker?.addEventListener('message', handleWorkerMessage);
  return () => {
    unsubscribe();
    navigator.serviceWorker?.removeEventListener('message', handleWorkerMessage);
  };
}
