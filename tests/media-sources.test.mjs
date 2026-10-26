import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('settings exposes a localized media-source screen backed by the API', () => {
  const settings = source('src/screens/SettingsScreen.js');
  const screen = source('src/screens/MediaSourcesScreen.js');
  const navigation = source('src/navigation/AppNavigator.js');
  const linking = source('src/navigation/linkingConfig.js');
  const translations = source('src/localization/translations.js');

  assert.match(settings, /navigation\.navigate\('MediaSources'\)/);
  assert.match(screen, /\/exercises\/media-sources\?locale=\$\{locale\}/);
  assert.match(screen, /item\.author/);
  assert.match(screen, /item\.license/);
  assert.match(screen, /Linking\.openURL\(item\.sourceUrl\)/);
  assert.match(navigation, /name="MediaSources" component=\{MediaSourcesScreen\}/);
  assert.match(linking, /path: 'settings\/media-sources'/);
  assert.match(translations, /mediaSources: 'Media sources'/);
  assert.match(translations, /mediaSources: 'Джерела медіа'/);
});

