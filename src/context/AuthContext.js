import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Имитация входа в систему
  const login = (email, password) => {
    setIsLoading(true);
    setTimeout(() => {
      setUserToken('some-jwt-token');
      setIsLoading(false);
    }, 1000);
  };

  // Имитация регистрации
  const register = (email, password) => {
    setIsLoading(true);
    setTimeout(() => {
      setUserToken('some-jwt-token');
      setIsLoading(false);
    }, 1000);
  };

  // Выход из аккаунта
  const logout = () => {
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};