import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container,
  Button,
  Card,
  Alert,
  Form,
  Row,
  Col,
  Modal,
  Dropdown,
  Table,
  Badge,
  ListGroup,
  ButtonGroup,
  Accordion,
  Image,
  CloseButton
} from 'react-bootstrap';
import { cinemaAPI as ApiService } from '../../services/api'; // Измененная строка импорта
import { useData } from '../../contexts/DataContext';

// Компонент для сворачиваемых секций (аналог AdminSection)
const AdminSection = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Header 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple text-white d-flex justify-content-between align-items-center"
        style={{ cursor: 'pointer' }}
      >
        <h5 className="mb-0">{title}</h5>
        <span>{isOpen ? '−' : '+'}</span>
      </Card.Header>
      {isOpen && (
        <Card.Body>{children}</Card.Body>
      )}
    </Card>
  );
};

// Компонент для управления залами
const HallsManagement = () => {
  const { halls, refreshData } = useData();
  const [newHallName, setNewHallName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const handleCreateHall = async (e) => {
    e.preventDefault();
    if (!newHallName.trim()) return;
    
    setLoading(true);
    const params = new FormData();
    params.set('hallName', newHallName);
    
    try {
      await ApiService.createHall(params);
      setNewHallName('');
      setShowCreateModal(false);
      await refreshData();
      setNotification({ show: true, type: 'success', message: 'Зал успешно создан' });
    } catch (error) {
      console.error('Failed to create hall:', error);
      setNotification({ show: true, type: 'error', message: 'Не удалось создать зал' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHall = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот зал? Все связанные сеансы также будут удалены.')) {
      try {
        await ApiService.deleteHall(id);
        await refreshData();
        setNotification({ show: true, type: 'success', message: 'Зал успешно удален' });
      } catch (error) {
        console.error('Failed to delete hall:', error);
        setNotification({ show: true, type: 'error', message: 'Не удалось удалить зал' });
      }
    }
  };

  return (
    <>
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="mb-3"
        >
          {notification.message}
        </Alert>
      )}
      
      <div className="mb-4">
        <h6>Доступные залы:</h6>
        <ListGroup>
          {halls && halls.map(hall => (
            <ListGroup.Item key={hall.id} className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-bold">• {hall.hall_name}</span>
                <Badge bg="secondary" className="ms-2">
                  {hall.hall_rows}×{hall.hall_places}
                </Badge>
              </div>
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={() => handleDeleteHall(hall.id)}
              >
                Удалить
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      <div className="text-center">
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
        >
          Создать новый зал
        </Button>
      </div>

      {/* Модальное окно создания зала */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавление зала</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateHall}>
            <Form.Group className="mb-3">
              <Form.Label>Название зала</Form.Label>
              <Form.Control
                type="text"
                value={newHallName}
                onChange={e => setNewHallName(e.target.value)}
                placeholder="Например, «Зал 1»"
                required
              />
              <Form.Text className="text-muted">
                Укажите уникальное название для зала
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Отмена
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Создать зал'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

// Компонент для конфигурации залов
const HallConfiguration = () => {
  const { halls, refreshData } = useData();
  const [selectedHallId, setSelectedHallId] = useState('');
  const [rows, setRows] = useState(10);
  const [places, setPlaces] = useState(8);
  const [config, setConfig] = useState([]);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (halls && halls.length > 0 && !selectedHallId) {
      handleHallSelect(halls[0].id);
    }
  }, [halls, selectedHallId]);

  const handleHallSelect = (id) => {
    setSelectedHallId(id);
    const hall = halls.find(h => h.id === id);
    if (hall) {
      setRows(hall.hall_rows || 10);
      setPlaces(hall.hall_places || 8);
      setConfig(hall.hall_config && hall.hall_config.length > 0 
        ? hall.hall_config 
        : Array(hall.hall_rows || 10).fill(Array(hall.hall_places || 8).fill('standart')));
    }
  };

  const handleGridSizeChange = (newRows, newPlaces) => {
    const r = Math.max(1, newRows);
    const p = Math.max(1, newPlaces);
    setRows(r);
    setPlaces(p);
    setConfig(Array(r).fill(null).map(() => Array(p).fill('standart')));
  };

  const handleSeatClick = (r, p) => {
    const newConfig = config.map(row => [...row]);
    const currentType = newConfig[r][p];
    const types = ['standart', 'vip', 'disabled'];
    const nextIndex = (types.indexOf(currentType) + 1) % types.length;
    newConfig[r][p] = types[nextIndex];
    setConfig(newConfig);
  };

  const handleSaveConfig = async () => {
    if (!selectedHallId) return;
    
    const params = new FormData();
    params.set('rowCount', String(rows));
    params.set('placeCount', String(places));
    params.set('config', JSON.stringify(config));
    
    try {
      await ApiService.updateHallConfig(selectedHallId, params);
      await refreshData();
      setNotification({ show: true, type: 'success', message: 'Конфигурация зала сохранена' });
    } catch (error) {
      console.error('Failed to save hall config:', error);
      setNotification({ show: true, type: 'error', message: 'Ошибка сохранения' });
    }
  };

  return (
    <>
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="mb-3"
        >
          {notification.message}
        </Alert>
      )}
      
      <Form.Group className="mb-4">
        <Form.Label>Выберите зал для конфигурации:</Form.Label>
        <ButtonGroup>
          {halls && halls.map(hall => (
            <Button
              key={hall.id}
              variant={selectedHallId === hall.id ? 'primary' : 'outline-primary'}
              onClick={() => handleHallSelect(hall.id)}
              className="text-uppercase"
            >
              {hall.hall_name}
            </Button>
          ))}
        </ButtonGroup>
      </Form.Group>

      {selectedHallId && (
        <>
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Рядов, шт</Form.Label>
                <Form.Control
                  type="number"
                  value={rows}
                  onChange={e => handleGridSizeChange(Number(e.target.value), places)}
                  min="1"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Мест, шт</Form.Label>
                <Form.Control
                  type="number"
                  value={places}
                  onChange={e => handleGridSizeChange(rows, Number(e.target.value))}
                  min="1"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mb-4">
            <h6>Легенда:</h6>
            <div className="d-flex gap-3 mb-3">
              <Badge bg="secondary" className="d-flex align-items-center gap-1">
                <div className="seat seat-standart"></div>
                Обычные
              </Badge>
              <Badge bg="warning" className="d-flex align-items-center gap-1">
                <div className="seat seat-vip"></div>
                VIP
              </Badge>
              <Badge bg="light" text="dark" className="d-flex align-items-center gap-1">
                <div className="seat seat-disabled"></div>
                Заблокировано
              </Badge>
            </div>
            <p className="text-muted small">
              Кликните по месту для изменения типа
            </p>
          </div>

          <Card className="mb-4">
            <Card.Body>
              <div className="text-center mb-3 border-bottom pb-2">
                <h5>ЭКРАН</h5>
              </div>
              
              <div className="d-flex flex-column align-items-center">
                {config.map((row, rIndex) => (
                  <div key={rIndex} className="d-flex mb-2">
                    {row.map((seat, pIndex) => {
                      let seatClass = 'seat ';
                      switch (seat) {
                        case 'standart': seatClass += 'seat-standart'; break;
                        case 'vip': seatClass += 'seat-vip'; break;
                        case 'disabled': seatClass += 'seat-disabled'; break;
                        default: break;
                      }
                      return (
                        <div
                          key={pIndex}
                          onClick={() => handleSeatClick(rIndex, pIndex)}
                          className={seatClass}
                        ></div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <div className="d-flex justify-content-center gap-2">
            <Button variant="secondary" onClick={() => selectedHallId && handleHallSelect(selectedHallId)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSaveConfig}>
              Сохранить конфигурацию
            </Button>
          </div>
        </>
      )}
    </>
  );
};

// Компонент для конфигурации цен
const PriceConfiguration = () => {
  const { halls, refreshData } = useData();
  const [selectedHallId, setSelectedHallId] = useState('');
  const [priceStandart, setPriceStandart] = useState('');
  const [priceVip, setPriceVip] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (halls && halls.length > 0 && !selectedHallId) {
      handleHallSelect(halls[0].id);
    }
  }, [halls, selectedHallId]);

  const handleHallSelect = (id) => {
    setSelectedHallId(id);
    const hall = halls.find(h => h.id === id);
    if (hall) {
      setPriceStandart(String(hall.hall_price_standart || ''));
      setPriceVip(String(hall.hall_price_vip || ''));
    }
  };

  const handleSavePrice = async () => {
    if (!selectedHallId) return;
    
    const params = new FormData();
    params.set('priceStandart', priceStandart);
    params.set('priceVip', priceVip);
    
    try {
      await ApiService.updateHallPrice(selectedHallId, params);
      await refreshData();
      setNotification({ show: true, type: 'success', message: 'Цены успешно сохранены' });
    } catch (error) {
      console.error('Failed to save prices:', error);
      setNotification({ show: true, type: 'error', message: 'Ошибка сохранения цен' });
    }
  };

  return (
    <>
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="mb-3"
        >
          {notification.message}
        </Alert>
      )}
      
      <Form.Group className="mb-4">
        <Form.Label>Выберите зал для настройки цен:</Form.Label>
        <ButtonGroup>
          {halls && halls.map(hall => (
            <Button
              key={hall.id}
              variant={selectedHallId === hall.id ? 'primary' : 'outline-primary'}
              onClick={() => handleHallSelect(hall.id)}
              className="text-uppercase"
            >
              {hall.hall_name}
            </Button>
          ))}
        </ButtonGroup>
      </Form.Group>

      {selectedHallId && (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Цена обычных мест (руб.)</Form.Label>
                <Form.Control
                  type="number"
                  value={priceStandart}
                  onChange={e => setPriceStandart(e.target.value)}
                  min="0"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Цена VIP мест (руб.)</Form.Label>
                <Form.Control
                  type="number"
                  value={priceVip}
                  onChange={e => setPriceVip(e.target.value)}
                  min="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-center gap-2">
            <Button variant="secondary" onClick={() => selectedHallId && handleHallSelect(selectedHallId)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={handleSavePrice}>
              Сохранить цены
            </Button>
          </div>
        </>
      )}
    </>
  );
};

// Компонент для управления сеансами
const SeanceManagement = () => {
  const { films, halls, seances, refreshData } = useData();
  const [showFilmModal, setShowFilmModal] = useState(false);
  const [showSeanceModal, setShowSeanceModal] = useState(false);
  const [filmName, setFilmName] = useState('');
  const [filmDuration, setFilmDuration] = useState('');
  const [filmDescription, setFilmDescription] = useState('');
  const [filmOrigin, setFilmOrigin] = useState('');
  const [filmPoster, setFilmPoster] = useState(null);
  const [seanceHallId, setSeanceHallId] = useState('');
  const [seanceFilmId, setSeanceFilmId] = useState('');
  const [seanceTime, setSeanceTime] = useState('12:00');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const draggedFilm = useRef(null);
  const draggedSeanceId = useRef(null);
  const dropSuccess = useRef(false);

  const filmColors = useMemo(() => {
    const colors = ['#85FF89', '#CAFF85', '#85FFD3', '#85E2FF', '#8599FF'];
    const colorMap = new Map();
    films && films.forEach((film, index) => {
      colorMap.set(film.id, colors[index % colors.length]);
    });
    return colorMap;
  }, [films]);

  const handleAddFilm = async (e) => {
    e.preventDefault();
    if (!filmPoster) {
      setNotification({ show: true, type: 'warning', message: 'Пожалуйста, загрузите постер' });
      return;
    }
    
    const params = new FormData();
    params.set('filmName', filmName);
    params.set('filmDuration', filmDuration);
    params.set('filmDescription', filmDescription);
    params.set('filmOrigin', filmOrigin);
    params.set('filePoster', filmPoster);

    try {
      await ApiService.createFilm(params);
      await refreshData();
      setShowFilmModal(false);
      setFilmName(''); setFilmDuration(''); setFilmDescription(''); setFilmOrigin(''); setFilmPoster(null);
      setNotification({ show: true, type: 'success', message: 'Фильм успешно добавлен' });
    } catch (error) {
      console.error('Failed to add film:', error);
      setNotification({ show: true, type: 'error', message: 'Не удалось добавить фильм' });
    }
  };

  const handleDeleteFilm = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот фильм? Все связанные сеансы также будут удалены.')) {
      try {
        await ApiService.deleteFilm(id);
        await refreshData();
        setNotification({ show: true, type: 'success', message: 'Фильм успешно удален' });
      } catch (error) {
        console.error('Failed to delete film:', error);
        setNotification({ show: true, type: 'error', message: 'Не удалось удалить фильм' });
      }
    }
  };

  const handleAddSeance = async (e) => {
    e.preventDefault();
    if (!seanceHallId || !seanceFilmId || !seanceTime) {
      setNotification({ show: true, type: 'warning', message: 'Пожалуйста, заполните все поля' });
      return;
    }
    
    const params = new FormData();
    params.set('seanceHallid', seanceHallId);
    params.set('seanceFilmid', seanceFilmId);
    params.set('seanceTime', seanceTime);
    
    try {
      await ApiService.createSeance(params);
      await refreshData();
      setShowSeanceModal(false);
      setSeanceHallId(''); setSeanceFilmId(''); setSeanceTime('12:00');
      setNotification({ show: true, type: 'success', message: 'Сеанс успешно добавлен' });
    } catch (error) {
      console.error('Failed to add seance:', error);
      setNotification({ show: true, type: 'error', message: 'Не удалось добавить сеанс' });
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleDrop = async (e, hallId) => {
    e.preventDefault();
    if (!draggedFilm.current) return;
    
    dropSuccess.current = true;
    const film = draggedFilm.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const totalMinutes = 24 * 60;
    const startTimeInMinutes = Math.round((dropX / rect.width) * totalMinutes);

    const hallSeances = seances.filter(s => s.seance_hallid === hallId);
    const newSeanceStart = startTimeInMinutes;
    const newSeanceEnd = newSeanceStart + film.film_duration;

    const isOverlap = hallSeances.some(seance => {
      const existingFilm = films.find(f => f.id === seance.seance_filmid);
      if (!existingFilm) return false;
      const existingStart = timeToMinutes(seance.seance_time);
      const existingEnd = existingStart + existingFilm.film_duration;
      return newSeanceStart < existingEnd && newSeanceEnd > existingStart;
    });

    if (isOverlap) {
      setNotification({ show: true, type: 'error', message: 'Ошибка: сеанс пересекается с существующим.' });
      return;
    }

    const hours = String(Math.floor(startTimeInMinutes / 60)).padStart(2, '0');
    const minutes = String(startTimeInMinutes % 60).padStart(2, '0');
    const seanceTime = `${hours}:${minutes}`;

    const params = new FormData();
    params.set('seanceHallid', String(hallId));
    params.set('seanceFilmid', String(film.id));
    params.set('seanceTime', seanceTime);
    
    try {
      await ApiService.createSeance(params);
      await refreshData();
      setNotification({ show: true, type: 'success', message: 'Сеанс добавлен перетаскиванием' });
    } catch (error) {
      console.error('Failed to add seance:', error);
      setNotification({ show: true, type: 'error', message: 'Не удалось добавить сеанс' });
    }
  };

  const handleSeanceDragEnd = async () => {
    if (draggedSeanceId.current && !dropSuccess.current) {
      if (window.confirm('Удалить сеанс?')) {
        try {
          await ApiService.deleteSeance(draggedSeanceId.current);
          await refreshData();
          setNotification({ show: true, type: 'success', message: 'Сеанс удален' });
        } catch (e) {
          setNotification({ show: true, type: 'error', message: 'Ошибка удаления сеанса' });
        }
      }
    }
    draggedSeanceId.current = null;
  };

  return (
    <>
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'danger'}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="mb-3"
        >
          {notification.message}
        </Alert>
      )}
      
      <div className="d-flex gap-2 mb-4">
        <Button variant="success" onClick={() => setShowFilmModal(true)}>
          Добавить фильм
        </Button>
        <Button variant="info" onClick={() => setShowSeanceModal(true)}>
          Добавить сеанс
        </Button>
      </div>

      <div className="mb-4">
        <h6>Доступные фильмы (перетащите в расписание):</h6>
        <div className="d-flex flex-wrap gap-2">
          {films && films.map(film => (
            <Card
              key={film.id}
              draggable
              onDragStart={() => { draggedFilm.current = film; dropSuccess.current = false; }}
              onDragEnd={() => { draggedFilm.current = null; }}
              className="draggable-film"
              style={{ width: '200px', backgroundColor: filmColors.get(film.id) }}
            >
              <Card.Body className="p-2">
                <div className="d-flex align-items-center">
                  <Image src={film.film_poster} alt={film.film_name} width={40} height={60} className="me-2" />
                  <div className="flex-grow-1">
                    <h6 className="mb-1">{film.film_name}</h6>
                    <small className="text-muted">{film.film_duration} мин.</small>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => handleDeleteFilm(film.id)}
                  >
                    ×
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h6>Расписание сеансов:</h6>
        {halls && halls.map(hall => (
          <Card key={hall.id} className="mb-3">
            <Card.Header>{hall.hall_name}</Card.Header>
            <Card.Body>
              <div
                className="seance-timeline"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, hall.id)}
              >
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="timeline-hour">
                    {hour}:00
                  </div>
                ))}
                
                {seances && seances.filter(s => s.seance_hallid === hall.id).map(seance => {
                  const film = films.find(f => f.id === seance.seance_filmid);
                  if (!film) return null;
                  const left = (timeToMinutes(seance.seance_time) / (24 * 60)) * 100;
                  const width = (film.film_duration / (24 * 60)) * 100;
                  
                  return (
                    <div
                      key={seance.id}
                      draggable
                      onDragStart={() => { draggedSeanceId.current = seance.id; dropSuccess.current = false; }}
                      onDragEnd={handleSeanceDragEnd}
                      className="seance-block"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: filmColors.get(film.id)
                      }}
                    >
                      <small>{film.film_name}</small>
                      <br />
                      <small>{seance.seance_time}</small>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Модальное окно добавления фильма */}
      <Modal show={showFilmModal} onHide={() => setShowFilmModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Добавление фильма</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddFilm}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Название фильма</Form.Label>
                  <Form.Control
                    type="text"
                    value={filmName}
                    onChange={e => setFilmName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Продолжительность (минут)</Form.Label>
                  <Form.Control
                    type="number"
                    value={filmDuration}
                    onChange={e => setFilmDuration(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={filmDescription}
                onChange={e => setFilmDescription(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Страна производства</Form.Label>
              <Form.Control
                type="text"
                value={filmOrigin}
                onChange={e => setFilmOrigin(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Постер фильма (PNG)</Form.Label>
              <Form.Control
                type="file"
                accept="image/png"
                onChange={e => setFilmPoster(e.target.files?.[0])}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowFilmModal(false)}>
                Отмена
              </Button>
              <Button variant="success" type="submit">
                Добавить фильм
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Модальное окно добавления сеанса */}
      <Modal show={showSeanceModal} onHide={() => setShowSeanceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавление сеанса</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSeance}>
            <Form.Group className="mb-3">
              <Form.Label>Зал</Form.Label>
              <Form.Select
                value={seanceHallId}
                onChange={e => setSeanceHallId(e.target.value)}
                required
              >
                <option value="">Выберите зал</option>
                {halls && halls.map(hall => (
                  <option key={hall.id} value={hall.id}>
                    {hall.hall_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Фильм</Form.Label>
              <Form.Select
                value={seanceFilmId}
                onChange={e => setSeanceFilmId(e.target.value)}
                required
              >
                <option value="">Выберите фильм</option>
                {films && films.map(film => (
                  <option key={film.id} value={film.id}>
                    {film.film_name} ({film.film_duration} мин.)
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Время начала</Form.Label>
              <Form.Control
                type="time"
                value={seanceTime}
                onChange={e => setSeanceTime(e.target.value)}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowSeanceModal(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit">
                Добавить сеанс
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

// Компонент для управления продажами
const SalesManagement = () => {
  const { halls, refreshData } = useData();
  const [selectedHallId, setSelectedHallId] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    if (halls && halls.length > 0 && !selectedHallId) {
      setSelectedHallId(halls[0].id);
    }
  }, [halls, selectedHallId]);

  const toggleSales = async (hallId) => {
    const hall = halls.find(h => h.id === hallId);
    if (!hall) return;
    
    const params = new FormData();
    params.set('hallOpen', hall.hall_open === 1 ? '0' : '1');
    
    try {
      await ApiService.updateHallOpen(hall.id, params);
      await refreshData();
      setNotification({ 
        show: true, 
        type: 'success', 
        message: hall.hall_open === 1 ? 'Продажи приостановлены' : 'Продажи открыты' 
      });
    } catch (error) {
      console.error('Failed to toggle sales:', error);
      setNotification({ show: true, type: 'error', message: 'Ошибка изменения статуса продаж' });
    }
  };

  const selectedHall = halls && halls.find(h => h.id === selectedHallId);

  return (
    <>
      {notification.show && (
        <Alert 
          variant={notification.type === 'success' ? 'success' : 'danger'}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="mb-3"
        >
          {notification.message}
        </Alert>
      )}
      
      <Form.Group className="mb-4">
        <Form.Label>Выберите зал:</Form.Label>
        <ButtonGroup>
          {halls && halls.map(hall => (
            <Button
              key={hall.id}
              variant={selectedHallId === hall.id ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedHallId(hall.id)}
              className="text-uppercase"
            >
              {hall.hall_name}
            </Button>
          ))}
        </ButtonGroup>
      </Form.Group>

      {selectedHall && (
        <Card className="text-center">
          <Card.Body>
            <Card.Title>
              Статус продаж для зала "{selectedHall.hall_name}"
            </Card.Title>
            
            <Badge bg={selectedHall.hall_open === 1 ? 'success' : 'danger'} className="fs-5 mb-4 p-3">
              {selectedHall.hall_open === 1 ? 'Продажи открыты' : 'Продажи закрыты'}
            </Badge>
            
            <div className="mt-4">
              <Button
                variant={selectedHall.hall_open === 1 ? 'danger' : 'success'}
                size="lg"
                onClick={() => toggleSales(selectedHall.id)}
              >
                {selectedHall.hall_open === 1 ? 'Приостановить продажи' : 'Открыть продажи'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

// Главный компонент админ-панели
const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <Container className="py-4">
      <Card className="shadow">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">Админ-панель кинотеатра</h1>
            <Button 
              variant="outline-danger"
              onClick={handleLogout}
            >
              Выйти из системы
            </Button>
          </div>
          
          <Alert variant="success" className="mb-4">
            <Alert.Heading>Добро пожаловать в систему управления кинотеатром!</Alert.Heading>
            <p className="mb-0">
              Здесь вы можете управлять залами, фильмами, сеансами и продажами билетов.
            </p>
          </Alert>
          
          <Accordion defaultActiveKey="0" className="mb-4">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Быстрые действия</Accordion.Header>
              <Accordion.Body>
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => document.getElementById('halls-management')?.scrollIntoView({ behavior: 'smooth' })}>
                    Управление залами
                  </Button>
                  <Button variant="success" onClick={() => document.getElementById('seance-management')?.scrollIntoView({ behavior: 'smooth' })}>
                    Управление фильмами
                  </Button>
                  <Button variant="info" onClick={() => document.getElementById('price-configuration')?.scrollIntoView({ behavior: 'smooth' })}>
                    Настройка цен
                  </Button>
                  <Button variant="warning" onClick={() => document.getElementById('sales-management')?.scrollIntoView({ behavior: 'smooth' })}>
                    Управление продажами
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {/* Управление залами */}
          <div id="halls-management">
            <AdminSection title="Управление залами" initiallyOpen={true}>
              <HallsManagement />
            </AdminSection>
          </div>

          {/* Конфигурация залов */}
          <div id="hall-configuration">
            <AdminSection title="Конфигурация залов">
              <HallConfiguration />
            </AdminSection>
          </div>

          {/* Конфигурация цен */}
          <div id="price-configuration">
            <AdminSection title="Конфигурация цен">
              <PriceConfiguration />
            </AdminSection>
          </div>

          {/* Управление сеансами */}
          <div id="seance-management">
            <AdminSection title="Управление сеансами">
              <SeanceManagement />
            </AdminSection>
          </div>

          {/* Управление продажами */}
          <div id="sales-management">
            <AdminSection title="Управление продажами">
              <SalesManagement />
            </AdminSection>
          </div>
        </Card.Body>
      </Card>
      
      {/* Добавляем стили */}
      <style>{`
        .seat {
          width: 30px;
          height: 30px;
          margin: 2px;
          border: 1px solid #666;
          border-radius: 3px;
          cursor: pointer;
        }
        .seat-standart {
          background-color: #6c757d;
        }
        .seat-vip {
          background-color: #ffc107;
        }
        .seat-disabled {
          background-color: #f8f9fa;
        }
        .draggable-film {
          cursor: grab;
        }
        .draggable-film:active {
          cursor: grabbing;
        }
        .seance-timeline {
          position: relative;
          height: 60px;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow: hidden;
        }
        .timeline-hour {
          position: absolute;
          top: 0;
          bottom: 0;
          width: calc(100% / 24);
          border-right: 1px solid #e9ecef;
          font-size: 10px;
          padding: 2px;
          color: #6c757d;
          text-align: center;
        }
        .seance-block {
          position: absolute;
          top: 10px;
          bottom: 10px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 3px;
          padding: 5px;
          overflow: hidden;
          cursor: move;
        }
        .bg-purple {
          background-color: #63536C !important;
        }
      `}</style>
    </Container>
  );
};

export default AdminDashboard;