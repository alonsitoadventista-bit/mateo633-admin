/**
 * pages/dashboard/PanelUltimosPedidos.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/ultimos-pedidos?limite=7 (liviano: ya no descarga
 * la lista completa de pedidos como el PanelPedidosRecientes anterior).
 * Un pedido activo con entrega registrada se marca "Entregado".
 */
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { humanizar } from '../../utils/formato';
import { EnlacePill, IconoServicio, PanelDash } from './piezas.jsx';

/** Fecha corta para la tabla: '24/09, 21:15' (hora de Lima). */
const FECHA_CORTA = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Lima',
});

/** Pastilla de estado con su color (texto + borde, legible sobre negro). */
const PASTILLA = {
  pendiente: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  pagado: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  activo: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  entregado: 'border-blue-500/40 bg-blue-500/20 text-blue-300',
  vencido: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  cancelado: 'border-white/15 bg-white/5 text-texto-suave',
};

function Estado({ pedido }) {
  const clave = pedido.estado === 'activo' && pedido.entregado ? 'entregado' : pedido.estado;
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${PASTILLA[clave] || PASTILLA.cancelado}`}>
      {clave === 'entregado' ? 'Entregado' : humanizar(pedido.estado)}
    </span>
  );
}

export function PanelUltimosPedidos({ recargar }) {
  const navigate = useNavigate();
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ultimosPedidos(7), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <PanelDash
      icono="carrito"
      tono="azul"
      titulo="Últimos pedidos"
      subtitulo="Los 7 más recientes"
      acciones={<EnlacePill to="/pedidos">Ver todos</EnlacePill>}
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin pedidos" descripcion="Todavía no se ha registrado ningún pedido." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-left text-[11px] uppercase tracking-wider text-texto-suave">
                <th className="px-2.5 py-2.5 font-semibold">#</th>
                <th className="px-2.5 py-2.5 font-semibold">Cliente</th>
                <th className="px-2.5 py-2.5 font-semibold">Servicio</th>
                <th className="px-2.5 py-2.5 font-semibold">Estado</th>
                <th className="px-2.5 py-2.5 text-right font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filas.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => navigate(`/pedidos/${f.id}`)}
                  className="cursor-pointer transition hover:bg-white/[0.03]"
                >
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-bold tabular-nums text-texto">#{f.id}</td>
                  <td className="max-w-[8.5rem] truncate px-2.5 py-2.5 text-texto" title={f.cliente_nombre}>
                    {f.cliente_nombre}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="flex items-center gap-2 whitespace-nowrap text-texto/90">
                      <IconoServicio nombre={f.servicio_nombre} imagenUrl={f.servicio_imagen_url} />
                      {f.servicio_nombre}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <Estado pedido={f} />
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums text-texto-suave">
                    {FECHA_CORTA.format(new Date(f.fecha_solicitud))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelDash>
  );
}
