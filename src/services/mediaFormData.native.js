// EN: Converts native picker assets into the multipart field shape used for exercise and program media uploads.
// UK: Перетворює assets нативного picker на multipart-поля для завантаження media вправ і програм.
import { File } from 'expo-file-system';

/** EN: Wraps a native picker URI in Expo's File object and appends it to the upload payload. UK: Обгортає URI нативного вибору в об’єкт File від Expo та додає його до даних завантаження. */
export async function createMediaFormData(asset) {
  const form = new FormData();
  form.append('file', new File(asset.uri));
  return form;
}
