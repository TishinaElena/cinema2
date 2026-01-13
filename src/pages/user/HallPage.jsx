import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { cinemaAPI } from '../../services/api';
import { format } from 'date-fns';
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal } from 'react-bootstrap';

const HallPage = () => {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const { getMovieById, getHallById, data } = useData();
  
  const [seance, setSeance] = useState(null);
  const [hallConfig, setHallConfig] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadSeanceData();
  }, [seanceId, data]);

  const loadSeanceData = async () => {
    try {
      setLoading(true);
      const currentSeance = data.seances.find(s => s.id === parseInt(seanceId));
      
      if (!currentSeance) {
        throw new Error('Сеанс не найден');
      }

      setSeance(currentSeance);
      
      // Загружаем конфигурацию зала с занятыми местами
      const date = format(new Date(currentSeance.startTime), 'yyyy-MM-dd');
      const config = await cinemaAPI.getHallConfig(currentSeance.hallId, date);
      setHallConfig(config);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (!seat || seat.isBlocked) return;

    const isSelected = selectedSeats.some(s => 
      s.row === seat.row && s.column === seat.column
    );

    if (isSelected) {
      // Удаляем место
      setSelectedSeats(prev => prev.filter(s => 
        !(s.row === seat.row && s.column === seat.column)
      ));
    } else {
      // Добавляем место
      setSelectedSeats(prev => [...prev, {
        row: seat.row,
        column: seat.column,
        type: seat.type,
        price: seat.type === 'vip' ? seance.priceVip : seance.priceStandard
      }]);
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  };

  const handleBooking = async () => {
    try {
      setIsBooking(true);
      const bookingData = {
        seanceId: parseInt(seanceId),
        seats: selectedSeats
      };

      const result = await cinemaAPI.buyTickets(bookingData);
      setShowConfirm(false);
      navigate(`/ticket/${result.bookingId}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const renderSeat = (seat) => {
    const isSelected = selectedSeats.some(s => 
      s.row === seat.row && s.column === seat.column
    );

    let className = 'seat';
    
    if (seat.isBlocked || seat.isBooked) {
      className += ' seat-blocked';
    } else if (seat.type === 'vip') {
      className += ' seat-vip';
    } else {
      className += ' seat-standard';
    }

    if (isSelected) {
      className += ' seat-selected';
    }

    return (
      <div
        key={`${seat.row}-${seat.column}`}
        className={className}
        onClick={() => handleSeatClick(seat)}
        title={`Ряд ${seat.row}, Место ${seat.column} - ${seat.type === 'vip' ? 'VIP' : 'Стандарт'}`}
      >
        {seat.column}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем схему зала...</p>
      </Container>
    );
  }

  if (error || !seance || !hallConfig) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Ошибка!</Alert.Heading>
          <p>{error || 'Данные не найдены'}</p>
          <Button variant="outline-danger" onClick={() => navigate('/')}>
            Вернуться на главную
          </Button>
        </Alert>
      </Container>
    );
  }

  const movie = getMovieById(seance.movieId);
  const hall = getHallById(seance.hallId);

  return (
    <Container className="py-4">
      {/* Информация о сеансе */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <img 
                src={movie.posterUrl || '/images/default-poster.jpg'} 
                alt={movie.title}
                className="img-fluid rounded"
              />
            </Col>
            <Col md={9}>
              <h2>{movie.title}</h2>
              <p className="lead">{format(new Date(seance.startTime), 'dd.MM.yyyy HH:mm')}</p>
              <p>
                <strong>Зал:</strong> {hall?.name || 'Неизвестно'}<br />
                <strong>Длительность:</strong> {Math.floor(movie.duration / 60)}ч {movie.duration % 60}мин<br />
                <strong>Цены:</strong> Стандарт - {seance.priceStandard}₽, VIP - {seance.priceVip}₽
              </p>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/')}
              >
                ← Вернуться к расписанию
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Схема зала */}
      <Card className="mb-4">
        <Card.Header>
          <h4 className="mb-0">Выбор мест</h4>
        </Card.Header>
        <Card.Body>
          {/* Легенда */}
          <div className="seat-legend mb-4">
            <div className="d-flex gap-3">
              <div className="d-flex align-items-center">
                <div className="seat seat-standard me-2"></div>
                <span>Свободно (стандарт)</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="seat seat-vip me-2"></div>
                <span>Свободно (VIP)</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="seat seat-selected me-2"></div>
                <span>Выбрано вами</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="seat seat-blocked me-2"></div>
                <span>Занято/заблокировано</span>
              </div>
            </div>
          </div>

          {/* Экран */}
          <div className="screen text-center mb-5">
            <div className="screen-label">ЭКРАН</div>
            <div className="screen-line"></div>
          </div>

          {/* Места */}
          <div className="hall-container">
            {hallConfig.rows.map(rowNumber => (
              <div key={rowNumber} className="seat-row mb-3">
                <div className="row-label">Ряд {rowNumber}</div>
                <div className="d-flex justify-content-center gap-2">
                  {hallConfig.seats
                    .filter(seat => seat.row === rowNumber)
                    .sort((a, b) => a.column - b.column)
                    .map(seat => renderSeat(seat))}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Выбранные места и итог */}
      <Card>
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <h5>Выбранные места:</h5>
              {selectedSeats.length === 0 ? (
                <p className="text-muted">Выберите места на схеме выше</p>
              ) : (
                <ul className="list-unstyled">
                  {selectedSeats.map((seat, index) => (
                    <li key={index} className="mb-1">
                      Ряд {seat.row}, Место {seat.column} 
                      ({seat.type === 'vip' ? 'VIP' : 'Стандарт'}) - {seat.price}₽
                    </li>
                  ))}
                </ul>
              )}
            </Col>
            <Col md={6} className="text-end">
              <div className="mb-3">
                <h4>Итого: {calculateTotal()}₽</h4>
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={selectedSeats.length === 0 || isBooking}
                onClick={() => setShowConfirm(true)}
              >
                {isBooking ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Обработка...
                  </>
                ) : (
                  `Забронировать ${selectedSeats.length} мест`
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Модальное окно подтверждения */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Подтверждение бронирования</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы выбрали {selectedSeats.length} мест на сумму {calculateTotal()}₽</p>
          <ul>
            {selectedSeats.map((seat, index) => (
              <li key={index}>
                Ряд {seat.row}, Место {seat.column} - {seat.price}₽
              </li>
            ))}
          </ul>
          <p>Подтвердить бронирование?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleBooking} disabled={isBooking}>
            {isBooking ? 'Бронируем...' : 'Подтвердить бронирование'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CSS для зала */}
      <style jsx="true">{`
        .seat {
          width: 40px;
          height: 40px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          font-weight: bold;
          user-select: none;
        }

        .seat:hover:not(.seat-blocked) {
          transform: scale(1.1);
        }

        .seat-standard {
          background-color: #e9ecef;
          border: 2px solid #6c757d;
          color: #495057;
        }

        .seat-vip {
          background-color: #fff3cd;
          border: 2px solid #ffc107;
          color: #856404;
        }

        .seat-selected {
          background-color: #0d6efd;
          border-color: #0a58ca;
          color: white;
        }

        .seat-blocked {
          background-color: #dc3545;
          border-color: #b02a37;
          color: white;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .screen {
          position: relative;
        }

        .screen-label {
          font-weight: bold;
          color: #6c757d;
          margin-bottom: 5px;
        }

        .screen-line {
          height: 5px;
          background: linear-gradient(to right, #6c757d, #adb5bd, #6c757d);
          border-radius: 5px;
        }

        .seat-row {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .row-label {
          min-width: 60px;
          font-weight: bold;
          text-align: right;
        }

        .seat-legend .seat {
          width: 20px;
          height: 20px;
          font-size: 0;
        }

        @media (max-width: 768px) {
          .seat {
            width: 30px;
            height: 30px;
            font-size: 10px;
          }
          
          .seat-row {
            gap: 10px;
          }
          
          .row-label {
            min-width: 50px;
            font-size: 14px;
          }
        }
      `}</style>
    </Container>
  );
};

export default HallPage;