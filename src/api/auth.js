/**
 * api/auth.js  ->  backend: src/routes/auth.routes.js
 */
import { api } from './client';

/**
 * POST /admin/login
 * @returns {Promise<{ token: string, admin: { id, nombre, usuario, rol } }>}
 * Errores: 400 (faltan campos), 401 (credenciales), 403 (cuenta desactivada).
 */
export function login(usuario, password) {
  return api.post('/admin/login', { usuario, password });
}
