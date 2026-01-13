import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Spinner, 
  Alert,
  Form,
  InputGroup
} from 'react-bootstrap';
import { format, addDays, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';

const MainPage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHall, setSelectedHall] = useState('all');
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [halls, setHalls] = useState([]);
  const [seances, setSeances] = useState([]);

  // Тестовые данные для демонстрации
  useEffect(() => {
    setLoading(true);
    
    // Имитируем загрузку данных
    setTimeout(() => {
      // Тестовые фильмы
      const testMovies = [
        {
          id: 1,
          title: "Аватар: Путь воды",
          description: "Джейк Салли и Нейтири создали семью, но им снова угрожает опасность.",
          duration: 192,
          genre: "Фантастика, Приключения",
          country: "США",
          ageRating: "12+",
          posterUrl: "https://via.placeholder.com/300x450?text=Аватар+2"
        },
        {
          id: 2,
          title: "Оппенгеймер",
          description: "История создания атомной бомбы глазами Роберта Оппенгеймера.",
          duration: 180,
          genre: "Биография, Драма",
          country: "США",
          ageRating: "16+",
          posterUrl: "https://via.placeholder.com/300x450?text=Оппенгеймер"
        },
        {
          id: 3,
          title: "Барби",
          description: "Барби и Кен отправляются в настоящее путешествие.",
          duration: 114,
          genre: "Комедия, Фэнтези",
          country: "США",
          ageRating: "12+",
          posterUrl: "https://via.placeholder.com/300x450?text=Барби"
        },
        {
          id: 4,
          title: "Джон Уик 4",
          description: "Джон Уик продолжает сражаться с Высоким столом.",
          duration: 169,
          genre: "Боевик, Триллер",
          country: "США",
          ageRating: "18+",
          posterUrl: "https://via.placeholder.com/300x450?text=Джон+Уик+4"
        }
      ];

      // Тестовые залы
      const testHalls = [
        { id: 1, name: "Красный зал", rows: 10, cols: 15, isOpen: true, vipRows: [1, 2] },
        { id: 2, name: "Синий зал", rows: 8, cols: 12, isOpen: true, vipRows: [1] },
        { id: 3, name: "Зеленый зал", rows: 12, cols: 18, isOpen: false, vipRows: [1, 2, 3] }
      ];

      // Тестовые сеансы
      const testSeances = [
        { id: 1, movieId: 1, hallId: 1, startTime: `${format(new Date(), 'yyyy-MM-dd')}T12:00:00`, priceStandard: 400, priceVip: 600 },
        { id: 2, movieId: 2, hallId: 1, startTime: `${format(new Date(), 'yyyy-MM-dd')}T15:30:00`, priceStandard: 450, priceVip: 650 },
        { id: 3, movieId: 3, hallId: 2, startTime: `${format(new Date(), 'yyyy-MM-dd')}T14:00:00`, priceStandard: 350, priceVip: 550 },
        { id: 4, movieId: 4, hallId: 2, startTime: `${format(new Date(), 'yyyy-MM-dd')}T18:00:00`, priceStandard: 500, priceVip: 700 },
        { id: 5, movieId: 1, hallId: 1, startTime: `${format(new Date(), 'yyyy-MM-dd')}T20:30:00`, priceStandard: 400, priceVip: 600 }
      ];

      setMovies(testMovies);
      setHalls(testHalls);
      setSeances(testSeances);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleSeanceClick = (seanceId) => {
    navigate(`/hall/${seanceId}`);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}мин`;
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  // Получаем открытые залы
  const openHalls = halls.filter(hall => hall.isOpen);

  // Получаем сеансы на выбранную дату
  const getSeancesForDate = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return seances.filter(seance => {
      const seanceDate = format(new Date(seance.startTime), 'yyyy-MM-dd');
      return seanceDate === dateStr;
    });
  };

  // Фильтруем сеансы по залу
  const filteredSeances = getSeancesForDate().filter(seance => {
    if (selectedHall === 'all') return true;
    return seance.hallId === parseInt(selectedHall);
  });

  // Получаем фильм по ID
  const getMovieById = (movieId) => {
    return movies.find(movie => movie.id === movieId);
  };

  // Получаем зал по ID
  const getHallById = (hallId) => {
    return halls.find(hall => hall.id === hallId);
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-3">Загружаем расписание...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Шапка с навигацией */}
      <Card className="mb-4 bg-primary text-white">
        <Card.Body className="py-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h1 className="display-5 mb-2">
                <i className="bi bi-camera-reel me-3"></i>
                Кинотеатр "Премьера"
              </h1>
              <p className="lead mb-0">Бронируйте билеты онлайн на любой фильм</p>
            </Col>
            <Col md={4} className="text-end">
              <Button 
                variant="light" 
                onClick={() => navigate('/admin')}
                className="me-2"
              >
                <i className="bi bi-shield-lock me-2"></i>
                Админка
              </Button>
              <Button variant="outline-light">
                <i className="bi bi-telephone me-2"></i>
                8-800-123-45-67
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Баннер с акцией */}
      <Alert variant="info" className="mb-4">
        <Row className="align-items-center">
          <Col md={10}>
            <h5 className="mb-0">
              <i className="bi bi-star-fill me-2"></i>
              Специальное предложение! При покупке 3-х билетов - скидка 15%
            </h5>
          </Col>
          <Col md={2} className="text-end">
            <Badge bg="danger">Акция</Badge>
          </Col>
        </Row>
      </Alert>

      {/* Основной контент */}
      <Row>
        {/* Левая колонка - фильтры */}
        <Col lg={3} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-calendar me-2"></i>
                Выбор даты
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="date-buttons">
                {getWeekDates().map((date, index) => (
                  <Button
                    key={index}
                    variant={
                      format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                        ? 'primary'
                        : 'outline-secondary'
                    }
                    className="w-100 mb-2"
                    onClick={() => handleDateSelect(date)}
                  >
                    {isToday(date) ? 'Сегодня' : format(date, 'EEEE', { locale: ru })}
                    <br />
                    <small>{format(date, 'd MMMM', { locale: ru })}</small>
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Фильтры
              </h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Выбор зала:</Form.Label>
                <Form.Select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                >
                  <option value="all">Все залы</option>
                  {openHalls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} ({hall.rows}×{hall.cols})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ценовой диапазон:</Form.Label>
                <InputGroup>
                  <Form.Control placeholder="От" />
                  <Form.Control placeholder="До" />
                </InputGroup>
              </Form.Group>

              <Form.Group>
                <Form.Label>Время:</Form.Label>
                <Form.Select>
                  <option>Любое время</option>
                  <option>Утро (9:00 - 12:00)</option>
                  <option>День (12:00 - 18:00)</option>
                  <option>Вечер (18:00 - 23:00)</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Информация о кинотеатре */}
          <Card className="mt-3">
            <Card.Body>
              <h6>
                <i className="bi bi-info-circle me-2"></i>
                Информация
              </h6>
              <ul className="list-unstyled small">
                <li className="mb-2">
                  <i className="bi bi-clock text-primary me-2"></i>
                  Ежедневно: 9:00 - 23:00
                </li>
                <li className="mb-2">
                  <i className="bi bi-geo-alt text-primary me-2"></i>
                  ул. Кинотеатральная, 15
                </li>
                <li className="mb-2">
                  <i className="bi bi-phone text-primary me-2"></i>
                  8-800-123-45-67
                </li>
                <li>
                  <i className="bi bi-wifi text-primary me-2"></i>
                  Бесплатный Wi-Fi
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* Правая колонка - расписание */}
        <Col lg={9}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Расписание на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
              </h4>
              <div className="btn-group">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                >
                  ← Назад
                </Button>
                <Button variant="outline-primary" disabled>
                  {isToday(selectedDate) ? 'Сегодня' : format(selectedDate, 'd MMMM', { locale: ru })}
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                >
                  Вперед →
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {filteredSeances.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  На выбранную дату сеансов нет. Выберите другую дату или зал.
                </Alert>
              ) : (
                <Row>
                  {filteredSeances.map(seance => {
                    const movie = getMovieById(seance.movieId);
                    const hall = getHallById(seance.hallId);
                    
                    if (!movie || !hall) return null;

                    return (
                      <Col key={seance.id} lg={6} className="mb-4">
                        <Card className="h-100 shadow-sm">
                          <Row className="g-0">
                            <Col md={4}>
                              <div className="position-relative h-100">
                                <Card.Img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  className="h-100"
                                  style={{ objectFit: 'cover' }}
                                />
                                <Badge 
                                  bg={movie.ageRating === '18+' ? 'danger' : 'warning'}
                                  className="position-absolute top-0 start-0 m-2"
                                >
                                  {movie.ageRating}
                                </Badge>
                              </div>
                            </Col>
                            <Col md={8}>
                              <Card.Body>
                                <Card.Title>{movie.title}</Card.Title>
                                <Card.Text>
                                  <small className="text-muted d-block mb-2">
                                    <i className="bi bi-clock me-1"></i>
                                    {formatTime(seance.startTime)} • {formatDuration(movie.duration)}
                                  </small>
                                  <small className="text-muted d-block mb-2">
                                    <i className="bi bi-door-open me-1"></i>
                                    {hall.name} • {hall.rows}×{hall.cols} мест
                                  </small>
                                  <span className="d-inline-block text-truncate" style={{ maxWidth: '100%' }}>
                                    {movie.description}
                                  </span>
                                </Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <span className="fs-5 fw-bold text-primary">
                                      от {Math.min(seance.priceStandard, seance.priceVip)}₽
                                    </span>
                                    <div className="small text-muted">
                                      Стандарт: {seance.priceStandard}₽ • VIP: {seance.priceVip}₽
                                    </div>
                                  </div>
                                  <Button 
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSeanceClick(seance.id)}
                                  >
                                    <i className="bi bi-ticket-perforated me-2"></i>
                                    Выбрать места
                                  </Button>
                                </div>
                              </Card.Body>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Все фильмы */}
          <Card>
            <Card.Header>
              <h4 className="mb-0">
                <i className="bi bi-film me-2"></i>
                Все фильмы в прокате
              </h4>
            </Card.Header>
            <Card.Body>
              <Row>
                {movies.map(movie => (
                  <Col key={movie.id} sm={6} md={4} lg={3} className="mb-4">
                    <Card className="h-100">
                      <div className="position-relative">
                        <Card.Img
                          variant="top"
                          src={movie.posterUrl}
                          alt={movie.title}
                          style={{ height: '300px', objectFit: 'cover' }}
                        />
                        <Badge 
                          bg={movie.ageRating === '18+' ? 'danger' : 'warning'}
                          className="position-absolute top-0 start-0 m-2"
                        >
                          {movie.ageRating}
                        </Badge>
                      </div>
                      <Card.Body>
                        <Card.Title className="fs-6">{movie.title}</Card.Title>
                        <Card.Text className="small text-muted mb-2">
                          <div>
                            <i className="bi bi-clock me-1"></i>
                            {formatDuration(movie.duration)}
                          </div>
                          <div>
                            <i className="bi bi-tags me-1"></i>
                            {movie.genre}
                          </div>
                        </Card.Text>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          className="w-100"
                          onClick={() => {
                            // Находим первый сеанс этого фильма
                            const seance = seances.find(s => s.movieId === movie.id);
                            if (seance) navigate(`/hall/${seance.id}`);
                          }}
                        >
                          Смотреть расписание
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Футер */}
      <footer className="mt-5 pt-4 border-top">
        <Row>
          <Col md={4}>
            <h5>Кинотеатр "Премьера"</h5>
            <p className="text-muted small">
              Лучший выбор фильмов в городе. Современные залы, отличный звук и комфортные кресла.
            </p>
          </Col>
          <Col md={4}>
            <h5>Контакты</h5>
            <ul className="list-unstyled small">
              <li className="mb-2">
                <i className="bi bi-geo-alt me-2"></i>
                ул. Кинотеатральная, 15
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                8-800-123-45-67
              </li>
              <li>
                <i className="bi bi-envelope me-2"></i>
                info@cinema-premier.ru
              </li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>Социальные сети</h5>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm">
                <i className="bi bi-vk"></i>
              </Button>
              <Button variant="outline-info" size="sm">
                <i className="bi bi-telegram"></i>
              </Button>
              <Button variant="outline-danger" size="sm">
                <i className="bi bi-youtube"></i>
              </Button>
              <Button variant="outline-dark" size="sm">
                <i className="bi bi-instagram"></i>
              </Button>
            </div>
          </Col>
        </Row>
        <div className="text-center mt-4 pt-3 border-top">
          <small className="text-muted">
            © 2024 Кинотеатр "Премьера". Все права защищены.
          </small>
        </div>
      </footer>
    </Container>
  );
};

export default MainPage;