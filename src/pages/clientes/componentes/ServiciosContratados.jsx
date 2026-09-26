/**
 * pages/clientes/componentes/ServiciosContratados.jsx  (Clientes CRM)
 * -----------------------------------------
 * VISTA OPERATIVA (regla 2026-09-26): una tarjeta por SERVICIO del cliente
 * (Netflix, Disney+…), nunca una por pedido. Los pedidos quedan como historial
 * (pestaña "Compras y renovaciones").
 * Datos: GET /admin/clientes/:id/servicios, agrupado con agruparPorServicio().
 * Cada tarjeta: estado, vencimiento más próximo con barra de días y el/los
 * perfil(es) asignado(s) (cuenta + perfil; nunca la contraseña). Si el cliente
 * tiene varias pantallas del mismo servicio, se listan sus perfiles.
 * "Renovar" abre el mismo flujo de un paso (se elige el perfil si hay varios);
 * "Recordar renovación" abre el mensaje preparado cuando vence en ≤ 7 días.
 */
import { Link } from 'react-router-dom';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../../components/ui';
import { fechaCalendario, moneda } from '../../../utils/formato';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { acentoServicio, urgencia } from '../utilidades';
import { agruparPorServicio, nombrePerfil } from '../serviciosCliente';

const FECHA_LARGA = { day: '2-digit', month: 'short', year: 'numeric' };

function estadoGrupo(g) {
  if (g.suscripciones.length === 0) {
    const pagado = g.pendientes.some((p) => p.estado === 'pagado');
    return pagado
      ? { texto: 'Pagado: falta activar', clase: 'border-sky-500/40 bg-sky-500/15 text-sky-300' }
      : { texto: 'Falta el pago', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' };
  }
  if (g.dias_restantes <= 7) return { texto: 'Por vencer', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' };
  return { texto: 'Vigente', clase: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' };
}

/** Pendiente que NO es la renovación de una suscripción activa (compra nueva por pagar/activar). */
function comprasPendientes(g) {
  const activas = new Set(g.suscripciones.map((s) => s.pedido_id));
  return g.pendientes.filter((p) => !(p.es_renovacion && activas.has(p.pedido_origen_id)));
}

function BarraDias({ dias, duracion }) {
  const total = Math.max(Number(duracion) || 30, 1);
  const pct = Math.min(100, Math.max(0, (dias / total) * 100));
  const color = dias <= 0 ? 'bg-rose-500' : dias <= 7 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ServiciosContratados({ datos, cargando, error, onReintentar, mensajeRecordar, onMensaje, onRenovar }) {
  if (error) return <EstadoError error={error} onReintentar={onReintentar} />;
  if (cargando && !datos) return <EstadoCarga texto="Cargando servicios…" />;
  const grupos = agruparPorServicio(datos);
  if (grupos.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin servicios vigentes"
        descripcion="Este cliente no tiene servicios activos ni pendientes. Para asignarle uno, crea un pedido en Pedidos."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {grupos.map((g) => {
        const est = estadoGrupo(g);
        const n = g.suscripciones.length;
        const pendientes = comprasPendientes(g);
        return (
          <li key={g.servicio_id} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-black/20 p-4 pt-5">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: acentoServicio(g.servicio_nombre) }} aria-hidden="true" />
            <div className="flex items-start gap-3">
              <IconoServicio nombre={g.servicio_nombre} imagenUrl={g.servicio_imagen_url} tamano="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-texto">{g.servicio_nombre}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${est.clase}`}>{est.texto}</span>
                </div>
                <p className="text-xs text-texto-suave">
                  Plan de {g.duracion_dias} días · {moneda(g.precio_pagado)}
                  {n > 1 ? ` · ${n} perfiles` : ''}
                </p>
              </div>
            </div>

            {n > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <p className="text-xs text-texto-suave">{n > 1 ? 'Próximo vencimiento' : 'Vencimiento'}</p>
                  <p className="text-texto">{fechaCalendario(g.fecha_vencimiento, FECHA_LARGA)}</p>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-2xl font-bold tracking-tight text-texto">{urgencia(g.dias_restantes).grande}</span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${urgencia(g.dias_restantes).clase}`}>
                    {urgencia(g.dias_restantes).largo}
                  </span>
                </div>
                <BarraDias dias={g.dias_restantes} duracion={g.duracion_dias} />
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                  <p className="text-xs text-texto-suave">{n > 1 ? 'Perfiles asignados' : 'Perfil asignado'}</p>
                  <ul className="space-y-0.5">
                    {g.suscripciones.map((s) => (
                      <li key={s.pedido_id} className={s.perfil_id ? 'text-texto' : 'text-amber-300'}>
                        {nombrePerfil(s)}
                        {s.identificador_cuenta && <span className="text-texto-suave"> · {s.identificador_cuenta}</span>}
                        {n > 1 && <span className="text-texto-suave"> · vence {fechaCalendario(s.fecha_vencimiento, FECHA_LARGA)}</span>}
                        {s.renovacion_en_curso && <span className="text-sky-300"> · renovación en curso</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {g.renovacion_en_curso && (
                  <p className="text-xs text-sky-300">Tiene una renovación en curso: "Renovar" la confirma (no se duplica).</p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRenovar(g.servicio_id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-marca-500/40 bg-marca-500/10 px-3 py-1.5 text-sm font-semibold text-marca-400 transition hover:bg-marca-500/20"
                  >
                    <IconoNav nombre="actualizar" className="h-4 w-4" />
                    Renovar
                  </button>
                  {g.dias_restantes <= 7 && mensajeRecordar?.disponible && (
                    <button
                      type="button"
                      onClick={() => onMensaje(mensajeRecordar)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      <IconoNav nombre="whatsapp" className="h-4 w-4" />
                      Recordar renovación
                    </button>
                  )}
                </div>
              </div>
            )}

            {pendientes.length > 0 && (
              <div className={`${n > 0 ? 'mt-3 border-t border-white/[0.06] pt-2' : 'mt-3'} space-y-1 text-sm text-texto-suave`}>
                {pendientes.map((p) => (
                  <p key={p.pedido_id}>
                    {p.es_renovacion ? 'Renovación' : 'Compra nueva'}: {p.estado === 'pendiente' ? 'falta el pago' : 'pagada, falta activar'}.{' '}
                    <Link to={`/pedidos/${p.pedido_id}`} className="font-medium text-marca-400 hover:underline">
                      Gestionar →
                    </Link>
                  </p>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
