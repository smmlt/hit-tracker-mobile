// EN: Generates the verifier/challenge pair that binds a mobile OAuth callback to the device that started authorization.
// UK: Генерує пару verifier/challenge, яка привʼязує mobile OAuth callback до пристрою, що почав авторизацію.
// EN: The verifier stays local to the OAuth initiator while the returned S256 challenge is safe to send to the authorization endpoint.
// UK: Верифікатор залишається локальним для ініціатора OAuth, а повернутий S256 challenge можна передавати authorization endpoint.
import * as Crypto from 'expo-crypto';

/** EN: Generates a random PKCE verifier and its URL-safe SHA-256 challenge for a mobile OAuth flow. UK: Генерує випадковий PKCE-верифікатор і його безпечний для URL SHA-256 challenge для мобільного OAuth-процесу. */
export async function createPkcePair() {
  const verifier = Array.from(Crypto.getRandomBytes(32), /* EN: Encodes each random byte as a fixed-width hexadecimal fragment. UK: Кодує кожен випадковий байт як шістнадцятковий фрагмент сталої ширини. */ (byte) => byte.toString(16).padStart(2, '0')).join('');
  const base64Digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  return {
    verifier,
    challenge: base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  };
}
