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
    <Container className="py-5">
      {/* Печатная версия */}
      <div className="print-only">
        <h2 className="text-center mb-4">Электронный билет</h2>
        <hr />
      </div>

      <Card className="shadow-lg border-0 mb-4">
        <Card.Header className="bg-success text-white py-3">
          <h3 className="mb-0 d-flex justify-content-between align-items-center">
            <span>
              <i className="bi bi-ticket-perforated me-2"></i>
              Электронный билет
            </span>
            <Badge bg="light" text="dark" className="fs-6">
              № {bookingId}
            </Badge>
          </h3>
        </Card.Header>
        
        <Card.Body className="p-4">
          <Row>
            {/* Левая часть - информация */}
            <Col lg={8} className="mb-4 mb-lg-0">
              <Row className="mb-4">
                <Col xs={12}>
                  <h4 className="text-primary">{movieTitle}</h4>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Зал:</Col>
                <Col xs={8}>{hallName}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Дата:</Col>
                <Col xs={8}>{seanceDate}</Col>
              </Row>
              
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Время:</Col>
                <Col xs={8}>{seanceTime}</Col>
              </Row>
              
              <Row className="mb-4">
                <Col xs={4} className="fw-bold">Места:</Col>
                <Col xs={8}>
                  <div className="d-flex flex-wrap gap-2">
                    {/* Безопасный рендеринг мест */}
                    {Array.isArray(selectedSeats) && selectedSeats.length > 0 ? (
                      selectedSeats.map((seat, index) => (
                        <Badge key={index} bg="info" className="p-2">
                          Ряд {seat.row || '?'}, Место {seat.seat || '?'}
                        </Badge>
                      ))
                    ) : (
                      // Альтернатива: используем tickets если selectedSeats нет
                      Array.isArray(tickets) && tickets.length > 0 ? (
                        tickets.map((ticket, index) => (
                          <Badge key={index} bg="info" className="p-2">
                            Ряд {ticket.ticket_row || ticket.row || '?'}, 
                            Место {ticket.ticket_place || ticket.place || '?'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted">Места не указаны</span>
                      )
                    )}
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col xs={4} className="fw-bold fs-5">Стоимость:</Col>
                <Col xs={8} className="fs-4 fw-bold text-success">
                  {totalPrice} ₽
                </Col>
              </Row>
            </Col>
            
            {/* Правая часть - QR код */}
            <Col lg={4} className="text-center">
              <Card className="border-primary">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">QR-код</h5>
                </Card.Header>
                <Card.Body className="p-4">
                  {qrCode ? (
                    <>
                      <img 
                        src={qrCode} 
                        alt={`QR-код билета ${bookingId}`}
                        className="img-fluid mb-3"
                        style={{ maxWidth: '200px' }}
                      />
                      <p className="text-muted small mb-0">
                        Покажите QR-код контроллеру
                      </p>
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
            </Col>
          </Row>
          
          {/* Детали билетов в таблице */}
          {Array.isArray(tickets) && tickets.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3">Детализация</h5>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Билет</th>
                      <th>Ряд</th>
                      <th>Место</th>
                      <th>Цена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, index) => (
                      <tr key={ticket.id || index}>
                        <td>#{ticket.id || ticket.ticket_id || index + 1}</td>
                        <td>{ticket.ticket_row || ticket.row || '—'}</td>
                        <td>{ticket.ticket_place || ticket.place || '—'}</td>
                        <td>{ticket.ticket_price || ticket.price || 0} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Кнопки действий */}
          <div className="text-center mt-5">
            <Button 
              variant="primary" 
              className="me-3 px-4"
              onClick={handlePrint}
            >
              <i className="bi bi-printer me-2"></i>
              Распечатать
            </Button>
            
            <Button 
              variant="outline-primary" 
              className="me-3 px-4"
              onClick={handleSave}
            >
              <i className="bi bi-download me-2"></i>
              Сохранить
            </Button>
            
            <Button 
              variant="outline-secondary" 
              className="me-3 px-4"
              onClick={() => navigate('/')}
            >
              <i className="bi bi-house me-2"></i>
              На главную
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Информация для пользователя */}
      <Alert variant="info">
        <h5 className="alert-heading">
          <i className="bi bi-info-circle me-2"></i>
          Важная информация
        </h5>
        <ul className="mb-0">
          <li>Сохраните или распечатайте этот билет</li>
          <li>Покажите QR-код на входе в зал</li>
          <li>Приходите за 15 минут до начала сеанса</li>
          <li>Приятного просмотра!</li>
        </ul>
      </Alert>

      {/* Стили для печати */}
      <style>
        {`
          @media print {
            .print-only { display: block !important; }
            .no-print { display: none !important; }
            .container { max-width: 100% !important; }
            .card { border: 2px solid #000 !important; box-shadow: none !important; }
            .btn { display: none !important; }
            .alert { display: none !important; }
            body { font-size: 12pt; }
          }
          
          @media screen {
            .print-only { display: none !important; }
          }
        `}
      </style>
    </Container>
  );
};

export default TicketPage;