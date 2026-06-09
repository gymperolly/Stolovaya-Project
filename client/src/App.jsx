import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import RoleGuard from './components/RoleGuard';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OrderConfirmation from './pages/OrderConfirmation';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Страница входа */}
            <Route path="/login" element={<LoginPage />} />

            {/* Главная — меню */}
            <Route
              path="/"
              element={
                <RoleGuard allowedRoles={['student', 'staff', 'admin']}>
                  <HomePage />
                </RoleGuard>
              }
            />

            {/* Подтверждение заказа */}
            <Route
              path="/order/:id"
              element={
                <RoleGuard allowedRoles={['student', 'staff', 'admin']}>
                  <OrderConfirmation />
                </RoleGuard>
              }
            />

            {/* Панель сотрудника (персонал столовой) */}
            <Route
              path="/staff"
              element={
                <RoleGuard allowedRoles={['staff', 'admin']}>
                  <StaffDashboard />
                </RoleGuard>
              }
            />

            {/* Админ-панель */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['admin']}>
                  <AdminPanel />
                </RoleGuard>
              }
            />

            {/* Все остальные маршруты → главная */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
