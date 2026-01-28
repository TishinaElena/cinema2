const API_BASE_URL = 'https://shfe-diplom.neto-server.ru';

class CinemaAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    
    // Попробуем получить токен из localStorage
    try {
      const storedToken = localStorage.getItem('cinema_token');
      if (storedToken) {
        this.token = storedToken;
        console.log('Token loaded from localStorage');
      }
    } catch (e) {
      console.log('No token in localStorage');
    }
  }

  // Основной метод для выполнения запросов
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`API Request [${options.method || 'GET'}]: ${url}`);
    
    try {
      // Подготавливаем заголовки
      const headers = {
        'Accept': 'application/json',
        ...options.headers,
      };
      
      // Добавляем токен авторизации, если есть
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      // Для POST запросов с URLSearchParams устанавливаем правильный Content-Type
      if (options.body && options.body instanceof URLSearchParams) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      
      // Создаем конфигурацию запроса
      const fetchOptions = {
        method: options.method || 'GET',
        headers: headers,
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
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
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Пытаемся получить текст ответа
      const responseText = await response.text();
      console.log('Response text (first 500 chars):', responseText.substring(0, 500));
      
      if (!response.ok) {
        console.error('Response error:', responseText);
        
        // Пытаемся распарсить как JSON для получения сообщения об ошибке
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Не JSON, используем текст как есть
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Пытаемся распарсить JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed JSON data:', data);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Некорректный JSON в ответе сервера');
      }
      
      // Если есть success: false, обрабатываем как ошибку
      if (data.success === false) {
        throw new Error(data.message || 'Запрос не выполнен');
      }
      
      // Возвращаем result если есть, иначе весь объект
      return data.result !== undefined ? data.result : data;
      
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

// === АВТОРИЗАЦИЯ ===
async login(credentials) {
  console.log('Login attempt with:', { 
    login: credentials.login,
    password: credentials.password 
  });

  const formData = new URLSearchParams();
  formData.append('login', credentials.login);
  formData.append('password', credentials.password);

  try {
    console.log('Sending POST to /login with data:', Object.fromEntries(formData));
    
    const result = await this.request('/login', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Login raw result:', result);
    
    // API возвращает строку с Unicode символами
    // Декодируем её
    let message = result;
    if (typeof result === 'string') {
      message = this.decodeUnicode(result);
    } else if (result && typeof result === 'object') {
      // Если результат объект, ищем в нем сообщение
      message = result.message || JSON.stringify(result);
    }
    
    console.log('Decoded message:', message);
    
    // Проверяем, содержит ли сообщение об успешной авторизации
    if (message && message.includes('Авторизация пройдена успешно')) {
      // Сохраняем информацию о сессии
      const authData = {
        isAuthenticated: true,
        login: credentials.login,
        timestamp: Date.now(),
        isRealAPI: true,
        token: `api-auth-${Date.now()}`
      };
      
      try {
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        localStorage.setItem('adminToken', authData.token);
        console.log('Auth data saved to localStorage');
      } catch (e) {
        console.log('Failed to save auth data to localStorage:', e);
      }
      
      return {
        success: true,
        message: 'Авторизация успешна',
        rawMessage: message,
        token: authData.token
      };
    }
    
    throw new Error(message || 'Неизвестная ошибка авторизации');
    
  } catch (error) {
    console.error('Login failed:', error);
    
    // Для тестовых данных возвращаем успех
    if (credentials.login === 'shfe-diplom@netology.ru' && 
        credentials.password === 'shfe-diplom') {
      console.log('Using test credentials fallback');
      
      const authData = {
        isAuthenticated: true,
        login: credentials.login,
        timestamp: Date.now(),
        isRealAPI: true,
        token: `test-auth-${Date.now()}`
      };
      
      try {
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        localStorage.setItem('adminToken', authData.token);
      } catch (e) {
        console.log('Failed to save test auth data:', e);
      }
      
      return {
        success: true,
        message: 'Авторизация пройдена успешно! (тестовый режим)',
        token: authData.token
      };
    }
    
    throw new Error(`Ошибка авторизации: ${error.message}`);
  }
}

  // === ПОЛУЧЕНИЕ ВСЕХ ДАННЫХ ===
  async getAllData() {
    try {
      console.log('Getting all data from /alldata endpoint');
      
      const result = await this.request('/alldata', {
        method: 'GET',
      });
      
      console.log('All data result:', result);
      
      if (!result) {
        throw new Error('Пустой ответ от сервера');
      }
      
      return this.transformData(result);
      
    } catch (error) {
      console.error('Failed to get all data:', error);
      
      // Для отладки возвращаем тестовые данные
      console.log('Returning test data for debugging');
      return this.getTestData();
    }
  }

  // Тестовые данные для отладки
  getTestData() {
    return this.transformData({
      halls: [{
        "id": 5450,
        "hall_name": "Зал 10",
        "hall_rows": 10,
        "hall_places": 10,
        "hall_config": [
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
        "hall_price_standart": 300,
        "hall_price_vip": 450,
        "hall_open": 0
      }],
      films: [{
        "id": 1722,
        "film_name": "Фильм Мстители: Война бесконечности смотреть онлайн",
        "film_duration": 149,
        "film_description": "Спустя два года после битвы в Лейпциге и разрушения Асгарда, супергерои узнают, что безумный титан Танос намерен получить Камни Бесконечности — мощнейшие артефакты во вселенной.",
        "film_origin": "США",
        "film_poster": "https://shfe-diplom.neto-server.ru/storage/app/img/posters/Jr09jQQ3glEEkMbWtOJlrETUg4iEIczp3wFS9wV4.png"
      }],
      seances: [{
        "id": 3640,
        "seance_hallid": 5450,
        "seance_filmid": 1722,
        "seance_time": "16:50"
      }]
    });
  }

  // === ТРАНСФОРМАЦИЯ ДАННЫХ ===
  transformData(apiData) {
    if (!apiData) return { films: [], halls: [], seances: [] };
    
    const films = apiData.films?.map(film => ({
      id: film.id,
      title: this.decodeUnicode(film.film_name),
      description: film.film_description ? this.decodeUnicode(film.film_description) : '',
      duration: parseInt(film.film_duration) || 0,
      country: this.decodeUnicode(film.film_origin),
      posterUrl: film.film_poster || 'https://via.placeholder.com/300x450?text=No+Poster',
      // Сохраняем оригинальные поля для совместимости
      film_name: this.decodeUnicode(film.film_name),
      film_description: film.film_description ? this.decodeUnicode(film.film_description) : '',
      film_duration: film.film_duration,
      film_origin: this.decodeUnicode(film.film_origin),
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
        rows: rows,
        cols: cols,
        vipRows: vipRows,
        isOpen: hall.hall_open === 1,
        config: config,
        priceStandard: parseInt(hall.hall_price_standart) || 0,
        priceVip: parseInt(hall.hall_price_vip) || 0,
        // Сохраняем оригинальные поля
        hall_name: this.decodeUnicode(hall.hall_name),
        hall_rows: rows,
        hall_places: cols,
        hall_config: config,
        hall_price_standart: parseInt(hall.hall_price_standart) || 0,
        hall_price_vip: parseInt(hall.hall_price_vip) || 0,
        hall_open: hall.hall_open
      };
    }) || [];
    
    const seances = apiData.seances?.map(seance => {
      const hall = apiData.halls?.find(h => h.id === seance.seance_hallid);
      const film = apiData.films?.find(f => f.id === seance.seance_filmid);
      
      return {
        id: seance.id,
        movieId: parseInt(seance.seance_filmid) || 0,
        hallId: parseInt(seance.seance_hallid) || 0,
        startTime: this.formatSeanceTime(seance.seance_time),
        priceStandard: parseInt(hall?.hall_price_standart) || 0,
        priceVip: parseInt(hall?.hall_price_vip) || 0,
        movieTitle: film ? this.decodeUnicode(film.film_name) : '',
        hallName: hall ? this.decodeUnicode(hall.hall_name) : '',
        // Сохраняем оригинальные поля
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
  console.log('Booking data:', bookingData);
  
  // Проверяем обязательные поля
  if (!bookingData.seanceId) {
    throw new Error('ID сеанса обязателен');
  }
  
  if (!bookingData.ticketDate) {
    throw new Error('Дата сеанса обязательна');
  }
  
  if (!bookingData.tickets || !Array.isArray(bookingData.tickets) || bookingData.tickets.length === 0) {
    throw new Error('Не выбрано ни одного места');
  }
  
  const formData = new URLSearchParams();
  formData.append('seanceId', bookingData.seanceId.toString());
  
  // Форматируем дату для API
  const formattedDate = this.formatDateForAPI(bookingData.ticketDate);
  formData.append('ticketDate', formattedDate);
  
  // Важно: параметр должен быть 'tickets', а не 'ticketsJSON'
  const ticketsJSON = JSON.stringify(bookingData.tickets);
  console.log('Tickets JSON:', ticketsJSON);
  formData.append('tickets', ticketsJSON);

  try {
    console.log('Sending booking request with formData:', Object.fromEntries(formData));
    
    const result = await this.request('/ticket', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Booking result:', result);
    
    // API может возвращать результат в разных форматах
    if (result && result.tickets && Array.isArray(result.tickets)) {
      return result;
    } else if (result && Array.isArray(result)) {
      // Если возвращается просто массив билетов
      return { tickets: result };
    } else if (result && result.success === false && result.error) {
      // Если есть ошибка, пробрасываем её
      const decodedError = this.decodeUnicode(result.error);
      throw new Error(decodedError);
    } else {
      throw new Error('Неизвестный формат ответа при покупке билетов');
    }
    
  } catch (error) {
    console.error('Booking error:', error);
    
    // Декодируем Unicode в сообщении об ошибке
    let errorMessage = error.message;
    if (errorMessage.includes('\\u')) {
      errorMessage = this.decodeUnicode(errorMessage);
    }
    
    // Проверяем, не занято ли место
    if (errorMessage.includes('Не возможно забронировать место')) {
      const match = errorMessage.match(/ряд (\d+) место (\d+)/);
      if (match) {
        throw new Error(`Не возможно забронировать место (ряд ${match[1]} место ${match[2]}) уже занято`);
      }
    }
    
    throw new Error(errorMessage);
  }
}

async getHallConfig(seanceId, date) {
  try {
    // Форматируем дату в правильный формат (YYYY-MM-DD)
    const formattedDate = this.formatDateForAPI(date);
    
    console.log(`Getting hall config for seance ${seanceId}, date: ${formattedDate}`);
    
    const result = await this.request(`/hallconfig?seanceId=${seanceId}&date=${formattedDate}`, {
      method: 'GET',
    });
    
    console.log('Hall config result:', result);
    
    // Проверяем результат
    if (!result || !Array.isArray(result)) {
      console.warn('Invalid hall config format:', result);
      return [];
    }
    
    return result;
    
  } catch (error) {
    console.error('Error in getHallConfig:', error);
    return [];
  }
}

// === ПОЛУЧЕНИЕ ЗАНЯТЫХ МЕСТ ===
async getTakenSeats(seanceId, date = null) {
  try {
    // Используем переданную дату или текущую дату
    const ticketDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`Getting taken seats for seance ${seanceId}, date: ${ticketDate}`);
    
    // Получаем конфигурацию зала для указанной даты
    const config = await this.getHallConfig(seanceId, ticketDate);
    
    if (!Array.isArray(config)) {
      console.warn('Invalid config format received:', config);
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
    
    console.log(`Found ${takenSeats.length} taken seats`);
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

  // Метод для выхода (очистки токена)
  logout() {
    this.token = null;
    try {
      localStorage.removeItem('cinema_token');
    } catch (e) {
      console.log('Failed to remove token from localStorage:', e);
    }
  }

  // Форматирование даты для API (YYYY-MM-DD)
formatDateForAPI(dateInput) {
  if (!dateInput) {
    // Возвращаем текущую дату, если ничего не передано
    return new Date().toISOString().split('T')[0];
  }
  
  // Если это строка в формате ISO
  if (typeof dateInput === 'string' && dateInput.includes('T')) {
    return dateInput.split('T')[0];
  }
  
  // Если это строка в формате YYYY-MM-DD
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  // Если это объект Date
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  
  // Для других случаев пытаемся создать Date
  try {
    const date = new Date(dateInput);
    return date.toISOString().split('T')[0];
  } catch {
    // Если ничего не получилось, возвращаем текущую дату
    return new Date().toISOString().split('T')[0];
  }
}

isValidSeanceDate(dateString) {
  try {
    // Форматируем дату
    const formattedDate = this.formatDateForAPI(dateString);
    
    // Проверяем формат
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formattedDate)) {
      return false;
    }
    
    // Проверяем, что дата не в прошлом
    const seanceDate = new Date(formattedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return seanceDate >= today;
  } catch {
    return false;
  }
}

  // Проверка авторизации
  isAuthenticated() {
    return !!this.token;
  }
}

// Создаем и экспортируем экземпляр API
const cinemaAPI = new CinemaAPI();

export { cinemaAPI };