import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { cinemaAPI } from '../../services/api';

const HallPage = () => {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const { seances, halls, films, loading: contextLoading, error } = useData();
  
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seance, setSeance] = useState(null);
  const [movie, setMovie] = useState(null);
  const [hall, setHall] = useState(null);
  const [hallConfig, setHallConfig] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [configInfo, setConfigInfo] = useState({ taken: 0, total: 0 });

  useEffect(() => {
    if (!contextLoading && seances.length > 0) {
      const foundSeance = seances.find(s => s.id === parseInt(seanceId));
      
      if (foundSeance) {
        setSeance(foundSeance);
        
        const movieId = foundSeance.movieId || foundSeance.seance_filmid;
        const foundMovie = films.find(f => f.id === movieId);
        setMovie(foundMovie);
        
        const hallId = foundSeance.hallId || foundSeance.seance_hallid;
        const foundHall = halls.find(h => h.id === hallId);
        setHall(foundHall);
        
        loadActualHallConfig(foundSeance.id);
      } else {
        setLocalLoading(false);
      }
    }
  }, [contextLoading, seances, halls, films, seanceId]);

  const loadActualHallConfig = async (seanceId) => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const config = await cinemaAPI.getHallConfig(seanceId, date);
      
      if (!Array.isArray(config)) {
        throw new Error('Некорректный формат конфигурации зала');
      }
      
      setHallConfig(config);
      
      let takenCount = 0;
      let totalSeats = 0;
      
      config.forEach(row => {
        row.forEach(seat => {
          totalSeats++;
          if (seat === 'taken') takenCount++;
        });
      });
      
      setConfigInfo({ taken: takenCount, total: totalSeats });
      
    } catch (err) {
      console.error('Ошибка загрузки актуальной конфигурации зала:', err);
      setApiError('Не удалось загрузить актуальную схему зала');
      
      if (hall && hall.hall_config) {
        setHallConfig(hall.hall_config);
      } else {
        setHallConfig([]);
      }
      
    } finally {
      setLocalLoading(false);
    }
  };

  const getSeatType = (rowIndex, seatIndex) => {
    if (hallConfig.length > 0 && 
        hallConfig[rowIndex] && 
        hallConfig[rowIndex][seatIndex]) {
      return hallConfig[rowIndex][seatIndex];
    }
    
    if (hall && hall.hall_config && Array.isArray(hall.hall_config)) {
      const config = hall.hall_config;
      if (config[rowIndex] && config[rowIndex][seatIndex]) {
        return config[rowIndex][seatIndex];
      }
    }
    
    return 'standart';
  };

  const isSeatAvailable = (rowIndex, seatIndex) => {
    const seatType = getSeatType(rowIndex, seatIndex);
    
    if (seatType === 'disabled' || seatType === 'taken') {
      return false;
    }
    
    return true;
  };

  const handleSeatClick = (rowIndex, seatIndex, rowNumber, seatNumber) => {
    if (!isSeatAvailable(rowIndex, seatIndex)) {
      alert(`Место Ряд ${rowNumber}, Место ${seatNumber} уже занято или заблокировано!`);
      return;
    }
    
    const seatKey = `${rowNumber}-${seatNumber}`;
    setSelectedSeats(prev => {
      if (prev.includes(seatKey)) {
        return prev.filter(id => id !== seatKey);
      } else {
        return [...prev, seatKey];
      }
    });
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Выберите хотя бы одно место');
      return;
    }
    
    if (!movie || !hall || !seance) {
      alert('Ошибка данных сеанса');
      return;
    }
    
    const hallRows = hall?.rows || 10;
    const hallCols = hall?.cols || 15;
    const vipRows = hall?.vipRows || [];
    const standardPrice = seance?.priceStandard || 400;
    const vipPrice = seance?.priceVip || 600;
    
    const numericSelectedSeats = selectedSeats.map(seatKey => {
      const [row, seat] = seatKey.split('-').map(Number);
      return (row - 1) * hallCols + seat;
    });
    
    const totalPrice = selectedSeats.reduce((total, seatKey) => {
      const [row] = seatKey.split('-').map(Number);
      const rowIndex = row - 1;
      const seatIndex = seatKey.split('-')[1] - 1;
      const seatType = getSeatType(rowIndex, seatIndex);
      const isVip = seatType === 'vip' || (Array.isArray(vipRows) && vipRows.includes(row));
      return total + (isVip ? vipPrice : standardPrice);
    }, 0);
    
    navigate('/payment', {
      state: {
        movie,
        hall: {
          ...hall,
          name: hall.name || hall.hall_name,
          rows: hallRows,
          cols: hallCols,
          vipRows: vipRows,
          standardPrice: standardPrice,
          vipPrice: vipPrice
        },
        seance,
        selectedSeats: numericSelectedSeats,
        totalPrice,
        hallRows,
        hallCols,
        vipRows: Array.isArray(vipRows) ? vipRows : [],
        standardPrice,
        vipPrice
      }
    });
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';
    
    try {
      const date = new Date(timeValue);
      
      if (isNaN(date.getTime())) {
        if (typeof timeValue === 'string') {
          const timeMatch = timeValue.match(/(\d{1,2}:\d{2})/);
          return timeMatch ? timeMatch[0] : timeValue;
        }
        return String(timeValue);
      }
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
      
    } catch (error) {
      console.error('Error formatting time:', error, timeValue);
      return typeof timeValue === 'string' ? timeValue : String(timeValue);
    }
  };

  const getMovieTitle = (movie) => {
    return movie?.title || movie?.film_name || 'Фильм';
  };

  const getHallName = (hall) => {
    return hall?.name || hall?.hall_name || 'Зал';
  };

  const getHallRows = (hall) => {
    return hall?.rows || hall?.hall_rows || 10;
  };

  const getHallCols = (hall) => {
    return hall?.cols || hall?.hall_places || 15;
  };

  const getHallVipRows = (hall) => {
    return hall?.vipRows || [];
  };

  const getSeanceStandardPrice = (seance) => {
    return seance?.priceStandard || hall?.hall_price_standart || 400;
  };

  const getSeanceVipPrice = (seance) => {
    return seance?.priceVip || hall?.hall_price_vip || 600;
  };

  const refreshHall = async () => {
    if (!seance) return;
    
    try {
      setLocalLoading(true);
      setApiError(null);
      await loadActualHallConfig(seance.id);
    } catch (err) {
      console.error('Ошибка обновления зала:', err);
      setApiError('Не удалось обновить схему зала');
    } finally {
      setLocalLoading(false);
    }
  };

  if (contextLoading || localLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем информацию о сеансе...</p>
      </Container>
    );
  }

  if (error || apiError) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error || apiError}</p>
        </Alert>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => navigate('/')}>
            <i className="bi bi-house me-1"></i> На главную
          </Button>
          <Button variant="outline-primary" onClick={refreshHall}>
            <i className="bi bi-arrow-clockwise me-1"></i> Попробовать снова
          </Button>
        </div>
      </Container>
    );
  }

  if (!seance || !movie || !hall) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Сеанс не найден</Alert.Heading>
          <p>Сеанс #{seanceId} не найден или был удалён.</p>
        </Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          <i className="bi bi-house me-1"></i> Вернуться на главную
        </Button>
      </Container>
    );
  }

  const hallRows = getHallRows(hall);
  const hallCols = getHallCols(hall);
  const vipRows = getHallVipRows(hall);
  const standardPrice = getSeanceStandardPrice(seance);
  const vipPrice = getSeanceVipPrice(seance);

  return (
    <Container className="hall-page">
      <header className="user-page__header">
        <div className="user-page__logo">
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
        </div>
      </header>

      <main className="content_card">
      
          
          <div className="hall-page__movie-info">
            <h3 className="card__title">{getMovieTitle(movie)}</h3>
            
            <div className="movie-card__meta">
              <span>Начало сеанса: </span>
              <span>{formatTime(seance.startTime || seance.seance_time)}</span>
            </div>
            
            <div className="card__title">
              <span className="">{getHallName(hall)}</span>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="hall-page__container bg-dark p-3">
              <div className="hall-page__screen mb-4 p-3 bg-gradient bg-dark text-white rounded shadow">
                <i className="bi bi-display me-2"></i>
                ЭКРАН
              </div>
              
              <div className="hall-page__layout">
                {Array.from({ length: hallRows }, (_, rowIndex) => {
                  const rowNumber = rowIndex + 1;
                  const isVipRow = vipRows.includes(rowNumber);
                  
                  return (
                    <div key={rowIndex} className="hall-page__row d-flex justify-content-center mb-1">
                      <div className="d-flex flex-wrap justify-content-center hall-page__seats-container">
                        {Array.from({ length: hallCols }, (_, colIndex) => {
                          const seatNumber = colIndex + 1;
                          const seatKey = `${rowNumber}-${seatNumber}`;
                          const isSelected = selectedSeats.includes(seatKey);
                          
                          const seatType = getSeatType(rowIndex, colIndex);
                          const isAvailable = isSeatAvailable(rowIndex, colIndex);
                          
                          let seatClass = 'hall-page__seat hall-page__seat--standard';
                          if (!isAvailable) {
                            seatClass = 'hall-page__seat hall-page__seat--occupied';
                          } else if (isSelected) {
                            seatClass = 'hall-page__seat hall-page__seat--selected';
                          } else if (seatType === 'vip' || isVipRow) {
                            seatClass = 'hall-page__seat hall-page__seat--vip';
                          }
                          
                          return (
                            <button
                              key={colIndex}
                              className={`${seatClass} mx-1 mb-1 d-flex align-items-center justify-content-center`}
                              disabled={!isAvailable}
                              onClick={() => handleSeatClick(rowIndex, colIndex, rowNumber, seatNumber)}
                              title={`Ряд ${rowNumber}, Место ${seatNumber} - ${
                                !isAvailable 
                                  ? (seatType === 'taken' ? 'Занято' : 'Заблокировано')
                                  : (seatType === 'vip' || isVipRow ? `VIP (${vipPrice} ₽)` : `Стандарт (${standardPrice} ₽)`)
                              }`}
                            >

                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hall-page__legend">
                <div className="d-flex flex-column align-items-center">
                  <div className="hall-page__legend-container">
                    <div className="hall-page__legend-row d-flex mb-3">
                      <div className="hall-page__legend-item d-flex align-items-center">
                        <span className="hall-page__legend-icon hall-page__legend-icon--standard me-2"></span>
                        <small className="text-nowrap text-white">
                          Свободно ({standardPrice} руб)
                        </small>
                      </div>
                      
                      <div className="hall-page__legend-item d-flex align-items-center justify-content-start">
                        <span className="hall-page__legend-icon hall-page__legend-icon--occupied me-2">                             </span>
                        <small className="text-nowrap text-white">Занято</small>
                      </div>
                    </div>
                    
                    <div className="hall-page__legend-row d-flex">
                      <div className="hall-page__legend-item d-flex align-items-center">
                        <span className="hall-page__legend-icon hall-page__legend-icon--vip me-2"></span>
                        <small className="text-nowrap text-white">
                          Свободно VIP ({vipPrice} руб)
                        </small>
                      </div>
                      
                      <div className="hall-page__legend-item d-flex align-items-center justify-content-start">
                        <span className="hall-page__legend-icon hall-page__legend-icon--selected me-2"></span>
                        <small className="text-nowrap text-white">Выбрано</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div> 
          </div>

          <div className="text-center ">
            <Button 
              variant="success" 
              size="lg"
              className="button hall-page__booking-btn"
              disabled={selectedSeats.length === 0}
              onClick={handleBooking}
            >
              
              ЗАБРОНИРОВАТЬ
            </Button>
          </div>
          
  
      </main>
    </Container>
  );
};

export default HallPage;