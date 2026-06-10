import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ children, allowedRoles }) {
  const { role, roleLoading } = useAuth();

  // Show spinner while loading OR while role not yet determined
  if (roleLoading || role === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'white'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #F59E0B',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Only redirect when role is fully loaded and not allowed
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
