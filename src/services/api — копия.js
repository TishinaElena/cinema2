import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001'; // Или ваш URL API

export const cinemaAPI = {
  // Получение всех данных
  getAllData: async () => {
    try {
      // Вариант 1: если API возвращает все данные одной endpoint
      const response = await axios.get(`${API_BASE_URL}/api/data`);
      return response.data;
      
      // Вариант 2: если нужно собирать данные из нескольких endpoints
      // const [filmsRes, hallsRes, seancesRes] = await Promise.all([
      //   axios.get(`${API_BASE_URL}/api/films`),
      //   axios.get(`${API_BASE_URL}/api/halls`),
      //   axios.get(`${API_BASE_URL}/api/seances`)
      // ]);
      // return {
      //   films: filmsRes.data,
      //   halls: hallsRes.data,
      //   seances: seancesRes.data
      // };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Метод для получения сеансов на определенную дату
  getSeancesByDate: async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const response = await axios.get(`${API_BASE_URL}/api/seances?date=${dateStr}`);
    return response.data;
  },

  // Метод для бронирования мест
  bookTickets: async (bookingData) => {
    const response = await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
    return response.data;
  }
};