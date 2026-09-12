/**
 * api/configuracion.js  ->  backend: src/routes/configuracion.routes.js
 * Permiso: SoloAdmin (rol 'administrador').
 *
 * `valor` es JSONB tipado (string, array u objeto según la clave).
 * Solo se pueden EDITAR las 14 claves precargadas por la migración 012
 * (no se crean claves nuevas desde la API). Ver utils/configuracionClaves.js.
 */
import { api } from './client';

/** GET /admin/configuracion?categoria=negocio|comercial|sistema (categoria opcional) */
export const listar = (categoria) => api.get('/admin/configuracion', { categoria });

/** PUT /admin/configuracion/:clave — body: { valor } */
export const actualizar = (clave, valor) => api.put(`/admin/configuracion/${clave}`, { valor });
