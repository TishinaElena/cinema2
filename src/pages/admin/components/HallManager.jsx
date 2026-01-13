import React, { useState } from 'react';
import { cinemaAPI } from '../../../services/api';
import {
  Card,
  Button,
  Table,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Spinner
} from 'react-bootstrap';

const HallManager = ({ halls, onUpdate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Форма создания зала
  const [newHall, setNewHall] = useState({
    name: '',
    rows: 10,
    cols: 15,
    vipRows: [1, 2]
  });

  // Форма конфигурации
  const [config, setConfig] = useState({
    rows: 10,
    cols: 15,
    vipRows: []
  });

  // Форма цен
  const [prices, setPrices] = useState({
    standard: 300,
    vip: 500
  });

  const handleCreateHall = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Преобразуем vipRows в массив чисел
      const vipRowsArray = newHall.vipRows
        .split(',')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));
      
      await cinemaAPI.createHall({
        name: newHall.name,
        rows: parseInt(newHall.rows),
        cols: parseInt(newHall.cols),
        vipRows: vipRowsArray
      });
      
      setSuccess('Зал успешно создан');
      setShowCreateModal(false);
      setNewHall({ name: '', rows: 10, cols: 15, vipRows: [1, 2] });
      onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHall = async (hallId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот зал?')) return;
    
    setLoading(true);
    try {
      await cinemaAPI.deleteHall(hallId);
      setSuccess('Зал успешно удален');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSales = async (hall) => {
    setLoading(true);
    try {
      await cinemaAPI.toggleSales(hall.id, !hall.isOpen);
      setSuccess(`Продажи ${!hall.isOpen ? 'включены' : 'выключены'}`);
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await cinemaAPI.updateHallConfig(selectedHall.id, config);
      setSuccess('Конфигурация обновлена');
      setShowConfigModal(false);
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrices = async () => {
    setLoading(true);
    try {
      await cinemaAPI.updatePrices(selectedHall.id, prices);
      setSuccess('Цены обновлены');
      setShowPriceModal(false);
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSeatsGrid = () => {
    const grid = [];
    for (let row = 1; row <= config.rows; row++) {
      const cols = [];
      for (let col = 1; col <= config.cols; col++) {
        const isVip = config.vipRows.includes(row);
        cols.push(
          <div
            key={`${row}-${col}`}
            className={`seat-preview ${isVip ? 'vip' : 'standard'}`}
            title={`Ряд ${row}, Место ${col} (${isVip ? 'VIP' : 'Стандарт'})`}
          >
            {col}
          </div>
        );
      }
      grid.push(
        <div key={row} className="seat-row-preview mb-2">
          <div className="row-label me-3">Ряд {row}</div>
          <div className="d-flex gap-1">{cols}</div>
        </div>
      );
    }
    return grid;
  };

  return (
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

      {/* Кнопка создания */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Управление залами</h4>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Добавить зал
        </Button>
      </div>

      {/* Таблица залов */}
      <Card>
        <Card.Body>
          {halls.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-door-open text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">Залы не добавлены</h5>
              <p className="text-muted">Нажмите "Добавить зал" чтобы создать первый зал</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Размер</th>
                  <th>Статус</th>
                  <th>VIP ряды</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {halls.map(hall => (
                  <tr key={hall.id}>
                    <td>
                      <strong>{hall.name}</strong>
                    </td>
                    <td>
                      {hall.rows} × {hall.cols} мест
                    </td>
                    <td>
                      <Badge bg={hall.isOpen ? 'success' : 'danger'}>
                        {hall.isOpen ? 'Открыт' : 'Закрыт'}
                      </Badge>
                    </td>
                    <td>
                      {hall.vipRows?.join(', ') || 'Нет'}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant={hall.isOpen ? 'warning' : 'success'}
                          size="sm"
                          onClick={() => handleToggleSales(hall)}
                          disabled={loading}
                        >
                          <i className={`bi bi-${hall.isOpen ? 'pause' : 'play'}`}></i>
                        </Button>
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedHall(hall);
                            setConfig({
                              rows: hall.rows,
                              cols: hall.cols,
                              vipRows: hall.vipRows || []
                            });
                            setShowConfigModal(true);
                          }}
                          disabled={loading}
                        >
                          <i className="bi bi-gear"></i>
                        </Button>
                        
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedHall(hall);
                            setPrices({
                              standard: hall.priceStandard || 300,
                              vip: hall.priceVip || 500
                            });
                            setShowPriceModal(true);
                          }}
                          disabled={loading}
                        >
                          <i className="bi bi-tag"></i>
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteHall(hall.id)}
                          disabled={loading}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Модальное окно создания зала */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Создание нового зала</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Название зала</Form.Label>
                  <Form.Control
                    type="text"
                    value={newHall.name}
                    onChange={(e) => setNewHall({...newHall, name: e.target.value})}
                    placeholder="Например: Красный зал"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Количество рядов</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="20"
                    value={newHall.rows}
                    onChange={(e) => setNewHall({...newHall, rows: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Мест в ряду</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="25"
                    value={newHall.cols}
                    onChange={(e) => setNewHall({...newHall, cols: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>VIP ряды (через запятую)</Form.Label>
              <Form.Control
                type="text"
                value={newHall.vipRows}
                onChange={(e) => setNewHall({...newHall, vipRows: e.target.value})}
                placeholder="Например: 1, 2, 3"
              />
              <Form.Text className="text-muted">
                Укажите номера рядов, которые будут VIP (ближе к экрану)
              </Form.Text>
            </Form.Group>

            <div className="preview-section">
              <h6>Предпросмотр схемы зала:</h6>
              <div className="seat-grid-preview">
                {renderSeatsGrid()}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateHall}
            disabled={loading || !newHall.name.trim()}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Создание...
              </>
            ) : (
              'Создать зал'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно конфигурации */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Конфигурация зала: {selectedHall?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Количество рядов</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="20"
                    value={config.rows}
                    onChange={(e) => setConfig({...config, rows: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Мест в ряду</Form.Label>
                  <Form.Control
                    type="number"
                    min="5"
                    max="25"
                    value={config.cols}
                    onChange={(e) => setConfig({...config, cols: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>VIP ряды (через запятую)</Form.Label>
              <Form.Control
                type="text"
                value={config.vipRows.join(', ')}
                onChange={(e) => {
                  const values = e.target.value
                    .split(',')
                    .map(num => parseInt(num.trim()))
                    .filter(num => !isNaN(num));
                  setConfig({...config, vipRows: values});
                }}
              />
            </Form.Group>

            <div className="preview-section">
              <h6>Предпросмотр:</h6>
              <div className="seat-grid-preview">
                {renderSeatsGrid()}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveConfig}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно цен */}
      <Modal show={showPriceModal} onHide={() => setShowPriceModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Настройка цен: {selectedHall?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Стандартное место (₽)</Form.Label>
              <Form.Control
                type="number"
                min="100"
                max="5000"
                value={prices.standard}
                onChange={(e) => setPrices({...prices, standard: parseInt(e.target.value)})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>VIP место (₽)</Form.Label>
              <Form.Control
                type="number"
                min="100"
                max="5000"
                value={prices.vip}
                onChange={(e) => setPrices({...prices, vip: parseInt(e.target.value)})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPriceModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSavePrices}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить цены'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Стили */}
      <style jsx="true">{`
        .seat-preview {
          width: 25px;
          height: 25px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
        }
        
        .seat-preview.standard {
          background-color: #e9ecef;
          border: 1px solid #6c757d;
          color: #495057;
        }
        
        .seat-preview.vip {
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
        }
        
        .seat-row-preview {
          display: flex;
          align-items: center;
        }
        
        .row-label {
          min-width: 60px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .seat-grid-preview {
          max-height: 400px;
          overflow-y: auto;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
          border: 1px solid #dee2e6;
        }
        
        .preview-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default HallManager;