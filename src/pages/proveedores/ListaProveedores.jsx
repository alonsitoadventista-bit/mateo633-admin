/**
 * pages/proveedores/ListaProveedores.jsx  (Fase 2 del módulo Inventario)
 * -----------------------------------------
 * Lista completa (GET /admin/proveedores -- incluye inactivos).
 * Búsqueda por nombre/contacto (cliente, sobre la lista ya cargada,
 * mismo criterio que ListaClientes.jsx/ListaServicios.jsx). Alta vía
 * modal (POST /admin/proveedores). Sin detalle por id -- mismo criterio
 * que Auditoría/Configuración/Inventario: activar/desactivar es una
 * acción inline en la fila, no amerita una pantalla propia.
 *
 * Todavía NO conectado a ListaInventario.jsx (el campo "Proveedor" del
 * alta de inventario sigue siendo texto libre) -- esa integración es un
 * paso aparte, deliberadamente no incluido en esta fase para no afectar
 * el flujo de inventario ya en producción.
 */
import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as proveedoresApi from '../../api/proveedores';
import { Tarjeta, Tabla, Boton, Campo, Etiqueta, Modal, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';

const CAMPOS_VACIOS = { nombre: '', contacto: '', notas: '' };

export function ListaProveedores() {
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null);

  const { data, cargando, error, refetch } = useApi(() => proveedoresApi.listar(), []);
  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((p) =>
      [p.nombre, p.contacto].some((v) => v && String(v).toLowerCase().includes(texto))
    );
  }, [filas, busqueda]);

  async function alternarActivo(proveedor) {
    setCambiandoId(proveedor.id);
    try {
      if (proveedor.activo) {
        await proveedoresApi.desactivar(proveedor.id);
      } else {
        await proveedoresApi.activar(proveedor.id);
      }
      refetch();
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-texto">Proveedores</h1>
          <p className="text-sm text-texto-suave">Proveedores reales de las cuentas del inventario (costo/contacto)</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo proveedor</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Nombre o contacto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
        </div>

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : filasFiltradas.length === 0 ? (
          <EstadoVacio
            titulo="Sin proveedores"
            descripcion={busqueda ? 'Nada coincide con el filtro actual.' : 'Todavía no se cargó ningún proveedor.'}
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            columnas={[
              { clave: 'nombre', titulo: 'Nombre' },
              { clave: 'contacto', titulo: 'Contacto', render: (f) => f.contacto || '—' },
              { clave: 'notas', titulo: 'Notas', render: (f) => f.notas || '—' },
              {
                clave: 'activo',
                titulo: 'Estado',
                render: (f) => <Etiqueta color={f.activo ? 'green' : 'gray'}>{f.activo ? 'Activo' : 'Inactivo'}</Etiqueta>,
              },
              {
                clave: 'acciones',
                titulo: '',
                render: (f) => (
                  <Boton
                    variante="secundario"
                    onClick={() => alternarActivo(f)}
                    cargando={cambiandoId === f.id}
                  >
                    {f.activo ? 'Desactivar' : 'Activar'}
                  </Boton>
                ),
              },
            ]}
          />
        )}
      </Tarjeta>

      <ModalNuevoProveedor
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={() => {
          setModalAbierto(false);
          refetch();
        }}
      />
    </div>
  );
}

/** POST /admin/proveedores — body: { nombre, contacto?, notas? }. */
function ModalNuevoProveedor({ abierto, onCerrar, onCreado }) {
  const [campos, setCampos] = useState(CAMPOS_VACIOS);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function actualizar(campo) {
    return (e) => setCampos((c) => ({ ...c, [campo]: e.target.value }));
  }

  function cerrar() {
    setCampos(CAMPOS_VACIOS);
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await proveedoresApi.crear({
        nombre: campos.nombre.trim(),
        contacto: campos.contacto.trim() || undefined,
        notas: campos.notas.trim() || undefined,
      });
      cerrar();
      onCreado();
    } catch (err) {
      setError(err?.message || 'No se pudo crear el proveedor.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo proveedor"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-nuevo-proveedor" cargando={cargando} disabled={!campos.nombre.trim()}>
            Crear proveedor
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-proveedor" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo
          etiqueta="Contacto (opcional)"
          name="contacto"
          placeholder="Celular/WhatsApp"
          value={campos.contacto}
          onChange={actualizar('contacto')}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-texto-suave">Notas (opcional)</span>
          <textarea
            className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition placeholder:text-texto-suave/60 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
            rows={3}
            value={campos.notas}
            onChange={actualizar('notas')}
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
