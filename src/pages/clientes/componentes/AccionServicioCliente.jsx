/**
 * pages/clientes/componentes/AccionServicioCliente.jsx  (Clientes CRM)
 * -----------------------------------------
 * Acciones de la ficha sobre un SERVICIO activo del cliente, con los MISMOS
 * modales (y la misma lógica) que el detalle del pedido:
 * - "Credenciales": ver/entregar credenciales (ModalEntregarCredenciales),
 *   con su historial de entregas.
 * - "Modificar cuenta/perfil": módulo EXCEPCIONAL, solo administrador
 *   (PUT /admin/pedidos/:id/modificar-perfil): motivo obligatorio y auditoría;
 *   al terminar abre la entrega de las credenciales nuevas.
 * Primero se elige el SERVICIO (y el perfil si tiene varios del mismo servicio)
 * con SelectorServicioCliente: nunca por número de pedido. Internamente se
 * usa el pedido de esa suscripción (misma cuenta y perfil).
 */
import { useEffect, useState } from 'react';
import * as pedidosApi from '../../../api/pedidos';
import { Boton, Modal } from '../../../components/ui';
import { ModalEntregarCredenciales } from '../../pedidos/DetallePedido.jsx';
import { ModalModificarCuentaPerfil } from '../../pedidos/ModalesRenovacion';
import { SelectorServicioCliente } from './SelectorServicioCliente.jsx';

/** `accion` = 'credenciales' | 'modificar' | null (cerrado). */
export function AccionServicioCliente({ accion, clienteId, onCerrar, onCambiado }) {
  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [modo, setModo] = useState(null);
  const [error, setError] = useState(null);

  // Solo al abrir una acción nueva: la ficha se recarga al modificar y no debe reiniciar el flujo.
  useEffect(() => {
    setPedido(null);
    setError(null);
    setModo(accion);
    setPedidoId(null);
  }, [accion]);

  useEffect(() => {
    if (!pedidoId) return;
    let vigente = true;
    pedidosApi
      .detalle(pedidoId)
      .then((p) => vigente && setPedido(p))
      .catch((err) => vigente && setError(err?.message || 'No se pudo cargar el servicio.'));
    return () => {
      vigente = false;
    };
  }, [pedidoId]);

  if (!accion) return null;

  if (!pedidoId) {
    return <SelectorServicioCliente clienteId={clienteId} accion={accion} onElegido={(s) => setPedidoId(s.pedido_id)} onCerrar={onCerrar} />;
  }
  if (error) {
    return (
      <Modal abierto titulo="Servicio" onCerrar={onCerrar} pie={<Boton variante="secundario" onClick={onCerrar}>Cerrar</Boton>}>
        <p className="text-sm text-red-400">{error}</p>
      </Modal>
    );
  }
  if (!pedido) return null;

  if (modo === 'modificar') {
    return (
      <ModalModificarCuentaPerfil
        abierto
        pedido={pedido}
        onCerrar={onCerrar}
        onModificada={() => {
          onCambiado?.();
          setModo('credenciales'); // credenciales nuevas: se entregan
        }}
      />
    );
  }
  return <ModalEntregarCredenciales abierto pedido={pedido} onCerrar={onCerrar} onEntregado={() => onCambiado?.()} />;
}
