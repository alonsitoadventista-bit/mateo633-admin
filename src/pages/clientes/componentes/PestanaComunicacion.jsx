/**
 * pages/clientes/componentes/PestanaComunicacion.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Comunicación con el cliente:
 * 1. Mensajes preparados (GET /admin/clientes/:id/mensajes): recordar
 *    renovación · recuperar cliente · bienvenida, con datos reales. Se abren
 *    en WhatsApp para enviarlos a mano (sin API todavía).
 * 2. Historial de comunicación (GET /admin/clientes/:id/comunicaciones):
 *    entregas de credenciales y recordatorios automáticos.
 * 3. Avisos automáticos programados (GET /admin/clientes/:id/recordatorios).
 */
import { useApi } from '../../../hooks/useApi';
import * as clientesApi from '../../../api/clientes';
import { EstadoCarga, EstadoError, EstadoVacio, Tabla } from '../../../components/ui';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { fecha, fechaHora, humanizar } from '../../../utils/formato';

const ICONO_MENSAJE = { recordar_renovacion: 'reloj', recuperar_cliente: 'fuego', bienvenida: 'corona' };

const TIPO_COMUNICACION = {
  entrega_credenciales: 'Entrega de credenciales',
  recordatorio_7_dias: 'Recordatorio automático (7 días)',
  recordatorio_3_dias: 'Recordatorio automático (3 días)',
  recordatorio_vencimiento: 'Recordatorio automático (día del vencimiento)',
};

const CANAL_COMUNICACION = { whatsapp: 'WhatsApp', copiado: 'Copiado (enviado a mano)', manychat: 'WhatsApp (automático)', push: 'Notificación de la app' };

const ESTADO_COMUNICACION = {
  enviado: 'text-emerald-300',
  copiado: 'text-sky-300',
  fallido: 'text-rose-300',
};

function Titulo({ children, ayuda }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-texto">{children}</h3>
      {ayuda && <p className="text-xs text-texto-suave">{ayuda}</p>}
    </div>
  );
}

export function MensajesPreparados({ mensajes, cargando, error, onReintentar, onMensaje }) {
  if (error) return <EstadoError error={error} onReintentar={onReintentar} />;
  if (cargando && !mensajes) return <EstadoCarga texto="Preparando mensajes…" />;
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {(mensajes || []).map((m) => (
        <li
          key={m.tipo}
          className={`flex flex-col rounded-xl border p-4 ${m.recomendado && m.disponible ? 'border-marca-500/50 bg-marca-500/[0.07]' : 'border-white/[0.07] bg-black/20'}`}
        >
          <div className="flex items-center gap-2">
            <IconoNav nombre={ICONO_MENSAJE[m.tipo] || 'whatsapp'} className="h-4 w-4 text-marca-400" />
            <p className="text-sm font-semibold text-texto">{m.titulo}</p>
            {m.recomendado && m.disponible && (
              <span className="ml-auto rounded-full bg-marca-500 px-2 py-0.5 text-[11px] font-bold text-fondo">Recomendado</span>
            )}
          </div>
          <p className="mt-1 text-xs text-texto-suave">{m.descripcion}</p>
          <div className="mt-auto pt-3">
            {m.disponible ? (
              <button
                type="button"
                onClick={() => onMensaje(m)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                <IconoNav nombre="whatsapp" className="h-4 w-4" />
                Preparar mensaje
              </button>
            ) : (
              <p className="text-xs text-texto-suave">No aplica ahora: {m.motivo_no_disponible}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PestanaComunicacion({ clienteId, mensajes, onMensaje }) {
  const com = useApi(() => clientesApi.comunicaciones(clienteId), [clienteId]);
  const rec = useApi(() => clientesApi.recordatorios(clienteId), [clienteId]);

  return (
    <div className="space-y-6">
      <section>
        <Titulo ayuda="Textos listos con los datos del cliente. Se abren en WhatsApp para que los revises y envíes.">
          Mensajes preparados
        </Titulo>
        <MensajesPreparados
          mensajes={mensajes.data}
          cargando={mensajes.cargando}
          error={mensajes.error}
          onReintentar={mensajes.refetch}
          onMensaje={onMensaje}
        />
      </section>

      <section>
        <Titulo ayuda="Entregas de credenciales y recordatorios automáticos enviados a este cliente.">Historial de comunicación</Titulo>
        {com.error ? (
          <EstadoError error={com.error} onReintentar={com.refetch} />
        ) : com.cargando && !com.data ? (
          <EstadoCarga />
        ) : (com.data || []).length === 0 ? (
          <EstadoVacio titulo="Sin comunicaciones registradas" descripcion="Todavía no hay entregas ni recordatorios enviados a este cliente." />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={com.data}
            columnas={[
              { clave: 'fecha', titulo: 'Fecha', render: (f) => <span className="whitespace-nowrap">{fechaHora(f.fecha)}</span> },
              { clave: 'tipo', titulo: 'Tipo de mensaje', render: (f) => TIPO_COMUNICACION[f.tipo] || humanizar(f.tipo) },
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              { clave: 'canal', titulo: 'Canal', render: (f) => CANAL_COMUNICACION[f.canal] || humanizar(f.canal) },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (f) => <span className={`font-medium ${ESTADO_COMUNICACION[f.estado] || ''}`}>{humanizar(f.estado)}</span>,
              },
              { clave: 'actor_nombre', titulo: 'Por', render: (f) => f.actor_nombre || '—' },
            ]}
          />
        )}
      </section>

      <section>
        <Titulo ayuda="Avisos que el sistema enviará solo, antes de cada vencimiento.">Avisos automáticos programados</Titulo>
        {rec.error ? (
          <EstadoError error={rec.error} onReintentar={rec.refetch} />
        ) : rec.cargando && !rec.data ? (
          <EstadoCarga />
        ) : (rec.data || []).length === 0 ? (
          <EstadoVacio titulo="Sin avisos programados" descripcion="Este cliente no tiene servicios activos con avisos pendientes." />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={rec.data}
            columnas={[
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              { clave: 'tipo', titulo: 'Aviso', render: (f) => TIPO_COMUNICACION[f.tipo] || humanizar(f.tipo) },
              { clave: 'canal', titulo: 'Canal', render: (f) => CANAL_COMUNICACION[f.canal] || humanizar(f.canal) },
              { clave: 'fecha_envio', titulo: 'Se enviará', render: (f) => fechaHora(f.fecha_envio) },
              { clave: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => fecha(f.fecha_vencimiento) },
            ]}
          />
        )}
      </section>
    </div>
  );
}
