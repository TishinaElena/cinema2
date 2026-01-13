import React, { useState } from 'react';
import { cinemaAPI } from '../../../services/api';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Image
} from 'react-bootstrap';

const MovieManager = ({ movies, onUpdate }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);

  // Форма фильма
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    duration: 120,
    genre: '',
    country: '',
    director: '',
    actors: '',
    ageRating: '12+',
    posterUrl: ''
  });

  const handleCreateMovie = async () => {
    setLoading(true);
    setError('');
    
    try {
      await cinemaAPI.createMovie({
        ...movieForm,
        duration: parseInt(movieForm.duration)
      });
      
      setSuccess('Фильм успешно добавлен');
      setShowCreateModal(false);
      resetForm();
      onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMovie = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Здесь должен быть метод updateMovie в API
      // Пока используем create для демонстрации
      await cinemaAPI.createMovie({
        ...movieForm,
        duration: parseInt(movieForm.duration)
      });
      
      setSuccess('Фильм успешно обновлен');
      setShowEditModal(false);
      resetForm();
      onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот фильм?')) return;
    
    setLoading(true);
    try {
      await cinemaAPI.deleteMovie(movieId);
      setSuccess('Фильм успешно удален');
      onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovieForm({
      title: '',
      description: '',
      duration: 120,
      genre: '',
      country: '',
      director: '',
      actors: '',
      ageRating: '12+',
      posterUrl: ''
    });
  };

  const handleEditClick = (movie) => {
    setSelectedMovie(movie);
    setMovieForm({
      title: movie.title,
      description: movie.description || '',
      duration: movie.duration || 120,
      genre: movie.genre || '',
      country: movie.country || '',
      director: movie.director || '',
      actors: movie.actors || '',
      ageRating: movie.ageRating || '12+',
      posterUrl: movie.posterUrl || ''
    });
    setShowEditModal(true);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
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
        <h4 className="mb-0">Управление фильмами</h4>
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={loading}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Добавить фильм
        </Button>
      </div>

      {/* Таблица фильмов */}
      <Card>
        <Card.Body>
          {movies.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-film text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="mt-3 text-muted">Фильмы не добавлены</h5>
              <p className="text-muted">Начните добавлять фильмы для показа</p>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Постер</th>
                  <th>Название</th>
                  <th>Жанр</th>
                  <th>Длительность</th>
                  <th>Возраст</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie.id}>
                    <td>
                      <Image 
                        src={movie.posterUrl || '/images/default-poster.jpg'} 
                        alt={movie.title}
                        style={{ width: '60px', height: '90px', objectFit: 'cover' }}
                        rounded
                      />
                    </td>
                    <td>
                      <strong>{movie.title}</strong>
                      <div className="text-muted small">
                        {movie.director && <span>{movie.director}</span>}
                        {movie.country && <span className="ms-2">({movie.country})</span>}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info" className="me-1">
                        {movie.genre || 'Не указан'}
                      </Badge>
                    </td>
                    <td>
                      {formatDuration(movie.duration)}
                    </td>
                    <td>
                      <Badge bg={movie.ageRating === '18+' ? 'danger' : 'warning'}>
                        {movie.ageRating || '12+'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditClick(movie)}
                          disabled={loading}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteMovie(movie.id)}
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

      {/* Модальное окно создания фильма */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Добавление нового фильма</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Название фильма *</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({...movieForm, title: e.target.value})}
                    placeholder="Введите название фильма"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Длительность (минут) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="60"
                    max="300"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({...movieForm, duration: e.target.value})}
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
                value={movieForm.description}
                onChange={(e) => setMovieForm({...movieForm, description: e.target.value})}
                placeholder="Краткое описание фильма"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Жанр</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({...movieForm, genre: e.target.value})}
                    placeholder="Например: Боевик, Комедия, Драма"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Страна</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.country}
                    onChange={(e) => setMovieForm({...movieForm, country: e.target.value})}
                    placeholder="Например: США, Россия"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Режиссер</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({...movieForm, director: e.target.value})}
                    placeholder="Имя режиссера"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Актеры</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.actors}
                    onChange={(e) => setMovieForm({...movieForm, actors: e.target.value})}
                    placeholder="Основные актеры через запятую"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Возрастной рейтинг</Form.Label>
                  <Form.Select
                    value={movieForm.ageRating}
                    onChange={(e) => setMovieForm({...movieForm, ageRating: e.target.value})}
                  >
                    <option value="0+">0+</option>
                    <option value="6+">6+</option>
                    <option value="12+">12+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL постера</Form.Label>
                  <Form.Control
                    type="url"
                    value={movieForm.posterUrl}
                    onChange={(e) => setMovieForm({...movieForm, posterUrl: e.target.value})}
                    placeholder="https://example.com/poster.jpg"
                  />
                </Form.Group>
              </Col>
            </Row>

            {movieForm.posterUrl && (
              <div className="text-center mt-3">
                <Image 
                  src={movieForm.posterUrl} 
                  alt="Предпросмотр постера"
                  style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'contain' }}
                  thumbnail
                />
                <div className="small text-muted mt-2">Предпросмотр постера</div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateMovie}
            disabled={loading || !movieForm.title.trim() || !movieForm.duration}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Добавление...
              </>
            ) : (
              'Добавить фильм'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно редактирования */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Редактирование фильма: {selectedMovie?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Название фильма *</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({...movieForm, title: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Длительность (минут) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="60"
                    max="300"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({...movieForm, duration: e.target.value})}
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
                value={movieForm.description}
                onChange={(e) => setMovieForm({...movieForm, description: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Жанр</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({...movieForm, genre: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Страна</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.country}
                    onChange={(e) => setMovieForm({...movieForm, country: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Режиссер</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({...movieForm, director: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Актеры</Form.Label>
                  <Form.Control
                    type="text"
                    value={movieForm.actors}
                    onChange={(e) => setMovieForm({...movieForm, actors: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Возрастной рейтинг</Form.Label>
                  <Form.Select
                    value={movieForm.ageRating}
                    onChange={(e) => setMovieForm({...movieForm, ageRating: e.target.value})}
                  >
                    <option value="0+">0+</option>
                    <option value="6+">6+</option>
                    <option value="12+">12+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL постера</Form.Label>
                  <Form.Control
                    type="url"
                    value={movieForm.posterUrl}
                    onChange={(e) => setMovieForm({...movieForm, posterUrl: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            {movieForm.posterUrl && (
              <div className="text-center mt-3">
                <Image 
                  src={movieForm.posterUrl} 
                  alt="Предпросмотр постера"
                  style={{ maxWidth: '200px', maxHeight: '300px', objectFit: 'contain' }}
                  thumbnail
                />
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditMovie}
            disabled={loading || !movieForm.title.trim() || !movieForm.duration}
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
    </div>
  );
};

export default MovieManager;