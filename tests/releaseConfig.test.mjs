import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const appConfig = require('../app.config.js');

test('release builds require real public HTTPS API and web origins', () => {
  const original = {
    EAS_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE,
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
  };

  try {
    process.env.EAS_BUILD_PROFILE = 'preview';
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_WEB_URL = 'https://app.hit-tracker.com';
    assert.throws(() => appConfig({ config: {} }), /EXPO_PUBLIC_API_URL/);

    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
    assert.throws(() => appConfig({ config: {} }), /EXPO_PUBLIC_API_URL/);

    process.env.EXPO_PUBLIC_API_URL = 'https://api.hit-tracker.com';
    process.env.EXPO_PUBLIC_WEB_URL = 'https://app.example.com';
    assert.throws(() => appConfig({ config: {} }), /EXPO_PUBLIC_WEB_URL/);

    process.env.EXPO_PUBLIC_WEB_URL = 'https://app.hit-tracker.com';
    assert.deepEqual(appConfig({ config: { name: 'Hit Tracker' } }), { name: 'Hit Tracker' });
  } finally {
    for (const [name, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
