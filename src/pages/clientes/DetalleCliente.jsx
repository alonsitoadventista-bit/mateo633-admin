/**
 * pages/clientes/DetalleCliente.jsx  (Clientes CRM, F1 — 2026-09-24)
 * -----------------------------------------
 * Ficha del cliente:
 * - resumen rápido + próxima acción recomendada + etiquetas
 *   (GET /admin/clientes/:id/resumen, calculado en el backend en hora de Lima);
 * - edición de datos (PUT /admin/clientes/:id; el correo se puede borrar);
 * - acceso al panel/app (PUT /admin/clientes/:id/estado), que antes se
 *   llamaba "estado" y ahora se distingue del estado COMERCIAL;
 * - pestañas de historial (pedidos, pagos confirmados, recordatorios) sobre
 *   sus endpoints existentes. Se rehacen en F2 (historial, pagos y servicios).
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
import {
  Tabla,
  Boton,
  Selector,
  Etiqueta,
  DialogoConfirmacion,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import {
  ESTADOS_CLIENTE,
  COLOR_ESTADO_CLIENTE,
  COLOR_ESTADO_PEDIDO,
  TEXTO_ACCESO_CLIENTE,
} from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda } from '../../utils/formato';
import { ResumenCliente } from './componentes/ResumenCliente.jsx';
import { TarjetaProximaAccion } from './componentes/ProximaAccion.jsx';
import { ModalEditarCliente } from './componentes/ModalEditarCliente.jsx';

const PESTANAS = [
  { clave: 'pedidos', titulo: 'Pedidos' },
  { clave: 'pagos', titulo: 'Pagos' },
  { clave: 'recordatorios', titulo: 'Recordatorios' },
];

export function DetalleCliente() {
  const { id } = useParams();
  const { data: r, cargando, error, refetch } = useApi(() => clientesApi.resumen(id), [id]);

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

  if (cargando && !r) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!r) return null;

  return (
    <div className="space-y-4">
      <BotonVolver />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ResumenCliente r={r} onEditar={() => setModalEditar(true)} />
        </div>
        <div className="space-y-4">
          <TarjetaProximaAccion accion={r.proxima_accion} whatsapp={r.whatsapp} />
          <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5">
            <ControlAcceso cliente={{ id: r.id, nombre: r.nombre, estado: r.acceso }} onCambiado={refetch} />
          </section>
        </div>
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5">
        <div className="mb-3 flex gap-1 overflow-x-auto border-b border-borde">
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

        {pestana === 'pedidos' && <PestanaPedidos clienteId={id} />}
        {pestana === 'pagos' && <PestanaPagos clienteId={id} />}
        {pestana === 'recordatorios' && <PestanaRecordatorios clienteId={id} />}
      </section>

      <ModalEditarCliente
        abierto={modalEditar}
        cliente={r}
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
      <Link to="/clientes" className="text-sm font-medium text-marca-500 hover:underline">
        ← Volver a clientes
      </Link>
    );
  }
}

/**
 * PUT /admin/clientes/:id/estado — "Acceso" del cliente (clientes.estado:
 * activo/inactivo/bloqueado), separado de la edición de datos y del estado comercial.
 */
function ControlAcceso({ cliente, onCambiado }) {
  const [nuevoEstado, setNuevoEstado] = useState(cliente.estado);
  const [confirmando, setConfirmando] = useState(false);

  const hayCambio = nuevoEstado !== cliente.estado;
  const texto = (e) => TEXTO_ACCESO_CLIENTE[e] || humanizar(e);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-texto-suave">Acceso</p>
          <p className="mt-0.5 text-xs text-texto-suave">Bloquear impide que el cliente entre a la app.</p>
        </div>
        <Etiqueta color={COLOR_ESTADO_CLIENTE[cliente.estado]}>{texto(cliente.estado)}</Etiqueta>
      </div>

      <div className="flex items-end gap-2">
        <Selector
          etiqueta="Cambiar a"
          name="nuevo-acceso"
          opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: texto(e) }))}
          value={nuevoEstado}
          onChange={(e) => setNuevoEstado(e.target.value)}
          className="flex-1"
        />
        <Boton
          variante={nuevoEstado === 'bloqueado' ? 'peligro' : 'primario'}
          disabled={!hayCambio}
          onClick={() => setConfirmando(true)}
        >
          Guardar
        </Boton>
      </div>

      <DialogoConfirmacion
        abierto={confirmando}
        titulo="Cambiar acceso del cliente"
        mensaje={`¿Cambiar el acceso de "${cliente.nombre}" de "${texto(cliente.estado)}" a "${texto(nuevoEstado)}"?`}
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
