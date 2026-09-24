/**
 * pages/dashboard/PanelRenovaciones.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/proximas-renovaciones?dias=15 -> servicios activos
 * que vencen pronto, del más urgente al menos. Para que el administrador o
 * vendedor vea a quién renovar y le escriba por WhatsApp en un clic.
 *
 * Estado (lo calcula el backend en hora de Lima):
 *   vence_hoy (0 días o menos) · vence_pronto (1-7) · vigente (8-15).
 * "Renovación creada" = ya existe un pedido de renovación enlazado: no hace
 * falta volver a escribirle a ese cliente.
 *
 * El `id` del panel es el destino de las alertas de vencimiento de
 * "Atención requerida" (enlace '#proximas-renovaciones').
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { fechaCalendario } from '../../utils/formato';
import { IconoServicio, PanelDash, Segmentos } from './piezas.jsx';

const DIAS = 15;
const VISIBLES = 8;

const FILTROS = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'hoy', texto: 'Hoy' },
  { valor: 'semana', texto: '7 días' },
];

const ESTADO = {
  vence_hoy: { texto: 'Vence hoy', clase: 'border-rose-500/40 bg-rose-500/15 text-rose-300' },
  vence_pronto: { texto: 'Vence pronto', clase: 'border-amber-500/40 bg-amber-500/15 text-amber-300' },
  vigente: { texto: 'Vigente', clase: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' },
};

/**
 * Número para wa.me: solo dígitos. Un número peruano guardado sin código de
 * país (9 dígitos que empiezan en 9) se completa con 51. null si no sirve.
 */
function numeroWhatsapp(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (/^9\d{8}$/.test(digitos)) return `51${digitos}`;
  return digitos.length >= 8 ? digitos : null;
}

function textoDias(dias) {
  if (dias < 0) return `Venció hace ${-dias} día${dias === -1 ? '' : 's'}`;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
}

/** Mensaje inicial de WhatsApp (neutro: sin nombre de negocio fijo, el sistema se venderá como SaaS). */
function mensaje(r) {
  const cuando = r.dias_restantes <= 0 ? 'hoy' : `el ${fechaCalendario(r.fecha_vencimiento, { day: '2-digit', month: 'long' })}`;
  return `Hola ${r.cliente_nombre}, tu servicio de ${r.servicio_nombre} vence ${cuando}. ¿Deseas renovarlo? Responde este mensaje y te ayudamos.`;
}

export function PanelRenovaciones({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.proximasRenovaciones(DIAS), [recargar]);
  const [filtro, setFiltro] = useState('todas');
  const [verTodas, setVerTodas] = useState(false);

  const todas = Array.isArray(data) ? data : [];
  const filas = todas.filter((r) =>
    filtro === 'hoy' ? r.estado === 'vence_hoy' : filtro === 'semana' ? r.dias_restantes <= 7 : true
  );
  const mostradas = verTodas ? filas : filas.slice(0, VISIBLES);
  const vencenHoy = todas.filter((r) => r.estado === 'vence_hoy').length;

  return (
    <PanelDash
      id="proximas-renovaciones"
      className="scroll-mt-24"
      icono="calendario"
      tono="verde"
      titulo="Próximas renovaciones"
      subtitulo={
        todas.length
          ? `${todas.length} en los próximos ${DIAS} días${vencenHoy ? ` · ${vencenHoy} vence${vencenHoy === 1 ? '' : 'n'} hoy` : ''}`
          : `Servicios que vencen en los próximos ${DIAS} días`
      }
      acciones={
        <Segmentos
          etiqueta="Filtro de renovaciones"
          opciones={FILTROS}
          valor={filtro}
          onCambio={(v) => {
            setFiltro(v);
            setVerTodas(false);
          }}
        />
      }
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio
          titulo="Sin renovaciones pendientes"
          descripcion={filtro === 'todas' ? `Ningún servicio vence en los próximos ${DIAS} días.` : 'Nada en este filtro.'}
        />
      ) : (
        <>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.06]">
            {mostradas.map((r) => {
              const est = ESTADO[r.estado] || ESTADO.vigente;
              const wa = numeroWhatsapp(r.cliente_whatsapp);
              return (
                <li key={r.pedido_id} className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-white/[0.03]">
                  <IconoServicio nombre={r.servicio_nombre} imagenUrl={r.servicio_imagen_url} tamano="md" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/clientes/${r.cliente_id}`}
                      className="block truncate text-sm font-semibold text-texto hover:text-marca-400"
                      title={r.cliente_nombre}
                    >
                      {r.cliente_nombre}
                    </Link>
                    <p className="truncate text-xs text-texto-suave">
                      {r.servicio_nombre} · vence {fechaCalendario(r.fecha_vencimiento, { day: '2-digit', month: 'short' })}
                      {r.renovacion_en_curso && <span className="ml-1.5 font-semibold text-sky-300">· Renovación creada</span>}
                    </p>
                    {/* En celular la columna de estado se oculta: el estado va aquí, con texto. */}
                    <p className="mt-1 sm:hidden">
                      <span className={`inline-flex whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${est.clase}`}>
                        {est.texto} · {textoDias(r.dias_restantes)}
                      </span>
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${est.clase}`}>
                      {est.texto}
                    </span>
                    <p className="mt-0.5 whitespace-nowrap text-[11px] tabular-nums text-texto-suave">{textoDias(r.dias_restantes)}</p>
                  </div>
                  {wa ? (
                    <a
                      href={`https://wa.me/${wa}?text=${encodeURIComponent(mensaje(r))}`}
                      target="_blank"
                      rel="noreferrer"
                      title={`Escribir a ${r.cliente_nombre} por WhatsApp`}
                      aria-label={`Escribir a ${r.cliente_nombre} por WhatsApp`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-md shadow-green-500/25 transition hover:brightness-110"
                    >
                      <IconoNav nombre="whatsapp" className="h-5 w-5" />
                    </a>
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-texto-suave" title="Sin WhatsApp válido">
                      —
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {filas.length > VISIBLES && (
            <button
              onClick={() => setVerTodas((v) => !v)}
              className="mt-3 text-xs font-medium text-marca-400 hover:underline"
            >
              {verTodas ? 'Ver menos' : `Ver las ${filas.length} renovaciones`}
            </button>
          )}
        </>
      )}
    </PanelDash>
  );
}
