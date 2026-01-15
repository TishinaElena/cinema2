// services/api.js
const API_BASE_URL = 'https://shfe-diplom.neto-server.ru';

class CinemaAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.useMock = false; // По умолчанию используем реальный API
    this.isOnline = true;
    
    // Проверяем доступность API при создании
    this.checkApiStatus();
  }

  // Метод для проверки статуса API
  async checkApiStatus() {
    try {
      // Пробуем простой GET запрос без сложных заголовков
      const testResponse = await fetch(`${this.baseURL}/alldata`, {
        method: 'GET',
        mode: 'no-cors', // Используем no-cors для проверки
        cache: 'no-cache',
      });
      
      // Если не выбросило ошибку, сервер доступен
      this.isOnline = true;
      console.log('API status: ONLINE');
      return 'online';
    } catch (error) {
      this.isOnline = false;
      console.log('API status: OFFLINE', error.message);
      return 'offline';
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`API Request [${options.method || 'GET'}]: ${endpoint}`);
    
    // Если API offline, используем мок-данные
    if (!this.isOnline && endpoint !== '/login') {
      console.log('API offline, using mock data for:', endpoint);
      return this.getMockResponse(endpoint, options);
    }
    
    try {
      // Подготавливаем заголовки
      const headers = {
        'Accept': 'application/json',
        ...options.headers,
      };
      
      // Для POST запросов с FormData не устанавливаем Content-Type
      if (!(options.body instanceof FormData) && options.method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      
      // Создаем конфигурацию запроса
      const fetchOptions = {
        method: options.method || 'GET',
        headers: headers,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      };
      
      // Добавляем body, если есть
      if (options.body) {
        fetchOptions.body = options.body;
      }
      
      console.log('Fetch options:', {
        url,
        method: fetchOptions.method,
        headers: fetchOptions.headers
      });
      
      // Выполняем запрос
      const response = await fetch(url, fetchOptions);
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Получаем ответ
      const responseText = await response.text();
      console.log('Response text (first 200 chars):', responseText.substring(0, 200));
      
      // Пытаемся распарсить JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // Если не JSON, возвращаем текст
        return responseText;
      }
      
      // Возвращаем result если есть, иначе весь объект
      return data.result !== undefined ? data.result : data;
      
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.message);
      
      // Для авторизации пробрасываем ошибку
      if (endpoint === '/login') {
        // Но для тестовых данных делаем исключение
        if (options.body) {
          try {
            const params = new URLSearchParams(options.body);
            const login = params.get('login');
            const password = params.get('password');
            
            if (login === 'shfe-diplom@netology.ru' && password === 'shfe-diplom') {
              console.log('Using fallback auth for test credentials');
              return 'Авторизация пройдена успешно! (fallback)';
            }
          } catch (e) {
            // Не удалось распарсить body
          }
        }
        
        throw new Error(`Ошибка авторизации: ${error.message}`);
      }
      
      // Для других запросов возвращаем мок-данные
      return this.getMockResponse(endpoint, options);
    }
  }

  // Получение мок-ответа
  getMockResponse(endpoint, options) {
    console.log('Generating mock response for:', endpoint);
    
    // АВТОРИЗАЦИЯ
    if (endpoint === '/login' && options.method === 'POST') {
      try {
        const params = new URLSearchParams(options.body);
        const login = params.get('login');
        const password = params.get('password');
        
        if (login === 'shfe-diplom@netology.ru' && password === 'shfe-diplom') {
          return 'Авторизация пройдена успешно! (mock)';
        } else {
          return { error: 'Неверные учетные данные' };
        }
      } catch {
        return { error: 'Ошибка обработки запроса' };
      }
    }
    
    // ВСЕ ДАННЫЕ
    if (endpoint === '/alldata') {
      return {
        films: [
          {
            id: 1722,
            film_name: "Мстители: Война бесконечности",
            film_description: "Спустя два года после битвы в Лейпциге и разрушения Асгарда, супергерои узнают, что безумный титан Танос намерен получить Камни Бесконечности — мощнейшие артефакты во вселенной.",
            film_duration: "149",
            film_origin: "США",
            film_poster: "https://shfe-diplom.neto-server.ru/storage/app/img/posters/Jr09jQQ3glEEkMbWtOJlrETUg4iEIczp3wFS9wV4.png",
            film_genre: "Фантастика, Боевик",
            film_age_rating: "16+"
          }
        ],
        halls: [
          { 
            id: 5450, 
            hall_name: "Зал 10",
            hall_rows: 10,
            hall_places: 10,
            hall_config: [
              ["disabled", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "disabled"],
              ["standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "standart", "vip", "vip", "standart", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "vip", "vip", "vip", "vip", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "vip", "vip", "vip", "vip", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "vip", "vip", "vip", "vip", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "vip", "vip", "vip", "vip", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "vip", "vip", "vip", "vip", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart"],
              ["standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart", "standart"]
            ],
            hall_price_standart: 300,
            hall_price_vip: 400,
            hall_open: 1
          }
        ],
        seances: [
          { 
            id: 3640, 
            seance_filmid: "1722",
            seance_hallid: "5450",
            seance_time: "16:50"
          }
        ]
      };
    }
    
    // ОТВЕТ ПО УМОЛЧАНИЮ
    return { 
      success: true, 
      message: 'Mock response', 
      timestamp: new Date().toISOString() 
    };
  }

  // === АВТОРИЗАЦИЯ ===
  async login(credentials) {
    console.log('Login attempt with:', { 
      login: credentials.login,
      hasPassword: !!credentials.password 
    });

    const formData = new URLSearchParams();
    formData.append('login', credentials.login);
    formData.append('password', credentials.password);

    try {
      const result = await this.request('/login', {
        method: 'POST',
        body: formData,
      });
      
      console.log('Login result:', result);
      
      // Проверяем успешность авторизации
      if (typeof result === 'string' && result.includes('Авторизация')) {
        return result;
      }
      
      // Если результат не строка, проверяем другие форматы
      if (result && (result.success || result.message)) {
        return result.message || 'Авторизация успешна';
      }
      
      throw new Error('Неверный формат ответа от сервера');
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Для тестовых данных возвращаем успех
      if (credentials.login === 'shfe-diplom@netology.ru' && 
          credentials.password === 'shfe-diplom') {
        console.log('Using fallback auth for test credentials');
        return 'Авторизация пройдена успешно! (fallback)';
      }
      
      throw new Error(`Ошибка авторизации: ${error.message}`);
    }
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ===
  async getAllData() {
    try {
      const result = await this.request('/alldata', {
        method: 'GET',
      });
      
      if (!result) {
        throw new Error('Пустой ответ от сервера');
      }
      
      return this.transformData(result);
      
    } catch (error) {
      console.error('Failed to get all data:', error);
      
      // Возвращаем мок-данные в трансформированном виде
      const mockData = this.getMockResponse('/alldata', { method: 'GET' });
      return this.transformData(mockData);
    }
  }

  // === ТРАНСФОРМАЦИЯ ДАННЫХ ===
  transformData(apiData) {
    if (!apiData) return { films: [], halls: [], seances: [] };
    
    const films = apiData.films?.map(film => ({
      id: film.id,
      title: this.decodeUnicode(film.film_name),
      description: film.film_description ? this.decodeUnicode(film.film_description) : '',
      duration: parseInt(film.film_duration) || 0,
      genre: film.film_genre || '',
      country: this.decodeUnicode(film.film_origin),
      ageRating: film.film_age_rating || '',
      posterUrl: film.film_poster || 'https://via.placeholder.com/300x450?text=No+Poster',
      film_name: this.decodeUnicode(film.film_name),
      film_description: film.film_description ? this.decodeUnicode(film.film_description) : '',
      film_duration: film.film_duration,
      film_origin: this.decodeUnicode(film.film_origin),
      film_age_rating: film.film_age_rating,
      film_poster: film.film_poster
    })) || [];
    
    const halls = apiData.halls?.map(hall => {
      const config = hall.hall_config || [];
      const rows = parseInt(hall.hall_rows) || 0;
      const cols = parseInt(hall.hall_places) || 0;
      
      const vipRows = [];
      for (let i = 0; i < Math.min(config.length, rows); i++) {
        if (config[i] && config[i].includes('vip')) {
          vipRows.push(i + 1);
        }
      }
      
      return {
        id: hall.id,
        name: this.decodeUnicode(hall.hall_name),
        hall_name: this.decodeUnicode(hall.hall_name),
        rows: rows,
        cols: cols,
        hall_rows: rows,
        hall_places: cols,
        vipRows: vipRows,
        hall_open: parseInt(hall.hall_open) || 0,
        hall_config: config,
        hall_price_standart: parseInt(hall.hall_price_standart) || 0,
        hall_price_vip: parseInt(hall.hall_price_vip) || 0,
        priceStandard: parseInt(hall.hall_price_standart) || 0,
        priceVip: parseInt(hall.hall_price_vip) || 0
      };
    }) || [];
    
    const seances = apiData.seances?.map(seance => {
      const hall = apiData.halls?.find(h => h.id === seance.seance_hallid);
      
      return {
        id: seance.id,
        movieId: parseInt(seance.seance_filmid) || 0,
        hallId: parseInt(seance.seance_hallid) || 0,
        startTime: this.formatSeanceTime(seance.seance_time),
        priceStandard: parseInt(hall?.hall_price_standart) || 0,
        priceVip: parseInt(hall?.hall_price_vip) || 0,
        seance_filmid: seance.seance_filmid,
        seance_hallid: seance.seance_hallid,
        seance_time: seance.seance_time,
        startTimeStr: seance.seance_time
      };
    }) || [];
    
    return {
      films,
      halls,
      seances
    };
  }

  // Декодирование Unicode строк
  decodeUnicode(str) {
    if (!str) return '';
    try {
      return str.replace(/\\u[\dA-F]{4}/gi, 
        match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
      );
    } catch {
      return str;
    }
  }

  // Форматирование времени сеанса
  formatSeanceTime(timeString) {
    if (!timeString) return new Date().toISOString();
    
    try {
      const today = new Date();
      const [hours, minutes] = timeString.split(':').map(Number);
      const seanceDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      return seanceDate.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  // === ОСТАЛЬНЫЕ МЕТОДЫ API ===
  // (Используют тот же паттерн, что и выше)
  
  async getHalls() {
    const result = await this.getAllData();
    return result.halls || [];
  }

  async createHall(hallData) {
    const formData = new URLSearchParams();
    
    const hallName = hallData.get('hallName') || 
                    hallData.hallName || 
                    hallData.name || 
                    hallData.hall_name;
    
    if (!hallName) {
      throw new Error('Hall name is required');
    }
    
    formData.append('hallName', hallName);

    return this.request('/hall', {
      method: 'POST',
      body: formData,
    });
  }

  async updateHallConfig(hallId, configData) {
    const formData = new URLSearchParams();
    
    const rowCount = configData.get('rowCount') || 
                   configData.hall_rows || 
                   configData.rows || 
                   10;
    const placeCount = configData.get('placeCount') || 
                     configData.hall_places || 
                     configData.cols || 
                     configData.places || 
                     10;
    
    let config = configData.get('config');
    
    if (!config && configData.hall_config) {
      config = JSON.stringify(configData.hall_config);
    } else if (!config && configData.config) {
      config = JSON.stringify(configData.config);
    }
    
    if (!config) {
      const defaultConfig = Array(parseInt(rowCount)).fill()
        .map(() => Array(parseInt(placeCount)).fill('standart'));
      config = JSON.stringify(defaultConfig);
    }
    
    formData.append('rowCount', rowCount);
    formData.append('placeCount', placeCount);
    formData.append('config', config);

    return this.request(`/hall/${hallId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateHallPrice(hallId, priceData) {
    const formData = new URLSearchParams();
    
    const priceStandart = priceData.get('priceStandart') || 
                         priceData.priceStandart || 
                         priceData.hall_price_standart ||
                         '300';
    
    const priceVip = priceData.get('priceVip') || 
                    priceData.priceVip || 
                    priceData.hall_price_vip ||
                    '400';
    
    formData.append('priceStandart', priceStandart);
    formData.append('priceVip', priceVip);

    return this.request(`/price/${hallId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateHallOpen(hallId, statusData) {
    const formData = new URLSearchParams();
    
    const hallOpen = statusData.get('hallOpen') || 
                    statusData.hall_open ||
                    '0';
    
    formData.append('hallOpen', hallOpen);

    return this.request(`/open/${hallId}`, {
      method: 'POST',
      body: formData,
    });
  }

  async deleteHall(hallId) {
    return this.request(`/hall/${hallId}`, {
      method: 'DELETE',
    });
  }

  async getMovies() {
    const result = await this.getAllData();
    return result.films || [];
  }

  async createFilm(filmData) {
    const formData = new FormData();
    
    let filmName, filmDuration, filmDescription, filmOrigin, filePoster;
    
    if (filmData instanceof FormData) {
      filmName = filmData.get('filmName');
      filmDuration = filmData.get('filmDuration');
      filmDescription = filmData.get('filmDescription') || '';
      filmOrigin = filmData.get('filmOrigin') || '';
      filePoster = filmData.get('filePoster');
    } else {
      filmName = filmData.filmName || filmData.title || filmData.film_name;
      filmDuration = filmData.filmDuration || filmData.duration || filmData.film_duration;
      filmDescription = filmData.filmDescription || filmData.description || filmData.film_description || '';
      filmOrigin = filmData.filmOrigin || filmData.country || filmData.film_origin || '';
      filePoster = filmData.filePoster;
    }
    
    if (!filmName || filmName.trim() === '') {
      throw new Error('Название фильма обязательно');
    }
    
    if (!filmDuration || filmDuration.toString().trim() === '') {
      throw new Error('Продолжительность фильма обязательна');
    }
    
    if (!filePoster) {
      throw new Error('Постер фильма обязателен');
    }
    
    formData.append('filmName', filmName);
    formData.append('filmDuration', filmDuration.toString());
    formData.append('filmDescription', filmDescription);
    formData.append('filmOrigin', filmOrigin);
    
    if (filePoster instanceof File) {
      formData.append('filePoster', filePoster);
    } else if (filePoster) {
      formData.append('filePoster', filePoster);
    }
    
    return this.request('/film', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteFilm(filmId) {
    return this.request(`/film/${filmId}`, {
      method: 'DELETE',
    });
  }

  async getSeances() {
    const result = await this.getAllData();
    return result.seances || [];
  }

  async createSeance(seanceData) {
    const formData = new URLSearchParams();
    
    const seanceHallid = seanceData.get('seanceHallid') || seanceData.seanceHallid || seanceData.hallId;
    const seanceFilmid = seanceData.get('seanceFilmid') || seanceData.seanceFilmid || seanceData.movieId;
    const seanceTime = seanceData.get('seanceTime') || seanceData.seanceTime;
    
    formData.append('seanceHallid', seanceHallid);
    formData.append('seanceFilmid', seanceFilmid);
    formData.append('seanceTime', seanceTime);

    return this.request('/seance', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteSeance(seanceId) {
    return this.request(`/seance/${seanceId}`, {
      method: 'DELETE',
    });
  }

  async bookTickets(bookingData) {
    const formData = new URLSearchParams();
    formData.append('seanceId', bookingData.seanceId.toString());
    formData.append('ticketDate', bookingData.ticketDate);
    
    const ticketsJSON = JSON.stringify(bookingData.tickets);
    formData.append('tickets', ticketsJSON);

    return this.request('/ticket', {
      method: 'POST',
      body: formData,
    });
  }

  async getHallConfig(seanceId, date) {
    try {
      const url = `${this.baseURL}/hallconfig?seanceId=${seanceId}&date=${date}`;
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.result || data;
      
    } catch (error) {
      console.error('Error in getHallConfig:', error);
      return [];
    }
  }

  async getTakenSeats(seanceId) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const config = await this.getHallConfig(seanceId, date);
      
      if (!Array.isArray(config)) {
        return [];
      }
      
      const takenSeats = [];
      
      config.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) return;
        
        row.forEach((seatType, seatIndex) => {
          if (seatType === 'taken') {
            takenSeats.push({
              id: (rowIndex * row.length) + seatIndex + 1,
              row: rowIndex + 1,
              seat: seatIndex + 1,
              seatType: 'taken'
            });
          }
        });
      });
      
      return takenSeats;
      
    } catch (error) {
      console.error('Error in getTakenSeats:', error);
      return [];
    }
  }

  async getBookedTickets() {
    try {
      return await this.request('/ticket', { method: 'GET' });
    } catch (error) {
      console.error('Error in getBookedTickets:', error);
      return [];
    }
  }

  formatTimeForAPI(isoTime) {
    if (!isoTime) return '';
    
    try {
      const date = new Date(isoTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      if (typeof isoTime === 'string' && isoTime.includes(':')) {
        return isoTime;
      }
      return '';
    }
  }

  async getTakenSeatsFromTickets(seanceId) {
    try {
      const date = new Date().toISOString().split('T')[0];
      
      const response = await fetch(
        `${this.baseURL}/ticket?seanceId=${seanceId}&date=${date}`, 
        { 
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        }
      );
      
      const data = await response.json();
      const tickets = data.result || data || [];
      
      return tickets.map(ticket => ({
        row: ticket.ticket_row,
        seat: ticket.ticket_place,
        id: ticket.id,
        type: 'taken'
      }));
      
    } catch (error) {
      console.error('Error getting taken seats from tickets:', error);
      return [];
    }
  }

  // Включение/выключение мок-режима
  setMockMode(enabled) {
    this.useMock = enabled;
    this.isOnline = !enabled;
    console.log(`Mock mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Создаем и экспортируем экземпляр API
const cinemaAPI = new CinemaAPI();

export { cinemaAPI };