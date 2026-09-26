/**
 * pages/clientes/componentes/CabeceraFicha.jsx  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * Cabecera "hero" de la ficha (reemplaza a ResumenCliente de F1): avatar,
 * nombre, estado comercial, etiquetas, WhatsApp con copiar, correo y
 * antigüedad; y los botones principales:
 *   Contactar por WhatsApp (con el mensaje preparado que corresponda),
 *   Renovar (lógica existente), Editar, y ⋯ (Cambiar acceso, chat sin mensaje).
 */
import { useState } from 'react';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { fecha } from '../../../utils/formato';
import { enlaceWhatsApp, whatsappVisible } from '../../../utils/whatsapp';
import { AvatarCliente } from './AvatarCliente.jsx';
import { EtiquetasCliente, Semaforo } from './Semaforo.jsx';
import { MenuAcciones } from './MenuAcciones.jsx';
import { objetivoRenovacion } from './DialogoRenovar.jsx';
import { MENSAJE_POR_ACCION } from './ProximaAccion.jsx';

/** El mensaje a ofrecer: el de la próxima acción, si no el recomendado, si no ninguno. */
function mensajeContextual(r, mensajes) {
  const disponibles = (mensajes || []).filter((m) => m.disponible);
  return (
    disponibles.find((m) => m.tipo === MENSAJE_POR_ACCION[r.proxima_accion?.clave]) ||
    disponibles.find((m) => m.recomendado) ||
    null
  );
}

export function CabeceraFicha({ r, mensajes, onMensaje, onRenovar, onCredenciales, onModificarPerfil, esAdministrador, onEditar, onAcceso }) {
  // Credenciales y Modificar cuenta/perfil actúan sobre un servicio ACTIVO del cliente.
  const sinServicioActivo = !(r.servicios_activos?.length > 0);
  const [copiado, setCopiado] = useState(false);
  const enlace = enlaceWhatsApp(r.whatsapp);
  const mensaje = mensajeContextual(r, mensajes);
  const renovar = objetivoRenovacion(r);

  function contactar() {
    if (mensaje) onMensaje(mensaje);
    else if (enlace) window.open(enlace, '_blank', 'noopener');
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(whatsappVisible(r.whatsapp));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sin portapapeles */
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-marca-500/[0.08] via-[#141518] to-[#0e0f12] p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <AvatarCliente nombre={r.nombre} tamano="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-texto">{r.nombre}</h1>
              <Semaforo estado={r.estado_comercial} tamano="md" />
              {r.acceso !== 'activo' && (
                <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">
                  Acceso: {TEXTO_ACCESO_CLIENTE[r.acceso]}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto/85">
              <span className="flex items-center gap-1.5">
                <IconoNav nombre="whatsapp" className="h-4 w-4 text-emerald-400" />
                {whatsappVisible(r.whatsapp)}
                <button type="button" onClick={copiar} className="text-xs font-medium text-marca-400 hover:underline">
                  {copiado ? 'Copiado ✓' : 'Copiar'}
                </button>
              </span>
              <span className="text-texto-suave">{r.email || 'Sin correo'}</span>
              <span className="text-texto-suave">
                {r.primera_activacion ? `Cliente desde ${fecha(r.primera_activacion)}` : `Registrado el ${fecha(r.fecha_registro)}`}
              </span>
            </div>
            <div className="mt-2">
              <EtiquetasCliente etiquetas={r.etiquetas} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={contactar}
            disabled={!enlace}
            title={mensaje ? `Abre el mensaje "${mensaje.titulo}"` : 'Abre el chat de WhatsApp'}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 disabled:opacity-40"
          >
            <IconoNav nombre="whatsapp" className="h-4 w-4" />
            Contactar por WhatsApp
          </button>
          <button
            type="button"
            onClick={() => onRenovar(renovar)}
            disabled={Boolean(renovar.bloqueo)}
            title={renovar.bloqueo || `Renovar ${renovar.servicio_nombre}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-marca-400 to-marca-600 px-4 text-sm font-semibold text-fondo shadow-lg shadow-marca-900/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconoNav nombre="actualizar" className="h-4 w-4" />
            Renovar
          </button>
          <button
            type="button"
            onClick={onCredenciales}
            disabled={sinServicioActivo}
            title={sinServicioActivo ? 'No tiene un servicio activo' : 'Ver y entregar sus credenciales'}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-texto transition hover:border-marca-500/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconoNav nombre="inventario" className="h-4 w-4" />
            Credenciales
          </button>
          {esAdministrador && (
            <button
              type="button"
              onClick={onModificarPerfil}
              disabled={sinServicioActivo}
              title={
                sinServicioActivo
                  ? 'No tiene un servicio activo'
                  : 'Solo casos especiales: cambia cuenta, correo, contraseña, perfil o PIN (motivo obligatorio, queda en la auditoría)'
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 text-sm font-semibold text-amber-300 transition hover:border-amber-400/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconoNav nombre="alerta" className="h-4 w-4" />
              Modificar cuenta/perfil
            </button>
          )}
          <button
            type="button"
            onClick={onEditar}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-texto transition hover:border-marca-500/50"
          >
            <IconoNav nombre="configuracion" className="h-4 w-4" />
            Editar
          </button>
          <MenuAcciones
            tamano="md"
            opciones={[
              { texto: 'Cambiar acceso', onClick: onAcceso },
              ...(enlace ? [{ texto: 'Abrir chat sin mensaje', onClick: () => window.open(enlace, '_blank', 'noopener') }] : []),
            ]}
          />
        </div>
      </div>
    </section>
  );
}
