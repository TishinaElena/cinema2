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

const AdminSection = ({ title, children, initiallyOpen = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  
  return (
    <Card className="card-line">
      <Card.Header 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple text-white d-flex align-items-center"
        style={{ cursor: 'pointer' }}
      >
        <div className="admin-section-icon"></div>
        <h5 className="mb-0 flex-grow-1 admin-section-title" style={{ textAlign: 'left' }}>
          {title}
        </h5>
        <span className="admin-section-toggle">{isOpen ? '−' : '+'}</span>
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
      //setNotification({ show: true, type: 'success', message: 'Зал успешно создан' });
    } catch (error) {
      console.error('Failed to create hall:', error);
      //setNotification({ show: true, type: 'error', message: 'Не удалось создать зал' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHall = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот зал? Все связанные сеансы также будут удалены.')) {
      try {
        await ApiService.deleteHall(id);
        await refreshData();
        //setNotification({ show: true, type: 'success', message: 'Зал успешно удален' });
      } catch (error) {
        console.error('Failed to delete hall:', error);
        //setNotification({ show: true, type: 'error', message: 'Не удалось удалить зал' });
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
      
      <div className="mb-3">
        <h6>Доступные залы:</h6>
        <ListGroup>
          {halls && halls.map(hall => (
            <ListGroup.Item key={hall.id} className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center w-100">
                <span className="fw-bold me-2"> - {hall.hall_name}</span>
                <div className=" d-flex align-items-center">
                  <button 
                    onClick={() => handleDeleteHall(hall.id)}
                    className="btn btn-link p-0 border-0 d-flex align-items-center justify-content-center"
                    style={{ 
                      width: '12px', 
                      height: '12px',
                      background: 'transparent',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Удалить зал"
                  >
                    <img 
                      src={`${process.env.PUBLIC_URL}/images/delete.png`} 
                      alt="Удалить" 
                      style={{ 
                        width: '12px', 
                        height: '12px',
                        objectFit: 'contain',
                        display: 'block'
                      }} 
                    />
                  </button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      <div className="text-left">
        <Button 
        className='button'
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
        >
          СОЗДАТЬ ЗАЛ
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
        <div className="mb-2">Выберите зал для конфигурации:</div>
        <div className="d-flex flex-wrap gap-0 mt-2">
          {halls && halls.map(hall => {
            const isActive = selectedHallId === hall.id;
            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => handleHallSelect(hall.id)}
                style={{
                  width: isActive ? '90px' : '81px',
                  height: isActive ? '46px' : '42px',
                  background: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.45)',
                  border: 'none',
                  borderRadius: '3px',
                  fontFamily: 'Roboto',
                  fontWeight: 900,
                  fontSize: '15px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                  textTransform: 'uppercase',
                  color: '#000000',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive 
                    ? '0px 3px 3px 0px rgba(0, 0, 0, 0.24)' 
                    : '0px 0px 3px 0px rgba(0, 0, 0, 0.12)'
                }}
                className="hall-select-button"
              >
                {hall.hall_name}
              </button>
            );
          })}
        </div>
      </Form.Group>

      {selectedHallId && (
        <>
          <Row className="mb-4">
            <div className="mb-2">Укажите количество рядов  и максимальное количество кресел в ряду:</div>
            <div className="d-flex align-items-end gap-3">
              <div style={{ flex: '0 0 120px' }}>
                <div style={{
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '14px',
                  letterSpacing: '0%',
                  marginBottom: '4px',
                  color: 'rgba(132, 132, 132, 1)'
                }}>
                  Рядов, шт
                </div>
                <Form.Control
                  type="number"
                  value={rows}
                  onChange={e => handleGridSizeChange(Number(e.target.value), places)}
                  min="1"
                  style={{
                    height: '38px',
                    padding: '8px 12px'
                  }}
                />
              </div>
              
              <div style={{
                fontSize: '20px',
                color: 'rgba(132, 132, 132, 1)',
                lineHeight: '38px',
                marginBottom: '4px'
              }}>
                ×
              </div>
              
              <div style={{ flex: '0 0 120px' }}>
                <div style={{
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '14px',
                  letterSpacing: '0%',
                  marginBottom: '4px',
                  color: 'rgba(132, 132, 132, 1)'
                }}>
                  Мест, шт
                </div>
                <Form.Control
                  type="number"
                  value={places}
                  onChange={e => handleGridSizeChange(rows, Number(e.target.value))}
                  min="1"
                  style={{
                    height: '38px',
                    padding: '8px 12px'
                  }}
                />
              </div>
            </div>
          </Row>

          <div className="mb-4">
            <div className="mb-2" style={{
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '16px',
              letterSpacing: '0%',
              color: 'rgba(132, 132, 132, 1)'
            }}>
              Теперь вы можете указать типы кресел на схеме зала:
            </div>
            <div className="d-flex gap-3 mb-3" style={{ 
              backgroundColor: 'transparent',
              padding: '10px 0'
            }}>
              <div className="d-flex align-items-center gap-1" style={{
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: 'rgba(132, 132, 132, 1)'
              }}>
                <div className="seat-icon seat-standart-icon"></div>
                - обычные кресла
              </div>
              <div className="d-flex align-items-center gap-1" style={{
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: 'rgba(132, 132, 132, 1)'
              }}>
                <div className="seat-icon seat-vip-icon"></div>
                - VIP кресла
              </div>
              <div className="d-flex align-items-center gap-1" style={{
                fontFamily: 'Roboto',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '16px',
                letterSpacing: '0%',
                color: 'rgba(132, 132, 132, 1)'
              }}>
                <div className="seat-icon seat-disabled-icon"></div>
                - заблокированные (нет кресла)
              </div>
            </div>
            <p className="text-muted small">
              Чтобы изменить вид кресла, нажмите по нему левой кнопкой мыши
            </p>
          </div>

          <Card className="mb-4 seat-config-card" style={{ border: '1px solid rgba(0, 0, 0, 1)' }}>
            <Card.Body>
              <div className="text-center mb-2 pb-2">
      <h5 style={{
        fontFamily: 'Roboto',
        fontWeight: 400,
        fontSize: '16px',
        lineHeight: '18px',
        letterSpacing: '19px',
        textAlign: 'center',
        textTransform: 'uppercase',
        margin: 0,
        color: '#000',
        paddingLeft: '15px',
      }}>
        ЭКРАН
      </h5>
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

          <div className="d-flex justify-content-center gap-2 mb-2">
            <Button className="button white-button" variant="secondary" onClick={() => selectedHallId && handleHallSelect(selectedHallId)}>
              ОТМЕНА
            </Button>
            <Button className="button" variant="primary" onClick={handleSaveConfig}>
              СОХРАНИТЬ
            </Button>
          </div>
        </>
      )}

      {/* Добавляем стили для иконок кресел */}
      <style jsx>{`
        .seat-icon {
          width: 20px;
          height: 20px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .seat-standart-icon {
          background-color: rgba(196, 196, 196, 1);
          border: 1px solid rgba(57, 57, 57, 1);
        }
        .seat-vip-icon {
          background-color: rgba(176, 214, 216, 1);
          border: 1px solid rgba(10, 130, 138, 1);
        }
        .seat-disabled-icon {
          background-color: rgba(248, 249, 250, 0);
          border: 1px solid rgba(132, 132, 132, 1);
        }
      `}</style>
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
        <div className="mb-2">Выберите зал для настройки цен:</div>
        <div className="d-flex flex-wrap gap-0 mt-2">
          {halls && halls.map(hall => {
            const isActive = selectedHallId === hall.id;
            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => handleHallSelect(hall.id)}
                style={{
                  width: isActive ? '90px' : '81px',
                  height: isActive ? '46px' : '42px',
                  background: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.45)',
                  border: 'none',
                  borderRadius: '3px',
                  fontFamily: 'Roboto',
                  fontWeight: 900,
                  fontSize: '15px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                  textTransform: 'uppercase',
                  color: '#000000',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive 
                    ? '0px 3px 3px 0px rgba(0, 0, 0, 0.24)' 
                    : '0px 0px 3px 0px rgba(0, 0, 0, 0.12)'
                }}
                className="hall-select-button"
              >
                {hall.hall_name}
              </button>
            );
          })}
        </div>
      </Form.Group>

      {selectedHallId && (
        <>
          <div className="mb-2">Установите цены для типов кресел:</div>
          
          <div className="d-flex align-items-center gap-2 mb-2">
            <div style={{ flex: '0 0 100px' }}>
              <Form.Control
                type="number"
                value={priceStandart}
                onChange={e => setPriceStandart(e.target.value)}
                min="0"
                style={{
                  width: '100px',
                  height: '36px',
                  padding: '8px 12px'
                }}
              />
            </div>
            
            <div className="d-flex align-items-center gap-1" style={{
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '16px',
              letterSpacing: '0%',
              color: 'rgba(132, 132, 132, 1)'
            }}>
              за <div className="seat-icon seat-standart-icon"></div> обычные кресла
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mb-4">
            <div style={{ flex: '0 0 100px' }}>
              <Form.Control
                type="number"
                value={priceVip}
                onChange={e => setPriceVip(e.target.value)}
                min="0"
                style={{
                  width: '100px',
                  height: '36px',
                  padding: '8px 12px'
                }}
              />
            </div>
            
            <div className="d-flex align-items-center gap-1" style={{
              fontFamily: 'Roboto',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '16px',
              letterSpacing: '0%',
              color: 'rgba(132, 132, 132, 1)'
            }}>
              за <div className="seat-icon seat-vip-icon"></div> VIP кресла
            </div>
          </div>

          <div className="d-flex justify-content-center gap-2 mb-2">
            <Button className='button white-button' variant="secondary" onClick={() => selectedHallId && handleHallSelect(selectedHallId)}>
              ОТМЕНА
            </Button>
            <Button className='button' variant="primary" onClick={handleSavePrice}>
              СОХРАНИТЬ
            </Button>
          </div>
          
          <style jsx>{`
            .seat-icon {
              width: 20px;
              height: 20px;
              border-radius: 3px;
              flex-shrink: 0;
              margin: 0 4px;
            }
            .seat-standart-icon {
              background-color: rgba(196, 196, 196, 1);
              border: 1px solid rgba(57, 57, 57, 1);
            }
            .seat-vip-icon {
              background-color: rgba(176, 214, 216, 1);
              border: 1px solid rgba(10, 130, 138, 1);
            }
          `}</style>
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
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [filmName, setFilmName] = useState('');
  const [filmDuration, setFilmDuration] = useState('');
  const [filmDescription, setFilmDescription] = useState('');
  const [filmOrigin, setFilmOrigin] = useState('');
  const [filmPoster, setFilmPoster] = useState(null);
  const [seanceHallId, setSeanceHallId] = useState('');
  const [seanceFilmId, setSeanceFilmId] = useState('');
  const [seanceTime, setSeanceTime] = useState('12:00');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  const [draggedFilmId, setDraggedFilmId] = useState(null);
  const [targetHallId, setTargetHallId] = useState(null);
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 });

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

  // Функция для округления времени до ближайших 15 минут
  const roundTo15Minutes = (minutes) => {
    const remainder = minutes % 15;
    if (remainder < 7.5) {
      return minutes - remainder;
    } else {
      return minutes + (15 - remainder);
    }
  };

  // Функция для преобразования времени в минуты с округлением
  const roundTimeTo15Minutes = (hours, minutes) => {
    const totalMinutes = hours * 60 + minutes;
    const roundedMinutes = roundTo15Minutes(totalMinutes);
    
    // Убедимся, что время в пределах суток
    const finalMinutes = Math.min(Math.max(roundedMinutes, 0), 23 * 60 + 45);
    
    const roundedHours = Math.floor(finalMinutes / 60);
    const roundedMins = finalMinutes % 60;
    
    return `${roundedHours.toString().padStart(2, '0')}:${roundedMins.toString().padStart(2, '0')}`;
  };

  // Функция для получения времени из позиции на шкале с округлением
  const getTimeFromPosition = (x, width) => {
    const totalMinutes = 24 * 60;
    const startTimeInMinutes = (x / width) * totalMinutes;
    
    // Округляем до ближайших 15 минут
    const roundedMinutes = roundTo15Minutes(startTimeInMinutes);
    
    // Ограничиваем время в пределах 0:00 - 23:45
    const finalMinutes = Math.min(Math.max(roundedMinutes, 0), 23 * 60 + 45);
    
    const hours = Math.floor(finalMinutes / 60);
    const minutes = finalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Функция добавления фильма
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

  // Функция удаления фильма
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

  // Функция добавления сеанса через модальное окно (с округлением)
  const handleAddSeance = async (e) => {
    e.preventDefault();
    if (!seanceHallId || !seanceFilmId || !seanceTime) {
      setNotification({ show: true, type: 'warning', message: 'Пожалуйста, заполните все поля' });
      return;
    }
    
    // Округляем время до 15 минут при отправке
    const [hours, minutes] = seanceTime.split(':').map(Number);
    const roundedTime = roundTimeTo15Minutes(hours, minutes);
    
    const params = new FormData();
    params.set('seanceHallid', seanceHallId);
    params.set('seanceFilmid', seanceFilmId);
    params.set('seanceTime', roundedTime);
    
    try {
      await ApiService.createSeance(params);
      await refreshData();
      setShowSeanceModal(false);
      setSeanceHallId(''); setSeanceFilmId(''); setSeanceTime('12:00');
      //({ show: true, type: 'success', message: `Сеанс успешно добавлен на ${roundedTime}` });
    } catch (error) {
      console.error('Failed to add seance:', error);
      //setNotification({ show: true, type: 'error', message: 'Не удалось добавить сеанс' });
    }
  };

  // Функция добавления сеанса через перетаскивание
  const handleAddSeanceFromDrag = async () => {
    if (!draggedFilmId || !targetHallId || !seanceTime) {
      setNotification({ show: true, type: 'warning', message: 'Пожалуйста, заполните все поля' });
      return;
    }
    
    // Округляем время до 15 минут
    const [hours, minutes] = seanceTime.split(':').map(Number);
    const roundedTime = roundTimeTo15Minutes(hours, minutes);
    
    const params = new FormData();
    params.set('seanceHallid', targetHallId);
    params.set('seanceFilmid', draggedFilmId);
    params.set('seanceTime', roundedTime);
    
    try {
      await ApiService.createSeance(params);
      await refreshData();
      setShowTimeModal(false);
      setDraggedFilmId(null);
      setTargetHallId(null);
      setSeanceTime('12:00');
      //setNotification({ show: true, type: 'success', message: `Сеанс успешно добавлен на ${roundedTime}` });
    } catch (error) {
      console.error('Failed to add seance:', error);
      //setNotification({ show: true, type: 'error', message: 'Не удалось добавить сеанс' });
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Обработка начала перетаскивания фильма
  const handleFilmDragStart = (e, film) => {
    draggedFilm.current = film;
    setDraggedFilmId(film.id);
    dropSuccess.current = false;
    e.dataTransfer.setData('text/plain', film.id);
  };

  // Обработка окончания перетаскивания фильма
  const handleFilmDragEnd = () => {
    draggedFilm.current = null;
    if (!dropSuccess.current) {
      setDraggedFilmId(null);
    }
  };

  // Обработка сброса фильма на временную шкалу
  const handleDrop = (e, hallId) => {
    e.preventDefault();
    if (!draggedFilm.current) return;
    
    dropSuccess.current = true;
    setTargetHallId(hallId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    setDropPosition({ x: dropX, y: e.clientY - rect.top });
    
    // Получаем округленное время из позиции сброса
    const roundedTime = getTimeFromPosition(dropX, rect.width);
    
    // Устанавливаем округленное время
    setSeanceTime(roundedTime);
    
    setShowTimeModal(true);
  };

  // Проверка пересечения сеансов
  const checkSeanceOverlap = (hallId, filmId, time) => {
    const film = films.find(f => f.id === filmId);
    if (!film) return false;
    
    const hallSeances = seances.filter(s => s.seance_hallid === hallId);
    const newSeanceStart = timeToMinutes(time);
    const newSeanceEnd = newSeanceStart + film.film_duration;

    const isOverlap = hallSeances.some(seance => {
      const existingFilm = films.find(f => f.id === seance.seance_filmid);
      if (!existingFilm) return false;
      const existingStart = timeToMinutes(seance.seance_time);
      const existingEnd = existingStart + existingFilm.film_duration;
      return newSeanceStart < existingEnd && newSeanceEnd > existingStart;
    });

    return isOverlap;
  };

  // Обработка перетаскивания сеанса (удаление)
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

  // Функция для отображения времени с округлением
  const displayTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return roundTimeTo15Minutes(hours, minutes);
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
        <Button className='button' variant="success" onClick={() => setShowFilmModal(true)}>
          ДОБАВИТЬ ФИЛЬМ
        </Button>

      </div>



      <div className="mb-4">
        <div className="d-flex flex-wrap gap-3">
          {films && films.map(film => (
            <Card
              key={film.id}
              draggable
              onDragStart={(e) => handleFilmDragStart(e, film)}
              onDragEnd={handleFilmDragEnd}
              className="draggable-film"
              style={{
                width: '259px',
                height: '52px',
                backgroundColor: filmColors.get(film.id),
                borderRadius: '0',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                cursor: 'grab',
                padding: '0',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div className="d-flex h-100">
                <div style={{
                  width: '40px',
                  height: '52px',
                  flexShrink: 0
                }}>
                  <Image 
                    src={film.film_poster} 
                    alt={film.film_name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRight: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
                
                <div style={{ 
                  flex: 1,
                  padding: '3px 8px 2px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingRight: '24px',
                  minHeight: 0
                }}>
                  <div style={{
                    fontFamily: 'Roboto',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '15px',
                    color: '#000000',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                    flex: '1 1 auto',
                    minHeight: 0
                  }}>
                    {film.film_name}
                  </div>
                  
                  <div style={{
                    fontFamily: 'Roboto',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '15px',
                    color: 'rgba(0, 0, 0, 0.8)',
                    flexShrink: 0,
                    height: '15px'
                  }}>
                    {film.film_duration} минут
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => handleDeleteFilm(film.id)}
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  background: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  width: '20px',
                  height: '20px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  boxShadow: '0px 3px 3px 0px rgba(0, 0, 0, 0.24)'
                }}
                title="Удалить фильм"
              >
                <img 
                  src={`${process.env.PUBLIC_URL}/images/delete.png`} 
                  alt="Удалить" 
                  style={{ 
                    width: '10px', 
                    height: '10px',
                    objectFit: 'contain',
                    display: 'block'
                  }} 
                />
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div style={{
        paddingLeft: '35px',
        paddingRight: '100px'
      }}>
        {halls && halls.map(hall => {
          const hallSeances = seances && seances.filter(s => s.seance_hallid === hall.id);
          const seanceStartTimes = hallSeances ? 
            [...new Set(hallSeances.map(s => s.seance_time))].sort() : [];
          
          return (
            <div key={hall.id} className="mb-1" style={{ borderRadius: '0' }}>
              <div style={{
                backgroundColor: 'transparent',
                color: '#000000',
                padding: '0',
                height: '18px',
                marginBottom: '1px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'Roboto',
                  fontWeight: 500,
                  fontSize: '16px',
                  lineHeight: '18px',
                  letterSpacing: '0%',
                  textTransform: 'uppercase',
                  height: '18px',
                  paddingLeft: '0px',
                  backgroundColor: 'transparent',
                  display: 'block'
                }}>
                  {hall.hall_name}
                </span>
              </div>
              
              <Card className="mb-1" style={{ borderRadius: '0', border: '1px solid #dee2e6' }}>
                <Card.Body className="p-0" style={{ position: 'relative' }}>
                  <div
                    className="seance-timeline"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, hall.id)}
                    style={{
                      position: 'relative',
                      height: '60px',
                      backgroundColor: '#f8f9fa00',
                      borderRadius: '1px',
                      border: '1px solid rgba(132, 132, 132, 1)',
                      overflow: 'hidden',
                      marginBottom: '5px',
                      position: 'relative'
                    }}
                  >
                    {/* Убрали полоски-разделители - оставляем чистую шкалу */}
                    
                    {/* Подсказка при перетаскивании */}
                    {draggedFilm.current && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 123, 255, 0.05)',
                        border: '2px dashed rgba(0, 123, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#007bff',
                        fontSize: '14px',
                        pointerEvents: 'none'
                      }}>
                        Отпустите, чтобы добавить сеанс (время округлится до 15 минут)
                      </div>
                    )}

                    {seances && seances.filter(s => s.seance_hallid === hall.id).map(seance => {
                      const film = films.find(f => f.id === seance.seance_filmid);
                      if (!film) return null;
                      
                      const left = (timeToMinutes(seance.seance_time) / (24 * 60)) * 100;
                      const width = (film.film_duration / (24 * 60)) * 100;
                      const filmColor = filmColors.get(film.id) || '#85FF89';
                      
                      const timelineWidth = 24 * 60;
                      const minWidthPercent = (72 / timelineWidth) * 100;
                      
                      return (
                        <div
                          key={seance.id}
                          draggable
                          onDragStart={() => { 
                            draggedSeanceId.current = seance.id; 
                            dropSuccess.current = false; 
                          }}
                          onDragEnd={handleSeanceDragEnd}
                          className="seance-block"
                          style={{
                            position: 'absolute',
                            top: '10px',
                            bottom: '10px',
                            left: `${left}%`,
                            width: `${Math.max(width, minWidthPercent)}%`,
                            minWidth: '72px',
                            backgroundColor: filmColor,
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '1px',
                            padding: '10px 10px',
                            overflow: 'hidden',
                            cursor: 'move',
                            boxSizing: 'border-box',
                            height: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'flex-start'
                          }}
                          title={`${film.film_name} - ${seance.seance_time}\nПеретащите для удаления`}
                        >
                          <div style={{
                            fontFamily: 'Roboto',
                            fontWeight: 500,
                            fontSize: '10px',
                            lineHeight: '10px',
                            color: '#000000',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word',
                            maxHeight: '20px',
                            width: '100%',
                            textAlign: 'left',
                            margin: '0'
                          }}>
                            {film.film_name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '18px',
                    left: 0,
                    right: 0,
                    height: '10px'
                  }}>
                    {seanceStartTimes.map((time, index) => {
                      const left = (timeToMinutes(time) / (24 * 60)) * 100;
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            left: `${left}%`,
                            width: '1px',
                            height: '5px',
                            backgroundColor: '#000000',
                            transform: 'translateX(-50%)'
                          }}
                        />
                      );
                    })}
                  </div>
                  
                  <div style={{
                    position: 'relative',
                    height: '20px',
                    marginTop: '8px'
                  }}>
                    {seanceStartTimes.map((time, index) => {
                      const left = (timeToMinutes(time) / (24 * 60)) * 100;
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            left: `${left}%`,
                            transform: 'translateX(-50%)',
                            fontFamily: 'Roboto',
                            fontWeight: 400,
                            fontSize: '10px',
                            lineHeight: '12px',
                            color: '#000000',
                            whiteSpace: 'nowrap',
                            textAlign: 'center',
                            minWidth: '40px'
                          }}
                        >
                          {time}
                        </div>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </div>
          );
        })}
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

      {/* Модальное окно добавления сеанса (из кнопки) */}
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
              <Form.Label>Время начала (округляется до 15 минут)</Form.Label>
              <Form.Control
                type="time"
                value={seanceTime}
                onChange={e => setSeanceTime(e.target.value)}
                step="900" // 15 минут в секундах
                required
              />
              <Form.Text className="text-muted">
                Время будет округлено до ближайших 15 минут (0, 15, 30, 45)
              </Form.Text>
              {seanceHallId && seanceFilmId && seanceTime && 
                checkSeanceOverlap(seanceHallId, seanceFilmId, displayTime(seanceTime)) && (
                  <Form.Text className="text-danger">
                    Внимание! Сеанс пересекается с существующим сеансом.
                  </Form.Text>
                )}
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowSeanceModal(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit" 
                disabled={seanceHallId && seanceFilmId && seanceTime && 
                  checkSeanceOverlap(seanceHallId, seanceFilmId, displayTime(seanceTime))}>
                Добавить сеанс на {displayTime(seanceTime)}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Модальное окно добавления сеанса (из перетаскивания) */}
      <Modal show={showTimeModal} onHide={() => {
        setShowTimeModal(false);
        setDraggedFilmId(null);
        setTargetHallId(null);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Добавление сеанса</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddSeanceFromDrag();
          }}>
            <Form.Group className="mb-3">
              <Form.Label>Фильм</Form.Label>
              <Form.Control
                type="text"
                value={films?.find(f => f.id === draggedFilmId)?.film_name || ''}
                disabled
                readOnly
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Зал</Form.Label>
              <Form.Control
                type="text"
                value={halls?.find(h => h.id === targetHallId)?.hall_name || ''}
                disabled
                readOnly
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Время начала (округляется до 15 минут)</Form.Label>
              <Form.Control
                type="time"
                value={seanceTime}
                onChange={e => setSeanceTime(e.target.value)}
                step="900" // 15 минут в секундах
                required
              />
              <Form.Text className="text-muted">
                Время автоматически определено из позиции перетаскивания и округлено до 15 минут.
              </Form.Text>
              {draggedFilmId && targetHallId && seanceTime && 
                checkSeanceOverlap(targetHallId, draggedFilmId, displayTime(seanceTime)) && (
                  <Form.Text className="text-danger">
                    Внимание! Сеанс пересекается с существующим сеансом.
                  </Form.Text>
                )}
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => {
                setShowTimeModal(false);
                setDraggedFilmId(null);
                setTargetHallId(null);
              }}>
                Отмена
              </Button>
              <Button variant="primary" type="submit" 
                disabled={draggedFilmId && targetHallId && seanceTime && 
                  checkSeanceOverlap(targetHallId, draggedFilmId, displayTime(seanceTime))}>
                Добавить сеанс на {displayTime(seanceTime)}
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
        <div className="mb-3">Выберите зал для открытия/закрытия продаж:</div>


        <div className="d-flex flex-wrap gap-0 mt-2">
          {halls && halls.map(hall => {
            const isActive = selectedHallId === hall.id;
            return (
              <button
                key={hall.id}
                type="button"
                onClick={() => setSelectedHallId(hall.id)}
                style={{
                  width: isActive ? '90px' : '81px',
                  height: isActive ? '46px' : '42px',
                  background: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.45)',
                  border: 'none',
                  borderRadius: '3px',
                  fontFamily: 'Roboto',
                  fontWeight: 900,
                  fontSize: '15px',
                  lineHeight: '16px',
                  letterSpacing: '0%',
                  textTransform: 'uppercase',
                  color: '#000000',
                  verticalAlign: 'middle',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive 
                    ? '0px 3px 3px 0px rgba(0, 0, 0, 0.24)' 
                    : '0px 0px 3px 0px rgba(0, 0, 0, 0.12)'
                }}
                className="hall-select-button"
              >
                {hall.hall_name}
              </button>
            );
          })}
        </div>
      </Form.Group>

      {selectedHall && (
        <Card className="text-center" >
          <Card.Body style={{
                paddingLeft: '16px'
                }}>
        
            <div  className="mb-2 p-2">
              {selectedHall.hall_open === 1 ? 'Продажи открыты' : 'Всё готово к открытию'}
            </div>
            
            <div className="mt-4">
              <Button
              className='button'
                variant={selectedHall.hall_open === 1 ? 'danger' : 'success'}
                size="lg"
                onClick={() => toggleSales(selectedHall.id)}
              >
                {selectedHall.hall_open === 1 ? 'ЗАКРЫТЬ ПРОДАЖУ БИЛЕТОВ' : 'ОТКРЫТЬ ПРОДАЖУ БИЛЕТОВ'}
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
  
  useEffect(() => {
    // Устанавливаем правильные стили для body
    document.body.style.backgroundImage = `url(${process.env.PUBLIC_URL}/images/admin-bg.jpg)`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center";
    document.body.style.minHeight = "100vh";
    
    // Добавляем классы
    document.body.classList.add('admin-page', 'admin-dashboard-page');
    
    return () => {
      // Восстанавливаем оригинальные стили
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.minHeight = '';
      
      document.body.classList.remove('admin-page', 'admin-dashboard-page');
    };
  }, []);

  return (
    <Container className="admin-login-page">
      <header className="user-page__header">
        <div className="user-page__logo admin-logo">
          <div className="logo-container">
            {/* Первая строка */}
            <div className="logo-line logo-main">
              <span className="user-page__logo-bold">ИДЁМ</span>
              <span className="user-page__logo-thin">В</span>
              <span className="user-page__logo-bold">КИНО</span>
            </div>
            {/* Вторая строка */}
            <div className="logo-line logo-admin">
              АДМИНИСТРАТОРРРСКАЯ
            </div>
          </div>
        </div>
      </header>
      <main className="admin-dashboard-main">
        {/* Управление залами */}
        <div id="halls-management">
          <AdminSection title="УПРАВЛЕНИЕ ЗАЛАМИ" initiallyOpen={true} className="halls-section">
            <HallsManagement />
          </AdminSection>
        </div>

        {/* Конфигурация залов */}
        <div id="hall-configuration">
          <AdminSection title="КОНФИГУРАЦИЯ ЗАЛОВ" className="config-section">
            <HallConfiguration />
          </AdminSection>
        </div>

        {/* Конфигурация цен */}
        <div id="price-configuration">
          <AdminSection title="КОНФИГУРАЦИЯ ЦЕН" className="price-section">
            <PriceConfiguration />
          </AdminSection>
        </div>

        {/* Управление сеансами */}
        <div id="seance-management">
          <AdminSection title="СЕТКА СЕАНСОВ" className="seance-section">
            <SeanceManagement />
          </AdminSection>
        </div>

        {/* Управление продажами */}
        <div id="sales-management">
          <AdminSection title="ОТКРЫТЬ ПРОДАЖИ" className="sales-section">
            <SalesManagement />
          </AdminSection>
        </div>
      </main>
      
      {/* Добавляем стили */}
      <style>{`
  .admin-dashboard-main {
    max-width: 962px;
    margin: 0 auto;
    width: 100%;
    padding: 0 15px;
  }
  
  .admin-section-title {
  margin-left: 20px;
}

@media (max-width: 767px) {
  .admin-section-title {
    margin-left: 12px;
  }
}
  .admin-dashboard-main .card {
    max-width: 100%;
  }

  /* Убираем скругление и обводку у всех карточек */
  .admin-card,
  .admin-dashboard-main .card,
  .admin-dashboard-main .card-header,
  .admin-dashboard-main .card-body {
    border-radius: 0 !important;
    border: none !important;
  }

  /* Стили для заголовков карточек */
  .admin-dashboard-main .card-header {
    height: 95px;
    display: flex;
    align-items: center;
    background-color: #63536C !important;
    color: white !important;
    padding: 0 20px;
    position: relative;
  }
  
  .admin-dashboard-main .card-header h5 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
  }
  
  /* Иконка перед заголовком */
  .admin-section-icon {
    width: 44px;
    height: 44px;
    border: 4px solid rgba(188, 149, 214, 1);
    background: rgba(255, 255, 255, 1);
    border-radius: 50%;
    flex-shrink: 0;
    margin-right: 20px;
    margin-left: 20px;
    position: relative;
  }
  
  /* Кнопка сворачивания/разворачивания */
  .admin-section-toggle {
    font-size: 1.5rem;
    font-weight: bold;
    flex-shrink: 0;
    margin-left: 20px;
    width: 30px;
    text-align: center;
  }
  
  /* Для десктопных и планшетных версий (ширина от 768px) */
  @media (min-width: 768px) {
    .admin-dashboard-main .card-header {
      height: 95px;
      position: relative;

    }

        .admin-dashboard-main .card .card-body {
      position: relative;
      padding-left: 105px; /* Отступ для всего контента */
    }

    /* Убираем отступ для карточки с креслами */
    .admin-dashboard-main .card.seat-config-card .card-body {
      padding-left: 15px !important; /* Или другое значение, которое вам нужно */
    }
        .card-line {
      position: relative;
      overflow: visible !important;
    }
          
    /* Вертикальная линия слева от контента */
    .card-line::before {
      content: '';
      position: absolute;
      left: 60px; /* 40px от левого края карточки */
      top: 95px;
      bottom: 0;
      width: 4px;
      z-index: 10;
       background-color: #BC95D6 !important; /* Используем hex вместо rgba для большей насыщенности */
       opacity: 1 !important;
    }
      
     /* Убираем ::after для УПРАВЛЕНИЯ ПРОДАЖАМИ */
    #sales-management .card-line::before {
      display: none;
    }
    
    .admin-section-icon {
      width: 44px;
      height: 44px;
      border-width: 4px;
      margin-right: 20px;
      margin-left: 20px;
      position: relative;
    }
    
    /* Вертикальная линия от низа круга до низа заголовка */
    .admin-section-icon::after {
      content: '';
      position: absolute;
      bottom: -29px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 29px;
      background-color: rgba(188, 149, 214, 1);
    }
    
    /* Вертикальная линия от верха круга до верха заголовка */
    .admin-section-icon::before {
      content: '';
      position: absolute;
      bottom: 37px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 29px;
      background-color: rgba(188, 149, 214, 1);
    }
    
    /* Убираем ::before для УПРАВЛЕНИЯ ЗАЛАМИ */
    #halls-management .admin-section-icon::before {
      display: none;
    }
    
    /* Убираем ::after для УПРАВЛЕНИЯ ПРОДАЖАМИ */
    #sales-management .admin-section-icon::after {
      display: none;
    }
  }

   /* Переопределяем border для карточки с креслами */
  .admin-dashboard-main .card.seat-config-card {
    border: 1px solid rgba(0, 0, 0, 1) !important;
    
  }

  .seat {
    width: 26px;
    height: 26px;
    margin: 2px;
    border: 1px solid #666;
    border-radius: 3px;
    cursor: pointer;
  }
  .seat-standart {
    background-color: rgba(196, 196, 196, 1);
    border: 1px solid rgba(57, 57, 57, 1);
  }
  .seat-vip {
    background-color: rgba(176, 214, 216, 1);
    border: 1px solid rgba(10, 130, 138, 1);
  }
  .seat-disabled {
    background-color: rgba(248, 249, 250, 0);
    border: 1px solid rgba(132, 132, 132, 1);
  }


  
  /* Стили для иконок кресел в описании */
  .seat-icon {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    flex-shrink: 0;
  }
  .seat-standart-icon {
    background-color: rgba(196, 196, 196, 1);
    border: 1px solid rgba(57, 57, 57, 1);
  }
  .seat-vip-icon {
    background-color:  rgba(176, 214, 216, 1);
    border: 1px solid rgba(10, 130, 138, 1);
  }
  .seat-disabled-icon {
    background-color: rgba(248, 249, 250, 0);
    border: 1px solid rgba(108, 117, 125, 0.3);
  }
  
  /* Для мобильных версий (ширина меньше 768px) */
  @media (max-width: 767px) {
    .admin-dashboard-main .card-header {
      height: 65px !important;
      padding: 0 15px;
    }
    
    .admin-dashboard-main .card-header h5 {
      font-size: 1.2rem;
    }
    
    .admin-section-icon {
      width: 22px;
      height: 22px;
      border-width: 2px;
      margin-right: 12px;
    }
    
    .admin-section-toggle {
      font-size: 1.2rem;
      margin-left: 12px;
      width: 20px;
    }
  }

  .admin-card .card-body,
  .admin-dashboard-main .card .card-body {
    background-color: rgba(234, 233, 235, 0.95) !important;
  }
  
  @media (min-width: 992px) {
    .admin-dashboard-main {
      padding: 0;
    }
  }
  
  @media (max-width: 991px) {
    .admin-dashboard-main {
      max-width: 100%;
      padding: 0 0px;
    }
  }
  
  @media (max-width: 767px) {
    .admin-dashboard-main {
      padding: 0 0px;
    }
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
  .admin-dashboard-main .list-group-item {
    background-color: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 5px 20px !important;
  }

    /* Стили для белой кнопки */
  .button.white-button {
    background-color: #ffffff !important;
    color: #000000 !important;
    border: 1px solid #00000000 !important;
    box-shadow: 0px 3px 3px 0px rgba(0, 0, 0, 0.24);
  }
  

`}</style>
    </Container>
  );
};

export default AdminDashboard;