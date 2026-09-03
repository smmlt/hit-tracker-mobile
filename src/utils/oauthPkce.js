import * as Crypto from 'expo-crypto';

export async function createPkcePair() {
  const verifier = Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
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
