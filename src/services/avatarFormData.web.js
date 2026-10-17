// EN: Builds browser multipart avatar payloads by fetching the selected URI as a Blob before upload.
// UK: Створює browser multipart payload аватара, попередньо отримуючи вибраний URI як Blob.
export async function createAvatarFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then(/* EN: Converts the selected browser resource into the Blob used by the avatar upload. UK: Перетворює вибраний браузером ресурс на Blob для завантаження аватара. */ (response) => response.blob());
  form.append('file', file, asset.fileName || 'avatar.jpg');
  return form;
}
