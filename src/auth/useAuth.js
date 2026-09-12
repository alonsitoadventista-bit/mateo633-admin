import { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';

/** Acceso a la sesión: { admin, autenticado, iniciarSesion, cerrarSesion, tienePermiso }. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
