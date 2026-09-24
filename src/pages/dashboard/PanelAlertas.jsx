/**
 * pages/dashboard/PanelAlertas.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/alertas -> solo las alertas con algo pendiente, de la
 * más grave a la menos grave (el backend arma título, detalle y enlace).
 * Nivel con icono + texto, nunca solo con color.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, EstadoCarga, EstadoError } from '../../components/ui';

const NIVEL = {
  critico: { icono: '⛔', etiqueta: 'Crítico', caja: 'border-red-500/30 bg-red-500/10', texto: 'text-red-300' },
  advertencia: { icono: '⚠️', etiqueta: 'Atención', caja: 'border-amber-500/30 bg-amber-500/10', texto: 'text-amber-300' },
  info: { icono: 'ℹ️', etiqueta: 'Info', caja: 'border-blue-500/30 bg-blue-500/10', texto: 'text-blue-300' },
};

export function PanelAlertas({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.alertas(), [recargar]);
  const alertas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta titulo={`Alertas operativas${alertas.length ? ` · ${alertas.length}` : ''}`}>
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : alertas.length === 0 ? (
        <p className="py-6 text-center text-sm text-green-400">✓ Todo en orden: no hay alertas pendientes.</p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => {
            const n = NIVEL[a.nivel] || NIVEL.info;
            return (
              <li key={a.clave} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${n.caja}`}>
                <span aria-hidden="true" className="mt-0.5 text-base leading-none">
                  {n.icono}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${n.texto}`}>
                    <span className="sr-only">{n.etiqueta}: </span>
                    {a.titulo}
                  </p>
                  {a.detalle && <p className="truncate text-xs text-texto-suave" title={a.detalle}>{a.detalle}</p>}
                </div>
                {a.enlace && (
                  <Link to={a.enlace} className="shrink-0 self-center text-xs font-medium text-marca-500 hover:underline">
                    Resolver →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
