/**
 * pages/inventario/ListaInventario.jsx
 * -----------------------------------------
 * Fase 1: solo tipo_gestion='perfil' (Netflix, Disney+, Max, Amazon
 * Prime Video). Filtro por servicio/estado (servidor) + búsqueda por
 * cuenta/perfil/proveedor (cliente, sobre la lista ya cargada -- mismo
 * criterio que ListaClientes.jsx, el backend no expone búsqueda de
 * texto en este endpoint). Alta vía modal: servicio + identificador de
 * la cuenta + contraseña + número de perfil + costo/fechas/proveedor
 * opcionales. Sin detalle por id -- mismo criterio que
 * Auditoría/Configuración (no hay un "detalle" navegable propio, solo
 * esta lista).
 */
import { useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as inventarioApi from '../../api/inventario';
import * as serviciosApi from '../../api/servicios';
import {
  Tarjeta,
  Tabla,
  Boton,
  Campo,
  Selector,
  Etiqueta,
  Modal,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import { COLOR_ESTADO_INVENTARIO } from '../../utils/constantes';
import { fecha, humanizar, moneda } from '../../utils/formato';

const ESTADOS_INVENTARIO = ['disponible', 'asignado', 'vencido', 'bloqueado'];

export function ListaInventario() {
  const [servicioFiltro, setServicioFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: servicios } = useApi(() => serviciosApi.listar(), []);
  const { data, cargando, error, refetch } = useApi(
    () => inventarioApi.listar({ servicio_id: servicioFiltro || undefined, estado: estadoFiltro || undefined }),
    [servicioFiltro, estadoFiltro]
  );

  const filas = Array.isArray(data) ? data : [];
  const opcionesServicio = (servicios || []).filter((s) => s.activo).map((s) => ({ valor: s.id, texto: s.nombre }));

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((f) =>
      [f.identificador_cuenta, f.numero_perfil, f.proveedor, f.servicio_nombre].some(
        (v) => v && String(v).toLowerCase().includes(texto)
      )
    );
  }, [filas, busqueda]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-texto">Inventario</h1>
          <p className="text-sm text-texto-suave">
            Perfiles/cuentas vendibles — Fase 1: Netflix, Disney+, Max, Amazon Prime Video
          </p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo perfil</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Cuenta, perfil o proveedor…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <Selector
            etiqueta="Servicio"
            name="servicio"
            placeholder="Todos"
            opciones={opcionesServicio}
            value={servicioFiltro}
            onChange={(e) => setServicioFiltro(e.target.value)}
            className="sm:w-56"
          />
          <Selector
            etiqueta="Estado"
            name="estado"
            placeholder="Todos"
            opciones={ESTADOS_INVENTARIO.map((e) => ({ valor: e, texto: humanizar(e) }))}
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
            titulo="Sin inventario"
            descripcion={
              busqueda || servicioFiltro || estadoFiltro
                ? 'Nada coincide con el filtro actual.'
                : 'Todavía no se cargó ningún perfil. Usa "+ Nuevo perfil".'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            columnas={[
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              { clave: 'identificador_cuenta', titulo: 'Cuenta', render: (f) => f.identificador_cuenta || '—' },
              { clave: 'numero_perfil', titulo: 'Perfil', render: (f) => f.numero_perfil || '—' },
              { clave: 'costo', titulo: 'Costo', render: (f) => (f.costo != null ? moneda(f.costo) : '—') },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (f) => <Etiqueta color={COLOR_ESTADO_INVENTARIO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
              },
              { clave: 'pedido_id_actual', titulo: 'Pedido', render: (f) => (f.pedido_id_actual ? `#${f.pedido_id_actual}` : '—') },
              { clave: 'fecha_vence', titulo: 'Vence (proveedor)', render: (f) => fecha(f.fecha_vence) },
            ]}
          />
        )}
      </Tarjeta>

      <ModalNuevoInventario
        opcionesServicio={opcionesServicio}
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

/** POST /admin/inventario — Fase 1: tipo_gestion siempre 'perfil'. */
function ModalNuevoInventario({ opcionesServicio, abierto, onCerrar, onCreado }) {
  const [servicioId, setServicioId] = useState('');
  const [identificadorCuenta, setIdentificadorCuenta] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [numeroPerfil, setNumeroPerfil] = useState('');
  const [pinPerfil, setPinPerfil] = useState('');
  const [costo, setCosto] = useState('');
  const [fechaVence, setFechaVence] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  function limpiar() {
    setServicioId('');
    setIdentificadorCuenta('');
    setContrasena('');
    setNumeroPerfil('');
    setPinPerfil('');
    setCosto('');
    setFechaVence('');
    setProveedor('');
    setNotasInternas('');
    setError(null);
  }

  function cerrar() {
    limpiar();
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await inventarioApi.crear({
        servicio_id: Number(servicioId),
        tipo_gestion: 'perfil',
        identificador_cuenta: identificadorCuenta.trim(),
        contrasena,
        numero_perfil: numeroPerfil.trim() || undefined,
        pin_perfil: pinPerfil.trim() || undefined,
        costo: costo ? Number(costo) : undefined,
        fecha_vence: fechaVence || undefined,
        proveedor: proveedor.trim() || undefined,
        notas_internas: notasInternas.trim() || undefined,
      });
      cerrar();
      onCreado();
    } catch (err) {
      setError(err?.message || 'No se pudo crear el perfil de inventario.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo perfil de inventario"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-nuevo-inventario" cargando={cargando} disabled={!servicioId || !identificadorCuenta || !contrasena}>
            Crear
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-inventario" onSubmit={enviar} className="space-y-4">
        <Selector
          etiqueta="Servicio"
          name="servicio"
          placeholder="Selecciona un servicio…"
          opciones={opcionesServicio}
          value={servicioId}
          onChange={(e) => setServicioId(e.target.value)}
          required
        />
        <Campo
          etiqueta="Correo/usuario de la cuenta"
          name="identificador_cuenta"
          value={identificadorCuenta}
          onChange={(e) => setIdentificadorCuenta(e.target.value)}
          required
          autoFocus
        />
        <Campo
          etiqueta="Contraseña"
          name="contrasena"
          type="text"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
        />
        <Campo
          etiqueta="Número de perfil"
          name="numero_perfil"
          placeholder="1, 2, 3…"
          value={numeroPerfil}
          onChange={(e) => setNumeroPerfil(e.target.value)}
        />
        <Campo
          etiqueta="PIN del perfil (opcional)"
          name="pin_perfil"
          value={pinPerfil}
          onChange={(e) => setPinPerfil(e.target.value)}
        />
        <Campo
          etiqueta="Costo (opcional)"
          name="costo"
          type="number"
          min="0"
          step="0.01"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
        />
        <Campo
          etiqueta="Vence ante el proveedor (opcional)"
          name="fecha_vence"
          type="date"
          value={fechaVence}
          onChange={(e) => setFechaVence(e.target.value)}
        />
        <Campo
          etiqueta="Proveedor (opcional)"
          name="proveedor"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-texto-suave">Notas internas (opcional)</span>
          <textarea
            className="w-full rounded-lg border border-borde bg-superficie-alta px-3 py-2 text-sm text-texto outline-none transition placeholder:text-texto-suave/60 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
            rows={3}
            value={notasInternas}
            onChange={(e) => setNotasInternas(e.target.value)}
          />
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
