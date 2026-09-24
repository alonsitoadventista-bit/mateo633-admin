/**
 * pages/clientes/DetalleCliente.jsx  (Clientes CRM, F1 — 2026-09-24)
 * -----------------------------------------
 * Ficha del cliente, de arriba abajo:
 * 1. Resumen rápido + etiquetas (GET /admin/clientes/:id/resumen), próxima
 *    acción recomendada con su mensaje preparado, y Acceso (clientes.estado).
 * 2. Servicios contratados (GET /admin/clientes/:id/servicios): vigentes y
 *    pendientes, con inicio, vencimiento y perfil asignado.
 * 3. Pestañas: Historial (línea de tiempo) · Compras y renovaciones · Pagos ·
 *    Comunicación (mensajes preparados, historial y avisos automáticos).
 * Los mensajes preparados (GET /admin/clientes/:id/mensajes) se abren en
 * WhatsApp para enviarlos a mano; la API de WhatsApp usará los mismos textos.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { PanelDash, Segmentos } from '../dashboard/piezas.jsx';
import { ResumenCliente } from './componentes/ResumenCliente.jsx';
import { TarjetaProximaAccion } from './componentes/ProximaAccion.jsx';
import { ModalEditarCliente } from './componentes/ModalEditarCliente.jsx';
import { ModalMensajeWhatsApp } from './componentes/ModalMensajeWhatsApp.jsx';
import { ServiciosContratados } from './componentes/ServiciosContratados.jsx';
import { HistorialCliente } from './componentes/HistorialCliente.jsx';
import { PestanaComunicacion } from './componentes/PestanaComunicacion.jsx';

const PESTANAS = [
  { valor: 'historial', texto: 'Historial' },
  { valor: 'pedidos', texto: 'Compras y renovaciones' },
  { valor: 'pagos', texto: 'Pagos' },
  { valor: 'comunicacion', texto: 'Comunicación' },
];

export function DetalleCliente() {
  const { id } = useParams();
  const { data: r, cargando, error, refetch } = useApi(() => clientesApi.resumen(id), [id]);
  const servicios = useApi(() => clientesApi.servicios(id), [id]);
  const mensajes = useApi(() => clientesApi.mensajes(id), [id]);

  const [modalEditar, setModalEditar] = useState(false);
  const [mensajeAbierto, setMensajeAbierto] = useState(null);
  const [pestana, setPestana] = useState('historial');

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

  const mensajeRecordar = (mensajes.data || []).find((m) => m.tipo === 'recordar_renovacion');

  return (
    <div className="space-y-4">
      <BotonVolver />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ResumenCliente r={r} onEditar={() => setModalEditar(true)} />
        </div>
        <div className="space-y-4">
          <TarjetaProximaAccion
            accion={r.proxima_accion}
            whatsapp={r.whatsapp}
            mensajes={mensajes.data}
            onMensaje={setMensajeAbierto}
          />
          <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5">
            <ControlAcceso cliente={{ id: r.id, nombre: r.nombre, estado: r.acceso }} onCambiado={refetch} />
          </section>
        </div>
      </div>

      <PanelDash
        icono="servicios"
        tono="verde"
        titulo="Servicios contratados"
        subtitulo="Vigentes y pendientes de pago o activación"
      >
        <ServiciosContratados
          datos={servicios.data}
          cargando={servicios.cargando}
          error={servicios.error}
          onReintentar={servicios.refetch}
          mensajeRecordar={mensajeRecordar}
          onMensaje={setMensajeAbierto}
        />
      </PanelDash>

      <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5">
        <div className="mb-4 overflow-x-auto">
          <Segmentos opciones={PESTANAS} valor={pestana} onCambio={setPestana} etiqueta="Secciones de la ficha" />
        </div>

        {pestana === 'historial' && <HistorialCliente clienteId={id} />}
        {pestana === 'pedidos' && <PestanaPedidos clienteId={id} />}
        {pestana === 'pagos' && <PestanaPagos clienteId={id} />}
        {pestana === 'comunicacion' && <PestanaComunicacion clienteId={id} mensajes={mensajes} onMensaje={setMensajeAbierto} />}
      </section>

      <ModalEditarCliente
        abierto={modalEditar}
        cliente={r}
        onCerrar={() => setModalEditar(false)}
        onGuardado={() => {
          setModalEditar(false);
          refetch();
          mensajes.refetch();
        }}
      />

      <ModalMensajeWhatsApp mensaje={mensajeAbierto} nombreCliente={r.nombre} onCerrar={() => setMensajeAbierto(null)} />
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

/**
 * GET /admin/clientes/:id/pedidos — todas las compras y renovaciones, con las
 * fechas de cada periodo (activación y vencimiento). Clic en una fila → pedido.
 */
function PestanaPedidos({ clienteId }) {
  const navigate = useNavigate();
  const { data, cargando, error, refetch } = useApi(() => clientesApi.pedidos(clienteId), [clienteId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pedidos" descripcion="Este cliente aún no tiene compras." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      onFila={(f) => navigate(`/pedidos/${f.id}`)}
      columnas={[
        { clave: 'id', titulo: 'Pedido', render: (f) => `#${f.id}` },
        {
          clave: 'tipo',
          titulo: 'Tipo',
          render: (f) => (f.pedido_origen_id ? <span className="text-marca-400">Renovación</span> : 'Compra'),
        },
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'duracion_dias', titulo: 'Plan', render: (f) => `${f.duracion_dias} días · ${moneda(f.precio_pagado)}` },
        {
          clave: 'estado',
          titulo: 'Estado',
          render: (f) => <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
        },
        { clave: 'fecha_solicitud', titulo: 'Solicitado', render: (f) => fecha(f.fecha_solicitud) },
        { clave: 'fecha_activacion', titulo: 'Inicio', render: (f) => fecha(f.fecha_activacion) },
        { clave: 'fecha_vencimiento', titulo: 'Vencimiento', render: (f) => fecha(f.fecha_vencimiento) },
      ]}
    />
  );
}

/** GET /admin/clientes/:id/pagos — pagos CONFIRMADOS (dinero real), con el total. */
function PestanaPagos({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.pagos(clienteId), [clienteId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pagos" descripcion="Este cliente no tiene pagos confirmados." />;

  const total = filas.reduce((suma, f) => suma + Number(f.monto || 0), 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-texto-suave">
        {filas.length} pago{filas.length === 1 ? '' : 's'} confirmado{filas.length === 1 ? '' : 's'} · Total{' '}
        <span className="font-semibold text-texto">{moneda(total)}</span>
      </p>
      <Tabla
        claveFila={(f) => f.id}
        filas={filas}
        columnas={[
          { clave: 'fecha_registro', titulo: 'Fecha', render: (f) => fechaHora(f.fecha_registro) },
          { clave: 'servicio_nombre', titulo: 'Servicio' },
          { clave: 'monto', titulo: 'Monto', render: (f) => moneda(f.monto) },
          { clave: 'tipo_pago', titulo: 'Tipo', render: (f) => humanizar(f.tipo_pago) },
          { clave: 'metodo', titulo: 'Método', render: (f) => f.metodo || '—' },
          { clave: 'pedido_id', titulo: 'Pedido', render: (f) => <Link to={`/pedidos/${f.pedido_id}`} className="text-marca-400 hover:underline">#{f.pedido_id}</Link> },
        ]}
      />
    </div>
  );
}
