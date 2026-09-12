/**
 * pages/pagos-por-revisar/DetallePagoPorRevisar.jsx  (Fase 5)
 * -----------------------------------------
 * Detalle de un pago reportado pendiente de revisión. No existe un
 * GET individual para esto en el backend -- se arma combinando dos
 * endpoints ya existentes (ninguno nuevo):
 *   - pedidosApi.detalle(id)     -> datos del pedido (cliente, servicio,
 *                                    duración, precio, estado actual)
 *   - dashboardApi.pagosPorRevisar() -> el registro de la bandeja para
 *                                    este pedido (monto/método/referencia/
 *                                    comprobante reportados, origen)
 * Aprobar (marca pagado + activa en un paso) y Rechazar (motivo
 * obligatorio, el pedido queda pendiente) usan los endpoints reales
 * de api/pagosPorRevisar.js. La auditoría reutiliza pedidosApi.auditoria(),
 * igual que en DetallePedido.jsx.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import * as pagosPorRevisarApi from '../../api/pagosPorRevisar';
import * as dashboardApi from '../../api/dashboard';
import { urlArchivo } from '../../api/client';
import {
  Tarjeta,
  Tabla,
  Boton,
  Campo,
  Etiqueta,
  Modal,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import { COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fechaHora, humanizar, moneda, whatsapp as formatoWhatsapp } from '../../utils/formato';

const ORIGEN = {
  pago_reportado_cliente: 'App del cliente',
  pago_reportado_manychat: 'ManyChat',
};

export function DetallePagoPorRevisar() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const { data: pedido, cargando: cargandoPedido, error: errorPedido, refetch: refetchPedido } = useApi(
    () => pedidosApi.detalle(pedidoId),
    [pedidoId]
  );
  const { data: bandeja, cargando: cargandoBandeja, error: errorBandeja } = useApi(
    () => dashboardApi.pagosPorRevisar(),
    []
  );

  const reporte = useMemo(
    () => (Array.isArray(bandeja) ? bandeja.find((f) => String(f.pedido_id) === String(pedidoId)) : null),
    [bandeja, pedidoId]
  );

  const [modalAprobar, setModalAprobar] = useState(false);
  const [modalRechazar, setModalRechazar] = useState(false);

  const error = errorPedido || errorBandeja;
  if (error) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoError error={error} onReintentar={refetchPedido} />
      </div>
    );
  }

  if ((cargandoPedido || cargandoBandeja) && (!pedido || !bandeja)) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!pedido) return null;

  const detalles = reporte?.detalles || {};
  const enBandeja = !!reporte;

  return (
    <div className="space-y-4">
      <BotonVolver />

      <Tarjeta titulo="Pedido">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato
            etiqueta="Cliente"
            valor={
              <Link to={`/clientes/${pedido.cliente_id}`} className="text-marca-700 hover:underline">
                {pedido.cliente_nombre}
              </Link>
            }
          />
          <Dato etiqueta="WhatsApp" valor={formatoWhatsapp(pedido.cliente_whatsapp)} />
          <Dato etiqueta="Servicio" valor={pedido.servicio_nombre} />
          <Dato etiqueta="Duración del plan" valor={`${pedido.duracion_dias} días`} />
          <Dato etiqueta="Precio del plan" valor={moneda(pedido.precio_pagado)} />
          <Dato
            etiqueta="Estado del pedido"
            valor={<Etiqueta color={COLOR_ESTADO_PEDIDO[pedido.estado]}>{humanizar(pedido.estado)}</Etiqueta>}
          />
        </dl>
      </Tarjeta>

      <Tarjeta titulo="Pago reportado">
        {!enBandeja ? (
          <EstadoVacio
            titulo="Ya no está pendiente de revisión"
            descripcion="Este pedido ya fue aprobado o rechazado, o no tiene un pago reportado sin resolver."
          />
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato etiqueta="Monto reportado" valor={moneda(detalles.monto ?? pedido.precio_pagado)} />
              <Dato etiqueta="Método" valor={detalles.metodo || '—'} />
              <Dato etiqueta="Referencia" valor={detalles.referencia || '—'} />
              <Dato
                etiqueta="Origen"
                valor={<Etiqueta color="blue">{ORIGEN[reporte.origen_reporte] || humanizar(reporte.origen_reporte)}</Etiqueta>}
              />
              <Dato etiqueta="Reportado el" valor={fechaHora(reporte.fecha_reporte)} />
              {detalles.comprobante_url && (
                <Dato
                  etiqueta="Comprobante"
                  valor={
                    <a
                      href={urlArchivo(detalles.comprobante_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-marca-700 hover:underline"
                    >
                      Ver imagen
                    </a>
                  }
                />
              )}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Boton variante="primario" tamano="md" onClick={() => setModalAprobar(true)}>
                Aprobar pago
              </Boton>
              <Boton variante="peligro" tamano="md" onClick={() => setModalRechazar(true)}>
                Rechazar pago
              </Boton>
            </div>
          </>
        )}
      </Tarjeta>

      <Tarjeta titulo="Auditoría">
        <PestanaAuditoria pedidoId={pedidoId} />
      </Tarjeta>

      <ModalAprobar
        abierto={modalAprobar}
        pedidoId={pedidoId}
        montoSugerido={detalles.monto ?? pedido.precio_pagado}
        metodoSugerido={detalles.metodo}
        onCerrar={() => setModalAprobar(false)}
        onAprobado={() => navigate('/pagos-por-revisar')}
      />
      <ModalRechazar
        abierto={modalRechazar}
        pedidoId={pedidoId}
        onCerrar={() => setModalRechazar(false)}
        onRechazado={() => navigate('/pagos-por-revisar')}
      />
    </div>
  );

  function BotonVolver() {
    return (
      <Link to="/pagos-por-revisar" className="text-sm font-medium text-marca-700 hover:underline">
        ← Volver a la bandeja
      </Link>
    );
  }
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valor ?? '—'}</dd>
    </div>
  );
}

/** PUT /admin/pagos-por-revisar/:pedidoId/aprobar — body: { monto, metodo }. Marca pagado + activa en un paso. */
function ModalAprobar({ abierto, pedidoId, montoSugerido, metodoSugerido, onCerrar, onAprobado }) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setMonto(montoSugerido != null ? String(montoSugerido) : '');
    setMetodo(metodoSugerido || '');
  }, [abierto, montoSugerido, metodoSugerido]);

  function cerrar() {
    setMonto('');
    setMetodo('');
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await pagosPorRevisarApi.aprobar(pedidoId, { monto: Number(monto), metodo: metodo.trim() || undefined });
      cerrar();
      onAprobado();
    } catch (err) {
      setError(err?.message || 'No se pudo aprobar el pago.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Aprobar pago"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-aprobar-pago" cargando={cargando}>
            Confirmar y activar
          </Boton>
        </>
      }
    >
      <form id="form-aprobar-pago" onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">
          Esto marca el pedido como pagado y lo activa de inmediato (fecha de vencimiento + recordatorios se calculan igual que en el módulo Pedidos).
        </p>
        <Campo
          etiqueta="Monto"
          name="monto"
          type="number"
          min="0.01"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          autoFocus
        />
        <Campo
          etiqueta="Método (opcional)"
          name="metodo"
          placeholder="Efectivo, transferencia…"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

/** PUT /admin/pagos-por-revisar/:pedidoId/rechazar — body: { motivo }. El pedido permanece pendiente. */
function ModalRechazar({ abierto, pedidoId, onCerrar, onRechazado }) {
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function cerrar() {
    setMotivo('');
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await pagosPorRevisarApi.rechazar(pedidoId, motivo.trim());
      cerrar();
      onRechazado();
    } catch (err) {
      setError(err?.message || 'No se pudo rechazar el pago.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Rechazar pago"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" type="submit" form="form-rechazar-pago" cargando={cargando} disabled={!motivo.trim()}>
            Rechazar pago
          </Boton>
        </>
      }
    >
      <form id="form-rechazar-pago" onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-600">El pedido permanece pendiente; el cliente o el staff puede reportar el pago de nuevo.</p>
        <Campo
          etiqueta="Motivo del rechazo"
          name="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

/** GET /admin/pedidos/:id/auditoria — reutilizado tal cual de DetallePedido.jsx. */
function PestanaAuditoria({ pedidoId }) {
  const { data, cargando, error, refetch } = useApi(() => pedidosApi.auditoria(pedidoId), [pedidoId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin eventos" descripcion="Aún no hay auditoría registrada para este pedido." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'fecha', titulo: 'Fecha', render: (f) => fechaHora(f.fecha) },
        { clave: 'accion', titulo: 'Acción', render: (f) => humanizar(f.accion) },
        { clave: 'actor', titulo: 'Actor', render: (f) => `${humanizar(f.actor_tipo)}${f.actor_id ? ` #${f.actor_id}` : ''}` },
        {
          clave: 'detalles',
          titulo: 'Detalles',
          render: (f) =>
            f.detalles && Object.keys(f.detalles).length > 0 ? (
              <code className="text-xs text-slate-500">{JSON.stringify(f.detalles)}</code>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}
