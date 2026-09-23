import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const screensDirectory = new URL('../src/screens/', import.meta.url);

test('screens use the Android-aware SafeAreaView', () => {
  for (const file of readdirSync(screensDirectory).filter((name) => name.endsWith('.js'))) {
    const source = readFileSync(new URL(file, screensDirectory), 'utf8');
    if (!source.includes('<SafeAreaView')) continue;

    assert.match(
      source,
      /import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['"]react-native-safe-area-context['"]/s,
      `${file} must import SafeAreaView from react-native-safe-area-context`,
    );
    assert.doesNotMatch(
      source,
      /import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['"]react-native['"]/s,
      `${file} must not use React Native's iOS-only SafeAreaView`,
    );
  }
});
