/**
 * pages/precios/PreciosPage.jsx  (módulo Precios, 2026-09-24)
 * -----------------------------------------
 * Todos los planes de todos los servicios en una sola tabla
 * (GET /admin/planes), con búsqueda por servicio, filtro de inactivos y
 * edición rápida de precio/duración (PUT /admin/planes/:id -- la misma ruta
 * que usa Servicios; queda auditada con el valor anterior). Crear planes o
 * activarlos/desactivarlos sigue en Servicios -> detalle del servicio.
 * Solo administrador (App.jsx + backend).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as serviciosApi from '../../api/servicios';
import { Tarjeta, Tabla, Boton, Campo, Etiqueta, Modal, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { moneda } from '../../utils/formato';
import { IconoServicio } from '../dashboard/piezas.jsx';

export function PreciosPage() {
  const { data, cargando, error, refetch } = useApi(() => serviciosApi.listarPlanes(), []);
  const [busqueda, setBusqueda] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [editando, setEditando] = useState(null);

  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (Array.isArray(data) ? data : []).filter(
      (p) =>
        (verInactivos || (p.activo && p.servicio_activo)) &&
        (!texto || p.servicio_nombre.toLowerCase().includes(texto))
    );
  }, [data, busqueda, verInactivos]);

  const servicios = new Set(filas.map((p) => p.servicio_id)).size;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-texto">Precios</h1>
        <p className="text-sm text-texto-suave">
          Todos los planes y sus precios. Para crear planes o activarlos/desactivarlos, entra al servicio en{' '}
          <Link to="/servicios" className="text-marca-500 hover:underline">
            Servicios
          </Link>
          .
        </p>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar servicio"
            name="busqueda"
            placeholder="Netflix, Disney+…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <label className="flex items-center gap-2 pb-2 text-sm text-texto-suave">
            <input type="checkbox" checked={verInactivos} onChange={(e) => setVerInactivos(e.target.checked)} />
            Mostrar inactivos
          </label>
        </div>

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : filas.length === 0 ? (
          <EstadoVacio titulo="Sin planes" descripcion={busqueda ? 'Nada coincide con la búsqueda.' : 'Todavía no hay planes.'} />
        ) : (
          <>
            <Tabla
              claveFila={(p) => p.id}
              filas={filas}
              columnas={[
                {
                  clave: 'servicio_nombre',
                  titulo: 'Servicio',
                  render: (p, i) =>
                    i > 0 && filas[i - 1].servicio_id === p.servicio_id ? (
                      <span className="sr-only">{p.servicio_nombre}</span>
                    ) : (
                      <Link to={`/servicios/${p.servicio_id}`} className="flex items-center gap-2 hover:text-marca-500">
                        <IconoServicio nombre={p.servicio_nombre} imagenUrl={p.servicio_imagen_url} />
                        <span className="font-medium">{p.servicio_nombre}</span>
                        {!p.servicio_activo && <Etiqueta>servicio inactivo</Etiqueta>}
                      </Link>
                    ),
                },
                { clave: 'duracion_dias', titulo: 'Duración', render: (p) => `${p.duracion_dias} días` },
                { clave: 'precio', titulo: 'Precio', render: (p) => <span className="font-semibold">{moneda(p.precio)}</span> },
                {
                  clave: 'por_dia',
                  titulo: 'Precio por día',
                  render: (p) => <span className="text-texto-suave">{moneda(Number(p.precio) / p.duracion_dias)}</span>,
                },
                {
                  clave: 'activo',
                  titulo: 'Estado',
                  render: (p) => <Etiqueta color={p.activo ? 'green' : 'gray'}>{p.activo ? 'Activo' : 'Inactivo'}</Etiqueta>,
                },
                {
                  clave: 'acciones',
                  titulo: '',
                  render: (p) => (
                    <Boton variante="secundario" tamano="sm" onClick={() => setEditando(p)}>
                      Editar precio
                    </Boton>
                  ),
                },
              ]}
            />
            <p className="mt-2 text-xs text-texto-suave">
              {filas.length} plan{filas.length === 1 ? '' : 'es'} de {servicios} servicio{servicios === 1 ? '' : 's'}
            </p>
          </>
        )}
      </Tarjeta>

      <ModalEditarPrecio
        plan={editando}
        onCerrar={() => setEditando(null)}
        onGuardado={() => {
          setEditando(null);
          refetch();
        }}
      />
    </div>
  );
}

/** PUT /admin/planes/:id — body: { precio, duracion_dias }. Afecta solo a pedidos NUEVOS (cada pedido guarda su precio). */
function ModalEditarPrecio({ plan, onCerrar, onGuardado }) {
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!plan) return;
    setPrecio(String(plan.precio));
    setDuracion(String(plan.duracion_dias));
    setError(null);
  }, [plan]);

  if (!plan) return null;

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await serviciosApi.actualizarPlan(plan.id, { precio: Number(precio), duracion_dias: Number(duracion) });
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el precio.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={!!plan}
      titulo={`Editar precio · ${plan.servicio_nombre}`}
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-precio" cargando={cargando}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id="form-editar-precio" onSubmit={enviar} className="space-y-4">
        <Campo
          etiqueta="Precio (S/)"
          name="precio"
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
          autoFocus
        />
        <Campo
          etiqueta="Duración (días)"
          name="duracion_dias"
          type="number"
          min="1"
          step="1"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          required
        />
        <p className="text-xs text-texto-suave">
          Precio actual: {moneda(plan.precio)} por {plan.duracion_dias} días. El cambio aplica solo a pedidos nuevos: los
          pedidos existentes conservan el precio con el que se crearon.
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
