export async function createAvatarFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
  form.append('file', file, asset.fileName || 'avatar.jpg');
  return form;
}
