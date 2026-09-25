/**
 * pages/clientes/componentes/TarjetasClientes.jsx  (Clientes CRM, F1 → F2 visual)
 * -----------------------------------------
 * GET /admin/clientes/tarjetas → 4 indicadores tipo CRM:
 * Total clientes · Clientes activos · Próximos a vencer · Clientes vencidos.
 * Cada uno con su color, el % que representa y una barra de proporción.
 * Clic = filtra la lista (otro clic quita el filtro).
 */
import { EstadoCarga, EstadoError } from '../../../components/ui';
import { numero } from '../../../utils/formato';
import { IconoTile } from '../../dashboard/piezas.jsx';

const TONOS = {
  azul: { borde: 'border-blue-500/20 hover:border-blue-400/50', fondo: 'from-blue-600/20', barra: 'bg-blue-400', texto: 'text-blue-300' },
  verde: { borde: 'border-emerald-500/20 hover:border-emerald-400/50', fondo: 'from-emerald-600/15', barra: 'bg-emerald-400', texto: 'text-emerald-300' },
  ambar: { borde: 'border-amber-500/20 hover:border-amber-400/50', fondo: 'from-amber-600/15', barra: 'bg-amber-400', texto: 'text-amber-300' },
  rojo: { borde: 'border-rose-500/20 hover:border-rose-400/50', fondo: 'from-rose-600/15', barra: 'bg-rose-500', texto: 'text-rose-300' },
};

function pct(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

function Indicador({ titulo, icono, tono, valor, porcentaje, detalle, destacado, ayuda, activa, onClick }) {
  const t = TONOS[tono];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      title={ayuda}
      className={`group flex flex-col rounded-2xl border bg-gradient-to-br ${t.fondo} via-[#111215] to-[#0c0d10] p-4 text-left shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] transition ${t.borde} ${
        activa ? 'ring-2 ring-marca-500/70' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-texto-suave">{titulo}</p>
        <IconoTile icono={icono} tono={tono} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums text-texto">{numero(valor)}</span>
        {porcentaje !== null && <span className={`text-sm font-semibold ${t.texto}`}>{porcentaje}%</span>}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        <div className={`h-full rounded-full ${t.barra}`} style={{ width: `${porcentaje ?? 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-texto-suave">
        {destacado && <span className={`font-semibold ${t.texto}`}>{destacado} </span>}
        {detalle}
      </p>
    </button>
  );
}

/** `filtro` = estado_comercial aplicado en la lista ('' | 'vigentes' | 'proximo_a_vencer' | 'vencido'). */
export function TarjetasClientes({ datos, cargando, error, onReintentar, filtro, onFiltrar }) {
  if (error) return <EstadoError error={error} onReintentar={onReintentar} />;
  if (cargando && !datos) return <EstadoCarga texto="Cargando resumen de clientes…" />;
  if (!datos) return null;

  const alternar = (valor) => onFiltrar(filtro === valor ? '' : valor);

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Indicador
        titulo="Total clientes"
        icono="clientes"
        tono="azul"
        valor={datos.total}
        porcentaje={null}
        destacado={`+${numero(datos.nuevos_mes)}`}
        detalle={`este mes · ${numero(datos.inactivos)} inactivos`}
        ayuda="Todos los clientes registrados. Clic para ver todos."
        activa={false}
        onClick={() => onFiltrar('')}
      />
      <Indicador
        titulo="Clientes activos"
        icono="usuarios"
        tono="verde"
        valor={datos.vigentes}
        porcentaje={pct(datos.vigentes, datos.total)}
        destacado={numero(datos.activos)}
        detalle={`al día · ${numero(datos.proximos_a_vencer)} por vencer`}
        ayuda="Clientes con al menos un servicio vigente."
        activa={filtro === 'vigentes'}
        onClick={() => alternar('vigentes')}
      />
      <Indicador
        titulo="Próximos a vencer"
        icono="reloj"
        tono="ambar"
        valor={datos.proximos_a_vencer}
        porcentaje={pct(datos.proximos_a_vencer, datos.vigentes)}
        destacado={datos.vencen_hoy > 0 ? `${numero(datos.vencen_hoy)} vencen hoy` : null}
        detalle={datos.vencen_hoy > 0 ? '· de los activos' : 'de los activos, en 7 días o menos'}
        ayuda="Algún servicio vence en 7 días o menos: ofréceles la renovación."
        activa={filtro === 'proximo_a_vencer'}
        onClick={() => alternar('proximo_a_vencer')}
      />
      <Indicador
        titulo="Clientes vencidos"
        icono="alerta"
        tono="rojo"
        valor={datos.vencidos}
        porcentaje={pct(datos.vencidos, datos.total)}
        destacado={null}
        detalle="para recuperar (vencieron hace 30 días o menos)"
        ayuda="Sin servicios vigentes; el último venció hace 30 días o menos."
        activa={filtro === 'vencido'}
        onClick={() => alternar('vencido')}
      />
    </div>
  );
}
