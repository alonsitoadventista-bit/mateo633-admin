/**
 * pages/clientes/componentes/SelectorServicioCliente.jsx  (Clientes CRM)
 * -----------------------------------------
 * Selector OPERATIVO común (Credenciales, Modificar cuenta/perfil y Renovar):
 * 1. elige el SERVICIO (Netflix, Disney+…); si hay uno solo, se salta;
 * 2. si ese servicio tiene varias suscripciones activas (varias pantallas del
 *    mismo servicio), elige el PERFIL; si tiene una sola, entra directo.
 * Nunca muestra números de pedido: los pedidos son historial (serviciosCliente.js).
 * Llama `onElegido(suscripcion, grupo)` con la fila de GET /admin/clientes/:id/servicios
 * (tiene pedido_id, perfil, cuenta, vencimiento y renovacion_en_curso).
 */
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../../hooks/useApi';
import * as clientesApi from '../../../api/clientes';
import { Boton, EstadoCarga, Modal } from '../../../components/ui';
import { IconoServicio } from '../../dashboard/piezas.jsx';
import { fechaCalendario } from '../../../utils/formato';
import { agruparPorServicio, etiquetaSuscripcion } from '../serviciosCliente';

const TITULOS = {
  credenciales: 'Credenciales',
  modificar: 'Modificar cuenta/perfil',
  renovar: 'Renovar',
};

/** Suscripciones válidas para cada acción: credenciales/modificar necesitan un perfil asignado. */
function aptas(grupo, accion) {
  return accion === 'renovar' ? grupo.suscripciones : grupo.suscripciones.filter((s) => s.perfil_id);
}

export function SelectorServicioCliente({ clienteId, accion, servicioId = null, onElegido, onCerrar }) {
  const { data, cargando, error } = useApi(() => clientesApi.servicios(clienteId), [clienteId]);
  const grupos = useMemo(
    () => agruparPorServicio(data).filter((g) => aptas(g, accion).length > 0),
    [data, accion]
  );
  const [grupoId, setGrupoId] = useState(servicioId);
  const grupo = grupos.find((g) => g.servicio_id === grupoId) || null;
  const opciones = grupo ? aptas(grupo, accion) : [];

  // Pasos automáticos: un solo servicio → se elige; una sola suscripción → se entrega.
  useEffect(() => {
    if (!grupoId && grupos.length === 1) setGrupoId(grupos[0].servicio_id);
  }, [grupoId, grupos]);
  useEffect(() => {
    if (grupo && opciones.length === 1) onElegido(opciones[0], grupo);
  }, [grupo, opciones.length]); // a propósito sin onElegido (cambia en cada render del padre)

  const titulo = TITULOS[accion] || 'Servicio';
  const pie = (
    <Boton variante="secundario" onClick={onCerrar}>
      Cancelar
    </Boton>
  );

  if (error) {
    return (
      <Modal abierto titulo={titulo} onCerrar={onCerrar} pie={pie}>
        <p className="text-sm text-red-400">{error.message || 'No se pudieron cargar los servicios.'}</p>
      </Modal>
    );
  }
  if (cargando && !data) {
    return (
      <Modal abierto titulo={titulo} onCerrar={onCerrar} pie={pie}>
        <EstadoCarga texto="Cargando servicios…" />
      </Modal>
    );
  }
  if (grupos.length === 0) {
    return (
      <Modal abierto titulo={titulo} onCerrar={onCerrar} pie={pie}>
        <p className="text-sm text-texto-suave">
          {accion === 'renovar' ? 'Este cliente no tiene servicios activos.' : 'Este cliente no tiene servicios activos con un perfil asignado.'}
        </p>
      </Modal>
    );
  }
  // Paso automático en curso (evita un parpadeo del modal).
  if (grupo && opciones.length === 1) return null;

  if (!grupo) {
    return (
      <Modal abierto titulo={`${titulo}: elige el servicio`} onCerrar={onCerrar} pie={pie}>
        <ul className="space-y-2">
          {grupos.map((g) => {
            const n = aptas(g, accion).length;
            return (
              <li key={g.servicio_id}>
                <button
                  type="button"
                  onClick={() => setGrupoId(g.servicio_id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-marca-500/50"
                >
                  <IconoServicio nombre={g.servicio_nombre} imagenUrl={g.servicio_imagen_url} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-texto">{g.servicio_nombre}</span>
                    <span className="block text-xs text-texto-suave">
                      {g.fecha_vencimiento ? `Vence ${fechaCalendario(g.fecha_vencimiento, { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Sin vencimiento'}
                      {n > 1 ? ` · ${n} perfiles` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    );
  }

  return (
    <Modal abierto titulo={`${titulo}: ${grupo.servicio_nombre}`} onCerrar={onCerrar} pie={pie}>
      <p className="mb-3 text-sm text-texto-suave">
        Este cliente tiene {opciones.length} perfiles de {grupo.servicio_nombre}. Elige cuál:
      </p>
      <ul className="space-y-2">
        {opciones.map((s) => (
          <li key={s.pedido_id}>
            <button
              type="button"
              onClick={() => onElegido(s, grupo)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-sm transition hover:border-marca-500/50"
            >
              <span className="min-w-0">
                <span className="block text-texto">{etiquetaSuscripcion(s)}</span>
                {s.identificador_cuenta && <span className="block truncate text-xs text-texto-suave">Cuenta: {s.identificador_cuenta}</span>}
              </span>
              {s.renovacion_en_curso && <span className="shrink-0 text-xs text-sky-300">renovación en curso</span>}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
