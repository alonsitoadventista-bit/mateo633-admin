/**
 * pages/clientes/componentes/ProximaAccion.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * "Próxima acción recomendada" que calcula el backend
 * (services/clientesService.js): Renovar cliente · Contactar cliente ·
 * Esperar renovación · Recuperar cliente · Todo al día.
 *
 * El botón abre el mensaje preparado que corresponde (recordar renovación /
 * recuperar cliente) o, si no hay, el chat vacío. El registro de lo enviado
 * llega en F4 y el asistente "Renovar" en F3.
 */
import { IconoNav } from '../../../components/IconoNav.jsx';
import { ACCIONES_CLIENTE } from '../../../utils/constantes';
import { enlaceWhatsApp } from '../../../utils/whatsapp';

/** Pastilla compacta para la tabla. */
export function AccionPill({ accion }) {
  if (!accion) return null;
  const a = ACCIONES_CLIENTE[accion.clave] || ACCIONES_CLIENTE.ninguna;
  return (
    <span
      title={accion.motivo}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${a.clase}`}
    >
      <IconoNav nombre={a.icono} className="h-3.5 w-3.5" />
      {accion.titulo}
    </span>
  );
}

// Qué mensaje preparado corresponde a cada acción recomendada.
export const MENSAJE_POR_ACCION = { contactar: 'recordar_renovacion', renovar: 'recordar_renovacion', recuperar: 'recuperar_cliente' };

/**
 * Banner de la ficha (F2): qué hacer ahora con este cliente y por qué, a lo
 * ancho, con el botón a la derecha. Si hay un mensaje preparado para esa
 * acción, lo abre (onMensaje); si no, abre el chat de WhatsApp vacío.
 * "Esperar" y "Todo al día" se muestran sin botón.
 */
export function TarjetaProximaAccion({ accion, whatsapp, mensajes, onMensaje }) {
  if (!accion) return null;
  const a = ACCIONES_CLIENTE[accion.clave] || ACCIONES_CLIENTE.ninguna;
  const enlace = enlaceWhatsApp(whatsapp);
  const mensaje = (mensajes || []).find((m) => m.tipo === MENSAJE_POR_ACCION[accion.clave] && m.disponible);
  const conWhatsApp = ['contactar', 'recuperar', 'renovar'].includes(accion.clave) && enlace;
  const boton = 'inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500';

  return (
    <section className={`flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center ${a.clase.replace(/text-\S+/, '')}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${a.clase}`}>
        <IconoNav nombre={a.icono} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-texto-suave">Próxima acción recomendada</p>
        <p className="text-base font-semibold text-texto">{accion.titulo}</p>
        <p className="text-sm text-texto/80">{accion.motivo}</p>
      </div>
      {mensaje ? (
        <button type="button" onClick={() => onMensaje(mensaje)} className={boton}>
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
          {mensaje.titulo}
        </button>
      ) : (
        conWhatsApp && (
          <a href={enlace} target="_blank" rel="noopener noreferrer" className={boton}>
            <IconoNav nombre="whatsapp" className="h-4 w-4" />
            Abrir chat de WhatsApp
          </a>
        )
      )}
    </section>
  );
}
