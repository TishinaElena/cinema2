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
import { format, parseISO } from 'date-fns';
import QRCode from 'qrcode'; // Добавляем библиотеку для генерации QR-кода

const TicketPage = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(''); // Новое состояние для QR-кода
  
  // Пытаемся получить данные из location.state или sessionStorage
  const ticketData = location.state || (() => {
    try {
      const savedData = sessionStorage.getItem('ticket_data');
      return savedData ? JSON.parse(savedData) : null;
    } catch {
      return null;
    }
  })();

  // Генерация QR-кода из данных билета
  useEffect(() => {
    const generateQRCode = async () => {
      if (!ticketData) return;

      try {
        // Извлекаем данные для QR-кода
        const {
          bookingId = ticketId || 'N/A',
          tickets = [],
          movie = {},
          hall = {},
          seance = {},
          selectedSeats = [],
          totalPrice = 0,
          selectedDate: selectedDateStr = null
        } = ticketData;

        // Получаем данные
        const movieTitle = movie?.title || movie?.film_name || 'Фильм';
        const hallName = hall?.name || hall?.hall_name || 'Зал';
        const seanceTime = seance?.time || '--:--';

        // Форматируем дату
        let seanceDate;
        if (selectedDateStr) {
          seanceDate = formatDate(selectedDateStr);
        } else if (seance?.date) {
          if (seance.date.includes('.')) {
            seanceDate = seance.date;
          } else {
            seanceDate = formatDate(seance.date);
          }
        } else {
          seanceDate = format(new Date(), 'dd.MM.yyyy');
        }

        // Форматируем места
        let seatsText = '';
        if (Array.isArray(selectedSeats) && selectedSeats.length > 0) {
          seatsText = selectedSeats.map(s => `Ряд ${s.row}, Место ${s.seat}`).join('; ');
        } else if (Array.isArray(tickets) && tickets.length > 0) {
          seatsText = tickets.map(t => 
            `Ряд ${t.ticket_row || t.row || '?'}, Место ${t.ticket_place || t.place || '?'}`
          ).join('; ');
        } else {
          seatsText = 'Места не указаны';
        }

        // Создаем текст для QR-кода по требованиям ТЗ
        const qrText = `
БИЛЕТ №: ${bookingId}
ФИЛЬМ: ${movieTitle}
ЗАЛ: ${hallName}
ДАТА: ${seanceDate}
ВРЕМЯ: ${seanceTime}
МЕСТА: ${seatsText}
СТОИМОСТЬ: ${totalPrice}₽
Билет действителен строго на свой сеанс
        `.trim();

        // Генерируем QR-код
        const qrCodeDataUrl = await QRCode.toDataURL(qrText, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
      }
    };

    if (ticketData) {
      generateQRCode();
    }
  }, [ticketData, ticketId]);

  // Если нет данных, перенаправляем на главную
  useEffect(() => {
    if (!ticketData) {
      setError('Данные билета не найдены');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [ticketData]);

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      
      // Проверяем, если это уже отформатированная дата (с точками)
      if (dateString.includes('.')) {
        return dateString;
      }
      
      // Пытаемся парсить и форматировать
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || '';
    }
  };

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
    qrCode = '',
    selectedDate: selectedDateStr = null // Получаем выбранную дату
  } = ticketData;

  // Получаем дату сеанса
  let seanceDate;
  if (selectedDateStr) {
    // Используем выбранную дату из PaymentPage
    seanceDate = formatDate(selectedDateStr);
  } else if (seance?.date) {
    // Используем дату из данных сеанса
    seanceDate = formatDate(seance.date);
  } else {
    // Используем текущую дату как fallback
    seanceDate = format(new Date(), 'dd.MM.yyyy');
  }

  // Безопасное извлечение вложенных свойств
const movieTitle = movie?.title || movie?.film_name || 'Фильм';
const hallName = hall?.name || hall?.hall_name || 'Зал';
// Получаем время и дату из seance объекта
const seanceTime = seance?.time || '--:--';


// Приоритет: выбранная дата > дата из seance > текущая дата
if (selectedDateStr) {
  seanceDate = formatDate(selectedDateStr);
} else if (seance?.date) {
  // Если дата уже в правильном формате (с точками)
  if (seance.date.includes('.')) {
    seanceDate = seance.date;
  } else {
    seanceDate = formatDate(seance.date);
  }
} else {
  seanceDate = format(new Date(), 'dd.MM.yyyy');
}

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
    <Container className="ticket-page">
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
<div className="payment-card__title">ЭЛЕКТРОННЫЙ БИЛЕТ</div>
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
        <Card.Body className="ticket-card__body">


          {/* Ticket Details */}
          <div className="ticket-details">
            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-film"></i>
                На фильм:  <span className="ticket-details__value fw-bold">{movieTitle}</span>
              </span>
             
            </div>



            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-geo-alt"></i>
                Места: <span className="ticket-details__value">
                {Array.isArray(selectedSeats) && selectedSeats.length > 0 ? (
                  selectedSeats.map((seat, index) => (
                    <span key={index} bg="primary" className="me-1 mb-1">
                      ряд {seat.row || '?'}, место {seat.seat || '?'}; 
                    </span>
                  ))
                ) : (
                  Array.isArray(tickets) && tickets.length > 0 ? (
                    tickets.map((ticket, index) => (
                      <Badge key={index} bg="primary" className="me-1 mb-1">
                        ряд {ticket.ticket_row || ticket.row || '?'}, 
                        место {ticket.ticket_place || ticket.place || '?'}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted">Места не указаны</span>
                  )
                )}
              </span>
              </span>
              
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-building"></i>
                В зале:  <span className="ticket-details__value fw-bold">{hallName}</span>
              </span>
              
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-clock"></i>
                Начало сеанса:   <span className="ticket-details__value fw-bold">
                {seanceTime} 
              </span>
              </span>
             
            </div>

            <div className="ticket-details__item">
              <span className="ticket-details__label">
                <i className="bi bi-currency-exchange"></i>
                Стоимость:  <span className="ticket-details__value fw-bold">
                {totalPrice} рублей
              </span>
              </span>
              
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center ticket-qr">
            
                {qrCodeUrl ? ( // Используем сгенерированный QR-код
                  <>
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR-код билета ${bookingId}`}
                      className="img-fluid ticket-qr__code"
                      style={{ width: '200px' }}
                    />
                    
                  </>
                ) : (
                  <div className="text-center ">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="">Генерация QR-кода...</p>
                  </div>
                )}
              
          </div>

          {/* User Instructions */}
          <div className="ticket-instructions">
            <div className="mb-2">
              <i className=""></i>
              Покажите QR-код нашему контроллеру для подтверждения бронирования.
            </div>
            <div>
              <i className=""></i>
              Приятного просмотра!
            </div>
          </div>

        </Card.Body>
      </Card>
    </Container>
  );
};

export default TicketPage;