import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('native splash hands off to the matching animated brand screen', () => {
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
  const plugin = config.expo.plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-splash-screen')[1];
  const appSource = readFileSync(new URL('../App.js', import.meta.url), 'utf8');

  assert.equal(plugin.image, './assets/splash-native-logo.png');
  assert.equal(plugin.imageWidth, 172);
  assert.equal(plugin.backgroundColor, '#F00D22');
  assert.equal(plugin.dark.backgroundColor, '#F00D22');
  assert.equal(plugin.dark.image, plugin.image);
  assert.match(appSource, /fontsReady && animationComplete && !isInitializing/);
  assert.match(appSource, /STARTUP_ANIMATION_MS = 900/);
  assert.match(appSource, /splash-native-logo\.png/);
  assert.match(appSource, /splash-wordmark\.png/);
  assert.doesNotMatch(appSource, /ActivityIndicator/);
});
