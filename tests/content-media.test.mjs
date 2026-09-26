import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createMediaFormData } from '../src/services/mediaFormData.web.js';
import { getYouTubeThumbnailUrl, getYouTubeVideoId } from '../src/utils/media.js';
import { isMultipartBody } from '../src/utils/requestBody.js';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('content image upload sends one multipart file without a manual boundary', async () => {
  const image = new Blob(['image'], { type: 'image/png' });
  const body = await createMediaFormData({ file: image, fileName: 'exercise.png', uri: 'blob:unused' });
  assert.equal(isMultipartBody(body), true);
  assert.equal(body.get('file').name, 'exercise.png');
  assert.equal(body.get('file').type, 'image/png');
});

test('YouTube media accepts common URLs and derives a card thumbnail', () => {
  assert.equal(getYouTubeVideoId('https://youtu.be/abc123?t=2'), 'abc123');
  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=xyz789'), 'xyz789');
  assert.equal(getYouTubeThumbnailUrl('https://youtube.com/shorts/short1'), 'https://i.ytimg.com/vi/short1/hqdefault.jpg');
  assert.equal(getYouTubeThumbnailUrl('https://example.com/video'), null);
});

test('media images cover fixed containers and fall back after load errors', () => {
  const mediaImage = source('src/components/media/MediaImage.js');
  assert.match(mediaImage, /resizeMode="cover"/);
  assert.match(mediaImage, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(mediaImage, /width: '36%'/);

  const exerciseStyles = source('src/components/exercise/ExerciseItem.styles.js');
  assert.match(exerciseStyles, /width: 90, height: 90/);
  const workshopStyles = source('src/components/workshop/ui.styles.js');
  assert.match(workshopStyles, /aspectRatio: 333 \/ 226/);
});

test('admin navigation is role-gated and the screen revalidates a fresh profile', () => {
  const navigator = source('src/navigation/AppNavigator.js');
  assert.match(navigator, /\{canOpenAdmin && \(/);
  assert.match(navigator, /name="Admin"/);

  const admin = source('src/screens/AdminScreen.js');
  assert.match(admin, /useProfile\(false\)/);
  assert.match(admin, /const freshProfile = await refreshProfile\(\)/);
  assert.match(admin, /includes\(verifiedRole\)/);
  assert.match(admin, /accessState !== "allowed"/);
});
