/**
 * pages/clientes/serviciosCliente.js
 * -----------------------------------------
 * Regla del sistema (usuario, 2026-09-26):
 *   SERVICIO ACTIVO = vista operativa (vendedor, administrador, renovación,
 *   entrega de credenciales, atención al cliente).
 *   PEDIDO = historial interno (auditoría, pagos, trazabilidad).
 * El panel de Clientes muestra SERVICIOS únicos (Netflix, Disney+…) y nunca
 * números de pedido; internamente cada "suscripción" (cadena de renovaciones
 * activa) sigue identificada por su pedido_id, así la renovación y la entrega
 * usan la misma cuenta y el mismo perfil de siempre.
 * Un cliente puede tener varias suscripciones del MISMO servicio (varias
 * pantallas): se agrupan bajo el servicio y se distinguen por su PERFIL.
 */
import { fechaCalendario } from '../../utils/formato';

/**
 * Agrupa las filas de GET /admin/clientes/:id/servicios por servicio.
 * -> [{ servicio_id, servicio_nombre, servicio_imagen_url, duracion_dias, precio_pagado,
 *       suscripciones: [filas activas, por vencimiento], pendientes: [pendientes/pagados],
 *       dias_restantes, fecha_vencimiento, renovacion_en_curso }]
 */
export function agruparPorServicio(filas) {
  const grupos = new Map();
  for (const f of filas || []) {
    if (!grupos.has(f.servicio_id)) {
      grupos.set(f.servicio_id, {
        servicio_id: f.servicio_id,
        servicio_nombre: f.servicio_nombre,
        servicio_imagen_url: f.servicio_imagen_url,
        duracion_dias: f.duracion_dias,
        precio_pagado: f.precio_pagado,
        suscripciones: [],
        pendientes: [],
      });
    }
    const g = grupos.get(f.servicio_id);
    (f.estado === 'activo' ? g.suscripciones : g.pendientes).push(f);
  }
  return [...grupos.values()]
    .map((g) => {
      g.suscripciones.sort((a, b) => (a.dias_restantes ?? 0) - (b.dias_restantes ?? 0));
      const proxima = g.suscripciones[0];
      return {
        ...g,
        dias_restantes: proxima ? proxima.dias_restantes : null,
        fecha_vencimiento: proxima ? proxima.fecha_vencimiento : null,
        renovacion_en_curso: g.suscripciones.some((s) => s.renovacion_en_curso),
      };
    })
    .sort((a, b) => {
      if (Boolean(a.suscripciones.length) !== Boolean(b.suscripciones.length)) return a.suscripciones.length ? -1 : 1;
      return (a.dias_restantes ?? 1e9) - (b.dias_restantes ?? 1e9);
    });
}

/** Nombre visible del perfil de una suscripción (sin número de pedido). */
export function nombrePerfil(s) {
  if (!s.perfil_id) return 'Sin perfil asignado';
  return s.nombre_perfil || (s.numero_perfil ? `Perfil ${s.numero_perfil}` : 'Perfil');
}

/** "Perfil 3 · cuenta@correo · vence 24 oct. 2026" — cómo se distingue una suscripción. */
export function etiquetaSuscripcion(s) {
  const partes = [nombrePerfil(s)];
  if (s.identificador_cuenta) partes.push(s.identificador_cuenta);
  if (s.fecha_vencimiento) partes.push(`vence ${fechaCalendario(s.fecha_vencimiento, { day: '2-digit', month: 'short', year: 'numeric' })}`);
  return partes.join(' · ');
}

/** Servicios ÚNICOS de una lista de servicios activos del resumen ([{ servicio_id, servicio_nombre, ... }]). */
export function serviciosUnicos(servicios) {
  const vistos = new Map();
  for (const s of servicios || []) if (!vistos.has(s.servicio_id)) vistos.set(s.servicio_id, s);
  return [...vistos.values()];
}
