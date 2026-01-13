import React, { createContext, useState, useContext, useEffect } from 'react';
import { cinemaAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await cinemaAPI.login(credentials);
      if (response.token) {
        localStorage.setItem('adminToken', response.token);
        setIsAuthenticated(true);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Ошибка авторизации' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    cinemaAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};