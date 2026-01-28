import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { useData } from '../../contexts/DataContext';
import { cinemaAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';

const HallPage = () => {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { seances, halls, films, loading: contextLoading, error } = useData();
  
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seance, setSeance] = useState(null);
  const [movie, setMovie] = useState(null);
  const [hall, setHall] = useState(null);
  const [actualHallConfig, setActualHallConfig] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [configInfo, setConfigInfo] = useState({ taken: 0, total: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 1. Получаем дату из URL параметров
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    
    console.log('HallPage: Date param from URL:', dateParam);
    
    if (dateParam) {
      try {
        const parsedDate = parseISO(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          console.log('HallPage: Setting date to:', parsedDate);
          setSelectedDate(parsedDate);
        }
      } catch (err) {
        console.error('Ошибка парсинга даты:', err);
      }
    } else {
      console.log('HallPage: No date param found, using current date');
    }
  }, [location.search]);

  

  // Основная функция загрузки конфигурации зала
  const loadActualHallConfig = useCallback(async (seanceId, date) => {
    try {
      setLocalLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      console.log('Loading hall config for date:', dateStr);
      
      // 1. Получаем конфигурацию зала из API для ВЫБРАННОЙ даты
      let apiConfig = await cinemaAPI.getHallConfig(seanceId, dateStr);
      
      console.log('API config received:', apiConfig);
      
      if (!Array.isArray(apiConfig) || apiConfig.length === 0) {
        // Если API не вернул конфигурацию, используем базовую из зала
        console.log('API returned empty config, using hall config');
        const currentHall = halls.find(h => 
          h.id === seance?.hallId || h.id === seance?.seance_hallid
        );
        apiConfig = currentHall && currentHall.hall_config ? 
          [...currentHall.hall_config] : [];
      }
      
      // Сохраняем актуальную конфигурацию
      setActualHallConfig(apiConfig);
      
      // 2. Получаем забронированные места из localStorage для этой даты
      const bookedSeatsKey = `booked_seats_${seanceId}_${dateStr}`;
      const bookedSeats = JSON.parse(localStorage.getItem(bookedSeatsKey) || '[]');
      
      // 3. Получаем все забронированные места для этого сеанса (все даты)
      const allBookedSeatsKey = 'all_booked_seats';
      const allBookedSeats = JSON.parse(localStorage.getItem(allBookedSeatsKey) || '[]');
      
      // 4. Фильтруем места для выбранной даты из общего списка
      const bookedSeatsForDate = allBookedSeats.filter(seat => 
        seat.date === dateStr && seat.seanceId === parseInt(seanceId)
      );
      
      // 5. Объединяем все забронированные места для этой даты
      const allTakenSeats = [...bookedSeats, ...bookedSeatsForDate];
      
      // 6. Создаем копию конфигурации с учетом забронированных мест
      const configWithBookings = [...apiConfig.map(row => [...row])];
      
      // 7. Помечаем забронированные места как 'taken'
      allTakenSeats.forEach(bookedSeat => {
        const rowIndex = bookedSeat.row - 1;
        const seatIndex = bookedSeat.seat - 1;
        
        // Проверяем, что индексы в пределах массива
        if (rowIndex >= 0 && rowIndex < configWithBookings.length && 
            seatIndex >= 0 && seatIndex < configWithBookings[rowIndex].length) {
          configWithBookings[rowIndex][seatIndex] = 'taken';
        }
      });
      
      // 8. Подсчитываем статистику
      let takenCount = 0;
      let totalSeats = 0;
      
      configWithBookings.forEach(row => {
        row.forEach(seat => {
          totalSeats++;
          if (seat === 'taken') takenCount++;
        });
      });
      
      setConfigInfo({ taken: takenCount, total: totalSeats });
      
      console.log('Hall config loaded for date', dateStr, {
        rows: apiConfig.length,
        cols: apiConfig.length > 0 ? apiConfig[0].length : 0,
        apiTakenSeats: apiConfig.flat().filter(s => s === 'taken').length,
        localBookedSeats: allTakenSeats.length,
        totalTaken: takenCount
      });
      
    } catch (err) {
      console.error('Ошибка загрузки актуальной конфигурации зала:', err);
      setApiError('Не удалось загрузить актуальную схему зала');
      setActualHallConfig([]);
      
    } finally {
      setLocalLoading(false);
      setIsInitialLoad(false);
    }
  }, [halls, seance]);

  // 2. Загружаем данные сеанса и начальную конфигурацию
  useEffect(() => {
    if (!contextLoading && seances.length > 0 && isInitialLoad) {
      console.log('Initial load of seance data');
      
      const foundSeance = seances.find(s => s.id === parseInt(seanceId));
      
      if (foundSeance) {
        console.log('Seance found:', foundSeance);
        setSeance(foundSeance);
        
        const movieId = foundSeance.movieId || foundSeance.seance_filmid;
        const foundMovie = films.find(f => f.id === movieId);
        setMovie(foundMovie);
        console.log('Movie found:', foundMovie);
        
        const hallId = foundSeance.hallId || foundSeance.seance_hallid;
        const foundHall = halls.find(h => h.id === hallId);
        setHall(foundHall);
        console.log('Hall found:', foundHall);
        
        // Загружаем начальную конфигурацию
        loadActualHallConfig(foundSeance.id, selectedDate);
      } else {
        console.log('Seance not found');
        setLocalLoading(false);
        setIsInitialLoad(false);
      }
    }
  }, [contextLoading, seances, halls, films, seanceId, isInitialLoad, loadActualHallConfig, selectedDate]);

  // 3. Обновляем конфигурацию при изменении даты (только если не начальная загрузка)
  useEffect(() => {
    if (seance && !isInitialLoad) {
      console.log('Date changed, reloading hall config for date:', format(selectedDate, 'yyyy-MM-dd'));
      loadActualHallConfig(seance.id, selectedDate);
    }
  }, [selectedDate, seance, isInitialLoad, loadActualHallConfig]);

  // 4. Обработчик события бронирования мест
  useEffect(() => {
    const handleSeatsBooked = (event) => {
      const { seanceId: bookedSeanceId, date } = event.detail;
      
      // Если событие относится к текущему сеансу и дате
      const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
      if (bookedSeanceId === parseInt(seanceId) && date === currentDateStr) {
        console.log('Seats booked event received, reloading hall config');
        if (seance) {
          loadActualHallConfig(seance.id, selectedDate);
        }
      }
    };

    window.addEventListener('seatsBooked', handleSeatsBooked);
    
    return () => {
      window.removeEventListener('seatsBooked', handleSeatsBooked);
    };
  }, [seanceId, selectedDate, seance, loadActualHallConfig]);

  // Проверка типа места
  const getSeatType = (rowIndex, seatIndex) => {
    if (actualHallConfig.length > 0 && 
        rowIndex >= 0 && rowIndex < actualHallConfig.length &&
        actualHallConfig[rowIndex] && 
        seatIndex >= 0 && seatIndex < actualHallConfig[rowIndex].length) {
      return actualHallConfig[rowIndex][seatIndex];
    }
    
    return 'standart';
  };

  // Проверка доступности места
  const isSeatAvailable = (rowIndex, seatIndex) => {
    // Проверяем, существует ли такое место в зале
    if (rowIndex < 0 || seatIndex < 0 || 
        rowIndex >= actualHallConfig.length || 
        !actualHallConfig[rowIndex] || 
        seatIndex >= actualHallConfig[rowIndex].length) {
      console.warn(`Seat at row ${rowIndex + 1}, seat ${seatIndex + 1} doesn't exist in hall`);
      return false;
    }
    
    const seatType = getSeatType(rowIndex, seatIndex);
    return seatType !== 'disabled' && seatType !== 'taken';
  };

  // Обработчик клика по месту
  const handleSeatClick = (rowIndex, seatIndex, rowNumber, seatNumber) => {
    // Проверка существования места
    if (rowIndex < 0 || seatIndex < 0 || 
        rowIndex >= actualHallConfig.length || 
        !actualHallConfig[rowIndex] || 
        seatIndex >= actualHallConfig[rowIndex].length) {
      alert(`Место Ряд ${rowNumber}, Место ${seatNumber} не существует в этом зале!`);
      return;
    }
    
    if (!isSeatAvailable(rowIndex, seatIndex)) {
      const seatType = getSeatType(rowIndex, seatIndex);
      const status = seatType === 'taken' ? 'занято' : 'заблокировано';
      alert(`Место Ряд ${rowNumber}, Место ${seatNumber} ${status}!`);
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

  // Обработчик бронирования
// Обработчик бронирования
const handleBooking = () => {
  if (selectedSeats.length === 0) {
    alert('Выберите хотя бы одно место');
    return;
  }
  
  if (!movie || !hall || !seance) {
    alert('Ошибка данных сеанса');
    return;
  }
  
  // Получаем актуальные размеры зала из конфигурации
  const actualRows = actualHallConfig.length;
  const actualCols = actualRows > 0 ? actualHallConfig[0].length : 0;
  
  if (actualRows === 0) {
    alert('Не удалось загрузить конфигурацию зала');
    return;
  }
  
  // Проверяем, что выбранные места существуют в зале
  const invalidSeats = [];
  const selectedSeatsDetails = [];
  
  selectedSeats.forEach(seatKey => {
    const [row, seat] = seatKey.split('-').map(Number);
    
    if (row > actualRows) {
      invalidSeats.push(`Ряд ${row} не существует (в зале ${actualRows} рядов)`);
      return;
    }
    
    if (seat > actualCols) {
      invalidSeats.push(`Место ${seat} не существует в ряду ${row} (в ряду всего ${actualCols} мест)`);
      return;
    }
    
    // Определяем тип места и цену
    const rowIndex = row - 1;
    const seatIndex = seat - 1;
    const seatType = getSeatType(rowIndex, seatIndex);
    const isVip = seatType === 'vip';
    
    // Определяем VIP ряды из конфигурации (если еще не определили)
    let vipRows = [];
    actualHallConfig.forEach((rowConfig, index) => {
      if (rowConfig.some(seat => seat === 'vip')) {
        vipRows.push(index + 1);
      }
    });
    
    // Если место находится в VIP ряду (даже если не помечено как vip в конфигурации)
    const isInVipRow = vipRows.includes(row);
    
    const standardPrice = seance?.priceStandard || hall?.hall_price_standart || 400;
    const vipPrice = seance?.priceVip || hall?.hall_price_vip || 600;
    const price = (isVip || isInVipRow) ? vipPrice : standardPrice;
    
    // Сохраняем детали места
    selectedSeatsDetails.push({
      row,
      seat,
      seatKey,
      isVip: isVip || isInVipRow,
      price,
      seatType
    });
  });
  
  if (invalidSeats.length > 0) {
    alert(`Ошибка выбора мест:\n${invalidSeats.join('\n')}`);
    return;
  }
  
  // Правильно преобразуем выбранные места в числовой формат для обратной совместимости
  const numericSelectedSeats = selectedSeatsDetails.map(seatDetail => {
    const { row, seat } = seatDetail;
    // Формула: (номер ряда - 1) * количество мест в ряду + номер места
    return (row - 1) * actualCols + seat;
  });
  
  // Определяем VIP ряды из конфигурации
  const vipRows = [];
  actualHallConfig.forEach((row, index) => {
    if (row.some(seat => seat === 'vip')) {
      vipRows.push(index + 1);
    }
  });
  
  const standardPrice = seance?.priceStandard || hall?.hall_price_standart || 400;
  const vipPrice = seance?.priceVip || hall?.hall_price_vip || 600;
  
  // Рассчитываем общую стоимость
  const totalPrice = selectedSeatsDetails.reduce((total, seat) => total + seat.price, 0);
  
  // Форматируем дату для передачи
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  console.log('HallPage: Sending to PaymentPage:', {
    date: formattedDate,
    rows: actualRows,
    cols: actualCols,
    vipRows: vipRows,
    selectedSeatsCount: selectedSeats.length,
    selectedSeatsDetails: selectedSeatsDetails,
    numericSelectedSeats: numericSelectedSeats,
    totalPrice: totalPrice
  });
  
  const seanceTime = seance.seance_time || formatTime(seance.startTime);
  
  // Создаем seatsForPayment для API
  const seatsForPayment = selectedSeatsDetails.map(seat => ({
    row: seat.row, // 1-based
    place: seat.seat, // 1-based
    coast: seat.price
  }));
  
  navigate('/payment', {
    state: {
      movie,
      hall: {
        ...hall,
        name: hall.name || hall.hall_name,
        rows: actualRows,
        cols: actualCols,
        vipRows: vipRows,
        standardPrice: standardPrice,
        vipPrice: vipPrice,
        hall_config: actualHallConfig
      },
      seance: {
        ...seance,
        time: seanceTime,
        id: seance.id
      },
       selectedSeats: numericSelectedSeats, // Для обратной совместимости [16]
    selectedSeatsDetails: selectedSeatsDetails, // Основные данные [{row: 4, seat: 1, ...}]
    seatsForPayment: seatsForPayment, // Для API
    totalPrice,
    selectedDate: formattedDate,
    actualRows, // 8
    actualCols, // 5 ← ЭТО ВАЖНО!
    seanceId: seance.id
    }
  });
};







  // Форматирование времени
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

  // Обновление зала
  const refreshHall = async () => {
    if (!seance) return;
    
    try {
      setLocalLoading(true);
      setApiError(null);
      setSelectedSeats([]);
      await loadActualHallConfig(seance.id, selectedDate);
    } catch (err) {
      console.error('Ошибка обновления зала:', err);
      setApiError('Не удалось обновить схему зала');
    } finally {
      setLocalLoading(false);
    }
  };

  // Функции для получения данных
  const getMovieTitle = (movie) => {
    return movie?.title || movie?.film_name || 'Фильм';
  };

  const getHallName = (hall) => {
    return hall?.name || hall?.hall_name || 'Зал';
  };

  // Состояние загрузки
  if (contextLoading || (localLoading && isInitialLoad)) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем информацию о сеансе...</p>
      </Container>
    );
  }

  // Обработка ошибок
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

  // Проверка существования сеанса
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

  // Получаем актуальные размеры зала
  const actualRows = actualHallConfig.length;
  const actualCols = actualRows > 0 ? actualHallConfig[0].length : 0;
  
  // Получаем цены
  const standardPrice = seance?.priceStandard || hall?.hall_price_standart || 400;
  const vipPrice = seance?.priceVip || hall?.hall_price_vip || 600;

  return (
    <Container className="hall-page">
      <header className="user-page__header">
        <div 
        className="user-page__logo" 
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
      >
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
            <span>
              {formatTime(seance.startTime || seance.seance_time)}
              <span> ({format(selectedDate, 'dd.MM.yyyy')})</span>  
            </span>
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
            
            {localLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Загрузка схемы зала...</span>
              </div>
            ) : actualRows === 0 ? (
              <Alert variant="warning" className="text-center">
                Конфигурация зала не загружена
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="ms-2"
                  onClick={refreshHall}
                >
                  Повторить
                </Button>
              </Alert>
            ) : (
              <>
                <div className="hall-page__layout">
                  {Array.from({ length: actualRows }, (_, rowIndex) => {
                    const rowNumber = rowIndex + 1;
                    
                    return (
                      <div key={rowIndex} className="hall-page__row d-flex justify-content-center mb-1">
                        <div className="d-flex flex-wrap justify-content-center hall-page__seats-container">
                          {Array.from({ length: actualCols }, (_, colIndex) => {
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
                            } else if (seatType === 'vip') {
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
                                    : (seatType === 'vip' ? `VIP (${vipPrice} ₽)` : `Стандарт (${standardPrice} ₽)`)
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

                <div className="hall-page__legend mt-4">
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
                          <span className="hall-page__legend-icon hall-page__legend-icon--occupied me-2"></span>
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
              </>
            )}
          </div> 
        </div>

        {!localLoading && actualRows > 0 && (
          <div className="text-center mt-4">
            <div className="mb-3">
              <p className="text-white">
                Выбрано мест: <strong>{selectedSeats.length}</strong> | 
                Общая стоимость: <strong>{selectedSeats.reduce((total, seatKey) => {
                  const [rowStr] = seatKey.split('-');
                  const row = parseInt(rowStr);
                  const rowIndex = row - 1;
                  const seatIndex = parseInt(seatKey.split('-')[1]) - 1;
                  const seatType = getSeatType(rowIndex, seatIndex);
                  const isVip = seatType === 'vip';
                  return total + (isVip ? vipPrice : standardPrice);
                }, 0)} ₽</strong>
              </p>
            </div>
            
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
        )}
      </main>
    </Container>
  );
};

export default HallPage;