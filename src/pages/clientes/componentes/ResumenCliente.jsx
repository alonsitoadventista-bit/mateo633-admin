/**
 * pages/clientes/componentes/ResumenCliente.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Resumen rápido de la ficha (GET /admin/clientes/:id/resumen):
 * nombre, estado comercial, servicios activos, próximo vencimiento,
 * último pago y último contacto; más WhatsApp, correo, acceso, etiquetas,
 * total pagado y antigüedad. Todo lo calcula el backend en hora de Lima.
 */
import { useState } from 'react';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { Boton, Etiqueta } from '../../../components/ui';
import { COLOR_ESTADO_CLIENTE, TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { fecha, fechaCalendario, moneda } from '../../../utils/formato';
import { enlaceWhatsApp, whatsappVisible } from '../../../utils/whatsapp';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { EtiquetasCliente, Semaforo, textoDias } from './Semaforo.jsx';

const FECHA_LARGA = { day: '2-digit', month: 'short', year: 'numeric' };

function Dato({ etiqueta, children, nota }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-texto">{children}</dd>
      {nota && <p className="mt-0.5 text-xs text-texto-suave">{nota}</p>}
    </div>
  );
}

function BotonCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sin portapapeles: no se muestra "copiado" */
    }
  }
  return (
    <button type="button" onClick={copiar} className="text-xs font-medium text-marca-400 hover:underline">
      {copiado ? 'Copiado ✓' : 'Copiar'}
    </button>
  );
}

export function ResumenCliente({ r, onEditar }) {
  const enlace = enlaceWhatsApp(r.whatsapp);
  const servicios = r.servicios_activos || [];

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-texto">{r.nombre}</h1>
            <Semaforo estado={r.estado_comercial} tamano="md" />
            {r.acceso !== 'activo' && (
              <Etiqueta color={COLOR_ESTADO_CLIENTE[r.acceso]}>
                Acceso: {TEXTO_ACCESO_CLIENTE[r.acceso]}
              </Etiqueta>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-texto/85">
            <span className="flex items-center gap-2">
              <IconoNav nombre="whatsapp" className="h-4 w-4 text-emerald-400" />
              {whatsappVisible(r.whatsapp)}
              <BotonCopiar texto={whatsappVisible(r.whatsapp)} />
            </span>
            <span className="text-texto-suave">{r.email || 'Sin correo'}</span>
          </div>
          <div className="mt-2">
            <EtiquetasCliente etiquetas={r.etiquetas} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {enlace && (
            <a
              href={enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              <IconoNav nombre="whatsapp" className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          <Boton variante="secundario" onClick={onEditar}>
            Editar datos
          </Boton>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Dato etiqueta={`Servicios activos (${servicios.length})`}>
          {servicios.length === 0 ? (
            <span className="text-texto-suave">Ninguno por ahora</span>
          ) : (
            <ul className="space-y-1.5">
              {servicios.map((s) => (
                <li key={s.pedido_id} className="flex items-center gap-2">
                  <IconoServicio nombre={s.servicio_nombre} imagenUrl={s.servicio_imagen_url} />
                  <span className="truncate">{s.servicio_nombre}</span>
                  <span className="ml-auto whitespace-nowrap text-xs text-texto-suave">{textoDias(s.dias_restantes)}</span>
                </li>
              ))}
            </ul>
          )}
        </Dato>

        <Dato
          etiqueta="Próximo vencimiento"
          nota={r.proximo_vencimiento ? textoDias(r.dias_restantes) : r.ultimo_vencimiento ? `Último: ${fechaCalendario(r.ultimo_vencimiento, FECHA_LARGA)}` : null}
        >
          {r.proximo_vencimiento ? fechaCalendario(r.proximo_vencimiento, FECHA_LARGA) : 'Sin servicios vigentes'}
        </Dato>

        <Dato etiqueta="Último pago" nota={r.ultimo_pago_fecha ? fecha(r.ultimo_pago_fecha) : null}>
          {r.ultimo_pago_monto !== null ? moneda(r.ultimo_pago_monto) : 'Sin pagos registrados'}
        </Dato>

        <Dato etiqueta="Último contacto" nota={r.ultimo_contacto ? 'Entrega de credenciales' : 'Aún no hay contactos registrados'}>
          {r.ultimo_contacto ? fecha(r.ultimo_contacto) : '—'}
        </Dato>

        <Dato etiqueta="Total pagado" nota={`${r.pedidos_activados} servicio${r.pedidos_activados === 1 ? '' : 's'} activado${r.pedidos_activados === 1 ? '' : 's'} · ${r.renovaciones} renovaci${r.renovaciones === 1 ? 'ón' : 'ones'}`}>
          {moneda(r.total_pagado)}
        </Dato>

        <Dato etiqueta="Cliente desde" nota={`Registrado el ${fecha(r.fecha_registro)}`}>
          {r.primera_activacion ? fecha(r.primera_activacion) : 'Todavía no activa un servicio'}
        </Dato>
      </dl>
    </section>
  );
}
