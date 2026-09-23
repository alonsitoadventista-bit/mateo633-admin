/**
 * pages/servicios/DetalleServicio.jsx  (Fase 6)
 * -----------------------------------------
 * Detalle de un servicio: datos + edición (PUT /admin/servicios/:id),
 * imagen (POST/DELETE /admin/servicios/:id/imagen), activar/desactivar
 * (DialogoConfirmacion, mismo patrón que ControlEstado en
 * DetalleCliente.jsx) y gestión completa de sus planes -- todos,
 * incluidos inactivos, cada acción sobre su endpoint ya existente en
 * api/servicios.js.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as serviciosApi from '../../api/servicios';
import { urlArchivo } from '../../api/client';
import {
  Tarjeta,
  Tabla,
  Boton,
  Campo,
  Etiqueta,
  Modal,
  DialogoConfirmacion,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import { fecha, moneda } from '../../utils/formato';

export function DetalleServicio() {
  const { id } = useParams();
  const { data: servicio, cargando, error, refetch } = useApi(() => serviciosApi.detalle(id), [id]);

  const [modalEditar, setModalEditar] = useState(false);
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [modalPlan, setModalPlan] = useState(null); // null | 'nuevo' | plan a editar
  const [confirmandoPlan, setConfirmandoPlan] = useState(null); // { plan, accion: 'activar'|'desactivar' }

  if (error) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoError error={error} onReintentar={refetch} />
      </div>
    );
  }

  if (cargando && !servicio) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!servicio) return null;

  const planes = servicio.planes || [];

  return (
    <div className="space-y-4">
      <BotonVolver />

      <Tarjeta
        titulo="Datos del servicio"
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setModalEditar(true)}>
            Editar datos
          </Boton>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <ImagenServicio servicio={servicio} onCambiada={refetch} />

          <dl className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta="Nombre" valor={servicio.nombre} />
            <Dato etiqueta="Categoría" valor={servicio.categoria || '—'} />
            <Dato etiqueta="Creado" valor={fecha(servicio.fecha_creacion)} />
            <Dato etiqueta="Descripción" valor={servicio.descripcion || '—'} />
            <Dato
              etiqueta="Estado"
              valor={<Etiqueta color={servicio.activo ? 'green' : 'gray'}>{servicio.activo ? 'Activo' : 'Inactivo'}</Etiqueta>}
            />
          </dl>
        </div>

        <div className="mt-4 border-t border-borde pt-4">
          <Boton
            variante={servicio.activo ? 'peligro' : 'primario'}
            tamano="md"
            onClick={() => setConfirmandoEstado(true)}
          >
            {servicio.activo ? 'Desactivar servicio' : 'Activar servicio'}
          </Boton>
        </div>

        <DialogoConfirmacion
          abierto={confirmandoEstado}
          titulo={servicio.activo ? 'Desactivar servicio' : 'Activar servicio'}
          mensaje={
            servicio.activo
              ? `¿Desactivar "${servicio.nombre}"? Dejará de aparecer en el catálogo de la app, pero no se borra ni afecta pedidos existentes.`
              : `¿Reactivar "${servicio.nombre}"? Volverá a aparecer en el catálogo de la app.`
          }
          textoConfirmar={servicio.activo ? 'Sí, desactivar' : 'Sí, activar'}
          variante={servicio.activo ? 'peligro' : 'primario'}
          onConfirmar={async () => {
            if (servicio.activo) await serviciosApi.desactivar(servicio.id);
            else await serviciosApi.activar(servicio.id);
            refetch();
          }}
          onCerrar={() => setConfirmandoEstado(false)}
        />
      </Tarjeta>

      <Tarjeta
        titulo="Planes"
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setModalPlan('nuevo')}>
            + Nuevo plan
          </Boton>
        }
      >
        {planes.length === 0 ? (
          <EstadoVacio titulo="Sin planes" descripcion="Este servicio todavía no tiene planes de duración/precio." />
        ) : (
          <Tabla
            claveFila={(p) => p.id}
            filas={planes}
            columnas={[
              { clave: 'duracion_dias', titulo: 'Duración', render: (p) => `${p.duracion_dias} días` },
              { clave: 'precio', titulo: 'Precio', render: (p) => moneda(p.precio) },
              {
                clave: 'activo',
                titulo: 'Estado',
                render: (p) => <Etiqueta color={p.activo ? 'green' : 'gray'}>{p.activo ? 'Activo' : 'Inactivo'}</Etiqueta>,
              },
              {
                clave: 'acciones',
                titulo: '',
                render: (p) => (
                  <div className="flex gap-2">
                    <Boton variante="secundario" tamano="sm" onClick={() => setModalPlan(p)}>
                      Editar
                    </Boton>
                    <Boton
                      variante={p.activo ? 'peligro' : 'primario'}
                      tamano="sm"
                      onClick={() => setConfirmandoPlan({ plan: p, accion: p.activo ? 'desactivar' : 'activar' })}
                    >
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </Boton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Tarjeta>

      <ModalEditarServicio
        abierto={modalEditar}
        servicio={servicio}
        onCerrar={() => setModalEditar(false)}
        onGuardado={() => {
          setModalEditar(false);
          refetch();
        }}
      />

      <ModalPlan
        abierto={!!modalPlan}
        servicioId={servicio.id}
        plan={modalPlan === 'nuevo' ? null : modalPlan}
        onCerrar={() => setModalPlan(null)}
        onGuardado={() => {
          setModalPlan(null);
          refetch();
        }}
      />

      <DialogoConfirmacion
        abierto={!!confirmandoPlan}
        titulo={confirmandoPlan?.accion === 'desactivar' ? 'Desactivar plan' : 'Activar plan'}
        mensaje={
          confirmandoPlan?.accion === 'desactivar'
            ? `¿Desactivar el plan de ${confirmandoPlan?.plan.duracion_dias} días (${moneda(confirmandoPlan?.plan.precio)})? Dejará de ofrecerse en el catálogo.`
            : `¿Reactivar el plan de ${confirmandoPlan?.plan.duracion_dias} días (${moneda(confirmandoPlan?.plan.precio)})?`
        }
        textoConfirmar={confirmandoPlan?.accion === 'desactivar' ? 'Sí, desactivar' : 'Sí, activar'}
        variante={confirmandoPlan?.accion === 'desactivar' ? 'peligro' : 'primario'}
        onConfirmar={async () => {
          if (confirmandoPlan.accion === 'desactivar') await serviciosApi.desactivarPlan(confirmandoPlan.plan.id);
          else await serviciosApi.activarPlan(confirmandoPlan.plan.id);
          refetch();
        }}
        onCerrar={() => setConfirmandoPlan(null)}
      />
    </div>
  );

  function BotonVolver() {
    return (
      <Link to="/servicios" className="text-sm font-medium text-marca-500 hover:underline">
        ← Volver a servicios
      </Link>
    );
  }
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-texto">{valor}</dd>
    </div>
  );
}

/**
 * POST /admin/servicios/:id/imagen (multipart, campo "imagen", máx 3MB)
 * DELETE /admin/servicios/:id/imagen
 */
function ImagenServicio({ servicio, onCambiada }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmandoQuitar, setConfirmandoQuitar] = useState(false);
  const [error, setError] = useState(null);

  async function alSeleccionarArchivo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = ''; // permite volver a elegir el mismo archivo despues
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    try {
      await serviciosApi.subirImagen(servicio.id, archivo);
      onCambiada();
    } catch (err) {
      setError(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:w-40">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-borde bg-superficie-alta">
        {servicio.imagen_url ? (
          <img src={urlArchivo(servicio.imagen_url)} alt={servicio.nombre} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-texto-suave">Sin imagen</span>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={alSeleccionarArchivo} />
      <Boton variante="secundario" tamano="sm" cargando={subiendo} onClick={() => inputRef.current?.click()}>
        {servicio.imagen_url ? 'Reemplazar' : 'Subir imagen'}
      </Boton>
      {servicio.imagen_url && (
        <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmandoQuitar(true)}>
          Quitar imagen
        </Boton>
      )}
      {error && <p className="text-center text-xs text-red-400">{error}</p>}

      <DialogoConfirmacion
        abierto={confirmandoQuitar}
        titulo="Quitar imagen"
        mensaje={`¿Quitar la imagen de "${servicio.nombre}"? La app mostrará el placeholder por defecto.`}
        textoConfirmar="Sí, quitar"
        variante="peligro"
        onConfirmar={async () => {
          await serviciosApi.eliminarImagen(servicio.id);
          onCambiada();
        }}
        onCerrar={() => setConfirmandoQuitar(false)}
      />
    </div>
  );
}

/**
 * PUT /admin/servicios/:id — body parcial: { nombre?, descripcion?, categoria?, indicaciones_entrega? }.
 * indicaciones_entrega (migración 021): se envía SOLO en el mensaje final de
 * entrega de credenciales; vacío = ese servicio no lleva bloque de indicaciones.
 */
function ModalEditarServicio({ abierto, servicio, onCerrar, onGuardado }) {
  const [campos, setCampos] = useState(() => ({
    nombre: servicio.nombre || '',
    categoria: servicio.categoria || '',
    descripcion: servicio.descripcion || '',
    indicaciones_entrega: servicio.indicaciones_entrega || '',
  }));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function actualizar(campo) {
    return (e) => setCampos((c) => ({ ...c, [campo]: e.target.value }));
  }

  function cerrar() {
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await serviciosApi.actualizar(servicio.id, {
        nombre: campos.nombre.trim(),
        categoria: campos.categoria.trim(),
        descripcion: campos.descripcion.trim(),
        indicaciones_entrega: campos.indicaciones_entrega,
      });
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Editar servicio"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-servicio" cargando={cargando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-editar-servicio" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo etiqueta="Categoría" name="categoria" value={campos.categoria} onChange={actualizar('categoria')} />
        <Campo etiqueta="Descripción" name="descripcion" value={campos.descripcion} onChange={actualizar('descripcion')} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-texto-suave">
            Indicaciones de uso (solo se envían al entregar las credenciales)
          </span>
          <textarea
            className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition placeholder:text-texto-suave/60 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
            rows={8}
            value={campos.indicaciones_entrega}
            onChange={actualizar('indicaciones_entrega')}
            placeholder="Vacío = el mensaje de entrega de este servicio no lleva indicaciones."
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/**
 * POST /admin/servicios/:id/planes — body: { duracion_dias, precio }.
 * PUT  /admin/planes/:id           — body parcial: { duracion_dias?, precio? }.
 * Un solo modal cubre alta y edición, igual que el resto del panel
 * distingue por si `plan` viene null (nuevo) o con datos (editar).
 */
function ModalPlan({ abierto, servicioId, plan, onCerrar, onGuardado }) {
  const esNuevo = !plan;
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setDuracion(plan ? String(plan.duracion_dias) : '');
    setPrecio(plan ? String(plan.precio) : '');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, plan?.id]);

  function cerrar() {
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const datos = { duracion_dias: Number(duracion), precio: Number(precio) };
      if (esNuevo) await serviciosApi.crearPlan(servicioId, datos);
      else await serviciosApi.actualizarPlan(plan.id, datos);
      cerrar();
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el plan.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={esNuevo ? 'Nuevo plan' : 'Editar plan'}
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-plan" cargando={cargando}>
            {esNuevo ? 'Crear plan' : 'Guardar cambios'}
          </Boton>
        </>
      }
    >
      <form id="form-plan" onSubmit={enviar} className="space-y-4">
        <Campo
          etiqueta="Duración (días)"
          name="duracion_dias"
          type="number"
          min="1"
          step="1"
          value={duracion}
          onChange={(e) => setDuracion(e.target.value)}
          required
          autoFocus
        />
        <Campo
          etiqueta="Precio"
          name="precio"
          type="number"
          min="0"
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
