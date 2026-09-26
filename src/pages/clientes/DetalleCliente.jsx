/**
 * pages/clientes/DetalleCliente.jsx  (Clientes CRM — F1 lógica, F2 visual)
 * -----------------------------------------
 * Ficha CRM del cliente, de arriba abajo:
 * 1. Cabecera: avatar, nombre, estado comercial, etiquetas y botones
 *    Contactar por WhatsApp (mensaje preparado) · Renovar · Credenciales ·
 *    Modificar cuenta/perfil (solo administrador, excepcional) · Editar · ⋯ (Acceso).
 * 2. Banner "Próxima acción recomendada".
 * 3. Indicadores: próximo vencimiento destacado, servicios activos,
 *    total histórico pagado y última comunicación.
 * 4. Servicios contratados en tarjetas (GET /admin/clientes/:id/servicios).
 * 5. Pestañas: Historial · Compras y renovaciones · Pagos · Comunicación.
 * Datos: /resumen, /servicios, /mensajes y /comunicaciones (una sola carga,
 * compartida entre las secciones). Sin lógica nueva: Renovar usa
 * POST /admin/pedidos/:id/renovar y Acceso PUT /admin/clientes/:id/estado.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
import { Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda } from '../../utils/formato';
import { PanelDash, Segmentos } from '../dashboard/piezas.jsx';
import { CabeceraFicha } from './componentes/CabeceraFicha.jsx';
import { IndicadoresFicha } from './componentes/IndicadoresFicha.jsx';
import { TarjetaProximaAccion } from './componentes/ProximaAccion.jsx';
import { ModalEditarCliente } from './componentes/ModalEditarCliente.jsx';
import { ModalMensajeWhatsApp } from './componentes/ModalMensajeWhatsApp.jsx';
import { ModalAcceso } from './componentes/ModalAcceso.jsx';
import { ServiciosContratados } from './componentes/ServiciosContratados.jsx';
import { HistorialCliente } from './componentes/HistorialCliente.jsx';
import { PestanaComunicacion } from './componentes/PestanaComunicacion.jsx';
import { RenovarServicioCliente, objetivoRenovacion } from './componentes/DialogoRenovar.jsx';
import { AccionServicioCliente } from './componentes/AccionServicioCliente.jsx';
import { useAuth } from '../../auth/useAuth';

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
  const comunicaciones = useApi(() => clientesApi.comunicaciones(id), [id]);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalAcceso, setModalAcceso] = useState(false);
  const [mensajeAbierto, setMensajeAbierto] = useState(null);
  const [renovando, setRenovando] = useState(null);
  // Se incrementa al renovar: recarga las pestañas (historial, pedidos, pagos), que cargan sus propios datos.
  const [version, setVersion] = useState(0);
  const [pestana, setPestana] = useState('historial');
  // 'credenciales' | 'modificar' (Modificar cuenta/perfil: solo administrador) | null
  const [accionServicio, setAccionServicio] = useState(null);
  const { tienePermiso } = useAuth();

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
  // Renovar (cabecera o tarjeta de un servicio): se elige el SERVICIO, nunca un pedido.
  const renovar = (servicioId = null) =>
    setRenovando({
      clienteId: id,
      cliente_nombre: r.nombre,
      servicioId,
      tieneActivos: (r.servicios_activos || []).length > 0,
      respaldo: objetivoRenovacion(r),
    });

  return (
    <div className="space-y-4">
      <BotonVolver />

      <CabeceraFicha
        r={r}
        mensajes={mensajes.data}
        onMensaje={setMensajeAbierto}
        onRenovar={renovar}
        onCredenciales={() => setAccionServicio('credenciales')}
        onModificarPerfil={() => setAccionServicio('modificar')}
        esAdministrador={tienePermiso(['administrador'])}
        onEditar={() => setModalEditar(true)}
        onAcceso={() => setModalAcceso(true)}
      />

      <TarjetaProximaAccion accion={r.proxima_accion} whatsapp={r.whatsapp} mensajes={mensajes.data} onMensaje={setMensajeAbierto} />

      <IndicadoresFicha r={r} servicios={servicios.data} comunicaciones={comunicaciones.data} />

      <PanelDash icono="servicios" tono="verde" titulo="Servicios contratados" subtitulo="Vigentes y pendientes de pago o activación">
        <ServiciosContratados
          datos={servicios.data}
          cargando={servicios.cargando}
          error={servicios.error}
          onReintentar={servicios.refetch}
          mensajeRecordar={mensajeRecordar}
          onMensaje={setMensajeAbierto}
          onRenovar={renovar}
        />
      </PanelDash>

      <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-5">
        <div className="mb-4 overflow-x-auto [&_button]:whitespace-nowrap">
          <Segmentos opciones={PESTANAS} valor={pestana} onCambio={setPestana} etiqueta="Secciones de la ficha" />
        </div>

        {pestana === 'historial' && <HistorialCliente key={version} clienteId={id} />}
        {pestana === 'pedidos' && <PestanaPedidos key={version} clienteId={id} />}
        {pestana === 'pagos' && <PestanaPagos key={version} clienteId={id} />}
        {pestana === 'comunicacion' && (
          <PestanaComunicacion clienteId={id} mensajes={mensajes} comunicaciones={comunicaciones} onMensaje={setMensajeAbierto} />
        )}
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

      <ModalAcceso abierto={modalAcceso} cliente={r} onCerrar={() => setModalAcceso(false)} onCambiado={refetch} />

      <AccionServicioCliente
        accion={accionServicio}
        clienteId={id}
        onCerrar={() => setAccionServicio(null)}
        onCambiado={() => {
          refetch();
          servicios.refetch();
          setVersion((v) => v + 1);
        }}
      />

      <RenovarServicioCliente
        solicitud={renovando}
        onCerrar={() => setRenovando(null)}
        onRenovado={() => {
          refetch();
          servicios.refetch();
          setVersion((v) => v + 1);
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
