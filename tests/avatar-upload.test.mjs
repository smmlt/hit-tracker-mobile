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
