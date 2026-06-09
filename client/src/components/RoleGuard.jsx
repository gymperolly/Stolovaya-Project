import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ children, allowedRoles }) {
  const { user, role, loading, roleLoading } = useAuth();

  if (loading || (roleLoading && role === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если требуются определённые роли (например: ['admin', 'staff'])
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-primary-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Доступ запрещён</h2>
            <p className="text-gray-500 mb-6">
              У вас нет прав для доступа к этой странице.
            </p>
            <a
              href="/"
              className="inline-block bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Вернуться на главную
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
}
