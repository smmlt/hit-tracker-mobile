// EN: Builds browser multipart avatar payloads by fetching the selected URI as a Blob before upload.
// UK: Створює browser multipart payload аватара, попередньо отримуючи вибраний URI як Blob.
export async function createAvatarFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
  form.append('file', file, asset.fileName || 'avatar.jpg');
  return form;
}
