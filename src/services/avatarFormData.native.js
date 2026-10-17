// EN: Builds React Native multipart avatar payloads from a device URI with the filename and MIME metadata expected by the API.
// UK: Створює React Native multipart payload аватара з device URI, filename і MIME-даними, яких очікує API.
import { File } from 'expo-file-system';

/** EN: Converts a native avatar picker result into the multipart file field expected by the API. UK: Перетворює результат нативного вибору аватара на multipart-поле файла, якого очікує API. */
export async function createAvatarFormData(asset) {
  const form = new FormData();
  form.append('file', new File(asset.uri));
  return form;
}
