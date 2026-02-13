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
    
    // Добавляем класс к body для админского фона
    document.body.classList.add('admin-page', 'admin-login-page');
    
    // Убираем класс при размонтировании
    return () => {
      document.body.classList.remove('admin-page', 'admin-login-page');
    };
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

  return (
    <div className="admin-login-page-wrapper">
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
  <div className="mb-3">
    {/* API статус остается без изменений */}
    {apiStatus === 'checking' && (
      <span className="badge bg-secondary">
        <Spinner animation="border" size="sm" className="me-1" />
        Проверка соединения...
      </span>
    )}
    {apiStatus === 'online' && (
      <span className="">
        <i className="bi bi-check-circle me-1"></i>
        {/*API доступен*/}
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
          
            <Card className="shadow admin-login-card ">
              <Card.Body className="justify-content-center ">
            <div className="auth-header">
              <h2 className="auth-title">
                <i className="bi bi-shield-lock me-2"></i>
                АВТОРИЗАЦИЯ
              </h2>
            </div>

                {error && (
                  <Alert variant="danger" className="text-center">
                    {error}
                  </Alert>
                )}

                <Form className='auth-form' onSubmit={handleSubmit}>
                  <Form.Group className=" input-line ">
               
                    <div style={{
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '14px',
                  letterSpacing: '0%',
                  marginBottom: '4px',
                  color: 'rgba(132, 132, 132, 1)'
                }}>
                  E-mail
                </div>
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

                  <Form.Group className="input-line">
                      <div style={{
                  fontFamily: 'Roboto',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '14px',
                  letterSpacing: '0%',
                  marginBottom: '4px',
                  color: 'rgba(132, 132, 132, 1)'
                }}>
                  Пароль
                </div>
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

<div style={{ 
  display: 'flex', 
  justifyContent: 'center', 
  marginTop: '20px', 
  marginBottom: '30px' /* ← Добавляем нижний отступ 30px */
}}>
  <Button 
    className="button"
    variant="primary" 
    type="submit" 
    disabled={loading}
    size="lg"
    style={{ width: '189px' }}
  >
    {loading ? (
      <>
        <Spinner
          animation="border"
          size="sm"
          className="me-2"
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
</div>
                </Form>
              </Card.Body>
            </Card>
          
        </Row>
      </Container>
    </div>
  );
};

export default AdminLoginPage;