// EN: Stores refresh credentials in SecureStore on native platforms while intentionally keeping web access tokens outside persistent storage.
// UK: Зберігає refresh credentials у SecureStore на native-платформах і навмисно не зберігає web access tokens у постійному сховищі.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'userToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// EN: Persists the short-lived access token in native SecureStore; on web it removes any legacy copy because the browser session relies on the server cookie.
// UK: Зберігає короткоживучий access token у native SecureStore; у web видаляє застарілу копію, бо браузерна сесія спирається на серверний cookie.
export async function saveAuthToken(token) {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(TOKEN_KEY);
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

// EN: Reads the platform-appropriate access token and transparently migrates older native installations from AsyncStorage to encrypted SecureStore.
// UK: Читає access token із відповідного для платформи сховища та непомітно переносить старі native-інсталяції з AsyncStorage до зашифрованого SecureStore.
export async function loadAuthToken() {
  if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);

  const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
  if (secureToken) return secureToken;

  // One-time migration for users upgrading from the previous app version.
  const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
  if (!legacyToken) return null;
  await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
  await AsyncStorage.removeItem(TOKEN_KEY);
  return legacyToken;
}

// EN: Deletes every possible access-token copy so logout cannot leave credentials in either the current or legacy native storage.
// UK: Видаляє всі можливі копії access token, щоб після logout облікові дані не залишилися ні в поточному, ні в застарілому native-сховищі.
export async function removeAuthToken() {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// EN: Stores the long-lived refresh token only on native platforms; web refresh uses the HttpOnly cookie and must not expose this token to JavaScript storage.
// UK: Зберігає довгоживучий refresh token лише на native-платформах; web-refresh використовує HttpOnly cookie й не повинен відкривати цей token JavaScript-сховищу.
export async function saveRefreshToken(token) {
  if (!token || Platform.OS === 'web') return;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

// EN: Returns the native refresh token, while web deliberately returns null so the API client requests cookie-based refresh instead.
// UK: Повертає native refresh token, а у web навмисно повертає null, щоб API-клієнт виконав refresh через cookie.
export async function loadRefreshToken() {
  if (Platform.OS === 'web') return null;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

// EN: Clears the refresh credential from SecureStore and also removes a possible legacy AsyncStorage value during logout or session invalidation.
// UK: Очищає refresh credential із SecureStore, а також можливе застаріле значення в AsyncStorage під час logout або інвалідації сесії.
export async function removeRefreshToken() {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}
