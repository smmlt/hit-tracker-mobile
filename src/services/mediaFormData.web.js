export async function createMediaFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
  form.append('file', file, asset.fileName || 'image.jpg');
  return form;
}
