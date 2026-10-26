// EN: Proves the production contract for content media multipart uploads and YouTube URL, identifier, and thumbnail normalization; fixtures model user-visible behavior and integration boundaries rather than implementation details.
// UK: Перевіряє робочий контракт multipart-завантаження медіа та нормалізації URL, ідентифікаторів і мініатюр YouTube; фікстури відтворюють поведінку користувача й межі інтеграції, а не деталі реалізації.

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

test('exercise video and image media stay in separate visual areas', () => {
  const exerciseDetails = source('src/screens/ExerciseDetailsScreen.js');
  assert.match(exerciseDetails, /const \[videoFailed, setVideoFailed\] = useState\(false\)/);
  assert.match(exerciseDetails, /const videoSource = exercise\.displayVideoUrl \|\| exercise\.videoUrl/);
  assert.match(exerciseDetails, /useEffect\(\(\) => setVideoFailed\(false\), \[videoSource\]\)/);
  assert.match(exerciseDetails, /\{videoSource && !videoFailed \? \(/);
  assert.match(exerciseDetails, /<ExerciseVideoPlayer[\s\S]*?style=\{\[s\.media, styles\.videoMedia\]\}/);
  assert.match(exerciseDetails, /setVideoFailed\(true\)/);
  assert.match(exerciseDetails, /\) : \(\s*<>\s*<MediaImage accessibilityLabel=\{w\.noMedia\} source=\{null\} style=\{s\.media\}/);
  assert.match(exerciseDetails, /Linking\.openURL\(videoSource\)/);
  assert.match(exerciseDetails, /<MediaImage[\s\S]*?source=\{exercise\.demonstrationImageUrl \|\| exercise\.imageUrl\}[\s\S]*?style=\{styles\.muscleImage\}/);
  assert.doesNotMatch(exerciseDetails, /\) : <MediaImage[\s\S]*?source=\{exercise\.imageUrl\}[\s\S]*?style=\{s\.media\}/);
});

test('active workout details refresh and localize the current catalog record', () => {
  const modal = source('src/components/exercise/ExerciseDetailsModal.js');
  const activeWorkout = source('src/screens/ActiveWorkoutScreen.js');
  assert.match(modal, /apiFetch\(`\/exercises\/\$\{exercise\.id\}`/);
  assert.match(modal, /localizeCatalogEntity\(details \|\| exercise, locale, t, 'exercise'\)/);
  assert.match(modal, /<ExerciseDetailsContent allowAdd=\{false\} exercise=\{localizedDetails\}/);
  assert.match(activeWorkout, /<ExerciseDetailsModal exercise=\{selectedExercise\}/);
});

test('timed and repetition sets share the same accessible RPE picker', () => {
  const card = source('src/components/workout/ActiveExerciseCard.js');
  assert.equal((card.match(/<RpePicker/g) || []).length, 2);
  assert.doesNotMatch(card, /styles\.durationRpeStepper/);
});

test('program image and video choices use the shared adaptive media container', () => {
  const programDetails = source('src/screens/LibraryProgramScreen.js');
  assert.match(programDetails, /<ExerciseVideoPlayer source=\{program\.videoUrl\} style=\{s\.media\} \/>/);
  assert.match(programDetails, /<MediaImage[\s\S]*?source=\{program\.imageUrl\}[\s\S]*?style=\{s\.media\}/);
  assert.match(programDetails, /source=\{program\.displayVideoUrl \|\| program\.videoUrl\}/);
  assert.match(programDetails, /localizeCatalogEntity\(program, locale, t, "program", program\.isPersonal\)/);
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

test('exercise image saves preserve an existing video unless the video field is edited', () => {
  const editor = source('src/components/admin/ExerciseEditor.js');
  assert.match(editor, /const \[videoChanged, setVideoChanged\] = useState\(false\)/);
  assert.match(editor, /\.\.\.\(videoChanged \|\| !exercise \? \{ videoUrl: video\.trim\(\) \|\| undefined \} : \{\}\)/);
  assert.match(editor, /if \(image\) await contentMediaService\.uploadExerciseDemonstrationImage\(targetId, image, userToken\)/);
  assert.match(editor, /setVideoChanged\(true\)/);
});
