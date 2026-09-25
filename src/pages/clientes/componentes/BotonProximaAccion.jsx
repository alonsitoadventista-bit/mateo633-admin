/**
 * pages/clientes/componentes/BotonProximaAccion.jsx  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * La "Próxima acción" de la lista como botón que la EJECUTA:
 * - Contactar / Recuperar → pide los mensajes preparados del cliente
 *   (GET /admin/clientes/:id/mensajes, solo al hacer clic) y abre el que
 *   corresponde; si no hay, abre el chat de WhatsApp vacío.
 * - Renovar cliente (ya hay una renovación esperando pago o activación) →
 *   abre la ficha, donde está el pedido pendiente para completarlo.
 * - Esperar / Todo al día → solo informa (sin botón).
 */
import { useState } from 'react';
import * as clientesApi from '../../../api/clientes';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { ACCIONES_CLIENTE } from '../../../utils/constantes';
import { enlaceWhatsApp } from '../../../utils/whatsapp';
import { AccionPill, MENSAJE_POR_ACCION } from './ProximaAccion.jsx';

export function BotonProximaAccion({ cliente, onMensaje, onAbrirFicha }) {
  const [cargando, setCargando] = useState(false);
  const accion = cliente.proxima_accion;
  if (!accion) return null;
  if (!['contactar', 'recuperar', 'renovar'].includes(accion.clave)) return <AccionPill accion={accion} />;

  const a = ACCIONES_CLIENTE[accion.clave];

  async function ejecutar(e) {
    e.stopPropagation();
    if (accion.clave === 'renovar') return onAbrirFicha(cliente);
    setCargando(true);
    try {
      const mensajes = await clientesApi.mensajes(cliente.id);
      const m = mensajes.find((x) => x.tipo === MENSAJE_POR_ACCION[accion.clave] && x.disponible);
      if (m) onMensaje(m, cliente);
      else {
        const enlace = enlaceWhatsApp(cliente.whatsapp);
        if (enlace) window.open(enlace, '_blank', 'noopener');
      }
    } catch {
      const enlace = enlaceWhatsApp(cliente.whatsapp);
      if (enlace) window.open(enlace, '_blank', 'noopener');
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={ejecutar}
      disabled={cargando}
      title={accion.motivo}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition hover:brightness-125 disabled:opacity-60 ${a.clase}`}
    >
      <IconoNav nombre={a.icono} className="h-3.5 w-3.5" />
      {cargando ? 'Preparando…' : accion.titulo}
    </button>
  );
}
