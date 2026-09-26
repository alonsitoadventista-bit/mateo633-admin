/**
 * pages/clientes/componentes/AccionServicioCliente.jsx  (Clientes CRM)
 * -----------------------------------------
 * Acciones de la ficha sobre un servicio ACTIVO del cliente, con los MISMOS
 * modales (y la misma lógica) que el detalle del pedido:
 * - "Credenciales": ver/entregar credenciales (ModalEntregarCredenciales).
 * - "Modificar cuenta/perfil": módulo EXCEPCIONAL, solo administrador
 *   (PUT /admin/pedidos/:id/modificar-perfil): motivo obligatorio y auditoría;
 *   al terminar abre la entrega de las credenciales nuevas.
 * Si el cliente tiene más de un servicio activo, primero se elige cuál.
 */
import { useEffect, useState } from 'react';
import * as pedidosApi from '../../../api/pedidos';
import { Boton, Modal, Selector } from '../../../components/ui';
import { ModalEntregarCredenciales } from '../../pedidos/DetallePedido.jsx';
import { ModalModificarCuentaPerfil } from '../../pedidos/ModalesRenovacion';

/**
 * `accion` = 'credenciales' | 'modificar' | null (cerrado).
 * `servicios` = servicios activos del resumen: [{ pedido_id, servicio_nombre }].
 */
export function AccionServicioCliente({ accion, servicios = [], onCerrar, onCambiado }) {
  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [modo, setModo] = useState(null);
  const [error, setError] = useState(null);

  // Solo al abrir una acción nueva: la ficha se recarga al modificar y no debe reiniciar el flujo.
  useEffect(() => {
    setPedido(null);
    setError(null);
    setModo(accion);
    setPedidoId(accion && servicios.length === 1 ? servicios[0].pedido_id : null);
  }, [accion]); // a propósito sin `servicios`: ver arriba

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
    return <ModalElegirServicio servicios={servicios} accion={accion} onElegir={setPedidoId} onCerrar={onCerrar} />;
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

function ModalElegirServicio({ servicios, accion, onElegir, onCerrar }) {
  const [valor, setValor] = useState('');
  return (
    <Modal
      abierto
      titulo={accion === 'modificar' ? 'Modificar cuenta/perfil: elige el servicio' : 'Credenciales: elige el servicio'}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton onClick={() => valor && onElegir(Number(valor))} disabled={!valor}>
            Continuar
          </Boton>
        </>
      }
    >
      <Selector
        etiqueta="Servicio activo"
        name="servicio"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Elige un servicio"
        opciones={servicios.map((s) => ({ valor: String(s.pedido_id), texto: `${s.servicio_nombre} · pedido #${s.pedido_id}` }))}
      />
    </Modal>
  );
}
