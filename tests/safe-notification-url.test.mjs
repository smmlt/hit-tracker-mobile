// EN: Proves the production contract for notification URL allowlisting for the configured app host and YouTube HTTPS links; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт списку дозволених URL зі сповіщень для налаштованого домену застосунку та HTTPS-посилань YouTube; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import test from 'node:test';

process.env.EXPO_PUBLIC_WEB_URL = 'https://app.hit-tracker.example';
const { safeNotificationUrl } = await import('../src/utils/safeNotificationUrl.js');

test('allows the app and YouTube HTTPS hosts', () => {
  assert.equal(safeNotificationUrl('https://app.hit-tracker.example/account'), 'https://app.hit-tracker.example/account');
  assert.equal(safeNotificationUrl('https://www.youtube.com/watch?v=abc'), 'https://www.youtube.com/watch?v=abc');
});

test('rejects deceptive, non-HTTPS and malformed links', () => {
  assert.equal(safeNotificationUrl('https://youtube.com.evil.test/watch?v=x'), null);
  assert.equal(safeNotificationUrl('http://app.hit-tracker.example/account'), null);
  assert.equal(safeNotificationUrl('javascript:alert(1)'), null);
});
