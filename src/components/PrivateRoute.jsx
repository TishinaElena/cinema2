import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  // Проверяем наличие токена
  const token = localStorage.getItem('adminToken');
  const isAuthenticated = !!token;

  return isAuthenticated ? children : <Navigate to="/admin/login" />;
};

export default PrivateRoute;