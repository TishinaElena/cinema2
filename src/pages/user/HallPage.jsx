import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
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

  // ВАЖНО: Загружаем актуальную конфигурацию зала из /hallconfig
  const loadActualHallConfig = async (seanceId) => {
    try {
      // 1. Получаем АКТУАЛЬНУЮ конфигурацию зала для этого сеанса
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const config = await cinemaAPI.getHallConfig(seanceId, date);
      
      if (!Array.isArray(config)) {
        throw new Error('Некорректный формат конфигурации зала');
      }
      
      setHallConfig(config);
      
      // 2. Подсчитываем статистику по местам
      let takenCount = 0;
      let totalSeats = 0;
      
      config.forEach(row => {
        row.forEach(seat => {
          totalSeats++;
          if (seat === 'taken') takenCount++;
        });
      });
      
      setConfigInfo({ taken: takenCount, total: totalSeats });
      
      // 3. Логируем для отладки
      console.log('Актуальная конфигурация зала загружена:');
      console.log('- Занято мест:', takenCount);
      console.log('- Всего мест:', totalSeats);
      console.log('- Конфигурация:', config);
      
      // 4. Проверяем, отличается ли актуальная конфигурация от базовой
      if (hall && hall.hall_config) {
        const baseConfig = hall.hall_config;
        console.log('Сравнение конфигураций:');
        console.log('Базовая (из alldata):', baseConfig);
        console.log('Актуальная (из hallconfig):', config);
      }
      
    } catch (err) {
      console.error('Ошибка загрузки актуальной конфигурации зала:', err);
      setApiError('Не удалось загрузить актуальную схему зала');
      
      // Fallback: используем базовую конфигурацию из alldata
      if (hall && hall.hall_config) {
        setHallConfig(hall.hall_config);
        console.warn('Используется базовая конфигурация из alldata');
      } else {
        setHallConfig([]);
      }
      
    } finally {
      setLocalLoading(false);
    }
  };

  // Функция получения типа места из АКТУАЛЬНОЙ конфигурации
  const getSeatType = (rowIndex, seatIndex) => {
    // Используем актуальную конфигурацию из hallconfig
    if (hallConfig.length > 0 && 
        hallConfig[rowIndex] && 
        hallConfig[rowIndex][seatIndex]) {
      return hallConfig[rowIndex][seatIndex];
    }
    
    // Fallback: используем базовую конфигурацию
    if (hall && hall.hall_config && Array.isArray(hall.hall_config)) {
      const config = hall.hall_config;
      if (config[rowIndex] && config[rowIndex][seatIndex]) {
        return config[rowIndex][seatIndex];
      }
    }
    
    return 'standart';
  };

  // Функция проверки доступности места
  const isSeatAvailable = (rowIndex, seatIndex) => {
    const seatType = getSeatType(rowIndex, seatIndex);
    
    // Место недоступно если:
    // 1. Тип 'disabled' - заблокированное место
    // 2. Тип 'taken' - уже купленное место
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
    
    // Получаем данные о зале
    const hallRows = hall?.rows || 10;
    const hallCols = hall?.cols || 15;
    const vipRows = hall?.vipRows || [];
    const standardPrice = seance?.priceStandard || 400;
    const vipPrice = seance?.priceVip || 600;
    
    // Преобразуем selectedSeats в числовые ID (для совместимости с PaymentPage)
    const numericSelectedSeats = selectedSeats.map(seatKey => {
      const [row, seat] = seatKey.split('-').map(Number);
      return (row - 1) * hallCols + seat;
    });
    
    // Рассчитываем стоимость
    const totalPrice = selectedSeats.reduce((total, seatKey) => {
      const [row] = seatKey.split('-').map(Number);
      const rowIndex = row - 1;
      const seatIndex = seatKey.split('-')[1] - 1;
      const seatType = getSeatType(rowIndex, seatIndex);
      const isVip = seatType === 'vip' || (Array.isArray(vipRows) && vipRows.includes(row));
      return total + (isVip ? vipPrice : standardPrice);
    }, 0);
    
    // Переходим на оплату
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

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    try {
      const date = new Date(time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
  };

  const getMovieTitle = (movie) => {
    return movie?.title || movie?.film_name || 'Фильм';
  };

  const getMovieDescription = (movie) => {
    return movie?.description || movie?.film_description || '';
  };

  const getMovieDuration = (movie) => {
    return movie?.duration || movie?.film_duration || 0;
  };

  const getMovieAgeRating = (movie) => {
    return movie?.ageRating || '0+';
  };

  const getMovieGenre = (movie) => {
    return movie?.genre || '';
  };

  const getMovieCountry = (movie) => {
    return movie?.country || movie?.film_origin || '';
  };

  const getMoviePoster = (movie) => {
    return movie?.posterUrl || movie?.film_poster || 'https://via.placeholder.com/300x450?text=No+Poster';
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

  // Функция обновления схемы зала
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

  // Функция для отображения информации о конфигурации
  const renderConfigInfo = () => {
    if (hallConfig.length === 0 || configInfo.total === 0) return null;
    
    const freeSeats = configInfo.total - configInfo.taken;
    const percentage = Math.round((configInfo.taken / configInfo.total) * 100);
    
    return (
      <Alert variant="info" className="mt-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-info-circle me-2"></i>
            <strong>Статус зала:</strong> {configInfo.taken} занято / {freeSeats} свободно ({percentage}%)
          </div>
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={() => {
              console.log('Актуальная конфигурация зала:', hallConfig);
              console.log('Базовая конфигурация:', hall?.hall_config);
              alert(`Статистика зала:
- Занято мест: ${configInfo.taken}
- Свободно мест: ${freeSeats}
- Всего мест: ${configInfo.total}
- Заполненность: ${percentage}%

Подробности в консоли разработчика.`);
            }}
          >
            <i className="bi bi-graph-up me-1"></i> Статистика
          </Button>
        </div>
        <div className="progress mt-2" style={{ height: '10px' }}>
          <div 
            className="progress-bar bg-danger" 
            role="progressbar" 
            style={{ width: `${percentage}%` }}
            aria-valuenow={percentage} 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
          </div>
        </div>
      </Alert>
    );
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
          <p className="mb-0">Проверьте подключение к интернету и попробуйте снова.</p>
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
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <i className="bi bi-ticket-perforated me-2"></i>
            Выбор мест
          </h4>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={refreshHall}
              disabled={localLoading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Обновить схему
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Назад к расписанию
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4 align-items-center">
            <Col md={3} className="mb-3 mb-md-0">
              <div className="position-relative">
                <img 
                  src={getMoviePoster(movie)} 
                  alt={getMovieTitle(movie)} 
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '300px', objectFit: 'cover', width: '100%' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                  }}
                />
                <Badge 
                  bg={getMovieAgeRating(movie) === '18+' ? 'danger' : 'warning'}
                  className="position-absolute top-0 start-0 m-2"
                >
                  {getMovieAgeRating(movie)}
                </Badge>
              </div>
            </Col>
            <Col md={9}>
              <h3>{getMovieTitle(movie)}</h3>
              <p className="text-muted">{getMovieDescription(movie)}</p>
              
              <div className="d-flex flex-wrap gap-4 mb-3">
                <div>
                  <i className="bi bi-clock text-primary me-2"></i>
                  <strong>Продолжительность:</strong> {formatDuration(getMovieDuration(movie))}
                </div>
                <div>
                  <i className="bi bi-film text-primary me-2"></i>
                  <strong>Жанр:</strong> {getMovieGenre(movie)}
                </div>
                <div>
                  <i className="bi bi-globe text-primary me-2"></i>
                  <strong>Страна:</strong> {getMovieCountry(movie)}
                </div>
              </div>
              
              <div className="bg-light p-3 rounded">
                <Row>
                  <Col md={4}>
                    <div className="mb-2">
                      <i className="bi bi-clock-history text-primary me-2"></i>
                      <strong>Время сеанса:</strong>
                      <div className="fs-5 fw-bold text-primary">
                        {formatTime(seance.startTime || seance.seance_time)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-2">
                      <i className="bi bi-door-open text-primary me-2"></i>
                      <strong>Зал:</strong>
                      <div className="fs-5 fw-bold">
                        {getHallName(hall)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-2">
                      <i className="bi bi-currency-dollar text-primary me-2"></i>
                      <strong>Цены:</strong>
                      <div>
                        <span className="text-success fw-bold">{standardPrice}₽</span> (стандарт)
                        <span className="mx-2">•</span>
                        <span className="text-warning fw-bold">{vipPrice}₽</span> (VIP)
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {renderConfigInfo()}

          <div className="text-center mb-4">
            <div className="screen mb-4 p-3 bg-gradient bg-dark text-white rounded shadow">
              <i className="bi bi-display me-2"></i>
              ЭКРАН
            </div>
            
            <div className="hall-layout mb-4">
              {Array.from({ length: hallRows }, (_, rowIndex) => {
                const rowNumber = rowIndex + 1;
                const isVipRow = vipRows.includes(rowNumber);
                
                return (
                  <div key={rowIndex} className="d-flex justify-content-center mb-3">
                    <div className="me-3 d-flex align-items-center" style={{ width: '60px' }}>
                      <div className={`p-2 rounded ${isVipRow ? 'bg-warning text-dark' : 'bg-secondary text-white'}`}>
                        <small className="fw-bold">Ряд {rowNumber}</small>
                        {isVipRow && <small className="d-block">VIP</small>}
                      </div>
                    </div>
                    <div className="d-flex flex-wrap justify-content-center" style={{ maxWidth: '800px' }}>
                      {Array.from({ length: hallCols }, (_, colIndex) => {
                        const seatNumber = colIndex + 1;
                        const seatKey = `${rowNumber}-${seatNumber}`;
                        const isSelected = selectedSeats.includes(seatKey);
                        
                        const seatType = getSeatType(rowIndex, colIndex);
                        const isAvailable = isSeatAvailable(rowIndex, colIndex);
                        
                        let variant = 'outline-secondary';
                        let disabled = false;
                        
                        if (!isAvailable) {
                          variant = 'secondary';
                          disabled = true;
                        } else if (isSelected) {
                          variant = 'primary';
                        } else if (seatType === 'vip' || isVipRow) {
                          variant = 'warning';
                        }
                        
                        return (
                          <Button
                            key={colIndex}
                            variant={variant}
                            disabled={disabled}
                            className="mx-1 mb-1 seat-button d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '40px', 
                              height: '40px',
                              fontSize: '12px',
                              opacity: disabled ? 0.5 : 1,
                              cursor: disabled ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleSeatClick(rowIndex, colIndex, rowNumber, seatNumber)}
                            title={`Ряд ${rowNumber}, Место ${seatNumber} - ${
                              !isAvailable 
                                ? (seatType === 'taken' ? 'Занято' : 'Заблокировано')
                                : (seatType === 'vip' || isVipRow ? 'VIP' : 'Стандарт')
                            }`}
                          >
                            {seatNumber}
                            {!isAvailable && (
                              <div className="position-absolute" style={{ fontSize: '18px', marginTop: '-8px' }}>
                                ✕
                              </div>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="d-flex flex-wrap justify-content-center gap-4 mb-4">
              <div className="d-flex align-items-center">
                <Button variant="outline-secondary" size="sm" className="me-2" style={{ width: '30px', height: '30px' }}></Button>
                <small>Свободно (стандарт)</small>
              </div>
              <div className="d-flex align-items-center">
                <Button variant="warning" size="sm" className="me-2" style={{ width: '30px', height: '30px' }}></Button>
                <small>Свободно (VIP)</small>
              </div>
              <div className="d-flex align-items-center">
                <Button variant="primary" size="sm" className="me-2" style={{ width: '30px', height: '30px' }}></Button>
                <small>Выбрано</small>
              </div>
              <div className="d-flex align-items-center">
                <Button variant="secondary" size="sm" className="me-2" style={{ width: '30px', height: '30px', opacity: 0.5 }}>
                  <div style={{ fontSize: '14px', marginTop: '-4px' }}>✕</div>
                </Button>
                <small>Недоступно</small>
              </div>
            </div>
          </div>

          <Card className="mt-4 shadow">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h5 className="mb-3">
                    <i className="bi bi-cart-check me-2"></i>
                    Ваш заказ
                  </h5>
                  
                  {selectedSeats.length > 0 ? (
                    <div>
                      <div className="mb-2">
                        <strong>Выбранные места:</strong>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {selectedSeats.map(seatKey => {
                            const [row, seat] = seatKey.split('-').map(Number);
                            const rowIndex = row - 1;
                            const seatIndex = seat - 1;
                            const seatType = getSeatType(rowIndex, seatIndex);
                            const isVip = seatType === 'vip' || vipRows.includes(row);
                            const price = isVip ? vipPrice : standardPrice;
                            
                            return (
                              <Badge 
                                key={seatKey} 
                                bg={isVip ? 'warning' : 'info'} 
                                className="p-2"
                              >
                                Ряд {row}, Место {seat} - {price}₽
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <strong>Итого мест:</strong> {selectedSeats.length}
                      </div>
                      
                      <div>
                        <strong>Общая сумма:</strong>
                        <div className="fs-4 fw-bold text-success">
                          {selectedSeats.reduce((total, seatKey) => {
                            const [row] = seatKey.split('-').map(Number);
                            const rowIndex = row - 1;
                            const seatIndex = seatKey.split('-')[1] - 1;
                            const seatType = getSeatType(rowIndex, seatIndex);
                            const isVip = seatType === 'vip' || vipRows.includes(row);
                            return total + (isVip ? vipPrice : standardPrice);
                          }, 0)}₽
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">
                      <i className="bi bi-info-circle me-2"></i>
                      Выберите места в зале
                    </div>
                  )}
                </Col>
                
                <Col md={4} className="text-end">
                  <Button 
                    variant="success" 
                    size="lg"
                    className="px-5 py-3"
                    disabled={selectedSeats.length === 0}
                    onClick={handleBooking}
                  >
                    <i className="bi bi-check-circle me-2"></i>
                    Перейти к оплате
                    <div className="small">
                      {selectedSeats.length} мест
                    </div>
                  </Button>
                  
                  <div className="mt-3">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => setSelectedSeats([])}
                      disabled={selectedSeats.length === 0}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Очистить выбор
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default HallPage;