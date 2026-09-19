export function isMultipartBody(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}
