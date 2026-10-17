// EN: Converts browser files or URIs into multipart media payloads without leaking platform details to callers.
// UK: Перетворює browser files або URI на multipart media payload, не передаючи platform-деталі викликачам.
export async function createMediaFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then((response) => response.blob());
  form.append('file', file, asset.fileName || 'image.jpg');
  return form;
}
