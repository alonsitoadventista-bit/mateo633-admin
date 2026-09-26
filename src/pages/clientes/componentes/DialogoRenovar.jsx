/**
 * pages/clientes/componentes/DialogoRenovar.jsx  (Clientes CRM)
 * -----------------------------------------
 * "Renovar" desde Clientes (usuario, 2026-09-26): EXACTAMENTE el mismo flujo
 * que "Confirmar renovación" en Pedidos, en un solo paso y sin salir de
 * Clientes (POST /admin/pedidos/:id/renovar-y-confirmar):
 * - conserva cuenta, correo, contraseña, perfil y PIN (no toca inventario);
 * - suma los días calendario del plan desde el vencimiento actual (o desde hoy);
 * - registra el pago (ventas y ganancias del día) y el historial;
 * - muestra el mensaje de confirmación para el cliente (WhatsApp / copiar).
 * Si ya hay una renovación en curso de ese servicio, confirma ESA (no duplica).
 * Si el perfil no se puede conservar, lleva al pedido: Pedidos es el respaldo
 * administrativo ("Modificar renovación").
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as pedidosApi from '../../../api/pedidos';
import { Boton, Campo, Modal } from '../../../components/ui';
import { ModalMensajeRenovacion } from '../../pedidos/ModalesRenovacion';

/**
 * Qué pedido renovar para un cliente (fila del listado o resumen):
 * el servicio vigente que vence primero o, si no tiene, el último vencido.
 * { pedido_id, servicio_nombre, en_curso } o { bloqueo: 'motivo' }.
 * Con una renovación en curso NO se bloquea: se confirma esa.
 */
export function objetivoRenovacion(c) {
  const en_curso = Boolean(c.renovacion_pendiente);
  const vigente = c.servicios_activos?.[0];
  if (vigente) return { pedido_id: vigente.pedido_id, servicio_nombre: vigente.servicio_nombre, en_curso };
  if (c.ultimo_pedido_id) return { pedido_id: c.ultimo_pedido_id, servicio_nombre: c.ultimo_servicio_nombre, en_curso };
  return { bloqueo: 'Todavía no tiene un servicio para renovar. Crea su primer pedido en Pedidos.' };
}

/** `objetivo` = { pedido_id, servicio_nombre, cliente_nombre, en_curso? } o null (cerrado). */
export function DialogoRenovar({ objetivo, onCerrar, onRenovado }) {
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null); // { texto, renovacionId? }
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!objetivo) return;
    setMonto('');
    setMetodo('');
    setError(null);
    setMensaje(null);
  }, [objetivo]);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const r = await pedidosApi.renovarYConfirmar(objetivo.pedido_id, {
        monto: monto === '' ? undefined : Number(monto),
        metodo: metodo.trim() || undefined,
      });
      setMensaje(r.mensaje);
      onRenovado?.();
    } catch (err) {
      setError({ texto: err?.message || 'No se pudo renovar.', renovacionId: err?.datos?.renovacion_id || null });
      if (err?.datos?.renovacion_id) onRenovado?.(); // el pago pudo quedar registrado
    } finally {
      setCargando(false);
    }
  }

  if (!objetivo) return null;
  if (mensaje) return <ModalMensajeRenovacion abierto mensaje={mensaje} onCerrar={onCerrar} />;

  return (
    <Modal
      abierto
      titulo="Renovar servicio"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            {error ? 'Cerrar' : 'Cancelar'}
          </Boton>
          {!error?.renovacionId && (
            <Boton type="submit" form="form-renovar-cliente" cargando={cargando}>
              ✅ Confirmar renovación
            </Boton>
          )}
        </>
      }
    >
      <form id="form-renovar-cliente" onSubmit={enviar} className="space-y-4 text-sm">
        <p className="text-texto">
          Renovación de <strong>{objetivo.servicio_nombre}</strong> para <strong>{objetivo.cliente_nombre}</strong>: se suman los días
          del plan desde su vencimiento actual (o desde hoy si ya venció). Todo queda igual:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-texto-suave">
          <li>misma cuenta, correo, contraseña, perfil y PIN</li>
          <li>la venta se suma a los ingresos de hoy y queda en su historial</li>
          {objetivo.en_curso && <li className="text-sky-300">ya tiene una renovación en curso: se confirma esa (no se duplica)</li>}
        </ul>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Campo
            etiqueta="Monto pagado"
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Precio del plan"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
          />
          <Campo
            etiqueta="Método (opcional)"
            name="metodo"
            placeholder="Yape, Plin, transferencia…"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
          />
        </div>
        <p className="text-xs text-texto-suave">Si dejas el monto vacío, se registra el precio del plan.</p>
        {error && (
          <p className="text-xs text-red-400">
            {error.texto}
            {error.renovacionId && (
              <>
                {' '}
                <Link to={`/pedidos/${error.renovacionId}`} className="text-marca-500 hover:underline">
                  Resolver en el pedido #{error.renovacionId}
                </Link>
              </>
            )}
          </p>
        )}
      </form>
    </Modal>
  );
}
