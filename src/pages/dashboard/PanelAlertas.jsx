/**
 * pages/dashboard/PanelAlertas.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/alertas -> solo las alertas con algo pendiente, de la
 * más grave a la menos grave (el backend arma título, detalle y enlace).
 * Nivel con ícono + texto, nunca solo con color. Cada fila es un enlace al
 * módulo donde se resuelve.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { PanelDash } from './piezas.jsx';

const NIVEL = {
  critico: {
    icono: 'critico',
    etiqueta: 'Crítico',
    fila: 'border-rose-500/30 from-rose-600/20 hover:border-rose-400/60',
    tile: 'from-rose-400 to-red-600 text-white shadow-red-500/30',
    titulo: 'text-rose-100',
  },
  advertencia: {
    icono: 'alerta',
    etiqueta: 'Atención',
    fila: 'border-amber-500/30 from-amber-600/15 hover:border-amber-400/60',
    tile: 'from-amber-300 to-amber-600 text-fondo shadow-amber-500/30',
    titulo: 'text-amber-200',
  },
  info: {
    icono: 'info',
    etiqueta: 'Info',
    fila: 'border-sky-500/25 from-sky-600/15 hover:border-sky-400/60',
    tile: 'from-sky-400 to-blue-600 text-white shadow-blue-500/30',
    titulo: 'text-sky-100',
  },
};

/** Cuándo aplica cada alerta (columna derecha, como en la referencia). */
const CUANDO = {
  vencen_hoy: 'Hoy',
  vencen_7_dias: '1-7 días',
  cuentas_proveedor_por_vencer: '7 días',
};

export function PanelAlertas({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.alertas(), [recargar]);
  const alertas = Array.isArray(data) ? data : [];

  return (
    <PanelDash
      icono="campana"
      tono="ambar"
      titulo="Alertas del sistema"
      subtitulo={alertas.length ? `${alertas.length} pendiente${alertas.length === 1 ? '' : 's'} de atención` : 'Operación del día'}
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <IconoNav nombre="check" className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-texto">Todo en orden</p>
          <p className="text-xs text-texto-suave">No hay alertas pendientes.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {alertas.map((a) => {
            const n = NIVEL[a.nivel] || NIVEL.info;
            return (
              <li key={a.clave}>
                <Link
                  to={a.enlace || '/'}
                  className={`group flex items-center gap-3 rounded-xl border bg-gradient-to-r to-transparent px-3 py-2.5 transition ${n.fila}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br shadow-lg ${n.tile}`}>
                    <IconoNav nombre={n.icono} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${n.titulo}`}>
                      <span className="sr-only">{n.etiqueta}: </span>
                      {a.titulo}
                    </span>
                    {a.detalle && (
                      <span className="block truncate text-xs text-texto-suave" title={a.detalle}>
                        {a.detalle}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-texto-suave group-hover:text-marca-400">
                    {CUANDO[a.clave] || 'Ahora'}
                    <IconoNav nombre="flecha" className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PanelDash>
  );
}
