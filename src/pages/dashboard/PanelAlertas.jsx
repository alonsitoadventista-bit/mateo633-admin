/**
 * pages/dashboard/PanelAlertas.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * "Atención requerida" (antes "Alertas del sistema"):
 * GET /admin/dashboard/alertas -> SOLO acciones importantes con algo
 * pendiente, primero prioridad alta y luego media (orden del backend).
 * Cada fila: ícono por categoría, prioridad (texto + color, nunca solo
 * color), texto corto y enlace al módulo donde se resuelve. Los enlaces
 * '#...' llevan a un panel del propio Dashboard (Próximas renovaciones).
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { PanelDash } from './piezas.jsx';

const PRIORIDAD = {
  alta: {
    etiqueta: 'Alta',
    fila: 'border-rose-500/30 from-rose-600/20 hover:border-rose-400/60',
    tile: 'from-rose-400 to-red-600 text-white shadow-red-500/30',
    titulo: 'text-rose-100',
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  },
  media: {
    etiqueta: 'Media',
    fila: 'border-amber-500/30 from-amber-600/15 hover:border-amber-400/60',
    tile: 'from-amber-300 to-amber-600 text-fondo shadow-amber-500/30',
    titulo: 'text-amber-100',
    chip: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  },
};

/** Ícono según qué hay que atender. */
const ICONO_CATEGORIA = {
  activacion: 'portapapeles',
  pagos: 'billetera',
  vencimientos: 'reloj',
  stock: 'basedatos',
  problema: 'alerta',
};

/** Fila enlazada: ruta del panel (Link) o ancla del propio Dashboard ('#id', con scroll suave). */
function Destino({ enlace, className, children }) {
  if (enlace?.startsWith('#')) {
    return (
      <a
        href={enlace}
        className={className}
        onClick={(e) => {
          const destino = document.getElementById(enlace.slice(1));
          if (destino) {
            e.preventDefault();
            destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={enlace || '/'} className={className}>
      {children}
    </Link>
  );
}

export function PanelAlertas({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.alertas(), [recargar]);
  const alertas = Array.isArray(data) ? data : [];
  const altas = alertas.filter((a) => a.prioridad === 'alta').length;

  return (
    <PanelDash
      icono="campana"
      tono="ambar"
      titulo="Atención requerida"
      subtitulo={
        alertas.length
          ? `${alertas.length} acción${alertas.length === 1 ? '' : 'es'} pendiente${alertas.length === 1 ? '' : 's'}${altas ? ` · ${altas} de prioridad alta` : ''}`
          : 'Acciones importantes del día'
      }
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
          <p className="text-xs text-texto-suave">No hay acciones pendientes.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {alertas.map((a) => {
            const p = PRIORIDAD[a.prioridad] || PRIORIDAD.media;
            return (
              <li key={a.clave}>
                <Destino
                  enlace={a.enlace}
                  className={`group flex items-center gap-3 rounded-xl border bg-gradient-to-r to-transparent px-3 py-2.5 transition ${p.fila}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br shadow-lg ${p.tile}`}>
                    <IconoNav nombre={ICONO_CATEGORIA[a.categoria] || 'alerta'} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${p.titulo}`}>{a.titulo}</span>
                    {a.detalle && (
                      <span className="block truncate text-xs text-texto-suave" title={a.detalle}>
                        {a.detalle}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${p.chip}`}>
                      {p.etiqueta}
                    </span>
                    <IconoNav nombre="flecha" className="h-3.5 w-3.5 text-texto-suave group-hover:text-marca-400" />
                  </span>
                </Destino>
              </li>
            );
          })}
        </ul>
      )}
    </PanelDash>
  );
}
