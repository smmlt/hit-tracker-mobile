import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('push permission is requested only by the explicit enable flow', () => {
  const settings = source('src/screens/SettingsScreen.js');
  const native = source('src/utils/pushRegistration.native.js');
  const web = source('src/utils/pushRegistration.web.js');
  const auth = source('src/context/AuthContext.js');

  assert.match(settings, /syncPushRegistration\(userToken, true\)/);
  assert.match(auth, /syncPushRegistration\(userToken, false\)/);
  assert.match(native, /if \(requestPermission && permission\.status !== 'granted'\)/);
  assert.match(native, /Platform\.OS === 'ios' && !Device\.isDevice/);
  assert.match(web, /if \(requestPermission && permission === 'default'\)/);
  assert.match(settings, /workoutReminderFrequency/);
  assert.match(settings, /measurementReminderFrequency/);
  assert.match(settings, /const reminderFrequencies = \[[^\]]*'hourly'/);
});

test('notification inbox and admin delivery use the authenticated API', () => {
  const service = source('src/services/notificationService.js');
  const admin = source('src/services/adminService.js');
  const composer = source('src/components/admin/AdminNotifications.js');
  const inbox = source('src/screens/NotificationsScreen.js');
  const details = source('src/components/admin/AdminUserDetails.js');
  const adminScreen = source('src/screens/AdminScreen.js');
  const routes = source('src/navigation/linkingConfig.js');

  assert.match(service, /'\/notifications\/preferences'/);
  assert.match(service, /'\/notifications\/devices'/);
  assert.match(service, /'\/notifications\/read-all'/);
  assert.match(admin, /'\/admin\/notifications'/);
  assert.match(composer, /imageUrl/);
  assert.match(composer, /actionUrl/);
  assert.match(composer, /scheduledAt/);
  assert.match(inbox, /payload\?\.imageUrl/);
  assert.match(details, /onNotify\(user\)/);
  assert.match(adminScreen, /initialUserId=\{notificationTarget\}/);
  assert.match(routes, /Notifications: 'notifications'/);
});

test('Firebase public settings stay in env and the service worker', () => {
  const example = source('.env.example');
  const worker = source('public/firebase-messaging-sw.js');
  const ignored = source('.gitignore');

  assert.match(example, /EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_web_push_public_key/);
  assert.match(worker, /firebase-messaging-compat\.js/);
  assert.match(ignored, /^\.env\.\*$/m);
});
