/**
 * pages/clientes/componentes/TablaClientes.jsx  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * Lista de clientes con jerarquía de CRM:
 * - escritorio (md+): tabla con borde de color por estado, avatar, nombre +
 *   teléfono, servicio principal (+N), vencimiento como pastilla de urgencia,
 *   semáforo, último pago relativo, próxima acción ejecutable y botones
 *   directos WhatsApp / Renovar + menú ⋯ (Ver, Editar). Clic en fila → ficha.
 * - móvil: una tarjeta por cliente con lo mismo.
 * Los datos vienen tal cual de GET /admin/clientes/listado.
 */
import { IconoNav } from '../../../components/IconoNav.jsx';
import { TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { fechaCalendario, moneda } from '../../../utils/formato';
import { enlaceWhatsApp, whatsappVisible } from '../../../utils/whatsapp';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { fechaRelativa, urgencia } from '../utilidades';
import { AvatarCliente } from './AvatarCliente.jsx';
import { BotonProximaAccion } from './BotonProximaAccion.jsx';
import { MenuAcciones } from './MenuAcciones.jsx';
import { EtiquetasCliente, Semaforo } from './Semaforo.jsx';
import { objetivoRenovacion } from './DialogoRenovar.jsx';

const BORDE_ESTADO = {
  activo: 'bg-emerald-400',
  proximo_a_vencer: 'bg-amber-400',
  vencido: 'bg-rose-500',
  inactivo: 'bg-slate-600',
};

const FECHA = { day: '2-digit', month: 'short', year: 'numeric' };

/** Servicio principal = el vigente que vence primero; "+N" si tiene más. */
function ServicioPrincipal({ c }) {
  const s = c.servicios_activos?.[0];
  if (!s) {
    return c.ultimo_servicio_nombre ? (
      <span className="text-xs text-texto-suave">Último: {c.ultimo_servicio_nombre}</span>
    ) : (
      <span className="text-xs text-texto-suave">Sin servicios</span>
    );
  }
  const extra = c.servicios_activos.length - 1;
  return (
    <div className="flex items-center gap-2" title={c.servicios_activos.map((x) => x.servicio_nombre).join(', ')}>
      <IconoServicio nombre={s.servicio_nombre} imagenUrl={s.servicio_imagen_url} tamano="md" />
      <span className="truncate text-sm font-medium text-texto">{s.servicio_nombre}</span>
      {extra > 0 && (
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-semibold text-texto/85">+{extra}</span>
      )}
    </div>
  );
}

/** Vencimiento más importante: el próximo, o el último si ya no tiene vigentes. */
function Vencimiento({ c }) {
  const dias = c.proximo_vencimiento ? c.dias_restantes : c.ultimo_vencimiento ? -c.dias_desde_vencimiento : null;
  const u = urgencia(dias);
  if (!u) return <span className="text-texto-suave">—</span>;
  return (
    <div className="space-y-1">
      <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold ${u.clase}`}>{u.corto}</span>
      <p className="text-xs text-texto-suave">{fechaCalendario(c.proximo_vencimiento || c.ultimo_vencimiento, FECHA)}</p>
    </div>
  );
}

function UltimoPago({ c }) {
  if (c.ultimo_pago_monto === null) return <span className="text-xs text-texto-suave">Sin pagos</span>;
  return (
    <div>
      <p className="text-sm font-medium tabular-nums text-texto">{moneda(c.ultimo_pago_monto)}</p>
      <p className="text-xs text-texto-suave">{fechaRelativa(c.ultimo_pago_fecha)}</p>
    </div>
  );
}

/** Botones directos: WhatsApp (chat) y Renovar; luego el menú ⋯. */
function Acciones({ c, onVer, onEditar, onRenovar }) {
  const enlace = enlaceWhatsApp(c.whatsapp);
  const renovar = objetivoRenovacion(c);
  const base = 'grid h-8 w-8 place-items-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-30';
  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {enlace ? (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir chat de WhatsApp"
          aria-label="WhatsApp"
          className={`${base} border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30`}
        >
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
        </a>
      ) : (
        <span className={`${base} border-white/10 text-texto-suave opacity-30`} title="Número no válido">
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
        </span>
      )}
      <button
        type="button"
        aria-label="Renovar"
        title={renovar.bloqueo || `Renovar ${renovar.servicio_nombre}`}
        disabled={Boolean(renovar.bloqueo)}
        onClick={() => onRenovar({ ...renovar, cliente_nombre: c.nombre })}
        className={`${base} border-marca-500/40 bg-marca-500/15 text-marca-400 hover:bg-marca-500/30`}
      >
        <IconoNav nombre="actualizar" className="h-4 w-4" />
      </button>
      <MenuAcciones
        opciones={[
          { texto: 'Ver ficha del cliente', onClick: () => onVer(c) },
          { texto: 'Editar datos', onClick: () => onEditar(c) },
        ]}
      />
    </div>
  );
}

export function TablaClientes({ filas, onVer, onEditar, onRenovar, onMensaje }) {
  const acciones = { onVer, onEditar, onRenovar };
  return (
    <>
      {/* Escritorio */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-y-1.5 text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-texto-suave">
              <th className="px-4 pb-1">Cliente</th>
              <th className="px-3 pb-1">Servicio principal</th>
              <th className="px-3 pb-1">Vencimiento</th>
              <th className="px-3 pb-1">Estado</th>
              <th className="px-3 pb-1">Último pago</th>
              <th className="px-3 pb-1">Próxima acción</th>
              <th className="px-3 pb-1 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((c) => (
              <tr
                key={c.id}
                onClick={() => onVer(c)}
                className="group cursor-pointer bg-white/[0.025] transition hover:bg-white/[0.06]"
              >
                <td className="relative rounded-l-xl py-3 pl-4 pr-3">
                  <span className={`absolute inset-y-2 left-0 w-1 rounded-full ${BORDE_ESTADO[c.estado_comercial]}`} aria-hidden="true" />
                  <div className="flex items-center gap-3">
                    <AvatarCliente nombre={c.nombre} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-texto group-hover:text-marca-400">{c.nombre}</p>
                      <p className="whitespace-nowrap text-xs text-texto-suave">{whatsappVisible(c.whatsapp)}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <EtiquetasCliente etiquetas={c.etiquetas} />
                        {c.acceso !== 'activo' && (
                          <span className="rounded-md bg-red-500/15 px-1.5 py-0.5 text-[11px] font-medium text-red-300">
                            {TEXTO_ACCESO_CLIENTE[c.acceso]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3"><ServicioPrincipal c={c} /></td>
                <td className="px-3 py-3"><Vencimiento c={c} /></td>
                <td className="px-3 py-3"><Semaforo estado={c.estado_comercial} /></td>
                <td className="px-3 py-3"><UltimoPago c={c} /></td>
                <td className="px-3 py-3">
                  <BotonProximaAccion cliente={c} onMensaje={onMensaje} onAbrirFicha={onVer} />
                </td>
                <td className="rounded-r-xl px-3 py-3"><Acciones c={c} {...acciones} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <ul className="space-y-3 md:hidden">
        {filas.map((c) => (
          <li
            key={c.id}
            onClick={() => onVer(c)}
            className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 pl-5"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${BORDE_ESTADO[c.estado_comercial]}`} aria-hidden="true" />
            <div className="flex items-start gap-3">
              <AvatarCliente nombre={c.nombre} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-texto">{c.nombre}</p>
                <p className="text-xs text-texto-suave">{whatsappVisible(c.whatsapp)}</p>
              </div>
              <Semaforo estado={c.estado_comercial} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <ServicioPrincipal c={c} />
              <div className="justify-self-end"><Vencimiento c={c} /></div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
              <BotonProximaAccion cliente={c} onMensaje={onMensaje} onAbrirFicha={onVer} />
              <Acciones c={c} {...acciones} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
