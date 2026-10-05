import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('settings confirms current-device and all-device logout actions', () => {
  const settings = source('src/screens/SettingsScreen.js');
  const translations = source('src/localization/translations.js');

  assert.match(settings, /setLogoutConfirmation\('current'\)/);
  assert.match(settings, /setLogoutConfirmation\('all'\)/);
  assert.match(settings, /<ConfirmDialog/);
  assert.match(settings, /logoutAllDevicesConfirmMessage/);
  assert.match(settings, /logoutConfirmMessage/);
  assert.match(translations, /logoutAllDevicesConfirmTitle: 'Sign out on all devices\?'/);
  assert.match(translations, /logoutConfirmTitle: 'Вийти з акаунту\?'/);
});
