// EN: Detects multipart request bodies so the API client does not incorrectly force a JSON Content-Type header.
// UK: Визначає multipart body, щоб API client помилково не встановлював JSON Content-Type.
export function isMultipartBody(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}
