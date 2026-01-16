import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // Измените BrowserRouter на HashRouter
import { DataProvider } from './contexts/DataContext';
import './index.css';

// Пользовательские страницы
import MainPage from './pages/user/MainPage';
import HallPage from './pages/user/HallPage';
import PaymentPage from './pages/user/PaymentPage';
import TicketPage from './pages/user/TicketPage';

// Админские страницы
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <DataProvider>
      <Router> {/* Теперь это HashRouter */}
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<MainPage />} />
          <Route path="/hall/:seanceId" element={<HallPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/ticket/:bookingId" element={<TicketPage />} />
          
          {/* Админские маршруты */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin/*" 
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Резервный маршрут */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;