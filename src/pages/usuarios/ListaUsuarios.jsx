/**
 * pages/usuarios/ListaUsuarios.jsx  (Fase 7)
 * -----------------------------------------
 * Cuentas del panel (GET /admin/usuarios -- incluye inactivas).
 * Búsqueda por nombre/usuario (cliente, sobre la lista ya cargada,
 * mismo criterio que el resto del panel) + filtros por rol y por
 * estado (activo/inactivo -- boolean, mismo criterio que
 * ListaServicios.jsx). Alta vía modal (POST /admin/usuarios). Cada
 * fila navega al detalle (/usuarios/:id).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as usuariosApi from '../../api/usuarios';
import { Tarjeta, Tabla, Boton, Campo, Selector, Etiqueta, Modal, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { ROLES_ADMIN } from '../../utils/constantes';
import { fecha, humanizar } from '../../utils/formato';

const OPCIONES_ESTADO = [
  { valor: 'true', texto: 'Activo' },
  { valor: 'false', texto: 'Inactivo' },
];

const COLOR_ROL = { administrador: 'blue', vendedor: 'gray' };

const CAMPOS_VACIOS = { nombre: '', usuario: '', password: '', rol: 'vendedor' };

export function ListaUsuarios() {
  const navigate = useNavigate();
  const [rolFiltro, setRolFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data, cargando, error, refetch } = useApi(() => usuariosApi.listar(), []);
  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    let resultado = filas;
    if (rolFiltro) resultado = resultado.filter((u) => u.rol === rolFiltro);
    if (estadoFiltro) resultado = resultado.filter((u) => String(u.activo) === estadoFiltro);
    const texto = busqueda.trim().toLowerCase();
    if (texto) {
      resultado = resultado.filter((u) => [u.nombre, u.usuario].some((v) => v && String(v).toLowerCase().includes(texto)));
    }
    return resultado;
  }, [filas, busqueda, rolFiltro, estadoFiltro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Vendedores</h1>
          <p className="text-sm text-slate-500">Cuentas del panel: administradores y vendedores</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo usuario</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Nombre o usuario…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <Selector
            etiqueta="Rol"
            name="rol"
            placeholder="Todos"
            opciones={ROLES_ADMIN.map((r) => ({ valor: r, texto: humanizar(r) }))}
            value={rolFiltro}
            onChange={(e) => setRolFiltro(e.target.value)}
            className="sm:w-44"
          />
          <Selector
            etiqueta="Estado"
            name="estado"
            placeholder="Todos"
            opciones={OPCIONES_ESTADO}
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="sm:w-40"
          />
        </div>

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : filasFiltradas.length === 0 ? (
          <EstadoVacio
            titulo="Sin usuarios"
            descripcion={
              busqueda || rolFiltro || estadoFiltro ? 'Nada coincide con el filtro actual.' : 'Aún no hay usuarios registrados.'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            onFila={(f) => navigate(`/usuarios/${f.id}`)}
            columnas={[
              { clave: 'nombre', titulo: 'Nombre' },
              { clave: 'usuario', titulo: 'Usuario' },
              {
                clave: 'rol',
                titulo: 'Rol',
                render: (f) => <Etiqueta color={COLOR_ROL[f.rol]}>{humanizar(f.rol)}</Etiqueta>,
              },
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

      <ModalNuevoUsuario
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

/** POST /admin/usuarios — body: { nombre, usuario, password, rol }. */
function ModalNuevoUsuario({ abierto, onCerrar, onCreado }) {
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
      await usuariosApi.crear({
        nombre: campos.nombre.trim(),
        usuario: campos.usuario.trim(),
        password: campos.password,
        rol: campos.rol,
      });
      cerrar();
      onCreado();
    } catch (err) {
      setError(err?.message || 'No se pudo crear el usuario.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo usuario"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-nuevo-usuario" cargando={cargando}>
            Crear usuario
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-usuario" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo etiqueta="Usuario" name="usuario" value={campos.usuario} onChange={actualizar('usuario')} required />
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          minLength={6}
          value={campos.password}
          onChange={actualizar('password')}
          required
        />
        <Selector
          etiqueta="Rol"
          name="rol"
          opciones={ROLES_ADMIN.map((r) => ({ valor: r, texto: humanizar(r) }))}
          value={campos.rol}
          onChange={actualizar('rol')}
          required
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
