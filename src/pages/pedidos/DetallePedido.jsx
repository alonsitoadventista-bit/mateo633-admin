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
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import * as inventarioApi from '../../api/inventario';
import { useAuth } from '../../auth/useAuth';
import { ModalConfirmarRenovacion, ModalMensajeRenovacion, ModalModificarRenovacion } from './ModalesRenovacion';
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
  { clave: 'entregas', titulo: 'Entregas' },
];

export function DetallePedido() {
  const { id } = useParams();
  const { data: pedido, cargando, error, refetch } = useApi(() => pedidosApi.detalle(id), [id]);
  const { data: inventario, refetch: refetchInventario } = useApi(() => inventarioApi.porPedido(id), [id]);
  // Renovación: qué perfil conservará al activarse (o por qué no). Solo lectura.
  const { data: previsto, refetch: refetchPrevisto } = useApi(() => pedidosApi.perfilPrevisto(id), [id]);

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
            previsto={previsto}
            onCambiado={() => {
              refetch();
              refetchInventario();
              refetchPrevisto();
            }}
          />
        </div>
      </Tarjeta>

      {(pedido.estado === 'pagado' || pedido.estado === 'activo' || (pedido.estado === 'cancelado' && inventario)) && (
        <Tarjeta titulo="Perfil del inventario">
          {inventario ? (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato
                etiqueta="Identificador de la cuenta"
                valor={
                  <span className="flex flex-wrap items-center gap-1">
                    {inventario.identificador_cuenta || '—'}
                    {inventario.cuenta_eliminada_en && <Etiqueta color="red">cuenta eliminada</Etiqueta>}
                  </span>
                }
              />
              <Dato etiqueta="Perfil" valor={inventario.numero_perfil || '—'} />
              <Dato
                etiqueta="Estado del inventario"
                valor={<Etiqueta color={COLOR_ESTADO_INVENTARIO[inventario.estado]}>{humanizar(inventario.estado)}</Etiqueta>}
              />
              <Dato etiqueta="Notas internas" valor={inventario.notas_internas || '—'} />
            </dl>
          ) : (
            <SinPerfil pedido={pedido} previsto={previsto} />
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
        {pestana === 'entregas' && <PestanaEntregas pedidoId={id} />}
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

/**
 * Tarjeta del perfil cuando el pedido todavía no tiene uno. En una
 * renovación, el perfil del cliente se traslada AL ACTIVAR: aquí se muestra
 * cuál se conservará, o el motivo por el que no se puede (regla 2026-09-25:
 * entonces NO se activa sola y decide el administrador).
 */
function SinPerfil({ pedido, previsto }) {
  if (previsto?.renovado_por) {
    return (
      <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
        <p className="font-semibold text-texto">El perfil pasó a la renovación</p>
        <p className="text-texto-suave">
          Este pedido ya fue renovado: el perfil del cliente está ahora en la{' '}
          <Link to={`/pedidos/${previsto.renovado_por}`} className="text-marca-500 hover:underline">
            renovación #{previsto.renovado_por}
          </Link>
          . No hace falta asignarle otro.
        </p>
      </div>
    );
  }
  if (previsto?.es_renovacion && previsto.estado === 'conservable') {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
        <p className="font-semibold text-texto">Renovación: al confirmar, el cliente sigue con su mismo perfil</p>
        <p className="text-texto">
          {previsto.perfil?.nombre} <span className="text-texto-suave">· {previsto.perfil?.identificador_cuenta}</span>
        </p>
        <p className="text-texto-suave">
          Mismo correo, contraseña, PIN y configuración.
          {previsto.desde_pedido && previsto.desde_pedido !== pedido.pedido_origen_id ? ` Hoy está en el pedido #${previsto.desde_pedido}.` : ''}
        </p>
      </div>
    );
  }
  if (previsto?.es_renovacion && previsto.estado === 'no_conservable') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm">
        <p className="font-semibold text-red-300">Renovación: no se puede conservar el perfil del cliente</p>
        <p className="text-texto">{previsto.motivo}</p>
        <p className="text-texto-suave">
          La renovación no se confirma sola. Un administrador decide con "Modificar renovación" (el cliente cambia de credenciales).
        </p>
      </div>
    );
  }
  if (previsto?.es_renovacion && previsto.estado === 'sin_historial') {
    return (
      <EstadoVacio
        titulo="Renovación sin perfil anterior registrado"
        descripcion="El servicio anterior nunca tuvo un perfil del inventario: un administrador le asigna uno con 'Modificar renovación'."
      />
    );
  }
  if (pedido.estado === 'pagado') {
    return <EstadoVacio titulo="Perfil pendiente" descripcion="El perfil se asigna al activar el servicio." />;
  }
  return (
    <EstadoVacio
      titulo="Sin perfil asignado"
      descripcion="No había ningún perfil disponible del inventario para este servicio al momento de activar. Usa '⚡ Asignar automáticamente' (o 'Asignar manualmente') arriba en cuanto haya inventario cargado."
    />
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-texto">{valor ?? '—'}</dd>
    </div>
  );
}

/**
 * Acciones de una RENOVACIÓN (regla 2026-09-25): no es una venta nueva, solo
 * extiende la vigencia. Flujo normal = UN botón "Confirmar renovación"
 * (pago + mismo perfil + vigencia + mensaje). Sin inventario ni pasos de
 * entrega. "Modificar renovación" es excepcional y solo del administrador.
 */
function AccionesRenovacion({ pedido, inventario, previsto, onCambiado }) {
  const navigate = useNavigate();
  const { tienePermiso } = useAuth();
  const esAdministrador = tienePermiso(['administrador']);
  const [modalConfirmar, setModalConfirmar] = useState(false);
  const [modalModificar, setModalModificar] = useState(false);
  const [modalMensaje, setModalMensaje] = useState(null); // { mensaje } | {} (lo pide al backend)
  const [modalEntregar, setModalEntregar] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // 'cancelar' | 'renovar' | 'liberar'

  const noConservable = previsto?.estado === 'no_conservable' || previsto?.estado === 'sin_historial';
  const porConfirmar = pedido.estado === 'pendiente' || pedido.estado === 'pagado';
  const activa = pedido.estado === 'activo';
  const mostrarModificar = esAdministrador && (porConfirmar || activa);

  if (!porConfirmar && !activa && pedido.estado !== 'vencido') {
    return <p className="text-sm text-texto-suave">Esta renovación está {humanizar(pedido.estado).toLowerCase()} y no admite más acciones.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {porConfirmar && (
        <Boton variante="primario" tamano="md" onClick={() => setModalConfirmar(true)} disabled={noConservable}>
          ✅ Confirmar renovación
        </Boton>
      )}
      {activa && (
        <Boton variante="primario" tamano="md" onClick={() => setModalMensaje({})}>
          💬 Mensaje de renovación
        </Boton>
      )}
      {activa && inventario?.estado === 'asignado' && (
        <Boton variante="secundario" tamano="md" onClick={() => setModalEntregar(true)}>
          📲 Credenciales
        </Boton>
      )}
      {(activa || pedido.estado === 'vencido') && (
        <Boton variante="secundario" tamano="md" onClick={() => setConfirmando('renovar')}>
          Renovar
        </Boton>
      )}
      {inventario?.estado === 'vencido' && (
        <Boton variante="secundario" tamano="md" onClick={() => setConfirmando('liberar')}>
          Liberar cuenta
        </Boton>
      )}
      {mostrarModificar && (
        <Boton variante="secundario" tamano="md" onClick={() => setModalModificar(true)}>
          ⋯ Modificar renovación
        </Boton>
      )}
      {(porConfirmar || activa) && (
        <Boton variante="peligro" tamano="md" onClick={() => setConfirmando('cancelar')}>
          Cancelar
        </Boton>
      )}
      {porConfirmar && noConservable && (
        <p className="basis-full text-sm text-red-300">
          No se puede confirmar con el mismo perfil: {previsto?.motivo || 'el servicio anterior no tiene un perfil registrado.'}{' '}
          {esAdministrador ? 'Usa "Modificar renovación" para elegir otro perfil.' : 'Un administrador debe usar "Modificar renovación".'}
        </p>
      )}

      <ModalConfirmarRenovacion
        abierto={modalConfirmar}
        pedido={pedido}
        previsto={previsto}
        onCerrar={() => setModalConfirmar(false)}
        onConfirmada={(r) => {
          onCambiado();
          if (!r) return; // no se pudo conservar: el modal muestra el motivo y la tarjeta se refresca
          setModalConfirmar(false);
          setModalMensaje({ mensaje: r.mensaje });
        }}
      />
      <ModalModificarRenovacion
        abierto={modalModificar}
        pedido={pedido}
        onCerrar={() => setModalModificar(false)}
        onModificada={() => {
          setModalModificar(false);
          onCambiado();
          setModalEntregar(true); // credenciales nuevas: se entregan
        }}
      />
      <ModalMensajeRenovacion
        abierto={!!modalMensaje}
        pedidoId={pedido.id}
        mensaje={modalMensaje?.mensaje}
        onCerrar={() => setModalMensaje(null)}
      />
      <ModalEntregarCredenciales abierto={modalEntregar} pedido={pedido} onCerrar={() => setModalEntregar(false)} onEntregado={onCambiado} />

      <DialogoConfirmacion
        abierto={confirmando === 'liberar'}
        titulo="Liberar cuenta"
        mensaje="Confirma esto SOLO si ya cambiaste la contraseña real de esta cuenta en la plataforma del servicio. Si liberas sin cambiarla, el cliente anterior seguiría teniendo acceso."
        textoConfirmar="Ya la cambié, liberar"
        onConfirmar={async () => {
          await inventarioApi.liberar(inventario.id);
          onCambiado();
        }}
        onCerrar={() => setConfirmando(null)}
      />
      <DialogoConfirmacion
        abierto={confirmando === 'cancelar'}
        titulo="Cancelar renovación"
        mensaje={`¿Cancelar esta renovación de "${pedido.cliente_nombre}"? Esta acción no se puede deshacer.`}
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
        titulo="Renovar otra vez"
        mensaje={`¿Crear la próxima renovación de "${pedido.cliente_nombre}" (mismo plan de "${pedido.servicio_nombre}")?`}
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

/** Botones de acción según el estado actual, cada uno mapeado 1:1 a un endpoint ya existente. */
function ControlAcciones({ pedido, inventario, previsto, onCambiado }) {
  const navigate = useNavigate();
  const [modalPago, setModalPago] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalEntregaManual, setModalEntregaManual] = useState(false);
  const [modalEntregar, setModalEntregar] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // 'activar' | 'cancelar' | 'renovar' | 'liberar'
  const [asignandoAuto, setAsignandoAuto] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'info' | 'pin' | 'error', texto, cuentaId? }

  // Flujo rápido: cuántos perfiles disponibles hay del servicio (endpoint de solo lectura ya existente).
  // Una renovación nunca busca inventario.
  const necesitaStock = !pedido.pedido_origen_id && (pedido.estado === 'pagado' || (pedido.estado === 'activo' && !inventario));
  const { data: stock } = useApi(
    () => (necesitaStock ? inventarioApi.listar({ servicio_id: pedido.servicio_id, estado: 'disponible' }) : Promise.resolve(null)),
    [necesitaStock, pedido.servicio_id]
  );
  const disponibles = Array.isArray(stock) ? stock.length : null;

  // Tras activar/asignar: abre la entrega directo, salvo sin stock o con el PIN pendiente de ajuste.
  // `nota` (reglas de perfil 2026-09-24): perfil conservado en la renovación, o aviso si no se pudo conservar.
  function trasAsignar({ perfilAsignado, pinPendiente, cuentaId, nota }) {
    if (!perfilAsignado) {
      setAviso({
        tipo: 'info',
        texto: `Servicio activado, pero no había perfiles disponibles de ${pedido.servicio_nombre}. Carga inventario y usa "⚡ Asignar automáticamente".`,
      });
    } else if (pinPendiente) {
      setAviso({
        tipo: 'pin',
        texto: 'Perfil asignado, pero con el PIN pendiente de ajuste: ajústalo en la plataforma y pulsa "Marcar ajustado" en la cuenta antes de entregar.',
        cuentaId,
      });
    } else {
      setAviso(nota ? { tipo: 'info', texto: nota } : null);
      setModalEntregar(true);
    }
  }

  /** Texto para el panel según cómo se eligió el perfil (renovación conservada / aviso). */
  function notaPerfil(r) {
    if (r?.aviso_perfil || r?.aviso) return r.aviso_perfil || r.aviso;
    if (r?.perfil_conservado || r?.conservado) {
      const numero = r.perfil_numero || r.numero_perfil;
      const nombre = r.perfil_nombre || r.nombre_perfil || (numero ? `Perfil ${numero}` : 'su perfil');
      return `Renovación: se conservó el mismo perfil del cliente (${nombre}).`;
    }
    return null;
  }

  async function asignarAutomatico() {
    setAsignandoAuto(true);
    setAviso(null);
    try {
      const perfil = await inventarioApi.asignarAutomatico(pedido.id);
      onCambiado();
      trasAsignar({ perfilAsignado: true, pinPendiente: perfil?.pin_estado === 'pendiente_ajuste', cuentaId: perfil?.cuenta_servicio_id, nota: notaPerfil(perfil) });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err?.message || 'No se pudo asignar un perfil automáticamente.' });
    } finally {
      setAsignandoAuto(false);
    }
  }

  // RENOVACIÓN (regla 2026-09-25): flujo propio, totalmente separado del de cliente nuevo.
  if (pedido.pedido_origen_id) {
    return <AccionesRenovacion pedido={pedido} inventario={inventario} previsto={previsto} onCambiado={onCambiado} />;
  }

  // --- CLIENTE NUEVO: asignar cuenta/perfil del inventario ---
  const yaRenovado = !!previsto?.renovado_por; // su perfil pasó a la renovación
  const mostrarPagar = pedido.estado === 'pendiente';
  const mostrarActivar = pedido.estado === 'pagado';
  // Solo se ofrece "Asignar manualmente" cuando el pedido ya está pagado/activo Y no tiene ningún perfil asignado todavía.
  const mostrarAsignarManual = (pedido.estado === 'pagado' || pedido.estado === 'activo') && !inventario && !yaRenovado;
  const mostrarLiberar = inventario?.estado === 'vencido';
  // Paso FINAL de entrega (migración 021): pedido activo con su perfil asignado.
  const mostrarEntregar = pedido.estado === 'activo' && inventario?.estado === 'asignado';
  // Flujo rápido: pedido activo sin perfil -> asignación automática como acción principal.
  const mostrarAsignarAuto = pedido.estado === 'activo' && !inventario && !yaRenovado;
  const mostrarCancelar = pedido.estado === 'pendiente' || pedido.estado === 'pagado' || pedido.estado === 'activo';
  const mostrarRenovar = pedido.estado === 'activo' || pedido.estado === 'vencido';

  if (!mostrarPagar && !mostrarActivar && !mostrarAsignarManual && !mostrarLiberar && !mostrarCancelar && !mostrarRenovar && !mostrarEntregar) {
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
          {disponibles === 0 ? 'Activar servicio' : '⚡ Activar y entregar'}
        </Boton>
      )}
      {mostrarEntregar && (
        <Boton variante="primario" tamano="md" onClick={() => setModalEntregar(true)}>
          📲 Entregar credenciales
        </Boton>
      )}
      {mostrarAsignarAuto && (
        <Boton variante="primario" tamano="md" onClick={asignarAutomatico} cargando={asignandoAuto} disabled={disponibles === 0}>
          {disponibles === 0
            ? `Sin perfiles disponibles de ${pedido.servicio_nombre}`
            : `⚡ Asignar automáticamente${disponibles != null ? ` (${disponibles} disponible${disponibles === 1 ? '' : 's'})` : ''}`}
        </Boton>
      )}
      {mostrarAsignarManual && (
        <Boton variante="secundario" tamano="md" onClick={() => setModalAsignar(true)}>
          Asignar manualmente
        </Boton>
      )}
      {mostrarAsignarManual && (
        <Boton variante="peligro" tamano="md" onClick={() => setModalEntregaManual(true)}>
          ⚠ Entrega manual (emergencia)
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

      {aviso && (
        <p
          className={`basis-full text-sm ${
            aviso.tipo === 'error' ? 'text-red-400' : aviso.tipo === 'pin' ? 'text-amber-400' : 'text-texto-suave'
          }`}
        >
          {aviso.tipo === 'pin' ? '⚠ ' : ''}
          {aviso.texto}
          {aviso.tipo === 'pin' && (aviso.cuentaId || inventario?.cuenta_servicio_id) && (
            <>
              {' '}
              <Link to={`/inventario/cuentas/${aviso.cuentaId || inventario.cuenta_servicio_id}`} className="text-marca-500 hover:underline">
                Ir a la cuenta
              </Link>
            </>
          )}
        </p>
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

      <ModalEntregarCredenciales
        abierto={modalEntregar}
        pedido={pedido}
        onCerrar={() => setModalEntregar(false)}
        onEntregado={onCambiado}
      />

      <ModalEntregaManual
        abierto={modalEntregaManual}
        pedido={pedido}
        onCerrar={() => setModalEntregaManual(false)}
        onEntregado={() => {
          setModalEntregaManual(false);
          onCambiado();
        }}
      />

      <DialogoConfirmacion
        abierto={confirmando === 'activar'}
        titulo={disponibles === 0 ? 'Activar servicio' : 'Activar y entregar'}
        mensaje={`¿Activar el servicio de "${pedido.cliente_nombre}"? Se calculará el vencimiento (${pedido.duracion_dias} días), se programarán los 3 recordatorios y se asignará el primer perfil disponible del inventario. Si no hay ningún perfil, el servicio NO se activa.${disponibles === 0 ? ' Ahora mismo no hay perfiles disponibles de este servicio.' : ''}`}
        textoConfirmar="Sí, activar"
        onConfirmar={async () => {
          const resultado = await pedidosApi.activar(pedido.id);
          onCambiado();
          trasAsignar({ perfilAsignado: resultado?.perfil_asignado, pinPendiente: resultado?.perfil_pin_pendiente, nota: notaPerfil(resultado) });
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

/**
 * PUT /admin/pedidos/:id/inventario/entrega-manual — botón de EMERGENCIA.
 * A diferencia de "Asignar manualmente" (elige un perfil YA existente
 * en el inventario), este crea uno nuevo ad-hoc y lo asigna en el
 * mismo paso -- para cuando no hay absolutamente nada precargado para
 * este servicio. Queda igual de registrado en el historial que
 * cualquier otra asignación.
 */
function ModalEntregaManual({ abierto, pedido, onCerrar, onEntregado }) {
  const [identificadorCuenta, setIdentificadorCuenta] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [numeroPerfil, setNumeroPerfil] = useState('');
  const [pinPerfil, setPinPerfil] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function limpiar() {
    setIdentificadorCuenta('');
    setContrasena('');
    setNumeroPerfil('');
    setPinPerfil('');
    setNotasInternas('');
    setError(null);
  }

  function cerrar() {
    limpiar();
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await inventarioApi.entregaManual(pedido.id, {
        identificador_cuenta: identificadorCuenta.trim(),
        contrasena,
        numero_perfil: numeroPerfil.trim() || undefined,
        pin_perfil: pinPerfil.trim() || undefined,
        notas_internas: notasInternas.trim() || undefined,
      });
      cerrar();
      onEntregado();
    } catch (err) {
      setError(err?.message || 'No se pudo completar la entrega manual.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="⚠ Entrega manual de emergencia"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton
            variante="peligro"
            type="submit"
            form="form-entrega-manual"
            cargando={cargando}
            disabled={!identificadorCuenta.trim() || !contrasena}
          >
            Entregar ahora
          </Boton>
        </>
      }
    >
      <form id="form-entrega-manual" onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-texto-suave">
          Úsalo SOLO cuando no haya ningún perfil precargado en el inventario para "{pedido.servicio_nombre}". Esto
          crea una cuenta nueva en el inventario con estos datos y la asigna a este pedido de inmediato — queda
          registrada en el historial igual que cualquier otra asignación.
        </p>
        <Campo
          etiqueta="Usuario o correo de la cuenta"
          name="identificador_cuenta"
          value={identificadorCuenta}
          onChange={(e) => setIdentificadorCuenta(e.target.value)}
          required
          autoFocus
        />
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="text"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />
        <Campo
          etiqueta="Número de perfil (opcional)"
          name="numero_perfil"
          value={numeroPerfil}
          onChange={(e) => setNumeroPerfil(e.target.value)}
        />
        <Campo
          etiqueta="PIN del perfil (opcional)"
          name="pin_perfil"
          value={pinPerfil}
          onChange={(e) => setPinPerfil(e.target.value)}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-texto-suave">Notas internas (opcional)</span>
          <textarea
            className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition placeholder:text-texto-suave/60 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
            rows={3}
            value={notasInternas}
            onChange={(e) => setNotasInternas(e.target.value)}
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/**
 * Paso FINAL de entrega de credenciales (migración 021), pensado para la
 * rapidez: correo, contraseña y PIN visibles con un botón de copiar cada uno,
 * "Copiar credenciales completas", y el mensaje completo para WhatsApp. Los
 * datos se leen en vivo de Inventario (no se guardan aparte). Las
 * "Indicaciones importantes del servicio" solo van en el mensaje completo.
 * Registro en el historial (pestaña Entregas): "Abrir WhatsApp" registra cada
 * vez; las copias registran UNA entrega (canal "copiado") por apertura.
 */
const TEXTO_COPIADO = {
  correo: 'Correo copiado',
  contrasena: 'Contraseña copiada',
  pin: 'PIN copiado',
  credenciales: 'Credenciales copiadas',
  mensaje: 'Mensaje copiado',
};

function ModalEntregarCredenciales({ abierto, pedido, onCerrar, onEntregado }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [registrado, setRegistrado] = useState(null); // { canal, en }
  const [registrando, setRegistrando] = useState(false);
  const [copiado, setCopiado] = useState(null); // clave de TEXTO_COPIADO
  const copiaRegistrada = useRef(false);
  const temporizador = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    setDatos(null);
    setError(null);
    setRegistrado(null);
    setCopiado(null);
    copiaRegistrada.current = false;
    setCargando(true);
    pedidosApi
      .mensajeEntrega(pedido.id)
      .then((r) => vigente && setDatos(r))
      .catch((err) => vigente && setError(err?.message || 'No se pudo preparar la entrega.'))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [abierto, pedido.id]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function registrar(canal) {
    setRegistrando(true);
    setError(null);
    try {
      const entrega = await pedidosApi.registrarEntrega(pedido.id, canal);
      setRegistrado({ canal, en: entrega?.creado_en || new Date().toISOString() });
      onEntregado();
    } catch (err) {
      if (canal === 'copiado') copiaRegistrada.current = false;
      setError(err?.message || 'La entrega no se pudo registrar en el historial.');
    } finally {
      setRegistrando(false);
    }
  }

  function abrirWhatsApp() {
    const numero = String(datos.cliente_whatsapp || '').replace(/[^0-9]/g, '');
    // Se abre primero (dentro del clic) para que el navegador no bloquee la ventana.
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(datos.texto)}`, '_blank', 'noopener');
    registrar('whatsapp');
  }

  async function copiar(clave, texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      setError('No se pudo copiar al portapapeles. Selecciona el texto y cópialo a mano.');
      return;
    }
    setError(null);
    setCopiado(clave);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(null), 2500);
    if (!copiaRegistrada.current) {
      copiaRegistrada.current = true;
      registrar('copiado');
    }
  }

  const c = datos?.credenciales;
  const esPerfil = c?.tipo_espacio === 'perfil';
  const nombreEspacio = c?.tipo_espacio === 'miembro' ? 'Miembro' : 'Perfil';
  const espacio = c
    ? (c.tipo_espacio === 'cuenta_completa' ? 'Cuenta completa' : `${nombreEspacio} ${c.numero_perfil || '—'}`) +
      (c.nombre_perfil ? ` · ${c.nombre_perfil}` : '')
    : '';
  const credencialesCompletas = c
    ? [
        `Usuario/correo: ${c.correo}`,
        ...(c.contrasena ? [`Contraseña: ${c.contrasena}`] : []),
        ...(c.tipo_espacio !== 'cuenta_completa'
          ? [`${nombreEspacio}: ${c.numero_perfil || '—'}${c.nombre_perfil ? ` (${c.nombre_perfil})` : ''}`]
          : []),
        ...(c.pin ? [`PIN: ${c.pin}`] : []),
      ].join('\n')
    : '';

  return (
    <Modal
      abierto={abierto}
      titulo="Entregar credenciales al cliente"
      onCerrar={registrando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={registrando}>
            {registrado ? 'Cerrar' : 'Cancelar'}
          </Boton>
          <Boton variante="secundario" onClick={() => copiar('mensaje', datos.texto)} disabled={!datos}>
            Copiar mensaje
          </Boton>
          <Boton onClick={abrirWhatsApp} disabled={!datos || !datos.cliente_whatsapp} cargando={registrando}>
            Abrir WhatsApp
          </Boton>
        </>
      }
    >
      {cargando ? (
        <EstadoCarga />
      ) : error && !datos ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : datos ? (
        <div className="space-y-4">
          <div className="text-sm text-texto-suave">
            <p>
              Para <span className="font-medium text-texto">{datos.cliente_nombre}</span>
              {datos.cliente_whatsapp ? ` · ${formatoWhatsapp(datos.cliente_whatsapp)}` : ' · sin WhatsApp registrado'}
            </p>
            <p>
              {datos.servicio_nombre} · {espacio} ·{' '}
              <Link to={`/inventario/cuentas/${c.cuenta_servicio_id}`} className="text-marca-500 hover:underline">
                ver cuenta
              </Link>
              {c.version_credenciales ? ` · credenciales v${c.version_credenciales}` : ''}
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-borde bg-superficie-alta p-3">
            <FilaCredencial etiqueta="Correo/usuario" valor={c.correo} textoBoton="Copiar correo" onCopiar={() => copiar('correo', c.correo)} />
            <FilaCredencial
              etiqueta="Contraseña"
              valor={c.contrasena || '—'}
              textoBoton="Copiar contraseña"
              onCopiar={c.contrasena ? () => copiar('contrasena', c.contrasena) : undefined}
            />
            {esPerfil && (
              <FilaCredencial
                etiqueta="PIN del perfil"
                valor={c.pin || 'Sin PIN (perfil sin candado)'}
                textoBoton="Copiar PIN"
                onCopiar={c.pin ? () => copiar('pin', c.pin) : undefined}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Boton onClick={() => copiar('credenciales', credencialesCompletas)}>📋 Copiar credenciales completas</Boton>
            {copiado && <span className="text-sm font-medium text-green-400">✔ {TEXTO_COPIADO[copiado]}</span>}
          </div>

          <details className="rounded-lg border border-borde">
            <summary className="cursor-pointer px-3 py-2 text-sm text-texto-suave">
              Ver mensaje completo para el cliente{datos.advertencia_incluida ? ' (incluye las indicaciones de uso)' : ''}
            </summary>
            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap border-t border-borde p-3 text-sm text-texto">{datos.texto}</pre>
          </details>

          {registrado && (
            <p className="text-sm text-green-400">
              ✔ Entrega registrada el {fechaHora(registrado.en)} ({registrado.canal === 'whatsapp' ? 'enviada por WhatsApp' : 'datos copiados'}).
              Queda en la pestaña "Entregas".
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      ) : null}
    </Modal>
  );
}

function FilaCredencial({ etiqueta, valor, textoBoton, onCopiar }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</p>
        <code className="block select-all break-all text-base text-texto">{valor}</code>
      </div>
      {onCopiar && (
        <Boton variante="secundario" tamano="sm" onClick={onCopiar}>
          {textoBoton}
        </Boton>
      )}
    </div>
  );
}

/** GET /admin/pedidos/:id/entregas — historial de entregas de credenciales (sin secretos). */
function PestanaEntregas({ pedidoId }) {
  const { data, cargando, error, refetch } = useApi(() => pedidosApi.entregas(pedidoId), [pedidoId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) {
    return <EstadoVacio titulo="Sin entregas" descripcion="Todavía no se entregaron las credenciales de este pedido." />;
  }

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'creado_en', titulo: 'Fecha', render: (f) => fechaHora(f.creado_en) },
        { clave: 'canal', titulo: 'Canal', render: (f) => (f.canal === 'whatsapp' ? 'WhatsApp' : 'Copiado') },
        {
          clave: 'advertencia_incluida',
          titulo: 'Indicaciones de uso',
          render: (f) => (f.advertencia_incluida ? <Etiqueta color="green">Incluidas</Etiqueta> : <Etiqueta>No aplica</Etiqueta>),
        },
        { clave: 'perfil', titulo: 'Perfil', render: (f) => [f.numero_perfil, f.nombre_perfil].filter(Boolean).join(' · ') || '—' },
        { clave: 'version_credenciales', titulo: 'Credenciales', render: (f) => (f.version_credenciales ? `v${f.version_credenciales}` : '—') },
        { clave: 'entregado_por_nombre', titulo: 'Entregó', render: (f) => f.entregado_por_nombre || '—' },
      ]}
    />
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
