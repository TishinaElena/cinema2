import React, { useState } from 'react';
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
    login: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Тестовый вход для разработки
      // Если API не работает, используем этот код
      const mockResult = {
        token: 'test-token-' + Date.now(),
        user: {
          id: 1,
          login: credentials.login,
          role: 'admin'
        }
      };
      
      // Сохраняем токен
      localStorage.setItem('adminToken', mockResult.token);
      
      // Переходим в админку
      navigate('/admin');
      
      // Если хотите использовать реальный API, раскомментируйте:
      /*
      const result = await cinemaAPI.login(credentials);
      
      if (result.token) {
        localStorage.setItem('adminToken', result.token);
        navigate('/admin');
      } else {
        setError('Ошибка авторизации');
      }
      */
    } catch (err) {
      setError(err.message || 'Ошибка соединения с сервером');
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="text-primary">
                  <i className="bi bi-shield-lock me-2"></i>
                  Администратор
                </h2>
                <p className="text-muted">Войдите в систему управления</p>
              </div>

              {error && (
                <Alert variant="danger" className="text-center">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-person me-2"></i>
                    Логин
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="login"
                    value={credentials.login}
                    onChange={handleChange}
                    placeholder="Введите логин"
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
                    placeholder="Введите пароль"
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
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
                          className="me-2"
                        />
                        Вход...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Войти
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Вернуться на сайт
                  </Button>
                </div>
              </Form>

              <div className="mt-4 pt-3 border-top text-center">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Для доступа требуется авторизация администратора
                </small>
                <div className="mt-2">
                  <small className="text-info">
                    Тестовые данные: любой логин/пароль
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminLoginPage;