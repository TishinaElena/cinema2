import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Spinner,
  Row,
  Col,
  Badge,
  ListGroup
} from 'react-bootstrap';
import { cinemaAPI } from '../../services/api';

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
    totalPrice = 0,
    hallRows = 10,
    hallCols = 15,
    vipRows = [], // Устанавливаем пустой массив по умолчанию
    standardPrice = 400,
    vipPrice = 600
  } = state;

  // Форматируем время
  const formatTime = (time) => {
    if (!time) return '--:--';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    try {
      const date = new Date(time);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Получаем текущую дату в формате YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Подготавливаем данные для API покупки билетов
  const prepareBookingData = () => {
    const tickets = selectedSeats.map(seatId => {
      const row = Math.floor((seatId - 1) / hallCols) + 1;
      const place = ((seatId - 1) % hallCols) + 1;
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
      ticketDate: getCurrentDate(),
      tickets
    };
  };

const handleConfirmBooking = async () => {
  setLoading(true);
  setError(null);
  
  try {
    // Получаем занятые места перед покупкой
    const takenSeats = await cinemaAPI.getTakenSeats(seance?.id || seance?.seance_id);
    
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
    
    console.log('Отправка данных покупки билетов:', selectedSeatsData);
    
    // Проверяем наличие обязательных данных
    if (!selectedSeatsData.seanceId || selectedSeatsData.seanceId === 0) {
      throw new Error('Не указан ID сеанса');
    }
    
    if (selectedSeatsData.tickets.length === 0) {
      throw new Error('Не выбраны места');
    }

    // Отправляем запрос на покупку билетов через API
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
        time: formatTime(seance?.startTime || seance?.seance_time || ticket.ticket_time),
        date: ticket.ticket_date || getCurrentDate()
      },
      selectedSeats: result.tickets.map(t => ({
        id: t.id,
        row: t.ticket_row,
        seat: t.ticket_place,
        price: t.ticket_price
      })),
      totalPrice: result.tickets.reduce((sum, t) => sum + t.ticket_price, 0),
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}`
    };
    
    console.log('Данные для отображения билета:', ticketData);
    
    // Сохраняем в sessionStorage
    sessionStorage.setItem('ticket_data', JSON.stringify(ticketData));
    
    // ВАЖНО: Сохраняем информацию о забронированных местах в localStorage
    // чтобы HallPage мог их отобразить как занятые
    const seanceId = selectedSeatsData.seanceId;
    const bookedSeatsKey = `booked_seats_${seanceId}`;
    
    // Получаем текущие забронированные места для этого сеанса
    const bookedSeats = JSON.parse(localStorage.getItem(bookedSeatsKey) || '[]');
    
    // Преобразуем выбранные места в формат для хранения
    const newBookedSeats = selectedSeats.map(seatId => {
      const row = Math.floor((seatId - 1) / hallCols) + 1;
      const seat = ((seatId - 1) % hallCols) + 1;
      
      return {
        id: seatId,
        row: row,
        seat: seat,
        bookingId: bookingId,
        timestamp: Date.now()
      };
    });
    
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
        hallCols: hallCols
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
        errorMessage = `Место Ряд ${row}, Место ${seat} уже занято. Пожалуйста, выберите другие места.`;
      } else {
        errorMessage = 'Некоторые выбранные места уже заняты. Пожалуйста, выберите другие места.';
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
  const seanceTime = formatTime(seance?.startTime || seance?.seance_time);

  return (
    <Container className="payment-page">
      <header className="user-page__header">
        <div className="user-page__logo">
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
        </div>
      </header>
      
      <main className="payment-page__main">
        <Card className="content_card">
          <Card.Body>
            <h2 className="payment-card__title">ВЫ ВЫБРАЛИ БИЛЕТЫ:</h2>
            
            <div className="payment-card__info">
              <div className="payment-card__info-item">
                <span className="payment-card__label">На фильм: </span>
                <span className="payment-card__value fw-bold">{movieTitle}</span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Места: </span>
                <span className="payment-card__value fw-bold">
                  {selectedSeats.map(seatId => {
                    const row = Math.floor((seatId - 1) / hallCols) + 1;
                    const seat = ((seatId - 1) % hallCols) + 1;
                    const isVip = Array.isArray(vipRows) ? vipRows.includes(row) : false;
                    const price = isVip ? vipPrice : standardPrice;
                    
                    return (
                      <                 span
                      >
                        ряд {row}, место {seat};
                      </span>
                    );
                  })}
                </span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">В зале: </span>
                <span className="payment-card__value fw-bold">{hallName}</span>
              </div>
              
              <div className="payment-card__info-item">
                <span className="payment-card__label">Начало сеанса: </span>
                <span className="payment-card__value fw-bold">{seanceTime}</span>
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
                className="button"
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
              После оплаты билет будет доступен в этом окне, а также придёт вам на почту. 
              Покажите QR-код нашему контроллеру у входа в зал. Приятного просмотра!
            </div>  
          </Card.Body>
        </Card>
      </main>
    </Container>
  );
};

export default PaymentPage;