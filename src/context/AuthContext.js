import React, { createContext, useState } from 'react';
import Constants from 'expo-constants';

export const AuthContext = createContext();

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

const API_URL = getApiBaseUrl();

const normalizeAuthError = (status, data) => {
  const message = String(data?.message || '').toLowerCase();

  if (status === 401 || status === 404 || message.includes('not found') || message.includes('user')) {
    return 'User not found. Please register first.';
  }

  if (message.includes('already exists') || message.includes('exist')) {
    return 'This email is already registered.';
  }

  return data?.message || 'Authentication failed';
};

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Вхід через NestJS API
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(normalizeAuthError(response.status, data));
      }

      const accessToken = data.accessToken || data.token;
      setUserToken(accessToken);
      setUserData(data.user || null);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Реєстрація через NestJS API
  const register = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(normalizeAuthError(response.status, data));
      }

      const accessToken = data.accessToken || data.token;
      setUserToken(accessToken);
      setUserData(data.user || null);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Вихід
  const logout = () => {
    setUserToken(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};