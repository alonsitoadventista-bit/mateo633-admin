/**
 * pages/clientes/componentes/IndicadoresFicha.jsx  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * 4 indicadores bajo la cabecera de la ficha:
 * Próximo vencimiento (destacado) · Servicios activos · Total pagado · Última comunicación.
 * Datos: resumen (r), servicios contratados y comunicaciones ya cargados por la ficha.
 */
import { fechaCalendario, moneda } from '../../../utils/formato';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { fechaRelativa, urgencia } from '../utilidades';

const FECHA = { day: '2-digit', month: 'long', year: 'numeric' };

const TIPO_COMUNICACION = {
  entrega_credenciales: 'Entrega de credenciales',
  recordatorio_7_dias: 'Recordatorio automático',
  recordatorio_3_dias: 'Recordatorio automático',
  recordatorio_vencimiento: 'Recordatorio automático',
};

function Caja({ titulo, children, className = '', acento }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-4 ${className}`}>
      {acento && <span className={`absolute inset-x-0 top-0 h-1 ${acento}`} aria-hidden="true" />}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-texto-suave">{titulo}</p>
      {children}
    </div>
  );
}

function ProximoVencimiento({ r }) {
  const vigente = r.servicios_activos?.[0];
  const dias = vigente ? r.dias_restantes : r.ultimo_vencimiento ? -r.dias_desde_vencimiento : null;
  const u = urgencia(dias);
  if (!u) {
    return (
      <Caja titulo="Próximo vencimiento">
        <p className="mt-2 text-lg font-semibold text-texto-suave">Sin servicios</p>
        <p className="text-xs text-texto-suave">Todavía no activó ningún servicio.</p>
      </Caja>
    );
  }
  const pct = vigente ? Math.min(100, Math.max(4, (r.dias_restantes / 30) * 100)) : 100;
  return (
    <Caja titulo={vigente ? 'Próximo vencimiento' : 'Último vencimiento'} acento={u.barra}>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-3xl font-bold tracking-tight text-texto">{u.grande}</span>
        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${u.clase}`}>{u.largo}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-texto/85">
        {vigente && <IconoServicio nombre={vigente.servicio_nombre} imagenUrl={vigente.servicio_imagen_url} />}
        <span className="truncate">{vigente ? vigente.servicio_nombre : r.ultimo_servicio_nombre}</span>
        <span className="ml-auto whitespace-nowrap text-xs text-texto-suave">
          {fechaCalendario(vigente ? r.proximo_vencimiento : r.ultimo_vencimiento, FECHA)}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        <div className={`h-full rounded-full ${u.barra}`} style={{ width: `${pct}%` }} />
      </div>
    </Caja>
  );
}

export function IndicadoresFicha({ r, servicios, comunicaciones }) {
  const pendientes = (servicios || []).filter((s) => s.estado !== 'activo').length;
  const ultima = comunicaciones?.[0];
  const fechaUltima = ultima?.fecha || r.ultimo_contacto;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ProximoVencimiento r={r} />

      <Caja titulo="Servicios activos">
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-texto">{r.cantidad_servicios_activos}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {(r.servicios_activos || []).slice(0, 4).map((s) => (
              <IconoServicio key={s.pedido_id} nombre={s.servicio_nombre} imagenUrl={s.servicio_imagen_url} />
            ))}
          </div>
          <span className="text-xs text-texto-suave">
            {pendientes > 0 ? `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de pago o activación` : 'Sin pendientes'}
          </span>
        </div>
      </Caja>

      <Caja titulo="Total histórico pagado">
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-marca-400">{moneda(r.total_pagado)}</p>
        <p className="mt-2 text-xs text-texto-suave">
          {r.ultimo_pago_monto !== null
            ? `Último pago ${moneda(r.ultimo_pago_monto)} · ${fechaRelativa(r.ultimo_pago_fecha)}`
            : 'Aún sin pagos registrados'}
          {' · '}
          {r.renovaciones} renovaci{r.renovaciones === 1 ? 'ón' : 'ones'}
        </p>
      </Caja>

      <Caja titulo="Última comunicación">
        <p className="mt-2 text-2xl font-bold tracking-tight text-texto">{fechaUltima ? fechaRelativa(fechaUltima) : '—'}</p>
        <p className="mt-2 text-xs text-texto-suave">
          {ultima
            ? `${TIPO_COMUNICACION[ultima.tipo] || 'Mensaje'}${ultima.servicio_nombre ? ` · ${ultima.servicio_nombre}` : ''}`
            : fechaUltima
              ? 'Entrega de credenciales'
              : 'Aún no hay comunicaciones registradas'}
        </p>
      </Caja>
    </div>
  );
}
