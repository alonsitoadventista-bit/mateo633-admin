/**
 * auth/ProtectedRoute.jsx
 * -----------------------------------------
 * Guarda de rutas. Dos usos:
 *   1. Como wrapper de layout:  <ProtectedRoute><DashboardLayout/></ProtectedRoute>
 *   2. Como guarda por rol:     <ProtectedRoute roles={['administrador']}> ... </ProtectedRoute>
 *
 * Sin sesión -> /login (recordando a dónde iba).
 * Con sesión pero rol insuficiente -> pantalla "Sin permiso" (no redirige
 * en bucle). El backend igual bloquea; esto solo mejora la UX.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { SinPermiso } from '../pages/SinPermiso.jsx';

export function ProtectedRoute({ roles, children }) {
  const { autenticado, tienePermiso } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!tienePermiso(roles)) {
    return <SinPermiso />;
  }
  return children ?? <Outlet />;
}
