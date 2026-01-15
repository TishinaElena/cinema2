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
    // Подготавливаем данные для API
    const bookingData = prepareBookingData();
    
    console.log('Отправка данных покупки билетов:', bookingData);
    
    // Проверяем наличие обязательных данных
    if (!bookingData.seanceId || bookingData.seanceId === 0) {
      throw new Error('Не указан ID сеанса');
    }
    
    if (bookingData.tickets.length === 0) {
      throw new Error('Не выбраны места');
    }

    // Отправляем запрос на покупку билетов через API
    const result = await cinemaAPI.bookTickets(bookingData);
    
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
    const seanceId = bookingData.seanceId;
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
      if (err.message.includes('Не возможно забронировать место')) {
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
    <Container className="py-5">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-primary text-white py-3">
          <h3 className="mb-0">
            <i className="bi bi-credit-card me-2"></i>
            Оплата билетов
          </h3>
        </Card.Header>
        
        <Card.Body className="p-4">
          {/* Информация о заказе */}
          <Card className="mb-4 border-success">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-ticket-perforated me-2"></i>
                Детали заказа
              </h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col xs={4} className="fw-bold">Фильм:</Col>
                    <Col xs={8}>{movieTitle}</Col>
                  </Row>
                </ListGroup.Item>
                
                <ListGroup.Item>
                  <Row>
                    <Col xs={4} className="fw-bold">Места:</Col>
                    <Col xs={8}>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedSeats.map(seatId => {
                          const row = Math.floor((seatId - 1) / hallCols) + 1;
                          const seat = ((seatId - 1) % hallCols) + 1;
                          // Безопасная проверка vipRows
                          const isVip = Array.isArray(vipRows) ? vipRows.includes(row) : false;
                          const price = isVip ? vipPrice : standardPrice;
                          
                          return (
                            <Badge 
                              key={seatId} 
                              bg={isVip ? 'warning' : 'info'} 
                              className="p-2"
                            >
                              Ряд {row}, Место {seat} - {price}₽
                            </Badge>
                          );
                        })}
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
                
                <ListGroup.Item>
                  <Row>
                    <Col xs={4} className="fw-bold">Зал:</Col>
                    <Col xs={8}>{hallName}</Col>
                  </Row>
                </ListGroup.Item>
                
                <ListGroup.Item>
                  <Row>
                    <Col xs={4} className="fw-bold">Время сеанса:</Col>
                    <Col xs={8}>{seanceTime}</Col>
                  </Row>
                </ListGroup.Item>
                
                <ListGroup.Item>
                  <Row>
                    <Col xs={4} className="fw-bold">Количество мест:</Col>
                    <Col xs={8}>{selectedSeats.length}</Col>
                  </Row>
                </ListGroup.Item>
                
                <ListGroup.Item className="bg-light">
                  <Row>
                    <Col xs={4} className="fw-bold fs-5">Итого к оплате:</Col>
                    <Col xs={8} className="fs-4 fw-bold text-success">
                      {totalPrice} ₽
                    </Col>
                  </Row>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Кнопка оплаты */}
          <div className="text-center mb-4">
            <Button 
              variant="success" 
              size="lg" 
              className="px-5 py-3"
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
                  <i className="bi bi-check-circle me-2"></i>
                  Купить билеты
                </>
              )}
            </Button>
            
            {error && (
              <Alert variant="danger" className="mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </Alert>
            )}
          </div>

          {/* Информация */}
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Информация
              </h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Билеты будут зарезервированы на 15 минут
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  QR-код билета отобразится на следующей странице
                </li>
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Покажите QR-код контроллёру у входа в зал
                </li>
                <li>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Приятного просмотра!
                </li>
              </ul>
            </Card.Body>
          </Card>

          {/* Кнопка назад */}
          <div className="text-center mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(-1)}
              className="me-2"
            >
              <i className="bi bi-arrow-left me-1"></i>
              Вернуться к выбору мест
            </Button>
            
            <Button 
              variant="outline-primary" 
              onClick={() => navigate('/')}
            >
              <i className="bi bi-house me-1"></i>
              На главную
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentPage;