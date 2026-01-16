// src/index.jsx - ИЗМЕНИТЬ ЭТОТ ФАЙЛ
import React from 'react';
import ReactDOM from 'react-dom/client';
// УДАЛИТЬ BrowserRouter/HashRouter импорт отсюда
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* УДАЛИТЬ BrowserRouter/HashRouter здесь */}
    <App />
    {/* УДАЛИТЬ BrowserRouter/HashRouter здесь */}
  </React.StrictMode>
);