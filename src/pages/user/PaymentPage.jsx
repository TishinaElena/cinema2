import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Spinner
} from 'react-bootstrap';
import { cinemaAPI } from '../../services/api';
import { format, parseISO } from 'date-fns';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const state = location.state || null;

  // Если нет данных, перенаправляем на главную
  if (!state) {
    return <Navigate to="/" />;
  }

  // Используем значения по умолчанию для всех параметров
  const { 
    movie = {}, 
    hall = {}, 
    seance = {}, 
    selectedSeats = [], 
    selectedSeatsDetails = [],
    totalPrice = 0,
    selectedDate: selectedDateStr = null,
    actualRows = 10,      // ← используйте это вместо hallRows
    actualCols = 15,      // ← используйте это вместо hallCols
    vipRows = [],
    standardPrice = 400,
    vipPrice = 600,
    seatsForPayment = []
  } = state;

  // Добавьте лог для отладки
  console.log('PaymentPage state:', {
    actualRows, // должно быть 8
    actualCols, // должно быть 5
    selectedSeats, // [16]
    selectedSeatsDetails // [{row: 4, seat: 1}]
  });

  // Парсим выбранную дату
  let selectedDate;
  try {
    if (selectedDateStr) {
      selectedDate = parseISO(selectedDateStr);
    } else {
      selectedDate = new Date();
    }
  } catch (error) {
    selectedDate = new Date();
  }

  // Функция для извлечения только времени из seance.time
  const extractTimeOnly = (timeValue) => {
    if (!timeValue) return '--:--';
    
    try {
      // Если это уже время в формате HH:MM
      if (typeof timeValue === 'string' && timeValue.length === 5 && timeValue.includes(':')) {
        return timeValue;
      }
      
      // Если это полная дата с временем
      let date;
      if (typeof timeValue === 'string' && timeValue.includes('T')) {
        date = parseISO(timeValue);
      } else {
        date = new Date(timeValue);
      }
      
      if (isNaN(date.getTime())) {
        return String(timeValue);
      }
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
      
    } catch (error) {
      console.error('Error extracting time:', error);
      return '--:--';
    }
  };

  // Функция для форматирования даты для отображения
  const formatDate = (date) => {
    try {
      return format(date, 'dd.MM.yyyy');
    } catch {
      return '';
    }
  };

  // Функция для форматирования даты для API
  const formatDateForAPI = (date) => {
    try {
      return format(date, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  // Получаем время сеанса (только часы:минуты)
  const seanceTime = extractTimeOnly(seance?.time || seance?.seance_time || seance?.startTime);
  
  // Получаем отформатированную дату
  const formattedDate = formatDate(selectedDate);

  // Подготавливаем данные для API покупки билетов
  const prepareBookingData = () => {
    // Если есть selectedSeatsDetails, используем их
    if (selectedSeatsDetails && selectedSeatsDetails.length > 0) {
      const tickets = selectedSeatsDetails.map(seat => ({
        row: seat.row,
        place: seat.seat,
        coast: seat.price
      }));
      
      return {
        seanceId: seance?.id || seance?.seance_id || 0,
        ticketDate: formatDateForAPI(selectedDate),
        tickets
      };
    }
    
    // Для обратной совместимости используем старый расчет
    const tickets = selectedSeats.map(seatId => {
      // Используем actualCols
      const row = Math.floor((seatId - 1) / actualCols) + 1;
      const place = ((seatId - 1) % actualCols) + 1;
      const isVip = Array.isArray(vipRows) ? vipRows.includes(row) : false;
      const coast = isVip ? vipPrice : standardPrice;
      
      return {
        row,
        place,
        coast
      };
    });

    return {
      seanceId: seance?.id || seance?.seance_id || 0,
      ticketDate: formatDateForAPI(selectedDate),
      tickets
    };
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Используем ВЫБРАННУЮ дату для проверки занятых мест
      const ticketDate = formatDateForAPI(selectedDate);
      console.log('Checking taken seats for SELECTED date:', ticketDate);
      
      // Получаем занятые места перед покупкой для ВЫБРАННОЙ даты
      const takenSeats = await cinemaAPI.getTakenSeats(seance?.id || seance?.seance_id, ticketDate);
      
      console.log('Taken seats for date', ticketDate, ':', takenSeats);
      
      // Проверяем, не выбраны ли уже занятые места
      const selectedSeatsData = prepareBookingData();
      const conflictedSeats = [];
      
      selectedSeatsData.tickets.forEach(ticket => {
        const isTaken = takenSeats.some(taken => 
          taken.row === ticket.row && taken.seat === ticket.place
        );
        
        if (isTaken) {
          conflictedSeats.push(`ряд ${ticket.row} место ${ticket.place}`);
        }
      });
      
      if (conflictedSeats.length > 0) {
        throw new Error(`Места уже заняты: ${conflictedSeats.join(', ')}. Пожалуйста, выберите другие места.`);
      }
      
      console.log('Отправка данных покупки билетов на дату:', ticketDate, selectedSeatsData);
      
      // Проверяем наличие обязательных данных
      if (!selectedSeatsData.seanceId || selectedSeatsData.seanceId === 0) {
        throw new Error('Не указан ID сеанса');
      }
      
      if (selectedSeatsData.tickets.length === 0) {
        throw new Error('Не выбраны места');
      }

      // Отправляем запрос на покупку билетов через API с ВЫБРАННОЙ датой
      const result = await cinemaAPI.bookTickets(selectedSeatsData);
      
      console.log('Ответ от API покупки билетов:', result);

      if (!result || !result.tickets || result.tickets.length === 0) {
        throw new Error('Не удалось получить данные о билетах');
      }

      // Берем данные из первого билета
      const ticket = result.tickets[0];
      const bookingId = ticket.id || `TICKET-${Date.now()}`;
      
      // Формируем данные билета для отображения
      const ticketData = {
        bookingId,
        tickets: result.tickets,
        movie: {
          title: movie?.title || movie?.film_name || ticket.ticket_filmname || 'Фильм',
          posterUrl: movie?.posterUrl || ''
        },
        hall: {
          name: hall?.name || hall?.hall_name || ticket.ticket_hallname || 'Зал'
        },
        seance: {
          time: extractTimeOnly(seance?.time || seance?.seance_time || seance?.startTime || ticket.ticket_time),
          date: formatDate(selectedDate)
        },
        selectedSeats: result.tickets.map(t => ({
          id: t.id,
          row: t.ticket_row,
          seat: t.ticket_place,
          price: t.ticket_price
        })),
        totalPrice: result.tickets.reduce((sum, t) => sum + t.ticket_price, 0),
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`,
        selectedDate: formatDateForAPI(selectedDate)
      };
      
      console.log('Данные для отображения билета:', ticketData);
      
      // Сохраняем в sessionStorage
      sessionStorage.setItem('ticket_data', JSON.stringify(ticketData));
      
      // ВАЖНО: Сохраняем информацию о забронированных местах в localStorage
      const seanceId = selectedSeatsData.seanceId;
      const bookedSeatsKey = `booked_seats_${seanceId}_${ticketDate}`;
      
      // Получаем текущие забронированные места для этого сеанса и даты
      const bookedSeats = JSON.parse(localStorage.getItem(bookedSeatsKey) || '[]');
      
      // Преобразуем выбранные места в формат для хранения
      const newBookedSeats = (selectedSeatsDetails || []).map(seatDetail => ({
        id: `${seatDetail.row}-${seatDetail.seat}`,
        row: seatDetail.row,
        seat: seatDetail.seat,
        bookingId: bookingId,
        seanceId: seanceId,
        date: ticketDate,
        timestamp: Date.now()
      }));

      // Если нет details, используем старый расчет
      if (newBookedSeats.length === 0 && selectedSeats.length > 0) {
        selectedSeats.forEach(seatId => {
          const row = Math.floor((seatId - 1) / actualCols) + 1;
          const seat = ((seatId - 1) % actualCols) + 1;
          
          newBookedSeats.push({
            id: seatId,
            row: row,
            seat: seat,
            bookingId: bookingId,
            seanceId: seanceId,
            date: ticketDate,
            timestamp: Date.now()
          });
        });
      }
      
      // Объединяем старые и новые места
      const updatedBookedSeats = [...bookedSeats, ...newBookedSeats];
      
      // Сохраняем в localStorage
      localStorage.setItem(bookedSeatsKey, JSON.stringify(updatedBookedSeats));
      
      // Сохраняем также в общий список для всех сеансов
      const allBookedSeatsKey = 'all_booked_seats';
      const allBookedSeats = JSON.parse(localStorage.getItem(allBookedSeatsKey) || '[]');
      localStorage.setItem(allBookedSeatsKey, JSON.stringify([...allBookedSeats, ...newBookedSeats]));
      
      // Отправляем событие для обновления других вкладок
      window.dispatchEvent(new CustomEvent('seatsBooked', {
        detail: { 
          seanceId: seanceId,
          bookedSeats: newBookedSeats,
          hallCols: actualCols,
          date: ticketDate
        }
      }));
      
      // Переходим на страницу билета
      navigate(`/ticket/${bookingId}`, { state: ticketData });
      
    } catch (err) {
      console.error('Ошибка при покупке билетов:', err);
      
      let errorMessage = 'Ошибка при покупке билетов. Попробуйте еще раз.';
      
      if (err.message.includes('Не возможно забронировать место')) {
        const match = err.message.match(/ряд (\d+) место (\d+)/);
        if (match) {
          const row = match[1];
          const seat = match[2];
          errorMessage = `Место Ряд ${row}, Место ${seat} уже занято на выбранную дату. Пожалуйста, выберите другие места.`;
        } else {
          errorMessage = 'Некоторые выбранные места уже заняты на выбранную дату. Пожалуйста, выберите другие места.';
        }
      } else if (err.message.includes('Места уже заняты:')) {
        errorMessage = err.message;
      } else if (err.message.includes('Не указан ID сеанса')) {
        errorMessage = 'Ошибка данных сеанса. Вернитесь на главную страницу.';
      } else if (err.message.includes('Не выбраны места')) {
        errorMessage = 'Не выбраны места для покупки.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Сервер недоступен. Проверьте подключение к интернету.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Проблема с подключением к серверу.';
      }
      
      setError(errorMessage);
      
      // Предлагаем вернуться к выбору мест
      setTimeout(() => {
        if (err.message.includes('Не возможно забронировать место') || 
            err.message.includes('Места уже заняты:')) {
          if (window.confirm('Хотите вернуться к выбору других мест?')) {
            navigate(-1);
          }
        }
      }, 2000);
      
    } finally {
      setLoading(false);
    }
  };

  const movieTitle = movie?.title || movie?.film_name || 'Фильм';
  const hallName = hall?.name || hall?.hall_name || 'Зал';

  return (
    <Container className="payment-page">
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
      
      <main className="payment-page__main">
        
    {/* Изображение-разделитель на всю ширину */}
  <div 
    className="payment-page__divider"
    style={{
      width: '100%',
      height: '3px', // Высота вашего изображения
      backgroundImage: `url(${process.env.PUBLIC_URL}/images/circle1.png)`,
      backgroundRepeat: 'repeat-x',
      backgroundPosition: 'center',
      backgroundSize: '9px 3px', // Авто ширина, фикс высота
      
    }}
  ></div>
<div className="payment-card__title">ВЫ ВЫБРАЛИ БИЛЕТЫ:</div>
  <div 
    className="payment-page__divider"
    style={{
      width: '100%',
      height: '3px', // Высота вашего изображения
      backgroundImage: `url(${process.env.PUBLIC_URL}/images/circle2.png)`,
      backgroundRepeat: 'repeat-x',
      backgroundPosition: 'center',
      backgroundSize: '9px 3px', // Авто ширина, фикс высота
      
    }}
  ></div>
  <div 
    className="payment-page__divider"
    style={{
      width: '100%',
      height: '3px', // Высота вашего изображения
      backgroundImage: `url(${process.env.PUBLIC_URL}/images/circle1.png)`,
      backgroundRepeat: 'repeat-x',
      backgroundPosition: 'center',
      backgroundSize: '9px 3px', // Авто ширина, фикс высота
      
    }}
  ></div>
        <Card className="content_card">
          <Card.Body>

            
            
            <div className="payment-card__info">
              <div className="payment-card__info-item">
                <span className="payment-card__label">На фильм: </span>
                <span className="payment-card__value fw-bold">{movieTitle}</span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Дата сеанса: </span>
                <span className="payment-card__value fw-bold">{formattedDate}</span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Места: </span>
                <span className="payment-card__value fw-bold">
                  {selectedSeatsDetails && selectedSeatsDetails.length > 0
                    ? selectedSeatsDetails.map((seat, index) => (
                        <span key={`${seat.row}-${seat.seat}`}>
                          ряд {seat.row}, место {seat.seat}{index < selectedSeatsDetails.length - 1 ? '; ' : ''}
                        </span>
                      ))
                    : selectedSeats.map((seatId, index) => {
                        // Используем actualCols
                        const row = Math.floor((seatId - 1) / actualCols) + 1;
                        const seat = ((seatId - 1) % actualCols) + 1;
                        const isVip = Array.isArray(vipRows) ? vipRows.includes(row) : false;
                        const price = isVip ? vipPrice : standardPrice;
                        
                        return (
                          <span key={seatId}>
                            ряд {row}, место {seat}{index < selectedSeats.length - 1 ? '; ' : ''}
                          </span>
                        );
                      })
                  }
                </span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">В зале: </span>
                <span className="payment-card__value fw-bold">{hallName}</span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Начало сеанса: </span>
                <span className="payment-card__value fw-bold">
                  {seanceTime} {formattedDate && `(${formattedDate})`}
                </span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Стоимость: </span>
                <span className="payment-card__value payment-card__price fw-bold">{totalPrice} рублей</span>
              </div>
            </div>

            <div className="payment-card__actions text-center mb-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="button button-get-code"
                onClick={handleConfirmBooking}
                disabled={loading || selectedSeats.length === 0}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Покупка билетов...
                  </>
                ) : (
                  <>
                    <i className="bi bi-ticket-detailed me-2"></i>
                    ПОЛУЧИТЬ КОД БРОНИРОВАНИЯ
                  </>
                )}
              </Button>
              
              {error && (
                <Alert variant="danger" className="payment-card__alert mt-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}
            </div>

            <div className="payment-card__notice">
              <div className="mb-2">
              После оплаты билет будет доступен в этом окне, а также придёт вам на почту. Покажите QR-код нашему контроллеру у входа в зал.
              </div>
              <div>
              Приятного просмотра!
              </div> 
               
            </div>  
          </Card.Body>
        </Card>
      </main>
    </Container>
  );
};

export default PaymentPage;