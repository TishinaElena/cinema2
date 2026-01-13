import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container,
  Button,
  Card,
  Alert
} from 'react-bootstrap';

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
          <h1 className="mb-4">Админ-панель</h1>
          
          <Alert variant="success" className="mb-4">
            Вы успешно вошли в систему управления кинотеатром
          </Alert>
          
          <div className="mb-4">
            <h4>Быстрые действия:</h4>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary">Управление залами</Button>
              <Button variant="success">Управление фильмами</Button>
              <Button variant="warning">Расписание</Button>
              <Button variant="info">Отчеты</Button>
            </div>
          </div>
          
          <div className="mt-5 pt-4 border-top">
            <Button 
              variant="outline-danger"
              onClick={handleLogout}
            >
              Выйти из системы
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;