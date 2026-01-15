import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Spinner, 
  Alert 
} from 'react-bootstrap';
import { format, addDays, isToday, parseISO, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cinemaAPI } from '../../services/api';

const MainPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [seances, setSeances] = useState([]);
  const [filteredSeances, setFilteredSeances] = useState([]);

  // Загрузка данных из API
  useEffect(() => {
    loadData();
  }, []);

  // Фильтрация сеансов при изменении даты
  useEffect(() => {
    if (seances.length > 0) {
      filterSeancesByDate();
    }
  }, [selectedDate, seances]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получаем все данные из API
      const data = await cinemaAPI.getAllData();
      
      // Преобразуем данные в нужный формат
      const apiMovies = data.films || [];
      const apiHalls = data.halls || [];
      const apiSeances = data.seances || [];
      
      console.log('Загружено из API:', {
        movies: apiMovies.length,
        halls: apiHalls.length,
        seances: apiSeances.length
      });
      
      // Обрабатываем сеансы
      const processedSeances = apiSeances.map(seance => {
        // Создаем полную дату и время
        let seanceDateTime = new Date();
        
        // Если есть дата сеанса в API
        if (seance.seance_date) {
          seanceDateTime = parseISO(seance.seance_date);
        } else {
          // Иначе используем сегодняшнюю дату + время из сеанса
          const today = new Date();
          const timeParts = seance.seance_time ? seance.seance_time.split(':') : ['12', '00'];
          seanceDateTime = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            0
          );
        }
        
        return {
          ...seance,
          id: seance.id || seance.seance_id,
          movieId: seance.filmId || seance.seance_filmid,
          hallId: seance.hallId || seance.seance_hallid,
          startTime: seanceDateTime,
          date: seanceDateTime,
          seance_time: seance.seance_time || format(seanceDateTime, 'HH:mm')
        };
      });
      
      // Сортируем по времени
      processedSeances.sort((a, b) => a.startTime - b.startTime);
      
      setMovies(apiMovies);
      setHalls(apiHalls);
      setSeances(processedSeances);
      
      // Фильтруем сеансы для текущей даты
      filterSeancesByDate(processedSeances);
      
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      
      
      
    } finally {
      setLoading(false);
    }
  };

  // Функция фильтрации сеансов по дате
  const filterSeancesByDate = (seancesList = seances) => {
    console.log('Фильтрация сеансов для даты:', format(selectedDate, 'dd.MM.yyyy'));
    
    const filtered = seancesList.filter(seance => {
      // Проверяем зал
      const hall = getHallById(seance.hallId || seance.seance_hallid);
      if (!hall || hall.hall_open !== 1) {
        return false;
      }
      
      // Проверяем дату
      if (seance.date) {
        const isSame = isSameDay(new Date(seance.date), selectedDate);
        console.log(`Сеанс ${seance.id}: ${format(seance.date, 'dd.MM.yyyy')} - ${isSame ? 'подходит' : 'не подходит'}`);
        return isSame;
      }
      
      return false;
    });
    
    console.log('Отфильтровано сеансов:', filtered.length);
    setFilteredSeances(filtered);
  };

  const handleDateSelect = (date) => {
    console.log('Выбрана дата:', format(date, 'dd.MM.yyyy'));
    setSelectedDate(date);
  };

  const handleTimeClick = (seanceId) => {
    navigate(`/hall/${seanceId}`);
  };

  const formatTime = (timeValue) => {
    try {
      if (timeValue instanceof Date) {
        return format(timeValue, 'HH:mm');
      }
      
      if (typeof timeValue === 'number') {
        const date = new Date(timeValue);
        return format(date, 'HH:mm');
      }
      
      if (typeof timeValue === 'string' && timeValue.includes(':')) {
        return timeValue;
      }
      
      return '--:--';
    } catch (error) {
      console.error('Ошибка форматирования времени:', error);
      return '--:--';
    }
  };

  const formatDuration = (minutes) => {
    const minutesNum = parseInt(minutes) || 0;
    const hours = Math.floor(minutesNum / 60);
    const mins = minutesNum % 60;
    return `${hours}ч ${mins}мин`;
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  // Группируем отфильтрованные сеансы по фильмам
  const getSeancesByMovie = () => {
    console.log('Группировка отфильтрованных сеансов:', filteredSeances.length);
    
    const grouped = {};
    
    filteredSeances.forEach(seance => {
      const movieId = seance.movieId || seance.seance_filmid;
      if (!grouped[movieId]) {
        grouped[movieId] = [];
      }
      grouped[movieId].push(seance);
    });
    
    console.log('Группировка результата:', Object.keys(grouped).length, 'фильмов');
    return grouped;
  };

  // Получаем фильм по ID
  const getMovieById = (movieId) => {
    return movies.find(movie => movie.id === movieId);
  };

  // Получаем зал по ID
  const getHallById = (hallId) => {
    return halls.find(hall => hall.id === hallId);
  };

  // Получаем минимальную цену для фильма
  const getMinPriceForMovie = (movieId) => {
    const movieSeances = filteredSeances.filter(s => 
      (s.movieId === movieId || s.seance_filmid === movieId)
    );
    
    if (movieSeances.length === 0) return 0;
    
    const prices = movieSeances.map(s => {
      const standard = s.priceStandard || s.hall_price_standart || 0;
      const vip = s.priceVip || s.hall_price_vip || 0;
      return Math.min(standard, vip);
    });
    
    return Math.min(...prices);
  };

  // Функция для получения URL постера
  const getPosterUrl = (movie) => {
    if (movie.posterUrl) return movie.posterUrl;
    if (movie.film_poster) return movie.film_poster;
    return `https://via.placeholder.com/300x450?text=${encodeURIComponent(movie.title || movie.film_name || 'Фильм')}`;
  };

  // Функция для получения возраста
  const getAgeRating = (movie) => {
    if (movie.ageRating) return movie.ageRating;
    if (movie.film_age_rating) return movie.film_age_rating;
    return '0+';
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем расписание...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка загрузки</Alert.Heading>
          <p>{error}</p>
          <Button variant="primary" onClick={loadData}>
            Попробовать снова
          </Button>
        </Alert>
      </Container>
    );
  }

  const seancesByMovie = getSeancesByMovie();
  const selectedDateStr = format(selectedDate, 'd MMMM yyyy', { locale: ru });

  return (
    <Container className="py-4">
      <header className="d-flex justify-content-between align-items-center mb-4">
        <div className="logo-custom">
          <span className="logo-bold">ИДЁМ</span>
          <span className="logo-thin">В</span>
          <span className="logo-bold">КИНО</span>
        </div>
        
        <div>
          <Button 
            variant="primary" 
            onClick={() => navigate('/admin/login')}
            className="sign-in-button"
          >
            <i className="sign-in-button text"></i>
            ВОЙТИ
          </Button>
        </div>
      </header>

<nav className="date-picker mb-4">
  <div className="days-container">
    {getWeekDates().map((date, index) => {
      const isActive = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      const isTodayDate = isToday(date);
      
      // Получаем двухбуквенное сокращение дня недели
      const dayAbbreviation = format(date, 'EEEEEE', { locale: ru });
      // Преобразуем первую букву в заглавную
      const dayOfWeek = dayAbbreviation.charAt(0).toUpperCase() + dayAbbreviation.slice(1);
      const dayOfMonth = format(date, 'd', { locale: ru });
      
      return (
        <button
          key={index}
          className={`day-button ${isActive ? 'active' : ''}`}
          onClick={() => handleDateSelect(date)}
        >
          <div className="day-name">
            {isTodayDate ? 'Сегодня' : dayOfWeek + ','}
          </div>
          <div>
            <small className="date-text">
              {isTodayDate ? dayOfWeek + ',' + dayOfMonth : dayOfMonth}
              
            </small>
          </div>
        </button>
      );
    })}
  </div>
</nav>

<main>
  {Object.keys(seancesByMovie).length === 0 ? (
    <Alert variant="info" className="no-sessions-alert">
      <i className="bi bi-info-circle me-2"></i>
      На {selectedDateStr} сеансов нет. Выберите другую дату.
    </Alert>
  ) : (
    <div className="movie-schedule-container">
      {Object.entries(seancesByMovie).map(([movieId, movieSeances]) => {
        const movie = getMovieById(Number(movieId));
        if (!movie) return null;

        // Сортируем сеансы по времени
        const sortedSeances = [...movieSeances].sort((a, b) => {
          const timeA = a.seance_time || formatTime(a.startTime);
          const timeB = b.seance_time || formatTime(b.startTime);
          return timeA.localeCompare(timeB);
        });

        // Группируем сеансы по залам
        const seancesByHall = {};
        sortedSeances.forEach(seance => {
          const hall = getHallById(seance.hallId || seance.seance_hallid);
          if (hall) {
            const hallName = hall.name || hall.hall_name;
            if (!seancesByHall[hallName]) {
              seancesByHall[hallName] = [];
            }
            seancesByHall[hallName].push(seance);
          }
        });

        const movieTitle = movie.title || movie.film_name || 'Фильм';
        const movieDescription = movie.description || movie.film_description || '';
        const movieDuration = movie.duration || movie.film_duration || 0;
        const movieGenre = movie.genre || '';
        const movieCountry = movie.country || '';

        return (
          <Card key={movieId} className="movie-card">
            <div className="movie-card-content">
              {/* Первая строка: изображение и информация о фильме */}
              <div className="movie-info-section">
                {/* Изображение */}
                <div className="movie-poster-container">
                  <img
                    src={getPosterUrl(movie)}
                    alt={movieTitle}
                    className="movie-poster"
                  />
                </div>
                
                {/* Информация о фильме */}
                <div className="movie-details">
                  <h5 className="movie-title">{movieTitle}</h5>
                  <div className="movie-meta">
                    <span>
                      <i className="bi bi-clock me-1"></i>
                      {formatDuration(movieDuration)}
                    </span>
                    {movieGenre && (
                      <>
                        <span className="meta-divider">•</span>
                        <span>
                          <i className="bi bi-film me-1"></i>
                          {movieGenre}
                        </span>
                      </>
                    )}
                    {movieCountry && (
                      <>
                        <span className="meta-divider">•</span>
                        <span>
                          <i className="bi bi-globe me-1"></i>
                          {movieCountry}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="movie-description">{movieDescription}</p>
                </div>
              </div>
              
              {/* Вторая строка: сеансы */}
              <div className="sessions-section">
                {Object.entries(seancesByHall).map(([hallName, hallSeances]) => (
                  <div key={hallName} className="hall-sessions">
                    <h6 className="hall-name">
                      <i className="bi bi-door-open me-1"></i>
                      {hallName}
                    </h6>
                    <div className="sessions-list">
                      {hallSeances.map(seance => {
                        const time = seance.seance_time || formatTime(seance.startTime);
                        
                        return (
                          <Button
                            key={seance.id}
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleTimeClick(seance.id)}
                            className="session-button"
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  )}
</main>
    </Container>
  );
};

export default MainPage;