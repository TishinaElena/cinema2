import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cinemaAPI } from '../../../services/api';
import { format, parseISO, addHours, startOfDay, isSameDay, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Card,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
  Modal,
  Form,
  Badge,
  Dropdown
} from 'react-bootstrap';

// Компонент фильма для перетаскивания
const MovieItem = ({ movie, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'movie',
    item: { movie },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="movie-drag-item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
      onMouseDown={() => onDragStart(movie)}
    >
      <div className="movie-drag-content">
        <div className="movie-drag-poster">
          <img 
            src={movie.posterUrl || '/images/default-poster.jpg'} 
            alt={movie.title}
          />
        </div>
        <div className="movie-drag-info">
          <strong>{movie.title}</strong>
          <small className="text-muted d-block">
            {Math.floor(movie.duration / 60)}ч {movie.duration % 60}мин
          </small>
        </div>
      </div>
    </div>
  );
};

// Компонент сеанса на timeline
const SeanceItem = ({ seance, movie, hall, onDelete, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'seance',
    item: { seance },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const startTime = parseISO(seance.startTime);
  const endTime = addHours(startTime, movie.duration / 60);
  const duration = movie.duration;
  
  // Рассчитываем ширину сеанса (1 час = 100px)
  const width = (duration / 60) * 100;

  return (
    <div
      ref={drag}
      className="seance-item"
      style={{
        width: `${width}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
      onMouseDown={() => onDragStart(seance)}
      title={`${movie.title} - ${format(startTime, 'HH:mm')}`}
    >
      <div className="seance-content">
        <div className="seance-title">{movie.title}</div>
        <div className="seance-time">
          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
        </div>
        <Button
          variant="link"
          className="seance-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(seance.id);
          }}
          size="sm"
        >
          <i className="bi bi-x"></i>
        </Button>
      </div>
    </div>
  );
};

// Компонент ячейки timeline для размещения сеансов
const TimelineCell = ({ hall, timeSlot, date, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['movie', 'seance'],
    drop: (item) => {
      onDrop(item, hall, timeSlot, date);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="timeline-cell"
      style={{
        backgroundColor: isOver ? '#e3f2fd' : 'transparent',
      }}
    >
      {children}
    </div>
  );
};

const ScheduleManager = ({ seances, halls, movies, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [draggedMovie, setDraggedMovie] = useState(null);
  const [draggedSeance, setDraggedSeance] = useState(null);
  const [showSeanceModal, setShowSeanceModal] = useState(false);
  const [seanceForm, setSeanceForm] = useState({
    hallId: '',
    movieId: '',
    startTime: '',
    priceStandard: 300,
    priceVip: 500
  });

  // Временные слоты на день (с 9:00 до 23:00)
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Фильтруем открытые залы
  const openHalls = halls.filter(hall => hall.isOpen);

  // Получаем сеансы на выбранную дату
  const getSeancesForDate = useCallback(() => {
    return seances.filter(seance => 
      isSameDay(parseISO(seance.startTime), selectedDate)
    );
  }, [seances, selectedDate]);

  const handleDrop = async (item, hall, timeSlot, date) => {
    if (item.movie) {
      // Перетаскивание фильма - создание нового сеанса
      setSeanceForm({
        hallId: hall.id,
        movieId: item.movie.id,
        startTime: `${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`,
        priceStandard: hall.priceStandard || 300,
        priceVip: hall.priceVip || 500
      });
      setShowSeanceModal(true);
    } else if (item.seance) {
      // Перетаскивание существующего сеанса - изменение времени
      try {
        setLoading(true);
        const newStartTime = `${format(date, 'yyyy-MM-dd')}T${timeSlot}:00`;
        
        // Здесь должен быть метод updateSeance в API
        // Пока создаем новый и удаляем старый для демонстрации
        const movie = movies.find(m => m.id === item.seance.movieId);
        await cinemaAPI.createSeance({
          hallId: hall.id,
          movieId: item.seance.movieId,
          startTime: newStartTime,
          priceStandard: item.seance.priceStandard,
          priceVip: item.seance.priceVip
        });
        
        await cinemaAPI.deleteSeance(item.seance.id);
        
        setSuccess('Сеанс перемещен');
        onUpdate();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreateSeance = async () => {
    setLoading(true);
    setError('');
    
    try {
      await cinemaAPI.createSeance(seanceForm);
      setSuccess('Сеанс успешно создан');
      setShowSeanceModal(false);
      setSeanceForm({
        hallId: '',
        movieId: '',
        startTime: '',
        priceStandard: 300,
        priceVip: 500
      });
      onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeance = async (seanceId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот сеанс?')) return;
    
    setLoading(true);
    try {
      await cinemaAPI.deleteSeance(seanceId);
      setSuccess('Сеанс удален');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeancesForHallAndTime = (hallId, timeSlot) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const slotTime = parseISO(`${dateStr}T${timeSlot}:00`);
    
    return getSeancesForDate().filter(seance => {
      if (seance.hallId !== hallId) return false;
      
      const seanceStart = parseISO(seance.startTime);
      const seanceEnd = addHours(seanceStart, 
        movies.find(m => m.id === seance.movieId)?.duration / 60 || 2
      );
      
      // Проверяем пересечение временных интервалов
      return slotTime >= seanceStart && slotTime < seanceEnd;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {/* Сообщения */}
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Панель управления */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <h5 className="mb-0">
                  Расписание на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                </h5>
              </Col>
              <Col md={4}>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                    size="sm"
                  >
                    ← Назад
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSelectedDate(new Date())}
                    size="sm"
                  >
                    Сегодня
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    size="sm"
                  >
                    Вперед →
                  </Button>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    <i className="bi bi-calendar me-2"></i>
                    Быстрый переход
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = addDays(new Date(), i);
                      return (
                        <Dropdown.Item 
                          key={i}
                          onClick={() => setSelectedDate(date)}
                          active={isSameDay(date, selectedDate)}
                        >
                          {format(date, 'EEEE, d MMMM', { locale: ru })}
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          {/* Панель фильмов для перетаскивания */}
          <Col lg={3}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-film me-2"></i>
                  Фильмы
                </h6>
                <small className="text-muted">Перетащите для создания сеанса</small>
              </Card.Header>
              <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {movies.length === 0 ? (
                  <div className="text-center py-3 text-muted">
                    <i className="bi bi-film" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2">Нет фильмов</p>
                  </div>
                ) : (
                  <div className="movie-drag-list">
                    {movies.map(movie => (
                      <MovieItem
                        key={movie.id}
                        movie={movie}
                        onDragStart={setDraggedMovie}
                      />
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Timeline */}
          <Col lg={9}>
            <Card>
              <Card.Body className="p-0">
                <div className="schedule-timeline">
                  {/* Заголовок timeline */}
                  <div className="timeline-header">
                    <div className="time-header-cell"></div>
                    {timeSlots.map(slot => (
                      <div key={slot} className="time-header-cell">
                        {slot}
                      </div>
                    ))}
                  </div>

                  {/* Строки для каждого зала */}
                  {openHalls.map(hall => (
                    <div key={hall.id} className="timeline-row">
                      <div className="hall-header-cell">
                        <strong>{hall.name}</strong>
                        <small className="d-block text-muted">
                          {hall.rows}×{hall.cols} мест
                        </small>
                      </div>
                      
                      {timeSlots.map(slot => {
                        const seancesInSlot = getSeancesForHallAndTime(hall.id, slot);
                        return (
                          <TimelineCell
                            key={`${hall.id}-${slot}`}
                            hall={hall}
                            timeSlot={slot}
                            date={selectedDate}
                            onDrop={handleDrop}
                          >
                            {seancesInSlot.map(seance => {
                              const movie = movies.find(m => m.id === seance.movieId);
                              if (!movie) return null;
                              
                              return (
                                <SeanceItem
                                  key={seance.id}
                                  seance={seance}
                                  movie={movie}
                                  hall={hall}
                                  onDelete={handleDeleteSeance}
                                  onDragStart={setDraggedSeance}
                                />
                              );
                            })}
                          </TimelineCell>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* Легенда */}
            <Card className="mt-3">
              <Card.Body>
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center">
                    <div className="seance-item me-2" style={{ width: '100px' }}>
                      <div className="seance-content">
                        <div className="seance-title">Пример</div>
                      </div>
                    </div>
                    <span>Сеанс (перетаскивайте)</span>
                  </div>
                  <div className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Перетащите сеанс за пределы timeline для удаления
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Модальное окно создания сеанса */}
        <Modal show={showSeanceModal} onHide={() => setShowSeanceModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Создание сеанса</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Зал</Form.Label>
                <Form.Control
                  as="select"
                  value={seanceForm.hallId}
                  onChange={(e) => setSeanceForm({...seanceForm, hallId: e.target.value})}
                  required
                >
                  <option value="">Выберите зал</option>
                  {openHalls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.rows}×{hall.cols} мест)
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Фильм</Form.Label>
                <Form.Control
                  as="select"
                  value={seanceForm.movieId}
                  onChange={(e) => setSeanceForm({...seanceForm, movieId: e.target.value})}
                  required
                >
                  <option value="">Выберите фильм</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({Math.floor(movie.duration / 60)}ч {movie.duration % 60}мин)
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Время начала</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={seanceForm.startTime}
                      onChange={(e) => setSeanceForm({...seanceForm, startTime: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Дата</Form.Label>
                    <Form.Control
                      type="date"
                      value={format(parseISO(seanceForm.startTime || new Date().toISOString()), 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const time = seanceForm.startTime.split('T')[1] || '12:00';
                        setSeanceForm({
                          ...seanceForm,
                          startTime: `${e.target.value}T${time}`
                        });
                      }}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Цена стандарт (₽)</Form.Label>
                    <Form.Control
                      type="number"
                      min="100"
                      max="5000"
                      value={seanceForm.priceStandard}
                      onChange={(e) => setSeanceForm({...seanceForm, priceStandard: parseInt(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Цена VIP (₽)</Form.Label>
                    <Form.Control
                      type="number"
                      min="100"
                      max="5000"
                      value={seanceForm.priceVip}
                      onChange={(e) => setSeanceForm({...seanceForm, priceVip: parseInt(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {seanceForm.movieId && seanceForm.startTime && (
                <Alert variant="info">
                  <strong>Информация:</strong>
                  <div className="mt-2">
                    <div>Длительность: {Math.floor(
                      movies.find(m => m.id === seanceForm.movieId)?.duration / 60
                    )}ч {movies.find(m => m.id === seanceForm.movieId)?.duration % 60}мин</div>
                    <div>Окончание: {format(
                      addHours(
                        parseISO(seanceForm.startTime),
                        movies.find(m => m.id === seanceForm.movieId)?.duration / 60
                      ),
                      'HH:mm'
                    )}</div>
                  </div>
                </Alert>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSeanceModal(false)}>
              Отмена
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateSeance}
              disabled={loading || !seanceForm.hallId || !seanceForm.movieId || !seanceForm.startTime}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Создание...
                </>
              ) : (
                'Создать сеанс'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Стили */}
        <style jsx="true">{`
          .schedule-timeline {
            position: relative;
            overflow-x: auto;
          }
          
          .timeline-header {
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .time-header-cell {
            min-width: 100px;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            border-right: 1px solid #dee2e6;
          }
          
          .timeline-row {
            display: flex;
            min-height: 80px;
            border-bottom: 1px solid #dee2e6;
          }
          
          .hall-header-cell {
            min-width: 150px;
            padding: 15px;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-right: 1px solid #dee2e6;
          }
          
          .timeline-cell {
            min-width: 100px;
            min-height: 80px;
            border-right: 1px solid #dee2e6;
            position: relative;
            padding: 2px;
          }
          
          .movie-drag-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .movie-drag-item {
            padding: 10px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            background: white;
            transition: all 0.2s;
          }
          
          .movie-drag-item:hover {
            background: #f8f9fa;
            border-color: #0d6efd;
          }
          
          .movie-drag-content {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .movie-drag-poster {
            width: 40px;
            height: 60px;
            overflow: hidden;
            border-radius: 3px;
          }
          
          .movie-drag-poster img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .movie-drag-info {
            flex: 1;
          }
          
          .seance-item {
            background: linear-gradient(135deg, #0d6efd, #0a58ca);
            color: white;
            border-radius: 5px;
            padding: 5px;
            position: absolute;
            height: calc(100% - 4px);
            overflow: hidden;
            z-index: 5;
          }
          
          .seance-content {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 5px;
            position: relative;
          }
          
          .seance-title {
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .seance-time {
            font-size: 10px;
            opacity: 0.9;
          }
          
          .seance-delete {
            position: absolute;
            top: 2px;
            right: 2px;
            color: white;
            padding: 0;
            width: 16px;
            height: 16px;
            font-size: 10px;
            opacity: 0;
            transition: opacity 0.2s;
          }
          
          .seance-item:hover .seance-delete {
            opacity: 1;
          }
          
          .seance-delete:hover {
            color: #ffc107;
          }
          
          @media (max-width: 992px) {
            .timeline-header,
            .timeline-row {
              min-width: 1400px;
            }
          }
        `}</style>
      </div>
    </DndProvider>
  );
};

export default ScheduleManager;