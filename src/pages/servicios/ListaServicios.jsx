/**
 * pages/servicios/ListaServicios.jsx  (Fase 6)
 * -----------------------------------------
 * Catálogo completo (GET /admin/servicios -- incluye inactivos).
 * Búsqueda por nombre/categoría (cliente, sobre la lista ya cargada,
 * mismo criterio que ListaClientes.jsx/ListaPedidos.jsx) + filtro por
 * estado (activo/inactivo -- boolean, no hay enum de estados como en
 * Clientes/Pedidos, así que se filtra client-side sobre el mismo
 * booleano `activo` que ya trae cada fila). Alta vía modal (POST
 * /admin/servicios). Cada fila navega al detalle (/servicios/:id).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as serviciosApi from '../../api/servicios';
import { urlArchivo } from '../../api/client';
import { Tarjeta, Tabla, Boton, Campo, Selector, Etiqueta, Modal, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { fecha } from '../../utils/formato';

const OPCIONES_ESTADO = [
  { valor: 'true', texto: 'Activo' },
  { valor: 'false', texto: 'Inactivo' },
];

const CAMPOS_VACIOS = { nombre: '', categoria: '', descripcion: '' };

export function ListaServicios() {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data, cargando, error, refetch } = useApi(() => serviciosApi.listar(), []);
  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    let resultado = filas;
    if (estadoFiltro) {
      resultado = resultado.filter((s) => String(s.activo) === estadoFiltro);
    }
    const texto = busqueda.trim().toLowerCase();
    if (texto) {
      resultado = resultado.filter((s) =>
        [s.nombre, s.categoria].some((v) => v && String(v).toLowerCase().includes(texto))
      );
    }
    return resultado;
  }, [filas, busqueda, estadoFiltro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Servicios y planes</h1>
          <p className="text-sm text-slate-500">Catálogo de servicios de streaming, con sus planes de duración/precio</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo servicio</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Nombre o categoría…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <Selector
            etiqueta="Estado"
            name="estado"
            placeholder="Todos"
            opciones={OPCIONES_ESTADO}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="sm:w-48"
          />
        </div>

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : filasFiltradas.length === 0 ? (
          <EstadoVacio
            titulo="Sin servicios"
            descripcion={
              busqueda || estadoFiltro ? 'Nada coincide con el filtro actual.' : 'Aún no hay servicios registrados.'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            onFila={(f) => navigate(`/servicios/${f.id}`)}
            columnas={[
              {
                clave: 'nombre',
                titulo: 'Servicio',
                render: (f) => (
                  <div className="flex items-center gap-3">
                    {f.imagen_url ? (
                      <img
                        src={urlArchivo(f.imagen_url)}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                        —
                      </span>
                    )}
                    <span className="font-medium text-slate-800">{f.nombre}</span>
                  </div>
                ),
              },
              { clave: 'categoria', titulo: 'Categoría', render: (f) => f.categoria || '—' },
              {
                clave: 'activo',
                titulo: 'Estado',
                render: (f) => <Etiqueta color={f.activo ? 'green' : 'gray'}>{f.activo ? 'Activo' : 'Inactivo'}</Etiqueta>,
              },
              { clave: 'fecha_creacion', titulo: 'Creado', render: (f) => fecha(f.fecha_creacion) },
            ]}
          />
        )}
      </Tarjeta>

      <ModalNuevoServicio
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

/** POST /admin/servicios — body: { nombre, descripcion?, categoria? }. */
function ModalNuevoServicio({ abierto, onCerrar, onCreado }) {
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
      await serviciosApi.crear({
        nombre: campos.nombre.trim(),
        categoria: campos.categoria.trim() || undefined,
        descripcion: campos.descripcion.trim() || undefined,
      });
      cerrar();
      onCreado();
    } catch (err) {
      setError(err?.message || 'No se pudo crear el servicio.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo servicio"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-nuevo-servicio" cargando={cargando}>
            Crear servicio
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-servicio" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo
          etiqueta="Categoría (opcional)"
          name="categoria"
          placeholder="Streaming, Anime, TV…"
          value={campos.categoria}
          onChange={actualizar('categoria')}
        />
        <Campo
          etiqueta="Descripción (opcional)"
          name="descripcion"
          value={campos.descripcion}
          onChange={actualizar('descripcion')}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
