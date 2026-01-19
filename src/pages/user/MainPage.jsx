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
      const data = await cinemaAPI.getAllData();
      const apiMovies = data.films || [];
      const apiHalls = data.halls || [];
      const apiSeances = data.seances || [];
      
      // Обрабатываем сеансы
      const processedSeances = apiSeances.map(seance => {
        let seanceDateTime = new Date();
        
        if (seance.seance_date) {
          seanceDateTime = parseISO(seance.seance_date);
        } else {
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
      
      processedSeances.sort((a, b) => a.startTime - b.startTime);
      
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
    const filtered = seancesList.filter(seance => {
      const hall = getHallById(seance.hallId || seance.seance_hallid);
      if (!hall || hall.hall_open !== 1) return false;
      
      if (seance.date) {
        return isSameDay(new Date(seance.date), selectedDate);
      }
      return false;
    });
    
    setFilteredSeances(filtered);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeClick = (seanceId) => {
    navigate(`/hall/${seanceId}`);
  };

  const formatTime = (timeValue) => {
    try {
      if (timeValue instanceof Date) return format(timeValue, 'HH:mm');
      if (typeof timeValue === 'number') return format(new Date(timeValue), 'HH:mm');
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

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
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

  return (
    <Container className="main-page">
      <header className="user-page__header">
        <div className="user-page__logo">
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
        </div>
        
        <button
          onClick={() => navigate('/admin/login')}
          className="button sign-in-button"
        >
          ВОЙТИ
        </button>
      </header>

      <nav className="main-page__date-picker">
        <div className="date-picker__days">
          {getWeekDates().map((date, index) => {
            const isActive = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isTodayDate = isToday(date);
            const dayOfWeek = date.getDay();
                     
            const dayAbbreviation = format(date, 'EEEEEE', { locale: ru });
            const dayName = dayAbbreviation.charAt(0).toUpperCase() + dayAbbreviation.slice(1);
            const dayOfMonth = format(date, 'd', { locale: ru });
            
            return (
              <button
                key={index}
                className={`date-picker__day-btn ${isActive ? 'date-picker__day-btn--active' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="date-picker__day-name">
                  {isTodayDate ? 'Сегодня' : dayName + ','}
                </div>
                <div className="date-picker__date">
                  <small className="date-picker__date-text">
                    {isTodayDate ? dayName + ',' + dayOfMonth : dayOfMonth}
                  </small>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="main-page__content">
        {Object.keys(seancesByMovie).length === 0 ? (
          
          <Alert variant="info" className="content_card main-page__no-sessions">
            На {selectedDateStr} сеансов нет. Выберите другую дату.
          </Alert>
        ) : (
          <div className="movie-schedule">
            {Object.entries(seancesByMovie).map(([movieId, movieSeances]) => {
              const movie = getMovieById(Number(movieId));
              if (!movie) return null;

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
                <Card key={movieId} className="content_card">
                  <div className="movie-card__content">
                    <div className="movie-card__info">
                      <div className="movie-card__poster">
                        <img
                          src={getPosterUrl(movie)}
                          alt={movieTitle}
                          className="movie-card__poster-img"
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
                              
                              return (
                                <button
                                  key={seance.id}
                                  className="movie-sessions__time-btn"
                                  onClick={() => handleTimeClick(seance.id)}
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