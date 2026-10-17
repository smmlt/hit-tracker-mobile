// EN: Proves the production contract for web avatar multipart construction and the request-body boundary contract; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт побудови multipart-запиту для аватара у вебверсії та межу передавання тіла запиту; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAvatarFormData } from '../src/services/avatarFormData.web.js';
import { isMultipartBody } from '../src/utils/requestBody.js';

test('avatar upload uses one multipart file and leaves its boundary to fetch', async () => {
  const image = new Blob(['avatar'], { type: 'image/png' });
  const body = await createAvatarFormData({
    file: image,
    fileName: 'avatar.png',
    uri: 'blob:unused',
  });

  assert.equal(isMultipartBody(body), true);
  assert.equal(body.get('file').name, 'avatar.png');
  assert.equal(body.get('file').type, 'image/png');
});

test('JSON request bodies are not treated as multipart', () => {
  assert.equal(isMultipartBody(JSON.stringify({ displayName: 'User' })), false);
});
