import axios from 'axios';

const API_BASE_URL = 'https://shfe-diplom.neto-server.ru';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Интерцептор для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      return Promise.reject(new Error(response.data.error || 'Ошибка сервера'));
    }
    return response.data.result || response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const cinemaAPI = {
  // Авторизация
  login: (credentials) => {
    const formData = new FormData();
    formData.append('login', credentials.login);
    formData.append('password', credentials.password);
    return api.post('/login', formData);
  },
  
  logout: () => {
    localStorage.removeItem('adminToken');
  }
};

export default api;