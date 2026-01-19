import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  Container, 
  Card, 
  Button, 
  Row, 
  Col, 
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap';

const TicketPage = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Пытаемся получить данные из location.state или sessionStorage
  const ticketData = location.state || (() => {
    try {
      const savedData = sessionStorage.getItem('ticket_data');
      return savedData ? JSON.parse(savedData) : null;
    } catch {
      return null;
    }
  })();

  // Если нет данных, перенаправляем на главную
  useEffect(() => {
    if (!ticketData) {
      setError('Данные билета не найдены');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [ticketData]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Загрузка данных билета...</p>
      </Container>
    );
  }

  if (error || !ticketData) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error || 'Билет не найден'}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => navigate('/')}>
              <i className="bi bi-house me-1"></i>
              На главную
            </Button>
            <Button variant="outline-primary" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-1"></i>
              Назад
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Безопасное извлечение данных с значениями по умолчанию
  const {
    bookingId = ticketId || 'N/A',
    tickets = [],
    movie = {},
    hall = {},
    seance = {},
    selectedSeats = [],
    totalPrice = 0,
    qrCode = ''
  } = ticketData;

  // Безопасное извлечение вложенных свойств
  const movieTitle = movie?.title || movie?.film_name || 'Фильм';
  const hallName = hall?.name || hall?.hall_name || 'Зал';
  const seanceTime = seance?.time || '--:--';
  const seanceDate = seance?.dateFormatted || seance?.date || new Date().toLocaleDateString('ru-RU');

  // Функция для печати билета
  const handlePrint = () => {
    window.print();
  };

  // Функция для сохранения билета
  const handleSave = () => {
    const element = document.createElement('a');
    const text = `
БИЛЕТ №: ${bookingId}
ФИЛЬМ: ${movieTitle}
ЗАЛ: ${hallName}
ДАТА: ${seanceDate}
ВРЕМЯ: ${seanceTime}
МЕСТА: ${selectedSeats.map(s => `Ряд ${s.row}, Место ${s.seat}`).join('; ')}
ИТОГО: ${totalPrice}₽
QR-код: ${qrCode}
    `;
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `билет-${bookingId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Container className="py-4 ticket-page">
      <header className="user-page__header">
        <div className="user-page__logo">
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
        </div>
      </header>

      <Card className="content_card">
        <Card.Body className="ticket-card__body">
          {/* Ticket Header */}
          <div className="ticket-header">
            <h1 className="ticket-header__title">Электронный билет</h1>
          </div>

          {/* Ticket Details */}
          <div className="ticket-details">
            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-film"></i>
                На фильм: 
              </span>
              <span className="ticket-details__value fw-bold">{movieTitle}</span>
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-geo-alt"></i>
                Места:
              </span>
              <span className="ticket-details__value">
                {Array.isArray(selectedSeats) && selectedSeats.length > 0 ? (
                  selectedSeats.map((seat, index) => (
                    <span key={index} className="ticket-details__value">
                       ряд {seat.row || '?'}, место {seat.seat || '?'}
                    </span>
                  ))
                ) : (
                  Array.isArray(tickets) && tickets.length > 0 ? (
                    tickets.map((ticket, index) => (
                      <span key={index} className="ticket-details__value">
                        ряд {ticket.ticket_row || ticket.row || '?'}, 
                        место {ticket.ticket_place || ticket.place || '?'}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">Места не указаны</span>
                  )
                )}
              </span>
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-building"></i>
                В зале: 
              </span>
              <span className="ticket-details__value fw-bold">{hallName}</span>
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-clock"></i>
                Начало сеанса: 
              </span>
              <span className="ticket-details__value fw-bold">{seanceTime}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center">
            <Card className="ticket-qr">
              <Card.Body className="ticket-qr__body">
                {qrCode ? (
                  <>
                    <img 
                      src={qrCode} 
                      alt={`QR-код билета ${bookingId}`}
                      className="img-fluid ticket-qr__code"
                    />
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Alert variant="warning">
                      QR-код не доступен
                    </Alert>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* User Instructions */}
          <div className="ticket-instructions">
            <div>
              <i className="bi bi-check-circle-fill me-2"></i>
              Покажите QR-код нашему контроллеру для подтверждения бронирования.
            </div>
            <div>
              <i className="bi bi-emoji-smile me-2"></i>
              Приятного просмотра!
            </div>
          </div>

       </Card.Body>
      </Card>
    </Container>
  );
};

export default TicketPage;