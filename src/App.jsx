import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
// Измените путь с './context/DataContext' на:
import { DataProvider } from './contexts/DataContext'; // Обратите внимание на 'contexts'
import MainPage from './pages/user/MainPage';
import HallPage from './pages/user/HallPage';
import TicketPage from './pages/user/TicketPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <DataProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<MainPage />} />
            <Route path="/hall/:seanceId" element={<HallPage />} />
            <Route path="/ticket/:bookingId" element={<TicketPage />} />
            
            {/* Админские маршруты */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Резервный маршрут */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </DataProvider>
  );
}

export default App;