/**
 * auth/AuthContext.jsx
 * -----------------------------------------
 * Sesión del panel. Envuelve el almacén sin-React de auth/sesion.js
 * y expone estado + acciones a los componentes.
 *
 * Seguridad: esto es solo UX. El backend rechaza con 401/403 toda
 * acción no autorizada aunque el frontend se manipule.
 */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { login as loginRequest } from '../api/auth';
import {
  obtenerSesion,
  guardarSesion,
  borrarSesion,
  alRecibir401,
} from './sesion';
import { estaExpirado, msHastaExpirar } from '../utils/jwt';

export const AuthContext = createContext(null);

function sesionValida() {
  const s = obtenerSesion();
  if (!s?.token || estaExpirado(s.token)) return null;
  return s;
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(sesionValida);
  const temporizador = useRef(null);

  const cerrarSesion = useCallback(() => {
    borrarSesion();
    setSesion(null);
  }, []);

  /** POST /admin/login y persiste la sesión. Lanza ErrorApi si falla. */
  const iniciarSesion = useCallback(async (usuario, password) => {
    const datos = await loginRequest(usuario, password); // { token, admin }
    guardarSesion(datos);
    setSesion(datos);
    return datos;
  }, []);

  // La capa API avisa aquí cuando el backend responde 401.
  useEffect(() => alRecibir401(() => setSesion(null)), []);

  // Cierre automático al llegar la expiración del token (8h por defecto).
  useEffect(() => {
    clearTimeout(temporizador.current);
    if (!sesion?.token) return;
    const ms = msHastaExpirar(sesion.token);
    if (ms <= 0) {
      cerrarSesion();
      return;
    }
    temporizador.current = setTimeout(cerrarSesion, ms);
    return () => clearTimeout(temporizador.current);
  }, [sesion, cerrarSesion]);

  const valor = useMemo(() => {
    const admin = sesion?.admin ?? null;
    return {
      admin,
      autenticado: Boolean(sesion?.token),
      iniciarSesion,
      cerrarSesion,
      /** ¿El rol actual está entre los permitidos? Sin lista => permitido. */
      tienePermiso: (roles) => !roles || roles.length === 0 || roles.includes(admin?.rol),
    };
  }, [sesion, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
