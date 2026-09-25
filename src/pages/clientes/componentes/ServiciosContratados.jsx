/**
 * pages/clientes/componentes/ServiciosContratados.jsx  (Clientes CRM, F1 → F2 visual)
 * -----------------------------------------
 * GET /admin/clientes/:id/servicios → una tarjeta por servicio vigente o
 * pendiente: estado, inicio, vencimiento con barra de días, perfil asignado
 * (cuenta + perfil; nunca la contraseña) y enlace al pedido.
 * "Recordar renovación" abre el mensaje preparado cuando vence en ≤ 7 días;
 * "Renovar" crea la renovación con la lógica existente (DialogoRenovar).
 * F2: franja superior con el color de la marca y cuenta regresiva destacada.
 */
import { Link } from 'react-router-dom';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../../components/ui';
import { fecha, fechaCalendario, moneda } from '../../../utils/formato';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { acentoServicio, urgencia } from '../utilidades';

const FECHA_LARGA = { day: '2-digit', month: 'short', year: 'numeric' };

function estadoServicio(s) {
  if (s.estado === 'pendiente') {
    return { texto: s.es_renovacion ? 'Renovación: falta el pago' : 'Falta el pago', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' };
  }
  if (s.estado === 'pagado') {
    return { texto: s.es_renovacion ? 'Renovación: falta activar' : 'Pagado: falta activar', clase: 'border-sky-500/40 bg-sky-500/15 text-sky-300' };
  }
  if (s.dias_restantes <= 7) return { texto: 'Por vencer', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' };
  return { texto: 'Vigente', clase: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' };
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
  const servicios = datos || [];
  if (servicios.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin servicios vigentes"
        descripcion="Este cliente no tiene servicios activos ni pedidos pendientes. Para asignarle uno, crea un pedido en Pedidos."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {servicios.map((s) => {
        const est = estadoServicio(s);
        const activo = s.estado === 'activo';
        return (
          <li key={s.pedido_id} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-black/20 p-4 pt-5">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: acentoServicio(s.servicio_nombre) }} aria-hidden="true" />
            <div className="flex items-start gap-3">
              <IconoServicio nombre={s.servicio_nombre} imagenUrl={s.servicio_imagen_url} tamano="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-texto">{s.servicio_nombre}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${est.clase}`}>{est.texto}</span>
                </div>
                <p className="text-xs text-texto-suave">
                  Plan de {s.duracion_dias} días · {moneda(s.precio_pagado)}
                  {s.es_renovacion ? ' · Renovación' : ' · Compra'}
                </p>
              </div>
              <Link to={`/pedidos/${s.pedido_id}`} className="shrink-0 text-xs font-medium text-marca-400 hover:underline">
                Ver pedido #{s.pedido_id} →
              </Link>
            </div>

            {activo ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-texto-suave">Inicio</p>
                    <p className="text-texto">{fecha(s.fecha_activacion)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-texto-suave">Vencimiento</p>
                    <p className="text-texto">{fechaCalendario(s.fecha_vencimiento, FECHA_LARGA)}</p>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-2xl font-bold tracking-tight text-texto">{urgencia(s.dias_restantes).grande}</span>
                  <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${urgencia(s.dias_restantes).clase}`}>
                    {urgencia(s.dias_restantes).largo}
                  </span>
                </div>
                <BarraDias dias={s.dias_restantes} duracion={s.duracion_dias} />
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
                  <p className="text-xs text-texto-suave">Perfil asignado</p>
                  {s.perfil_id ? (
                    <p className="text-texto">
                      {s.nombre_perfil || (s.numero_perfil ? `Perfil ${s.numero_perfil}` : 'Perfil')}
                      <span className="text-texto-suave"> · {s.identificador_cuenta}</span>
                    </p>
                  ) : (
                    <p className="text-amber-300">Sin perfil asignado todavía. Asígnalo desde el pedido.</p>
                  )}
                </div>
                {s.renovacion_en_curso && (
                  <p className="text-xs text-sky-300">Ya tiene una renovación en curso para este servicio.</p>
                )}
                {!s.renovacion_en_curso && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onRenovar({ pedido_id: s.pedido_id, servicio_nombre: s.servicio_nombre })}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-marca-500/40 bg-marca-500/10 px-3 py-1.5 text-sm font-semibold text-marca-400 transition hover:bg-marca-500/20"
                    >
                      <IconoNav nombre="actualizar" className="h-4 w-4" />
                      Renovar
                    </button>
                    {s.dias_restantes <= 7 && mensajeRecordar?.disponible && (
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
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-texto-suave">
                Solicitado el {fecha(s.fecha_solicitud)}. {s.estado === 'pendiente' ? 'Cuando pague, confírmalo desde el pedido.' : 'Actívalo desde el pedido para asignarle su perfil.'}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
