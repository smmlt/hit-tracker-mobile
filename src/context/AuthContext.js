import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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
        throw new Error(data.message || 'Помилка авторизації');
      }

      setUserToken(data.token);
      setUserData(data.user);
    } catch (error) {
      throw error; // Прокидаємо помилку на екран для відображення UI-помилки
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
        throw new Error(data.message || 'Помилка реєстрації');
      }

      setUserToken(data.token);
      setUserData(data.user);
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