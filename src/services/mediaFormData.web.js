// EN: Converts browser files or URIs into multipart media payloads without leaking platform details to callers.
// UK: Перетворює browser files або URI на multipart media payload, не передаючи platform-деталі викликачам.
export async function createMediaFormData(asset) {
  const form = new FormData();
  const file = asset.file || await fetch(asset.uri).then(/* EN: Reads a fetched browser asset as the Blob required by multipart FormData. UK: Зчитує отриманий браузером ресурс як Blob, потрібний для multipart FormData. */ (response) => response.blob());
  form.append('file', file, asset.fileName || 'image.jpg');
  return form;
}
