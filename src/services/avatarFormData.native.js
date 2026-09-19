export async function createAvatarFormData(asset) {
  const form = new FormData();
  form.append('file', {
    uri: asset.uri,
    name: asset.fileName || 'avatar.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  return form;
}
