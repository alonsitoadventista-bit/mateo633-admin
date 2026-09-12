/**
 * api/auditoria.js  ->  backend: src/routes/auditoria.routes.js
 * Permiso: SoloAdmin (rol 'administrador').
 */
import { api, solicitar } from './client';

/**
 * GET /admin/auditoria
 * @param {object} filtros { tabla_afectada, actor_tipo, actor_id, accion, busqueda, desde, hasta, limite, offset }
 * @returns {Promise<{ eventos: Array, total: number }>}
 * Único endpoint del panel con paginación server-side (limite/offset).
 */
export const listar = (filtros = {}) => api.get('/admin/auditoria', filtros);

/**
 * GET /admin/auditoria/exportar — CSV con los mismos filtros (sin paginación, tope 5000 filas).
 * Requiere el header Authorization, por eso se descarga vía fetch + blob
 * en vez de un <a href> directo.
 */
export async function exportarCsv(filtros = {}) {
  const respuesta = await solicitar('/admin/auditoria/exportar', {
    method: 'GET',
    query: filtros,
    raw: true,
  });
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
