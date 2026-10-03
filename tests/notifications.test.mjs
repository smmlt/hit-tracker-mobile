import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('push permission is requested on native session registration only', () => {
  const settings = source('src/screens/SettingsScreen.js');
  const native = source('src/utils/pushRegistration.native.js');
  const web = source('src/utils/pushRegistration.web.js');
  const auth = source('src/context/AuthContext.js');

  assert.match(settings, /syncPushRegistration\(userToken, true\)/);
  assert.match(auth, /syncPushRegistration\(userToken, Platform\.OS !== 'web'\)/);
  assert.match(auth, /if \(state === 'active'\) \{[\s\S]*syncPushRegistration\(userToken, false\)/);
  assert.match(native, /if \(requestPermission && permission\.status !== 'granted'\)/);
  assert.match(native, /Platform\.OS === 'ios' && !Device\.isDevice/);
  assert.match(web, /if \(requestPermission && permission === 'default'\)/);
  assert.match(settings, /workoutReminderFrequency/);
  assert.match(settings, /measurementReminderFrequency/);
  assert.match(settings, /const reminderFrequencies = \[[^\]]*'hourly'/);
});

test('notification preferences persist optimistically and ordinary users have no save/test controls', () => {
  const settings = source('src/screens/SettingsScreen.js');
  assert.match(settings, /notificationWriteRef/);
  assert.match(settings, /notificationService\.updatePreferences\(payload, userToken\)/);
  assert.match(settings, /notificationService\.getPreferences\(userToken\)/);
  assert.match(settings, /setReminderTime/);
  assert.match(settings, /notificationWriteIdRef/);
  assert.match(settings, /notificationPendingRef\.current > 0/);
  assert.match(settings, /if \(writeId === notificationWriteIdRef\.current\)/);
  assert.match(settings, /onBlur=\{onTimeBlur\}/);
  assert.match(settings, /setNotificationError\(t\('invalidReminderTime'\)\)/);
  assert.match(settings, /const saved = await persistNotifications/);
  assert.match(settings, /if \(saved\) setNotificationMessage/);
  assert.ok(settings.indexOf("t('openNotificationInbox')") < settings.indexOf("t('pushNotifications')"));
  assert.doesNotMatch(settings, /sendTestNotification|saveNotificationSettings|sendTest\b|saveNotifications\b/);
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
  assert.match(admin, /'\/admin\/notifications\/media'/);
  assert.match(admin, /'\/admin\/notifications\/history'/);
  assert.match(composer, /AdminNotifications\.styles/);
  assert.match(composer, /launchImageLibraryAsync/);
  assert.match(composer, /allowsMultipleSelection: true/);
  assert.match(composer, /imageMediaIds/);
  assert.match(composer, /notificationContentRequired/);
  assert.match(composer, /videoUrls/);
  assert.match(composer, /actionUrl/);
  assert.match(composer, /scheduledLocalAt/);
  assert.match(composer, /setView\('compose'\)/);
  assert.match(composer, /historyType === 'images'/);
  assert.match(composer, /datePreset === 'custom'/);
  assert.match(composer, /calendarOpen/);
  assert.match(composer, /groupedHistory/);
  assert.match(composer, /ADMIN_NOTIFICATION_DRAFT_KEY/);
  assert.match(composer, /AsyncStorage\.setItem/);
  assert.match(composer, /AsyncStorage\.removeItem/);
  assert.match(composer, /adminService\.uploadNotificationImage\(asset, userToken\)/);
  assert.match(adminScreen, /adminNotificationDraftReminder/);
  assert.match(inbox, /item\.imageUrls/);
  assert.match(inbox, /item\.videoUrls/);
  assert.match(inbox, /getYouTubeThumbnailUrl/);
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
