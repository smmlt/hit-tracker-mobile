import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'userToken';

export async function saveAuthToken(token) {
  if (Platform.OS === 'web') return AsyncStorage.setItem(TOKEN_KEY, token);
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

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

export async function removeAuthToken() {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(TOKEN_KEY);
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
}
