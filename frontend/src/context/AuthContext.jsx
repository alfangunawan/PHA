import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted auth on app start
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('authUser'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.log('Failed to load auth:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { user: userData, token: authToken } = response.data;
    await Promise.all([
      AsyncStorage.setItem('authToken', authToken),
      AsyncStorage.setItem('authUser', JSON.stringify(userData)),
    ]);
    setToken(authToken);
    setUser(userData);
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const { user: userData, token: authToken } = response.data;
    await Promise.all([
      AsyncStorage.setItem('authToken', authToken),
      AsyncStorage.setItem('authUser', JSON.stringify(userData)),
    ]);
    setToken(authToken);
    setUser(userData);
    return response;
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('authToken'),
      AsyncStorage.removeItem('authUser'),
    ]);
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
