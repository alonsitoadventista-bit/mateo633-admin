/**
 * pages/dashboard/TarjetasResumen.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/resumen -> las 4 tarjetas superiores:
 * ventas del día, servicios activos, pedidos pendientes y cuentas por vencer.
 * Todo en hora de Lima (lo calcula el backend).
 * Fase visual: cada tarjeta lleva un tinte propio sobre el fondo negro
 * (azul, verde, ámbar, rojo -- como la referencia) y un ícono en degradado.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';
import { FilaDato, IconoTile, Indicador } from './piezas.jsx';

const TINTE = {
  azul: 'border-blue-500/25 from-blue-600/25 via-blue-950/20 to-[#0e0f12] hover:border-blue-400/40',
  verde: 'border-emerald-500/25 from-emerald-600/20 via-emerald-950/20 to-[#0e0f12] hover:border-emerald-400/40',
  ambar: 'border-amber-500/25 from-amber-600/20 via-amber-950/20 to-[#0e0f12] hover:border-amber-400/40',
  rojo: 'border-rose-500/25 from-rose-600/20 via-rose-950/20 to-[#0e0f12] hover:border-rose-400/40',
};

function Tarjeta({ titulo, icono, tono, valor, indicador, enlace, children }) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] transition ${TINTE[tono]}`}
    >
      <div className="flex items-start gap-4">
        <IconoTile icono={icono} tono={tono} tamano="lg" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-texto/80">{titulo}</p>
          <p className="mt-0.5 text-3xl font-bold tracking-tight text-texto tabular-nums">{valor}</p>
          <div className="mt-1 min-h-4">{indicador}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
      {enlace && (
        <Link to={enlace.ruta} className="mt-3 text-xs font-medium text-marca-400 hover:underline">
          {enlace.texto} →
        </Link>
      )}
    </div>
  );
}

export function TarjetasResumen({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.resumen(), [recargar]);

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga texto="Cargando resumen…" />;
  if (!data) return null;

  const { ventas_dia: v, servicios_activos: s, pedidos_pendientes: p, por_vencer: pv } = data;
  const difActivados = s.activados_mes - s.activados_mes_anterior;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta
        titulo="Ventas del día"
        icono="billetera"
        tono="azul"
        valor={moneda(v.monto)}
        indicador={<Indicador valor={v.variacion_pct} contexto="vs. ayer" sinBase={`Ayer: ${moneda(v.monto_ayer)}`} />}
      >
        <FilaDato icono="pedidos" etiqueta="Pagos registrados hoy" valor={numero(v.pagos_hoy)} />
        <FilaDato icono="carrito" etiqueta="Pedidos nuevos hoy" valor={numero(v.pedidos_hoy)} />
        <FilaDato icono="calendario" etiqueta="Ventas de ayer" valor={moneda(v.monto_ayer)} />
      </Tarjeta>

      <Tarjeta
        titulo="Servicios activos"
        icono="usuarios"
        tono="verde"
        valor={numero(s.total)}
        indicador={
          <span className="text-xs">
            <span className="font-semibold text-green-400">↑ +{numero(s.activados_mes)}</span>{' '}
            <span className="text-texto-suave">
              este mes ({difActivados >= 0 ? '+' : ''}
              {numero(difActivados)} vs. anterior)
            </span>
          </span>
        }
      >
        <FilaDato icono="clientes" etiqueta="Clientes con servicio" valor={numero(s.clientes_con_servicio)} />
        <FilaDato icono="inventario" etiqueta="Perfiles asignados" valor={numero(s.perfiles_asignados)} />
      </Tarjeta>

      <Tarjeta
        titulo="Pedidos pendientes"
        icono="portapapeles"
        tono="ambar"
        valor={numero(p.total)}
        indicador={
          p.en_revision > 0 ? (
            <Link to="/pagos-por-revisar" className="text-xs font-semibold text-amber-300 hover:underline">
              {numero(p.en_revision)} comprobante{p.en_revision === 1 ? '' : 's'} por revisar
            </Link>
          ) : (
            <span className="text-xs text-texto-suave">Sin comprobantes por revisar</span>
          )
        }
        enlace={{ ruta: '/pedidos', texto: 'Ver pedidos' }}
      >
        <FilaDato etiqueta="Pendientes de pago" valor={numero(p.de_pago)} punto="bg-amber-400" />
        <FilaDato etiqueta="Pendientes de activación" valor={numero(p.de_activacion)} punto="bg-rose-400" />
        <FilaDato etiqueta="Pendientes de entrega" valor={numero(p.de_entrega)} punto="bg-slate-400" />
      </Tarjeta>

      <Tarjeta
        titulo="Cuentas por vencer"
        icono="reloj"
        tono="rojo"
        valor={numero(pv.total)}
        indicador={<span className="text-xs text-texto-suave">próximos 15 días</span>}
      >
        <FilaDato etiqueta="Vencen hoy" valor={numero(pv.hoy)} punto="bg-rose-500" />
        <FilaDato etiqueta="Vencen en 1-7 días" valor={numero(pv.dias_1_7)} punto="bg-amber-400" />
        <FilaDato etiqueta="Vencen en 8-15 días" valor={numero(pv.dias_8_15)} punto="bg-slate-400" />
      </Tarjeta>
    </div>
  );
}
