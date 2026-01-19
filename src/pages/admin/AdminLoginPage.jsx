import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner
} from 'react-bootstrap';
import { cinemaAPI } from '../../services/api';

const AdminLoginPage = () => {
  const [credentials, setCredentials] = useState({
    login: 'shfe-diplom@netology.ru',
    password: 'shfe-diplom'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking'); // checking, online, offline
  const navigate = useNavigate();

  // Проверяем доступность API при загрузке компонента
  useEffect(() => {
    checkAPIStatus();
  }, []);

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('https://shfe-diplom.neto-server.ru/alldata');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
    }
  };

// В компоненте логина исправьте эту часть:
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Используем реальную авторизацию через API
    const result = await cinemaAPI.login(credentials);
    
    console.log('Auth result:', result);
    
    // Проверяем результат авторизации - теперь правильно проверяем объект
    if (result && result.success === true) {
      // Сохраняем информацию об авторизации
      const authData = {
        isAuthenticated: true,
        login: credentials.login,
        timestamp: Date.now(),
        isRealAPI: true,
        token: result.token || `auth-${Date.now()}`
      };
      
      localStorage.setItem('adminAuth', JSON.stringify(authData));
      localStorage.setItem('adminToken', authData.token);
      
      // Показываем уведомление об успехе
      setError(''); // Очищаем ошибки
      
      // Небольшая задержка для UX
      setTimeout(() => {
        navigate('/admin');
      }, 500);
      
    } else {
      setError('Ошибка авторизации: неверные учетные данные');
    }
  } catch (err) {
    console.error('Auth error:', err);
    
    // Специальная обработка CORS ошибок
    if (err.message.includes('Failed to fetch') || 
        err.message.includes('NetworkError') ||
        err.message.includes('CORS')) {
      
      // В случае CORS ошибки, разрешаем тестовый вход
      setError('CORS ошибка: API сервер не разрешает кросс-доменные запросы. Используется тестовый режим.');
      
      // Авторизуем в тестовом режиме
      const authData = {
        isAuthenticated: true,
        login: credentials.login,
        timestamp: Date.now(),
        isRealAPI: false,
        isTestMode: true
      };
      
      localStorage.setItem('adminAuth', JSON.stringify(authData));
      localStorage.setItem('adminToken', `test-auth-${Date.now()}`);
      
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
      
    } else {
      setError(`Ошибка авторизации: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickLogin = () => {
    setCredentials({
      login: 'shfe-diplom@netology.ru',
      password: 'shfe-diplom'
    });
  };

  const handleTestModeLogin = () => {
    // Режим для разработки когда API недоступен
    localStorage.setItem('adminAuth', JSON.stringify({
      isAuthenticated: true,
      login: 'test-admin',
      timestamp: Date.now(),
      isTestMode: true
    }));
    
    localStorage.setItem('authToken', 'test-token-' + Date.now());
    navigate('/admin');
  };

  const handleClearCredentials = () => {
    setCredentials({
      login: '',
      password: ''
    });
  };

  return (
    <Container className="py-5">
          <header className="user-page__header">
        <div className="user-page__logo">
          <div>
          <span className="user-page__logo-bold">ИДЁМ</span>
          <span className="user-page__logo-thin">В</span>
          <span className="user-page__logo-bold">КИНО</span>
          </div>
        
        </div>
                        <div className="mb-3">
                  {apiStatus === 'checking' && (
                    <span className="badge bg-secondary">
                      <Spinner animation="border" size="sm" className="me-1" />
                      Проверка соединения...
                    </span>
                  )}
                  {apiStatus === 'online' && (
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>
                      API доступен
                    </span>
                  )}
                  {apiStatus === 'offline' && (
                    <span className="badge bg-warning">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      API недоступен
                    </span>
                  )}
                </div>
      </header>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-primary">
                  <i className="bi bi-shield-lock me-2"></i>
                  Авторизация
                </h2>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-person me-2"></i>
                    E-mail
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="login"
                    value={credentials.login}
                    onChange={handleChange}
                    placeholder="example@domain.xyz"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    <i className="bi bi-key me-2"></i>
                    Пароль
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder=""
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                  className = "button"
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          
                        />
                        Вход...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        АВТОРИЗОВАТЬСЯ
                      </>
                    )}
                  </Button>
                  
                  <div className="d-flex gap-2">

                  </div>

                </div>


              </Form>

              
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminLoginPage;