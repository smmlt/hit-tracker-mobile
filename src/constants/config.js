import Constants from 'expo-constants';

/**
 * Динамічне визначення базової URL-адреси бекенду з урахуванням змінних середовища (.env)
 */
const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.expoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const normalizedHost = String(debuggerHost)
      .replace(/^https?:\/\//, '')
      .replace(/^exp:\/\//, '')
      .split(':')[0]
      .replace(/\/$/, '');

    if (normalizedHost && normalizedHost !== 'localhost') {
      return `http://${normalizedHost}:3000`;
    }
  }

  return 'http://localhost:3000';
};

export const API_URL = getApiBaseUrl();