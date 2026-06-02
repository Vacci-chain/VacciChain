import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useFreighter';

/**
 * Route guard component.
 *
 * @param {string} [requiredRole] - If set, user must also have this role.
 */
export default function RequireAuth({ children, requiredRole }) {
  const { isConnected, role, hydrating } = useAuth();
  const location = useLocation();

  if (hydrating) return null;

  if (!isConnected || (requiredRole && role !== requiredRole)) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
}
