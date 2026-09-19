/**
 * pages/pedidos/DetallePedido.jsx  (Fase 4)
 * -----------------------------------------
 * Detalle de un pedido: datos (cliente, servicio, plan, precio,
 * fechas) y acciones de cambio de estado, gobernadas por la máquina
 * de estados existente del backend (TRANSICIONES_PEDIDO en
 * utils/constants.js) -- cada botón llama exactamente al endpoint
 * dedicado que ya existe para esa transición:
 *   pendiente -> pagado   : PUT /admin/pedidos/:id/marcar-pagado
 *   pagado    -> activo   : PUT /admin/pedidos/:id/activar
 *   *         -> cancelado: PUT /admin/pedidos/:id/cancelar
 *   activo/vencido -> nuevo pedido enlazado: POST /admin/pedidos/:id/renovar
 * "vencido" no tiene transición manual (la marca un job automático),
 * así que ningún botón la ofrece -- solo "Renovar" queda disponible
 * desde ese estado.
 * Pestañas de historial (pagos, auditoría, cadena de renovaciones),
 * cada una sobre su propio endpoint ya existente en api/pedidos.js.
 *
 * Inventario (Fase 1, solo tipo_gestion='perfil'): "Activar servicio"
 * ya intenta asignar un perfil disponible automáticamente (ver
 * services/inventarioService.js del backend) -- esta pantalla solo
 * MUESTRA el resultado y ofrece el respaldo manual si no había
 * inventario disponible, más la acción "Liberar cuenta" cuando quedó
 * "vencido" (requiere que el admin haya rotado la contraseña real).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import * as inventarioApi from '../../api/inventario';
import {
  Tarjeta,
  Tabla,
  Boton,
  Campo,
  Selector,
  Etiqueta,
  Modal,
  DialogoConfirmacion,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import { COLOR_ESTADO_PEDIDO, COLOR_ESTADO_INVENTARIO } from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda, whatsapp as formatoWhatsapp } from '../../utils/formato';

const PESTANAS = [
  { clave: 'pagos', titulo: 'Pagos' },
  { clave: 'auditoria', titulo: 'Auditoría' },
  { clave: 'renovaciones', titulo: 'Renovaciones' },
];

export function DetallePedido() {
  const { id } = useParams();
  const { data: pedido, cargando, error, refetch } = useApi(() => pedidosApi.detalle(id), [id]);
  const { data: inventario, refetch: refetchInventario } = useApi(() => inventarioApi.porPedido(id), [id]);

  const [pestana, setPestana] = useState('pagos');

  if (error) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoError error={error} onReintentar={refetch} />
      </div>
    );
  }

  if (cargando && !pedido) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!pedido) return null;

  return (
    <div className="space-y-4">
      <BotonVolver />

      <Tarjeta titulo="Datos del pedido">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato
            etiqueta="Cliente"
            valor={
              <Link to={`/clientes/${pedido.cliente_id}`} className="text-marca-500 hover:underline">
                {pedido.cliente_nombre}
              </Link>
            }
          />
          <Dato etiqueta="WhatsApp" valor={formatoWhatsapp(pedido.cliente_whatsapp)} />
          <Dato etiqueta="Servicio" valor={pedido.servicio_nombre} />
          <Dato etiqueta="Duración del plan" valor={`${pedido.duracion_dias} días`} />
          <Dato etiqueta="Precio" valor={moneda(pedido.precio_pagado)} />
          <Dato
            etiqueta="Estado"
            valor={
              <Etiqueta color={COLOR_ESTADO_PEDIDO[pedido.estado]}>{humanizar(pedido.estado)}</Etiqueta>
            }
          />
          <Dato etiqueta="Solicitado" valor={fecha(pedido.fecha_solicitud)} />
          <Dato etiqueta="Pagado" valor={fecha(pedido.fecha_pago)} />
          <Dato etiqueta="Activado" valor={fecha(pedido.fecha_activacion)} />
          <Dato etiqueta="Vence" valor={fecha(pedido.fecha_vencimiento)} />
        </dl>

        <div className="mt-4 border-t border-borde pt-4">
          <ControlAcciones
            pedido={pedido}
            inventario={inventario}
            onCambiado={() => {
              refetch();
              refetchInventario();
            }}
          />
        </div>
      </Tarjeta>

      {(pedido.estado === 'pagado' || pedido.estado === 'activo' || (pedido.estado === 'cancelado' && inventario)) && (
        <Tarjeta titulo="Perfil del inventario">
          {inventario ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato etiqueta="Identificador de la cuenta" valor={inventario.identificador_cuenta || '—'} />
              <Dato etiqueta="Perfil" valor={inventario.numero_perfil || '—'} />
              <Dato
                etiqueta="Estado del inventario"
                valor={<Etiqueta color={COLOR_ESTADO_INVENTARIO[inventario.estado]}>{humanizar(inventario.estado)}</Etiqueta>}
              />
              <Dato etiqueta="Notas internas" valor={inventario.notas_internas || '—'} />
            </dl>
          ) : (
            <EstadoVacio
              titulo="Sin perfil asignado"
              descripcion="No había ningún perfil disponible del inventario para este servicio al momento de activar. Usa 'Asignar manualmente' arriba en cuanto haya inventario cargado."
            />
          )}
        </Tarjeta>
      )}

      <Tarjeta>
        <div className="mb-3 flex gap-1 border-b border-borde">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                pestana === p.clave
                  ? 'border-b-2 border-marca-500 text-marca-500'
                  : 'text-texto-suave hover:text-texto'
              }`}
            >
              {p.titulo}
            </button>
          ))}
        </div>

        {pestana === 'pagos' && <PestanaPagos pedidoId={id} />}
        {pestana === 'auditoria' && <PestanaAuditoria pedidoId={id} />}
        {pestana === 'renovaciones' && <PestanaRenovaciones pedidoId={id} pedidoActualId={pedido.id} />}
      </Tarjeta>
    </div>
  );

  function BotonVolver() {
    return (
      <Link to="/pedidos" className="text-sm font-medium text-marca-500 hover:underline">
        ← Volver a pedidos
      </Link>
    );
  }
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-texto">{valor ?? '—'}</dd>
    </div>
  );
}

/** Botones de acción según el estado actual, cada uno mapeado 1:1 a un endpoint ya existente. */
function ControlAcciones({ pedido, inventario, onCambiado }) {
  const navigate = useNavigate();
  const [modalPago, setModalPago] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // 'activar' | 'cancelar' | 'renovar' | 'liberar'

  const mostrarPagar = pedido.estado === 'pendiente';
  const mostrarActivar = pedido.estado === 'pagado';
  // Solo se ofrece "Asignar manualmente" cuando el pedido ya está pagado/activo Y no tiene ningún perfil asignado todavía.
  const mostrarAsignarManual = (pedido.estado === 'pagado' || pedido.estado === 'activo') && !inventario;
  const mostrarLiberar = inventario?.estado === 'vencido';
  const mostrarCancelar = pedido.estado === 'pendiente' || pedido.estado === 'pagado' || pedido.estado === 'activo';
  const mostrarRenovar = pedido.estado === 'activo' || pedido.estado === 'vencido';

  if (!mostrarPagar && !mostrarActivar && !mostrarAsignarManual && !mostrarLiberar && !mostrarCancelar && !mostrarRenovar) {
    return (
      <p className="text-sm text-texto-suave">
        Este pedido está {humanizar(pedido.estado).toLowerCase()} y no admite más acciones.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mostrarPagar && (
        <Boton variante="primario" tamano="md" onClick={() => setModalPago(true)}>
          Marcar como pagado
        </Boton>
      )}
      {mostrarActivar && (
        <Boton variante="primario" tamano="md" onClick={() => setConfirmando('activar')}>
          Activar servicio
        </Boton>
      )}
      {mostrarAsignarManual && (
        <Boton variante="secundario" tamano="md" onClick={() => setModalAsignar(true)}>
          Asignar manualmente
        </Boton>
      )}
      {mostrarLiberar && (
        <Boton variante="secundario" tamano="md" onClick={() => setConfirmando('liberar')}>
          Liberar cuenta
        </Boton>
      )}
      {mostrarRenovar && (
        <Boton variante="secundario" tamano="md" onClick={() => setConfirmando('renovar')}>
          Renovar
        </Boton>
      )}
      {mostrarCancelar && (
        <Boton variante="peligro" tamano="md" onClick={() => setConfirmando('cancelar')}>
          Cancelar pedido
        </Boton>
      )}

      <ModalMarcarPagado
        abierto={modalPago}
        pedidoId={pedido.id}
        onCerrar={() => setModalPago(false)}
        onPagado={() => {
          setModalPago(false);
          onCambiado();
        }}
      />

      <ModalAsignarManual
        abierto={modalAsignar}
        pedido={pedido}
        onCerrar={() => setModalAsignar(false)}
        onAsignado={() => {
          setModalAsignar(false);
          onCambiado();
        }}
      />

      <DialogoConfirmacion
        abierto={confirmando === 'activar'}
        titulo="Activar servicio"
        mensaje={`¿Activar el servicio de "${pedido.cliente_nombre}"? Se calculará la fecha de vencimiento (${pedido.duracion_dias} días), se programarán los 3 recordatorios de renovación, y si hay un perfil disponible del inventario para "${pedido.servicio_nombre}" se le asignará automáticamente.`}
        textoConfirmar="Sí, activar"
        onConfirmar={async () => {
          await pedidosApi.activar(pedido.id);
          onCambiado();
        }}
        onCerrar={() => setConfirmando(null)}
      />

      <DialogoConfirmacion
        abierto={confirmando === 'liberar'}
        titulo="Liberar cuenta"
        mensaje="Confirma esto SOLO si ya cambiaste la contraseña real de esta cuenta en la plataforma del servicio (Netflix, Disney+, etc.). El sistema no puede rotarla por ti -- si liberas sin cambiarla, el cliente anterior seguiría teniendo acceso."
        textoConfirmar="Ya la cambié, liberar"
        onConfirmar={async () => {
          await inventarioApi.liberar(inventario.id);
          onCambiado();
        }}
        onCerrar={() => setConfirmando(null)}
      />

      <DialogoConfirmacion
        abierto={confirmando === 'cancelar'}
        titulo="Cancelar pedido"
        mensaje={`¿Cancelar el pedido de "${pedido.cliente_nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Sí, cancelar"
        variante="peligro"
        onConfirmar={async () => {
          await pedidosApi.cancelar(pedido.id);
          onCambiado();
        }}
        onCerrar={() => setConfirmando(null)}
      />

      <DialogoConfirmacion
        abierto={confirmando === 'renovar'}
        titulo="Renovar pedido"
        mensaje={`¿Crear un pedido nuevo de renovación para "${pedido.cliente_nombre}", mismo plan de "${pedido.servicio_nombre}"?`}
        textoConfirmar="Sí, renovar"
        onConfirmar={async () => {
          const nuevo = await pedidosApi.renovar(pedido.id);
          navigate(`/pedidos/${nuevo.id}`);
        }}
        onCerrar={() => setConfirmando(null)}
      />
    </div>
  );
}

/** PUT /admin/pedidos/:id/marcar-pagado — body: { monto, metodo?, notas? }. */
function ModalMarcarPagado({ abierto, pedidoId, onCerrar, onPagado }) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function cerrar() {
    setMonto('');
    setMetodo('');
    setNotas('');
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await pedidosApi.marcarPagado(pedidoId, {
        monto: Number(monto),
        metodo: metodo.trim() || undefined,
        notas: notas.trim() || undefined,
      });
      cerrar();
      onPagado();
    } catch (err) {
      setError(err?.message || 'No se pudo registrar el pago.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Marcar como pagado"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-marcar-pagado" cargando={cargando}>
            Confirmar pago
          </Boton>
        </>
      }
    >
      <form id="form-marcar-pagado" onSubmit={enviar} className="space-y-4">
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
        <Campo
          etiqueta="Notas (opcional)"
          name="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/**
 * PUT /admin/pedidos/:id/inventario/asignar — body: { inventario_id }.
 * Fallback manual, solo aparece cuando no hubo ningún perfil disponible
 * al momento de activar (o marcar pagado). Lista el inventario
 * "disponible" del MISMO servicio del pedido para elegir uno.
 */
function ModalAsignarManual({ abierto, pedido, onCerrar, onAsignado }) {
  const { data: disponibles, cargando: cargandoLista, error: errorLista } = useApi(
    () => (abierto ? inventarioApi.listar({ servicio_id: pedido.servicio_id, estado: 'disponible' }) : Promise.resolve([])),
    [abierto, pedido.servicio_id]
  );
  const [inventarioId, setInventarioId] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setInventarioId('');
    setError(null);
  }, [abierto]);

  function cerrar() {
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    if (!inventarioId) return;
    setCargando(true);
    setError(null);
    try {
      await inventarioApi.asignarManual(pedido.id, Number(inventarioId));
      onAsignado();
    } catch (err) {
      setError(err?.message || 'No se pudo asignar el perfil.');
    } finally {
      setCargando(false);
    }
  }

  const filas = Array.isArray(disponibles) ? disponibles : [];

  return (
    <Modal
      abierto={abierto}
      titulo="Asignar perfil manualmente"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-asignar-manual" cargando={cargando} disabled={!inventarioId}>
            Asignar
          </Boton>
        </>
      }
    >
      <form id="form-asignar-manual" onSubmit={enviar} className="space-y-4">
        {errorLista && <p className="text-xs text-red-400">No se pudo cargar el inventario disponible.</p>}
        {!cargandoLista && filas.length === 0 && !errorLista && (
          <EstadoVacio
            titulo="No hay inventario disponible"
            descripcion={`No hay ningún perfil "disponible" para "${pedido.servicio_nombre}" ahora mismo. Carga inventario nuevo desde el módulo Inventario.`}
          />
        )}
        {filas.length > 0 && (
          <Selector
            etiqueta="Perfil disponible"
            name="inventario_id"
            value={inventarioId}
            onChange={(e) => setInventarioId(e.target.value)}
            opciones={filas.map((f) => ({
              valor: String(f.id),
              texto: `${f.identificador_cuenta || 'sin correo'} — perfil ${f.numero_perfil || '—'}`,
            }))}
            required
          />
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/** GET /admin/pedidos/:id/pagos — pagos confirmados de este pedido. */
function PestanaPagos({ pedidoId }) {
  const { data, cargando, error, refetch } = useApi(() => pedidosApi.pagos(pedidoId), [pedidoId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pagos" descripcion="Este pedido no tiene pagos registrados." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'monto', titulo: 'Monto', render: (f) => moneda(f.monto) },
        { clave: 'tipo_pago', titulo: 'Tipo', render: (f) => humanizar(f.tipo_pago) },
        { clave: 'metodo', titulo: 'Método', render: (f) => f.metodo || '—' },
        { clave: 'notas', titulo: 'Notas', render: (f) => f.notas || '—' },
        { clave: 'fecha_registro', titulo: 'Registrado', render: (f) => fechaHora(f.fecha_registro) },
      ]}
    />
  );
}

/** GET /admin/pedidos/:id/auditoria — quién hizo qué y cuándo sobre este pedido. */
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
              <code className="text-xs text-texto-suave">{JSON.stringify(f.detalles)}</code>
            ) : (
              '—'
            ),
        },
      ]}
    />
  );
}

/** GET /admin/pedidos/:id/renovaciones — cadena completa (original + renovaciones). */
function PestanaRenovaciones({ pedidoId, pedidoActualId }) {
  const navigate = useNavigate();
  const { data, cargando, error, refetch } = useApi(() => pedidosApi.renovaciones(pedidoId), [pedidoId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length <= 1) {
    return <EstadoVacio titulo="Sin renovaciones" descripcion="Este pedido todavía no tiene renovaciones." />;
  }

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      onFila={(f) => navigate(`/pedidos/${f.id}`)}
      columnas={[
        {
          clave: 'id',
          titulo: 'Pedido',
          render: (f) => (f.id === Number(pedidoActualId) ? `#${f.id} (este)` : `#${f.id}`),
        },
        { clave: 'precio_pagado', titulo: 'Precio', render: (f) => moneda(f.precio_pagado) },
        {
          clave: 'estado',
          titulo: 'Estado',
          render: (f) => <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
        },
        { clave: 'fecha_solicitud', titulo: 'Solicitado', render: (f) => fecha(f.fecha_solicitud) },
        { clave: 'fecha_vencimiento', titulo: 'Vence', render: (f) => fecha(f.fecha_vencimiento) },
      ]}
    />
  );
}
