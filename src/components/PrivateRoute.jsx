// PrivateRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';

const PrivateRoute = ({ children, requireRealAuth = false }) => {
  const [authStatus, setAuthStatus] = useState('checking'); // checking, authenticated, expired, failed
  
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Проверяем старый токен
      const oldToken = localStorage.getItem('adminToken');
      
      // Проверяем новую систему авторизации
      const authData = localStorage.getItem('adminAuth');
      
      // Если есть старая система токенов
      if (oldToken && !authData) {
        // Миграция со старой системы на новую
        localStorage.setItem('adminAuth', JSON.stringify({
          isAuthenticated: true,
          login: 'admin',
          timestamp: Date.now(),
          migrated: true
        }));
        setAuthStatus('authenticated');
        return;
      }
      
      // Если есть новая система авторизации
      if (authData) {
        const auth = JSON.parse(authData);
        
        // Проверяем флаг авторизации
        if (!auth.isAuthenticated) {
          setAuthStatus('failed');
          return;
        }
        
        // Проверяем время сессии (24 часа)
        if (auth.timestamp) {
          const timeDiff = Date.now() - auth.timestamp;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            // Сессия истекла
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('authToken');
            setAuthStatus('expired');
            return;
          }
        }
        
        // Проверяем, требуется ли реальная авторизация
        if (requireRealAuth && auth.isTestMode) {
          setAuthStatus('failed');
          return;
        }
        
        setAuthStatus('authenticated');
        return;
      }
      
      // Нет авторизации
      setAuthStatus('failed');
      
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus('failed');
    }
  };

  // Показываем лоадер во время проверки
  if (authStatus === 'checking') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Проверка авторизации...</span>
        </Spinner>
      </div>
    );
  }

  // Сессия истекла
  if (authStatus === 'expired') {
    // Очищаем данные и перенаправляем на логин
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    return <Navigate to="/admin/login" replace />;
  }

  // Нет доступа
  if (authStatus === 'failed') {
    return <Navigate to="/admin/login" replace />;
  }

  // Авторизован - показываем контент
  return children;
};

export default PrivateRoute;