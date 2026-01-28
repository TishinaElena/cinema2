import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  Button, 
  Spinner, 
  Alert 
} from 'react-bootstrap';
import { format, addDays, isToday, parseISO, isSameDay, isBefore } from 'date-fns';
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
  const [dateOffset, setDateOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dateContainerRef = useRef(null);
  
  const DAYS_TO_SHOW = 7;
  const STEP = 1;

  // Загрузка данных из API
  useEffect(() => {
    loadData();
    
    // Обновляем текущее время каждую минуту
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 секунд
    
    return () => clearInterval(timeInterval);
  }, []);

  // Фильтрация сеансов при изменении даты
  useEffect(() => {
    if (seances.length > 0) {
      filterSeancesByDate();
    }
  }, [selectedDate, seances]);

  useEffect(() => {
    // Принудительно обновляем компонент при изменении времени
  }, [currentTime]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await cinemaAPI.getAllData();
      const apiMovies = data.films || [];
      const apiHalls = data.halls || [];
      const apiSeances = data.seances || [];
      
// В MainPage.js убедитесь, что сеансы имеют правильное время
const processedSeances = apiSeances.map(seance => {
  const seanceTime = seance.seance_time || '12:00';
  
  return {
    ...seance,
    id: seance.id || seance.seance_id,
    movieId: seance.filmId || seance.seance_filmid,
    hallId: seance.hallId || seance.seance_hallid,
    seance_time: seanceTime, // Только время, например "16:30"
    date: null
  };
});
      
      // Сортируем по времени
      processedSeances.sort((a, b) => {
        const timeA = a.seance_time;
        const timeB = b.seance_time;
        return timeA.localeCompare(timeB);
      });
      
      setMovies(apiMovies);
      setHalls(apiHalls);
      setSeances(processedSeances);
      filterSeancesByDate(processedSeances);
      
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const filterSeancesByDate = (seancesList = seances) => {
    // Показываем все сеансы, но фильтруем только по открытым залам
    const filtered = seancesList.filter(seance => {
      const hall = getHallById(seance.hallId || seance.seance_hallid);
      return hall && hall.hall_open === 1;
    });
    
    setFilteredSeances(filtered);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeClick = (seanceId, isDisabled) => {
    if (isDisabled) return;
    
    // Передаем выбранную дату в параметрах
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/hall/${seanceId}?date=${selectedDateStr}`);
  };

  // Проверяем, прошло ли время начала сеанса (только для сегодняшнего дня)
const isSeanceTimePassed = (seance) => {
  // Если выбран не сегодняшний день, сеансы всегда доступны
  if (!isToday(selectedDate)) {
    return false;
  }
  
  try {
    // Получаем время сеанса из строки формата "HH:mm"
    const timeParts = seance.seance_time.split(':');
    const seanceHours = parseInt(timeParts[0]);
    const seanceMinutes = parseInt(timeParts[1]);
    
    // Создаем объект Date с сегодняшней датой и временем сеанса
    const seanceDateTime = new Date();
    seanceDateTime.setHours(seanceHours, seanceMinutes, 0, 0);
    
    // Сравниваем с текущим временем
    return seanceDateTime < currentTime;
  } catch (error) {
    console.error('Ошибка проверки времени сеанса:', error);
    return false;
  }
};

  // Получить массив дат для отображения
  const getDatesToShow = () => {
    const dates = [];
    const today = new Date();
    const startDate = addDays(today, dateOffset);
    
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  // Сдвинуть даты вперед (вправо)
  const handleNextDates = () => {
    setDateOffset(prev => prev + STEP);
  };

  // Сдвинуть даты назад (влево)
  const handlePrevDates = () => {
    const newOffset = dateOffset - STEP;
    // Не позволяем сдвигать дальше сегодняшнего дня
    if (addDays(new Date(), newOffset) >= new Date()) {
      setDateOffset(newOffset);
    } else {
      // Если пытаемся сдвинуть раньше сегодня, устанавливаем на сегодня
      setDateOffset(0);
    }
  };

  const formatTime = (timeValue) => {
    try {
      if (typeof timeValue === 'string' && timeValue.includes(':')) return timeValue;
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

  const getSeancesByMovie = () => {
    const grouped = {};
    filteredSeances.forEach(seance => {
      const movieId = seance.movieId || seance.seance_filmid;
      if (!grouped[movieId]) grouped[movieId] = [];
      grouped[movieId].push(seance);
    });
    return grouped;
  };

  const getMovieById = (movieId) => movies.find(movie => movie.id === movieId);
  const getHallById = (hallId) => halls.find(hall => hall.id === hallId);

  const getPosterUrl = (movie) => {
    if (movie.posterUrl) return movie.posterUrl;
    if (movie.film_poster) return movie.film_poster;
    return `https://via.placeholder.com/300x450?text=${encodeURIComponent(movie.title || movie.film_name || 'Фильм')}`;
  };

  if (loading) {
    return (
      <Container className="main-page__loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="main-page__loading-text">Загружаем расписание...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="main-page__error">
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
  const datesToShow = getDatesToShow();
  const showPrevButton = dateOffset > 0;

  return (
    <Container className="main-page">
      <header className="user-page__header">
        <Link to="/" className="user-page__logo" style={{ textDecoration: 'none' }}>
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
        </Link>
        
        <button
          onClick={() => navigate('/admin/login')}
          className="button sign-in-button"
        >
          ВОЙТИ
        </button>
      </header>

      <nav className="main-page__date-picker">
        <div className="date-picker__container" ref={dateContainerRef}>
          {/* Кнопка навигации назад (влево) - появляется после первого сдвига */}
          {showPrevButton && (
            <button
              className="date-picker__nav-btn date-picker__nav-btn--prev"
              onClick={handlePrevDates}
              aria-label="Предыдущие даты"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          
          <div className="date-picker__days">
            {datesToShow.map((date, index) => {
              const isActive = isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
                     
              const dayAbbreviation = format(date, 'EEEEEE', { locale: ru });
              const dayName = dayAbbreviation.charAt(0).toUpperCase() + dayAbbreviation.slice(1);
              const dayOfMonth = format(date, 'd', { locale: ru });
              
              return (
                <button
                  key={index}
                  className={`date-picker__day-btn ${isActive ? 'date-picker__day-btn--active' : ''} ${isTodayDate ? 'date-picker__day-btn--today' : ''}`}
                  onClick={() => handleDateSelect(date)}
                >
                  <div className="date-picker__day-name">
                    {isTodayDate ? 'Сегодня' : dayName}
                  </div>
                  <div className="date-picker__date">
                    {dayOfMonth}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Кнопка навигации вперед (вправо) - всегда видна */}
          <button
            className="date-picker__nav-btn date-picker__nav-btn--next"
            onClick={handleNextDates}
            aria-label="Следующие даты"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </nav>

      <main className="main-page__content">
        {filteredSeances.length === 0 ? (
          <Alert variant="info" className="content_card main-page__no-sessions">
            Сеансов нет.
          </Alert>
        ) : (
          <div className="movie-schedule">
            {movies.map(movie => {
              const movieId = movie.id;
              const movieSeances = filteredSeances.filter(seance => 
                seance.movieId === movieId || seance.seance_filmid === movieId
              );

              if (movieSeances.length === 0) return null;

              const sortedSeances = [...movieSeances].sort((a, b) => {
                const timeA = a.seance_time || formatTime(a.startTime);
                const timeB = b.seance_time || formatTime(b.startTime);
                return timeA.localeCompare(timeB);
              });

              const seancesByHall = {};
              sortedSeances.forEach(seance => {
                const hall = getHallById(seance.hallId || seance.seance_hallid);
                if (hall) {
                  const hallName = hall.name || hall.hall_name;
                  if (!seancesByHall[hallName]) seancesByHall[hallName] = [];
                  seancesByHall[hallName].push(seance);
                }
              });

              const movieTitle = movie.title || movie.film_name || 'Фильм';
              const movieDescription = movie.description || movie.film_description || '';
              const movieDuration = movie.duration || movie.film_duration || 0;
              const movieGenre = movie.genre || '';
              const movieCountry = movie.country || '';

              return (
                <div key={movieId} className="content_card movie-card">
                  <div className="movie-card__content">
                    <div className="movie-card__info">
                      <div className="movie-card__poster">
                        <img
                          src={getPosterUrl(movie)}
                          alt={movieTitle}
                          className="movie-card__poster-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://via.placeholder.com/300x450?text=${encodeURIComponent(movieTitle)}`;
                          }}
                        />
                      </div>
                      
                      <div className="movie-card__details">
                        <h5 className="card__title">{movieTitle}</h5>
                        
                        <p className="movie-card__description">{movieDescription}</p>
                        <div className="movie-card__meta">
                          <span className="movie-card__duration">
                            <i className="bi bi-clock me-1"></i>
                            {formatDuration(movieDuration)}
                          </span>
                          {movieGenre && (
                            <>
                              <span className="movie-card__meta-divider">•</span>
                              <span className="movie-card__genre">
                                <i className="bi bi-film me-1"></i>
                                {movieGenre}
                              </span>
                            </>
                          )}
                          {movieCountry && (
                            <>
                              <span className="movie-card__country">
                                <i className="bi bi-globe me-1"></i>
                                {movieCountry}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="movie-card__sessions">
                      {Object.entries(seancesByHall).map(([hallName, hallSeances]) => (
                        <div key={hallName} className="movie-sessions__hall">
                          <h6 className="movie-sessions__hall-name">
                            <i className="bi bi-door-open me-1"></i>
                            {hallName}
                          </h6>
                          <div className="movie-sessions__list">
                            {hallSeances.map(seance => {
                              const time = seance.seance_time || formatTime(seance.startTime);
                              const isDisabled = isSeanceTimePassed(seance);
                              
                              return (
                                <button
                                  key={seance.id}
                                  className={`movie-sessions__time-btn ${isDisabled ? 'movie-sessions__time-btn--disabled' : ''}`}
                                  onClick={() => handleTimeClick(seance.id, isDisabled)}
                                  disabled={isDisabled}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </Container>
  );
};

export default MainPage;