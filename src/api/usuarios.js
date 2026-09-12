/**
 * api/usuarios.js  ->  backend: src/routes/usuariosAdmin.routes.js
 * Permiso: SoloAdmin (rol 'administrador') en TODAS las rutas, incluida
 * la lectura. El panel oculta este módulo para vendedores.
 */
import { api } from './client';

/** GET /admin/usuarios */
export const listar = () => api.get('/admin/usuarios');

/** GET /admin/usuarios/:id */
export const detalle = (id) => api.get(`/admin/usuarios/${id}`);

/** POST /admin/usuarios — body: { nombre, usuario, password, rol } (rol: 'administrador' | 'vendedor') */
export const crear = (datos) => api.post('/admin/usuarios', datos);

/** PUT /admin/usuarios/:id — body: { nombre?, usuario? } (no cambia rol ni password) */
export const actualizar = (id, datos) => api.put(`/admin/usuarios/${id}`, datos);

/** PUT /admin/usuarios/:id/activar */
export const activar = (id) => api.put(`/admin/usuarios/${id}/activar`);

/** PUT /admin/usuarios/:id/desactivar — devuelve 400 si intentas desactivar tu propia cuenta */
export const desactivar = (id) => api.put(`/admin/usuarios/${id}/desactivar`);

/** PUT /admin/usuarios/:id/restablecer-password — body: { nuevaPassword } (mín. 6 caracteres) */
export const restablecerPassword = (id, nuevaPassword) =>
  api.put(`/admin/usuarios/${id}/restablecer-password`, { nuevaPassword });

/** GET /admin/usuarios/:id/pedidos — pedidos que este usuario aprobó */
export const pedidosGestionados = (id) => api.get(`/admin/usuarios/${id}/pedidos`);

/** GET /admin/usuarios/:id/pagos — pagos que este usuario registró */
export const pagosRegistrados = (id) => api.get(`/admin/usuarios/${id}/pagos`);
