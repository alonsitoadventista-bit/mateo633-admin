/**
 * api/pagosPorRevisar.js  ->  backend: src/routes/pagosPorRevisar.routes.js
 * Permiso: Panel (administrador o vendedor).
 *
 * La LISTA de la bandeja está en api/dashboard.js -> pagosPorRevisar()
 * (el backend la expone bajo /admin/dashboard/pagos-por-revisar).
 * Aquí solo van las acciones.
 */
import { api } from './client';

export { pagosPorRevisar as listar } from './dashboard';

/**
 * PUT /admin/pagos-por-revisar/:pedidoId/aprobar — body: { monto, metodo }
 * Hace marcar-pagado + activar en un solo paso. Falla 400 si el pedido
 * ya no está 'pendiente'.
 */
export const aprobar = (pedidoId, { monto, metodo }) =>
  api.put(`/admin/pagos-por-revisar/${pedidoId}/aprobar`, { monto, metodo });

/**
 * PUT /admin/pagos-por-revisar/:pedidoId/rechazar — body: { motivo }
 * motivo obligatorio. El pedido permanece 'pendiente'.
 */
export const rechazar = (pedidoId, motivo) =>
  api.put(`/admin/pagos-por-revisar/${pedidoId}/rechazar`, { motivo });
