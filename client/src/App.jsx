import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import RoleGuard from './components/RoleGuard';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import OrderConfirmation from './pages/OrderConfirmation';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';
import ProfilePage from './pages/ProfilePage';

// Protected route component — redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { user, roleLoading } = useAuth();

  if (roleLoading) return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh'
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #F59E0B',
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Страница входа */}
            <Route path="/login" element={<LoginPage />} />

            {/* Главная — меню */}
            <Route path="/" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />

            {/* Подтверждение заказа */}
            <Route path="/order/:id" element={
              <PrivateRoute>
                <OrderConfirmation />
              </PrivateRoute>
            } />

            {/* Панель сотрудника (персонал столовой) */}
            <Route path="/staff" element={
              <PrivateRoute>
                <RoleGuard allowedRoles={['staff', 'admin']}>
                  <StaffDashboard />
                </RoleGuard>
              </PrivateRoute>
            } />

            {/* Админ-панель */}
            <Route path="/admin" element={
              <PrivateRoute>
                <RoleGuard allowedRoles={['admin']}>
                  <AdminPanel />
                </RoleGuard>
              </PrivateRoute>
            } />

            {/* Профиль */}
            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />

            {/* Все остальные маршруты → главная */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', padding: '12px' }}>
            version 10.0
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
