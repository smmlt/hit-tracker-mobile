// EN: Converts native picker assets into the multipart field shape used for exercise and program media uploads.
// UK: Перетворює assets нативного picker на multipart-поля для завантаження media вправ і програм.
import { File } from 'expo-file-system';

export async function createMediaFormData(asset) {
  const form = new FormData();
  form.append('file', new File(asset.uri));
  return form;
}
