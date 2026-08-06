import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Створюємо контекст аутентифікації для глобального управління станом користувача
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Стани для зберігання токена, даних користувача та статусу завантаження
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Починаємо з true, поки перевіряємо сховище

  /**
   * При першому запуску програми або оновленні сторінки перевіряємо сховище на наявність токена
   */
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken) {
          setUserToken(storedToken);
          if (storedUser) {
            setUserData(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Failed to load auth data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  /**
   * Авторизація користувача через сервіс аутентифікації
   */
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Викликаємо метод із сервісу (він сам робить запит і перевіряє помилки)
      const data = await authService.login(email, password);

      const accessToken = data.accessToken || data.token;
      const user = data.user || null;

      // Зберігаємо токен та дані користувача в локальне сховище пристрою/браузера
      await AsyncStorage.setItem('userToken', accessToken);
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }

      setUserToken(accessToken);
      setUserData(user);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Реєстрація нового користувача через сервіс аутентифікації
   */
  const register = async (email, password) => {
    setIsLoading(true);
    try {
      // Викликаємо метод реєстрації із сервісу
      const data = await authService.register(email, password);

      const accessToken = data.accessToken || data.token;
      const user = data.user || null;

      // Зберігаємо токен одразу після успішної реєстрації
      await AsyncStorage.setItem('userToken', accessToken);
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }

      setUserToken(accessToken);
      setUserData(user);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Вихід користувача із системи (очищення сховища та станів)
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUserToken(null);
      setUserData(null);
    } catch (error) {
      console.error('Failed to clear storage during logout:', error);
    } finally {
      setIsLoading(false);
    }
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