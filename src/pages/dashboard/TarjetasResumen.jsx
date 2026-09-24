/**
 * pages/dashboard/TarjetasResumen.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/resumen -> las 4 tarjetas superiores:
 * ventas del día, servicios activos, pedidos pendientes y por vencer.
 * Todo en hora de Lima (lo calcula el backend).
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { IconoNav } from '../../components/IconoNav.jsx';
import { EstadoCarga, EstadoError } from '../../components/ui';
import { moneda, numero } from '../../utils/formato';
import { FilaDato, Indicador } from './piezas.jsx';

const BADGE = {
  dorado: 'bg-marca-500/15 text-marca-400',
  verde: 'bg-green-500/15 text-green-400',
  ambar: 'bg-amber-500/15 text-amber-400',
  rojo: 'bg-red-500/15 text-red-400',
};

function Tarjeta({ titulo, icono, color, valor, indicador, enlace, children }) {
  return (
    <div className="flex flex-col rounded-2xl border border-borde bg-superficie p-4 shadow-lg shadow-black/30">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${BADGE[color]}`}>
          <IconoNav nombre={icono} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-texto-suave">{titulo}</p>
          <p className="text-2xl font-bold leading-tight text-texto">{valor}</p>
        </div>
      </div>
      <div className="mt-1 min-h-5">{indicador}</div>
      <div className="mt-3 space-y-1.5 border-t border-borde pt-3">{children}</div>
      {enlace && (
        <Link to={enlace.ruta} className="mt-3 text-xs font-medium text-marca-500 hover:underline">
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Tarjeta
        titulo="Ventas del día"
        icono="pagos"
        color="dorado"
        valor={moneda(v.monto)}
        indicador={<Indicador valor={v.variacion_pct} contexto="vs. ayer" sinBase={`Ayer: ${moneda(v.monto_ayer)}`} />}
      >
        <FilaDato etiqueta="Pagos registrados hoy" valor={numero(v.pagos_hoy)} />
        <FilaDato etiqueta="Pedidos nuevos hoy" valor={numero(v.pedidos_hoy)} />
        <FilaDato etiqueta="Ventas de ayer" valor={moneda(v.monto_ayer)} />
      </Tarjeta>

      <Tarjeta
        titulo="Servicios activos"
        icono="servicios"
        color="verde"
        valor={numero(s.total)}
        indicador={
          <span className="text-xs text-texto-suave">
            <span className={`font-semibold ${difActivados >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              +{numero(s.activados_mes)}
            </span>{' '}
            activados este mes ({difActivados >= 0 ? '+' : ''}
            {numero(difActivados)} vs. mes anterior)
          </span>
        }
      >
        <FilaDato etiqueta="Clientes con servicio" valor={numero(s.clientes_con_servicio)} />
        <FilaDato etiqueta="Perfiles asignados" valor={numero(s.perfiles_asignados)} />
      </Tarjeta>

      <Tarjeta
        titulo="Pedidos pendientes"
        icono="pedidos"
        color="ambar"
        valor={numero(p.total)}
        indicador={
          p.en_revision > 0 ? (
            <Link to="/pagos-por-revisar" className="text-xs font-medium text-amber-400 hover:underline">
              {numero(p.en_revision)} comprobante{p.en_revision === 1 ? '' : 's'} por revisar
            </Link>
          ) : (
            <span className="text-xs text-texto-suave">Sin comprobantes por revisar</span>
          )
        }
        enlace={{ ruta: '/pedidos', texto: 'Ver pedidos' }}
      >
        <FilaDato etiqueta="Pendientes de pago" valor={numero(p.de_pago)} punto="bg-amber-400" />
        <FilaDato etiqueta="Pendientes de activación" valor={numero(p.de_activacion)} punto="bg-red-400" />
        <FilaDato etiqueta="Pendientes de entrega" valor={numero(p.de_entrega)} punto="bg-texto-suave" />
      </Tarjeta>

      <Tarjeta
        titulo="Cuentas por vencer"
        icono="auditoria"
        color="rojo"
        valor={numero(pv.total)}
        indicador={<span className="text-xs text-texto-suave">servicios de clientes, próximos 15 días</span>}
      >
        <FilaDato etiqueta="Vencen hoy" valor={numero(pv.hoy)} punto="bg-red-400" />
        <FilaDato etiqueta="Vencen en 1-7 días" valor={numero(pv.dias_1_7)} punto="bg-amber-400" />
        <FilaDato etiqueta="Vencen en 8-15 días" valor={numero(pv.dias_8_15)} punto="bg-texto-suave" />
      </Tarjeta>
    </div>
  );
}
