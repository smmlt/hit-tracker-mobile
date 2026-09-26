import { File } from 'expo-file-system';

export async function createMediaFormData(asset) {
  const form = new FormData();
  form.append('file', new File(asset.uri));
  return form;
}
