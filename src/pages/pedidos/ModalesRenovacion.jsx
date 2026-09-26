/**
 * pages/pedidos/ModalesRenovacion.jsx
 * -----------------------------------------
 * RENOVACIONES (regla del usuario, 2026-09-25): una renovación NO es una
 * venta nueva, solo extiende la vigencia del servicio existente.
 * - ModalConfirmarRenovacion: el único botón del flujo normal (pago si
 *   falta + mismo perfil + vigencia + mensaje).
 * - ModalMensajeRenovacion: mensaje de confirmación al cliente (WhatsApp / copiar).
 * - ModalModificarRenovacion: excepcional (solo administrador); cambia
 *   cuenta/correo/contraseña/perfil/PIN eligiendo otro perfil, con motivo
 *   obligatorio que queda en la auditoría.
 */
import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import * as inventarioApi from '../../api/inventario';
import { Boton, Campo, Selector, Modal, EstadoVacio } from '../../components/ui';
import { moneda } from '../../utils/formato';
import { enlaceWhatsApp } from '../../utils/whatsapp';

/** PUT /admin/pedidos/:id/confirmar-renovacion — si está pendiente, registra el pago en el mismo paso. */
export function ModalConfirmarRenovacion({ abierto, pedido, previsto, onCerrar, onConfirmada }) {
  const pendiente = pedido.estado === 'pendiente';
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setMonto(pedido.precio_pagado != null ? String(pedido.precio_pagado) : '');
    setMetodo('');
    setError(null);
  }, [abierto, pedido.precio_pagado]);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const r = await pedidosApi.confirmarRenovacion(
        pedido.id,
        pendiente ? { monto: Number(monto), metodo: metodo.trim() || undefined } : undefined
      );
      onConfirmada(r);
    } catch (err) {
      setError(err?.message || 'No se pudo confirmar la renovación.');
      if (err?.codigo === 'PERFIL_RENOVACION_NO_CONSERVABLE') onConfirmada(null);
    } finally {
      setCargando(false);
    }
  }

  const perfil = previsto?.estado === 'conservable' ? previsto.perfil : null;

  return (
    <Modal
      abierto={abierto}
      titulo="Confirmar renovación"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-confirmar-renovacion" cargando={cargando}>
            ✅ Confirmar renovación
          </Boton>
        </>
      }
    >
      <form id="form-confirmar-renovacion" onSubmit={enviar} className="space-y-4 text-sm">
        <p className="text-texto">
          Se suman <strong>{pedido.duracion_dias} días</strong> a la vigencia de <strong>{pedido.cliente_nombre}</strong> (desde su vencimiento
          actual, o desde hoy si ya venció). Todo queda igual:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-texto-suave">
          <li>{perfil ? `${perfil.nombre} · ${perfil.identificador_cuenta}` : 'la misma cuenta y el mismo perfil'}</li>
          <li>mismo correo, contraseña, PIN y configuración</li>
          <li>la venta se suma a los ingresos de hoy</li>
        </ul>
        {pendiente && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo
              etiqueta="Monto pagado"
              name="monto"
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
            <Campo
              etiqueta="Método (opcional)"
              name="metodo"
              placeholder="Yape, Plin, transferencia…"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            />
          </div>
        )}
        {!pendiente && <p className="text-texto-suave">Pago ya registrado: {moneda(pedido.precio_pagado)}.</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/** Mensaje de confirmación de la renovación: WhatsApp o copiar. `mensaje` viene de la confirmación o de GET mensaje-renovacion. */
export function ModalMensajeRenovacion({ abierto, pedidoId, mensaje, onCerrar }) {
  const [datos, setDatos] = useState(mensaje || null);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCopiado(false);
    setError(null);
    if (mensaje) {
      setDatos(mensaje);
      return;
    }
    let vigente = true;
    setDatos(null);
    pedidosApi
      .mensajeRenovacion(pedidoId)
      .then((r) => vigente && setDatos(r))
      .catch((err) => vigente && setError(err?.message || 'No se pudo preparar el mensaje.'));
    return () => {
      vigente = false;
    };
  }, [abierto, pedidoId, mensaje]);

  const enlace = datos ? enlaceWhatsApp(datos.cliente_whatsapp, datos.texto) : null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(datos.texto);
      setCopiado(true);
    } catch {
      setError('No se pudo copiar. Selecciona el texto y cópialo a mano.');
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Renovación confirmada ✅"
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton variante="secundario" onClick={copiar} disabled={!datos}>
            {copiado ? 'Copiado ✓' : 'Copiar mensaje'}
          </Boton>
          <Boton onClick={() => enlace && window.open(enlace, '_blank', 'noopener')} disabled={!enlace}>
            💬 Enviar por WhatsApp
          </Boton>
        </>
      }
    >
      {datos ? (
        <div className="space-y-2 text-sm">
          <p className="text-texto-suave">
            Mensaje para {datos.cliente_nombre}
            {datos.credenciales_cambiaron ? ' (sus credenciales cambiaron: envíale también la entrega)' : ''}:
          </p>
          <pre className="whitespace-pre-wrap rounded-lg border border-borde bg-superficie-alta p-3 font-sans text-texto">{datos.texto}</pre>
          {!enlace && <p className="text-xs text-amber-300">El cliente no tiene un WhatsApp válido: copia el mensaje.</p>}
        </div>
      ) : (
        !error && <p className="text-sm text-texto-suave">Preparando el mensaje…</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </Modal>
  );
}

/**
 * PUT /admin/pedidos/:id/modificar-renovacion — EXCEPCIONAL (solo administrador).
 * El cliente pasa a otro perfil del inventario: cambia cuenta/correo/contraseña/perfil/PIN.
 * Motivo obligatorio; queda en la auditoría (qué cambió, fecha, administrador, motivo).
 */
export function ModalModificarRenovacion({ abierto, pedido, onCerrar, onModificada }) {
  const { data: disponibles, cargando: cargandoLista, error: errorLista } = useApi(
    () => (abierto ? inventarioApi.listar({ servicio_id: pedido.servicio_id, estado: 'disponible' }) : Promise.resolve([])),
    [abierto, pedido.servicio_id]
  );
  const [perfilId, setPerfilId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const pendiente = pedido.estado === 'pendiente';

  useEffect(() => {
    if (!abierto) return;
    setPerfilId('');
    setMotivo('');
    setError(null);
  }, [abierto]);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const r = await pedidosApi.modificarRenovacion(pedido.id, {
        perfil_id: Number(perfilId),
        motivo: motivo.trim(),
        ...(pendiente ? { monto: Number(pedido.precio_pagado) } : {}),
      });
      onModificada(r);
    } catch (err) {
      setError(err?.message || 'No se pudo modificar la renovación.');
    } finally {
      setCargando(false);
    }
  }

  const filas = Array.isArray(disponibles) ? disponibles : [];

  return (
    <Modal
      abierto={abierto}
      titulo="Modificar renovación (excepcional)"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-modificar-renovacion" variante="peligro" cargando={cargando} disabled={!perfilId || motivo.trim().length < 5}>
            Cambiar perfil del cliente
          </Boton>
        </>
      }
    >
      <form id="form-modificar-renovacion" onSubmit={enviar} className="space-y-4 text-sm">
        <p className="text-amber-300">
          Solo para casos especiales (cuenta saturada, pedido del cliente, problema técnico). {pedido.cliente_nombre} cambia de
          credenciales: habrá que entregarle los datos nuevos. Su perfil actual queda "por rotar".
        </p>
        {pedido.estado !== 'activo' && (
          <p className="text-texto-suave">
            Además se confirma la renovación: +{pedido.duracion_dias} días de vigencia
            {pendiente ? ` y se registra el pago de ${moneda(pedido.precio_pagado)}` : ''}.
          </p>
        )}
        {errorLista && <p className="text-xs text-red-400">No se pudo cargar el inventario disponible.</p>}
        {!cargandoLista && filas.length === 0 && !errorLista && (
          <EstadoVacio titulo="No hay perfiles disponibles" descripcion={`Carga inventario de ${pedido.servicio_nombre} desde el módulo Inventario.`} />
        )}
        {filas.length > 0 && (
          <Selector
            etiqueta="Perfil nuevo"
            name="perfil_id"
            value={perfilId}
            onChange={(e) => setPerfilId(e.target.value)}
            placeholder="Elige un perfil disponible"
            opciones={filas.map((f) => ({
              valor: String(f.id),
              texto: `${f.identificador_cuenta || 'sin correo'} — perfil ${f.numero_perfil || '—'}${f.nombre_perfil ? ` (${f.nombre_perfil})` : ''}`,
            }))}
            required
          />
        )}
        <Campo
          etiqueta="Motivo del cambio (obligatorio)"
          name="motivo"
          placeholder="Ej.: cuenta antigua saturada"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          minLength={5}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
