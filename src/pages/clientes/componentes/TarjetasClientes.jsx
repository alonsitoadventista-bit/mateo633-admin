/**
 * pages/clientes/componentes/TarjetasClientes.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * GET /admin/clientes/tarjetas → las 4 tarjetas superiores de Clientes:
 * totales · activos (con servicio vigente) · próximos a renovar · vencidos.
 * Mismo estilo que las tarjetas del Dashboard. Cada tarjeta filtra la lista
 * al hacer clic (y otro clic quita el filtro).
 */
import { EstadoCarga, EstadoError } from '../../../components/ui';
import { numero } from '../../../utils/formato';
import { FilaDato, IconoTile } from '../../dashboard/piezas.jsx';

const TINTE = {
  azul: 'border-blue-500/25 from-blue-600/25 via-blue-950/20 to-[#0e0f12] hover:border-blue-400/50',
  verde: 'border-emerald-500/25 from-emerald-600/20 via-emerald-950/20 to-[#0e0f12] hover:border-emerald-400/50',
  ambar: 'border-amber-500/25 from-amber-600/20 via-amber-950/20 to-[#0e0f12] hover:border-amber-400/50',
  rojo: 'border-rose-500/25 from-rose-600/20 via-rose-950/20 to-[#0e0f12] hover:border-rose-400/50',
};

function Tarjeta({ titulo, ayuda, icono, tono, valor, activa, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      title={ayuda}
      className={`flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-5 text-left shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] transition ${TINTE[tono]} ${
        activa ? 'ring-2 ring-marca-500/70' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <IconoTile icono={icono} tono={tono} tamano="lg" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-texto/80">{titulo}</p>
          <p className="mt-0.5 text-3xl font-bold tracking-tight text-texto tabular-nums">{numero(valor)}</p>
        </div>
      </div>
      <div className="mt-4 w-full space-y-2">{children}</div>
      <span className="mt-3 text-xs font-medium text-marca-400">{activa ? 'Quitar filtro ×' : 'Ver en la lista →'}</span>
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta
        titulo="Clientes totales"
        ayuda="Todos los clientes registrados."
        icono="clientes"
        tono="azul"
        valor={datos.total}
        activa={false}
        onClick={() => onFiltrar('')}
      >
        <FilaDato etiqueta="Nuevos este mes" valor={numero(datos.nuevos_mes)} punto="bg-blue-400" />
        <FilaDato etiqueta="Inactivos" valor={numero(datos.inactivos)} punto="bg-slate-500" />
      </Tarjeta>

      <Tarjeta
        titulo="Clientes activos"
        ayuda="Clientes con al menos un servicio vigente."
        icono="usuarios"
        tono="verde"
        valor={datos.vigentes}
        activa={filtro === 'vigentes'}
        onClick={() => alternar('vigentes')}
      >
        <FilaDato etiqueta="Al día" valor={numero(datos.activos)} punto="bg-emerald-400" />
        <FilaDato etiqueta="Por vencer" valor={numero(datos.proximos_a_vencer)} punto="bg-amber-400" />
      </Tarjeta>

      <Tarjeta
        titulo="Próximos a renovar"
        ayuda="Algún servicio vence en 7 días o menos: ofréceles la renovación."
        icono="reloj"
        tono="ambar"
        valor={datos.proximos_a_vencer}
        activa={filtro === 'proximo_a_vencer'}
        onClick={() => alternar('proximo_a_vencer')}
      >
        <FilaDato etiqueta="Vencen hoy" valor={numero(datos.vencen_hoy)} punto="bg-rose-500" />
        <FilaDato etiqueta="En 1 a 7 días" valor={numero(datos.proximos_a_vencer - datos.vencen_hoy)} punto="bg-amber-400" />
      </Tarjeta>

      <Tarjeta
        titulo="Clientes vencidos"
        ayuda="Sin servicios vigentes; el último venció hace 30 días o menos."
        icono="alerta"
        tono="rojo"
        valor={datos.vencidos}
        activa={filtro === 'vencido'}
        onClick={() => alternar('vencido')}
      >
        <FilaDato etiqueta="Para recuperar (últimos 30 días)" valor={numero(datos.vencidos)} punto="bg-rose-500" />
      </Tarjeta>
    </div>
  );
}
