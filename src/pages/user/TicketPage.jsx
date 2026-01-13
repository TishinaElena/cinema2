import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cinemaAPI } from '../../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import QRCode from 'qrcode.react';
import { 
  Container, 
  Card, 
  Button, 
  Row, 
  Col, 
  Alert, 
  Spinner,
  Badge 
} from 'react-bootstrap';

const TicketPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    loadTicketData();
  }, [bookingId]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      const data = await cinemaAPI.getTicketInfo(bookingId);
      setTicket(data);

      // Формируем строку для QR-кода
      const qrString = `БИЛЕТ В КИНО
Фильм: ${data.movieTitle}
Дата: ${format(new Date(data.seanceStartTime), 'dd.MM.yyyy')}
Время: ${format(new Date(data.seanceStartTime), 'HH:mm')}
Зал: ${data.hallName}
Ряд: ${data.row}
Место: ${data.seat}
Тип: ${data.seatType === 'vip' ? 'VIP' : 'Стандарт'}
Стоимость: ${data.price}₽
Код брони: ${data.bookingCode}

Билет действителен строго на свой сеанс.`;

      setQrData(qrString);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем информацию о билете...</p>
      </Container>
    );
  }

  if (error || !ticket) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error || 'Билет не найден'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-lg ticket-card">
        <Card.Body>
          {/* Шапка билета */}
          <div className="text-center mb-4">
            <h1 className="display-5 text-primary">
              <i className="bi bi-ticket-perforated me-2"></i>
              ЭЛЕКТРОННЫЙ БИЛЕТ
            </h1>
            <Badge bg="success" className="fs-6 px-3 py-2">
              БРОНЬ №{ticket.bookingCode}
            </Badge>
          </div>

          <Row className="align-items-center">
            {/* Левая часть - Информация */}
            <Col lg={7} className="pe-lg-4">
              <div className="ticket-info">
                <div className="mb-4">
                  <h2 className="text-primary">{ticket.movieTitle}</h2>
                  <div className="d-flex flex-wrap gap-3 mt-3">
                    <div className="info-item">
                      <i className="bi bi-calendar-event me-2"></i>
                      <strong>Дата:</strong> {format(new Date(ticket.seanceStartTime), 'dd MMMM yyyy', { locale: ru })}
                    </div>
                    <div className="info-item">
                      <i className="bi bi-clock me-2"></i>
                      <strong>Время:</strong> {format(new Date(ticket.seanceStartTime), 'HH:mm')}
                    </div>
                    <div className="info-item">
                      <i className="bi bi-door-open me-2"></i>
                      <strong>Зал:</strong> {ticket.hallName}
                    </div>
                    <div className="info-item">
                      <i className="bi bi-geo-alt me-2"></i>
                      <strong>Место:</strong> Ряд {ticket.row}, Место {ticket.seat}
                    </div>
                    <div className="info-item">
                      <i className="bi bi-star me-2"></i>
                      <strong>Тип:</strong> 
                      <Badge bg={ticket.seatType === 'vip' ? 'warning' : 'secondary'} className="ms-2">
                        {ticket.seatType === 'vip' ? 'VIP' : 'Стандарт'}
                      </Badge>
                    </div>
                    <div className="info-item">
                      <i className="bi bi-cash-coin me-2"></i>
                      <strong>Стоимость:</strong> {ticket.price}₽
                    </div>
                  </div>
                </div>

                <Alert variant="warning" className="mt-4">
                  <Alert.Heading>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Важная информация
                  </Alert.Heading>
                  <ul className="mb-0">
                    <li>Приходите в кинотеатр за 20 минут до начала сеанса</li>
                    <li>Иметь при себе документ, удостоверяющий личность</li>
                    <li>QR-код можно предъявить в электронном виде</li>
                    <li>Билет действителен строго на свой сеанс</li>
                    <li>Возврат билетов возможен за 1 час до начала сеанса</li>
                  </ul>
                </Alert>

                <div className="mt-4 d-flex gap-2">
                  <Button variant="outline-primary" onClick={() => navigate('/')}>
                    <i className="bi bi-house me-2"></i>
                    На главную
                  </Button>
                  <Button variant="outline-secondary" onClick={handlePrint}>
                    <i className="bi bi-printer me-2"></i>
                    Распечатать билет
                  </Button>
                  <Button variant="primary" onClick={() => window.location.reload()}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Обновить QR-код
                  </Button>
                </div>
              </div>
            </Col>

            {/* Правая часть - QR-код */}
            <Col lg={5} className="text-center border-start ps-lg-4">
              <div className="qr-container p-4">
                <div className="mb-4">
                  <h4 className="text-secondary">QR-код для входа</h4>
                  <p className="text-muted">Покажите этот код на входе</p>
                </div>
                
                <div className="qr-wrapper p-3 bg-white rounded shadow-sm mb-3">
                  <QRCode 
                    value={qrData}
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <div className="mt-3">
                  <small className="text-muted">
                    Создано: {format(new Date(ticket.createdAt), 'dd.MM.yyyy HH:mm')}
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>

        {/* Футер билета */}
        <Card.Footer className="text-center text-muted">
          <div className="ticket-footer">
            <p className="mb-1">
              <i className="bi bi-telephone me-2"></i>
              Служба поддержки: 8 (800) 123-45-67
            </p>
            <p className="mb-0">
              <i className="bi bi-envelope me-2"></i>
              Email: support@cinema.ru
            </p>
          </div>
        </Card.Footer>
      </Card>

      {/* Стили для печати */}
      <style jsx="true">{`
        .ticket-card {
          border: 3px solid #0d6efd;
          border-radius: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }
        
        .info-item {
          padding: 8px 16px;
          background: white;
          border-radius: 10px;
          border: 1px solid #dee2e6;
          min-width: 180px;
        }
        
        .qr-container {
          background: #f8f9fa;
          border-radius: 15px;
        }
        
        .ticket-footer {
          border-top: 2px dashed #6c757d;
          padding-top: 15px;
        }
        
        /* Стили для печати */
        @media print {
          body * {
            visibility: hidden;
          }
          .ticket-card, .ticket-card * {
            visibility: visible;
          }
          .ticket-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 2px solid #000;
            box-shadow: none;
          }
          .btn {
            display: none !important;
          }
        }
        
        @media (max-width: 992px) {
          .info-item {
            min-width: 150px;
            font-size: 14px;
          }
          .border-start {
            border-left: none !important;
            border-top: 2px dashed #dee2e6;
            margin-top: 2rem;
            padding-top: 2rem;
          }
        }
      `}</style>
    </Container>
  );
};

export default TicketPage;