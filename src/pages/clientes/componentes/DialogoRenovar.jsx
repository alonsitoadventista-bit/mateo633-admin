/**
 * pages/clientes/componentes/DialogoRenovar.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * Acción rápida "Renovar" desde Clientes. REUTILIZA la lógica existente
 * del detalle del pedido: POST /admin/pedidos/:id/renovar crea un pedido
 * de renovación (mismo plan) pendiente de pago y lleva a ese pedido, donde
 * se registra el pago y se activa. Las mejoras de la renovación
 * (vencimiento desde el anterior, mismo perfil) llegan en F3.
 */
import { useNavigate } from 'react-router-dom';
import * as pedidosApi from '../../../api/pedidos';
import { DialogoConfirmacion } from '../../../components/ui';

/**
 * Qué pedido renovar para un cliente (fila del listado o resumen):
 * el servicio vigente que vence primero o, si no tiene, el último vencido.
 * { pedido_id, servicio_nombre } o { bloqueo: 'motivo' }.
 */
export function objetivoRenovacion(c) {
  if (c.renovacion_pendiente) return { bloqueo: 'Ya tiene una renovación esperando el pago o la activación.' };
  const vigente = c.servicios_activos?.[0];
  if (vigente) return { pedido_id: vigente.pedido_id, servicio_nombre: vigente.servicio_nombre };
  if (c.ultimo_pedido_id) return { pedido_id: c.ultimo_pedido_id, servicio_nombre: c.ultimo_servicio_nombre };
  return { bloqueo: 'Todavía no tiene un servicio para renovar. Crea su primer pedido en Pedidos.' };
}

/** `objetivo` = { pedido_id, servicio_nombre, cliente_nombre } o null (cerrado). */
export function DialogoRenovar({ objetivo, onCerrar }) {
  const navigate = useNavigate();
  return (
    <DialogoConfirmacion
      abierto={Boolean(objetivo)}
      titulo="Renovar servicio"
      mensaje={
        objetivo
          ? `Se creará la renovación de ${objetivo.servicio_nombre} para "${objetivo.cliente_nombre}", con el mismo plan. Después, en el pedido, registra el pago y actívalo.`
          : ''
      }
      textoConfirmar="Sí, renovar"
      onConfirmar={async () => {
        const nuevo = await pedidosApi.renovar(objetivo.pedido_id);
        navigate(`/pedidos/${nuevo.id}`);
      }}
      onCerrar={onCerrar}
    />
  );
}
