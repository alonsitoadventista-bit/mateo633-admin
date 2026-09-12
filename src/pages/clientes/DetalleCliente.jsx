/**
 * pages/clientes/DetalleCliente.jsx  (Fase 3)
 * -----------------------------------------
 * Detalle de un cliente: datos + edición (PUT /admin/clientes/:id),
 * cambio de estado (PUT /admin/clientes/:id/estado) y pestañas de
 * historial (pedidos, pagos confirmados, recordatorios), cada una
 * sobre su propio endpoint ya existente en api/clientes.js.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
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
import { ESTADOS_CLIENTE, COLOR_ESTADO_CLIENTE, COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda, whatsapp as formatoWhatsapp } from '../../utils/formato';

const PESTANAS = [
  { clave: 'pedidos', titulo: 'Pedidos' },
  { clave: 'pagos', titulo: 'Pagos' },
  { clave: 'recordatorios', titulo: 'Recordatorios' },
];

export function DetalleCliente() {
  const { id } = useParams();
  const { data: cliente, cargando, error, refetch } = useApi(() => clientesApi.detalle(id), [id]);

  const [modalEditar, setModalEditar] = useState(false);
  const [pestana, setPestana] = useState('pedidos');

  if (error) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoError error={error} onReintentar={refetch} />
      </div>
    );
  }

  if (cargando && !cliente) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="space-y-4">
      <BotonVolver />

      <Tarjeta
        titulo="Datos del cliente"
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setModalEditar(true)}>
            Editar datos
          </Boton>
        }
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Nombre" valor={cliente.nombre} />
          <Dato etiqueta="WhatsApp" valor={formatoWhatsapp(cliente.whatsapp)} />
          <Dato etiqueta="Email" valor={cliente.email || '—'} />
          <Dato etiqueta="Registrado" valor={fecha(cliente.fecha_registro)} />
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <ControlEstado cliente={cliente} onCambiado={refetch} />
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex gap-1 border-b border-slate-100">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                pestana === p.clave
                  ? 'border-b-2 border-marca-600 text-marca-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p.titulo}
            </button>
          ))}
        </div>

        {pestana === 'pedidos' && <PestanaPedidos clienteId={id} />}
        {pestana === 'pagos' && <PestanaPagos clienteId={id} />}
        {pestana === 'recordatorios' && <PestanaRecordatorios clienteId={id} />}
      </Tarjeta>

      <ModalEditarCliente
        abierto={modalEditar}
        cliente={cliente}
        onCerrar={() => setModalEditar(false)}
        onGuardado={() => {
          setModalEditar(false);
          refetch();
        }}
      />
    </div>
  );

  function BotonVolver() {
    return (
      <Link to="/clientes" className="text-sm font-medium text-marca-700 hover:underline">
        ← Volver a clientes
      </Link>
    );
  }
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{valor}</dd>
    </div>
  );
}

/** PUT /admin/clientes/:id/estado — cambia solo el estado, separado de la edición de datos. */
function ControlEstado({ cliente, onCambiado }) {
  const [nuevoEstado, setNuevoEstado] = useState(cliente.estado);
  const [confirmando, setConfirmando] = useState(false);

  const hayCambio = nuevoEstado !== cliente.estado;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado actual</p>
        <Etiqueta color={COLOR_ESTADO_CLIENTE[cliente.estado]} className="mt-1">
          {humanizar(cliente.estado)}
        </Etiqueta>
      </div>

      <Selector
        etiqueta="Cambiar a"
        name="nuevo-estado"
        opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: humanizar(e) }))}
        value={nuevoEstado}
        onChange={(e) => setNuevoEstado(e.target.value)}
        className="w-40"
      />

      <Boton
        variante={nuevoEstado === 'bloqueado' ? 'peligro' : 'primario'}
        tamano="md"
        disabled={!hayCambio}
        onClick={() => setConfirmando(true)}
      >
        Guardar estado
      </Boton>

      <DialogoConfirmacion
        abierto={confirmando}
        titulo="Cambiar estado del cliente"
        mensaje={`¿Cambiar el estado de "${cliente.nombre}" de "${humanizar(cliente.estado)}" a "${humanizar(nuevoEstado)}"?`}
        textoConfirmar="Sí, cambiar"
        variante={nuevoEstado === 'bloqueado' ? 'peligro' : 'primario'}
        onConfirmar={async () => {
          await clientesApi.actualizarEstado(cliente.id, nuevoEstado);
          onCambiado();
        }}
        onCerrar={() => setConfirmando(false)}
      />
    </div>
  );
}

/** PUT /admin/clientes/:id — body: { nombre?, email?, whatsapp? }. */
function ModalEditarCliente({ abierto, cliente, onCerrar, onGuardado }) {
  const [campos, setCampos] = useState(() => ({
    nombre: cliente.nombre || '',
    whatsapp: cliente.whatsapp || '',
    email: cliente.email || '',
  }));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function actualizar(campo) {
    return (e) => setCampos((c) => ({ ...c, [campo]: e.target.value }));
  }

  function cerrar() {
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await clientesApi.actualizarDatos(cliente.id, {
        nombre: campos.nombre.trim(),
        whatsapp: campos.whatsapp.trim(),
        email: campos.email.trim() || null,
      });
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Editar cliente"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-cliente" cargando={cargando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-editar-cliente" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo
          etiqueta="WhatsApp"
          name="whatsapp"
          value={campos.whatsapp}
          onChange={actualizar('whatsapp')}
          required
        />
        <Campo etiqueta="Email (opcional)" name="email" type="email" value={campos.email} onChange={actualizar('email')} />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}

/** GET /admin/clientes/:id/pedidos */
function PestanaPedidos({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.pedidos(clienteId), [clienteId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pedidos" descripcion="Este cliente aún no tiene pedidos." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'duracion_dias', titulo: 'Duración', render: (f) => `${f.duracion_dias} días` },
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

/** GET /admin/clientes/:id/pagos — pagos CONFIRMADOS (dinero real). */
function PestanaPagos({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.pagos(clienteId), [clienteId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pagos" descripcion="Este cliente no tiene pagos confirmados." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'monto', titulo: 'Monto', render: (f) => moneda(f.monto) },
        { clave: 'tipo_pago', titulo: 'Tipo', render: (f) => humanizar(f.tipo_pago) },
        { clave: 'metodo', titulo: 'Método', render: (f) => f.metodo || '—' },
        { clave: 'fecha_registro', titulo: 'Registrado', render: (f) => fechaHora(f.fecha_registro) },
      ]}
    />
  );
}

/** GET /admin/clientes/:id/recordatorios — avisos de renovación futuros no enviados. */
function PestanaRecordatorios({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.recordatorios(clienteId), [clienteId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) {
    return <EstadoVacio titulo="Sin recordatorios" descripcion="No hay recordatorios pendientes de envío." />;
  }

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'tipo', titulo: 'Tipo', render: (f) => humanizar(f.tipo) },
        { clave: 'canal', titulo: 'Canal', render: (f) => humanizar(f.canal) },
        { clave: 'fecha_envio', titulo: 'Se enviará', render: (f) => fechaHora(f.fecha_envio) },
        { clave: 'fecha_vencimiento', titulo: 'Vencimiento del pedido', render: (f) => fecha(f.fecha_vencimiento) },
      ]}
    />
  );
}
