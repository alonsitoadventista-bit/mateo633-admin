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
const MENSAJE_POR_ACCION = { contactar: 'recordar_renovacion', renovar: 'recordar_renovacion', recuperar: 'recuperar_cliente' };

/**
 * Tarjeta de la ficha: qué hacer ahora con este cliente y por qué.
 * Si hay un mensaje preparado para esa acción, el botón lo abre (onMensaje);
 * si no, abre el chat de WhatsApp vacío.
 */
export function TarjetaProximaAccion({ accion, whatsapp, mensajes, onMensaje }) {
  if (!accion) return null;
  const a = ACCIONES_CLIENTE[accion.clave] || ACCIONES_CLIENTE.ninguna;
  const enlace = enlaceWhatsApp(whatsapp);
  const mensaje = (mensajes || []).find((m) => m.tipo === MENSAJE_POR_ACCION[accion.clave] && m.disponible);

  if (mensaje) {
    return (
      <section className={`rounded-2xl border p-5 ${a.clase.replace(/text-\S+/, '')}`}>
        <Cuerpo accion={accion} a={a} />
        <button
          type="button"
          onClick={() => onMensaje(mensaje)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
          {mensaje.titulo}
        </button>
      </section>
    );
  }

  const conWhatsApp = ['contactar', 'recuperar', 'renovar'].includes(accion.clave) && enlace;

  return (
    <section className={`rounded-2xl border p-5 ${a.clase.replace(/text-\S+/, '')}`}>
      <Cuerpo accion={accion} a={a} />
      {conWhatsApp && (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
          Abrir chat de WhatsApp
        </a>
      )}
    </section>
  );
}

function Cuerpo({ accion, a }) {
  return (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">Próxima acción recomendada</p>
      <div className="mt-2 flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${a.clase}`}>
          <IconoNav nombre={a.icono} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-texto">{accion.titulo}</h3>
          <p className="mt-0.5 text-sm text-texto/80">{accion.motivo}</p>
        </div>
      </div>
    </>
  );
}
