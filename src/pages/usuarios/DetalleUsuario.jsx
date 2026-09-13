/**
 * pages/usuarios/DetalleUsuario.jsx  (Fase 7)
 * -----------------------------------------
 * Detalle de una cuenta del panel: datos + edición (PUT
 * /admin/usuarios/:id), activar/desactivar (DialogoConfirmacion,
 * mismo patrón que ControlEstado en DetalleCliente.jsx -- el backend
 * bloquea desactivar la propia cuenta con 400, aquí se refleja
 * deshabilitando el botón para no ofrecer una acción que sabemos que
 * fallará), restablecer contraseña, y pestañas Pedidos gestionados /
 * Pagos registrados, cada una sobre su endpoint ya existente en
 * api/usuarios.js.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../auth/useAuth';
import * as usuariosApi from '../../api/usuarios';
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
import { COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda } from '../../utils/formato';

const COLOR_ROL = { administrador: 'blue', vendedor: 'gray' };

const PESTANAS = [
  { clave: 'pedidos', titulo: 'Pedidos gestionados' },
  { clave: 'pagos', titulo: 'Pagos registrados' },
];

export function DetalleUsuario() {
  const { id } = useParams();
  const { admin } = useAuth();
  const { data: usuario, cargando, error, refetch } = useApi(() => usuariosApi.detalle(id), [id]);

  const [modalEditar, setModalEditar] = useState(false);
  const [modalPassword, setModalPassword] = useState(false);
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [pestana, setPestana] = useState('pedidos');

  if (error) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoError error={error} onReintentar={refetch} />
      </div>
    );
  }

  if (cargando && !usuario) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <EstadoCarga />
      </div>
    );
  }

  if (!usuario) return null;

  const esPropiaCuenta = admin?.id === usuario.id;

  return (
    <div className="space-y-4">
      <BotonVolver />

      <Tarjeta
        titulo="Datos del usuario"
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setModalEditar(true)}>
            Editar datos
          </Boton>
        }
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Nombre" valor={usuario.nombre} />
          <Dato etiqueta="Usuario" valor={usuario.usuario} />
          <Dato etiqueta="Rol" valor={<Etiqueta color={COLOR_ROL[usuario.rol]}>{humanizar(usuario.rol)}</Etiqueta>} />
          <Dato
            etiqueta="Estado"
            valor={<Etiqueta color={usuario.activo ? 'green' : 'gray'}>{usuario.activo ? 'Activo' : 'Inactivo'}</Etiqueta>}
          />
          <Dato etiqueta="Creado" valor={fecha(usuario.fecha_creacion)} />
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-borde pt-4">
          <Boton variante="secundario" tamano="md" onClick={() => setModalPassword(true)}>
            Restablecer contraseña
          </Boton>
          <Boton
            variante={usuario.activo ? 'peligro' : 'primario'}
            tamano="md"
            disabled={usuario.activo && esPropiaCuenta}
            onClick={() => setConfirmandoEstado(true)}
          >
            {usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
          </Boton>
          {usuario.activo && esPropiaCuenta && (
            <p className="text-xs text-texto-suave">No puedes desactivar tu propia cuenta.</p>
          )}
        </div>

        <DialogoConfirmacion
          abierto={confirmandoEstado}
          titulo={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
          mensaje={
            usuario.activo
              ? `¿Desactivar a "${usuario.nombre}"? No podrá iniciar sesión en el panel hasta que se reactive.`
              : `¿Reactivar a "${usuario.nombre}"? Podrá volver a iniciar sesión en el panel.`
          }
          textoConfirmar={usuario.activo ? 'Sí, desactivar' : 'Sí, activar'}
          variante={usuario.activo ? 'peligro' : 'primario'}
          onConfirmar={async () => {
            if (usuario.activo) await usuariosApi.desactivar(usuario.id);
            else await usuariosApi.activar(usuario.id);
            refetch();
          }}
          onCerrar={() => setConfirmandoEstado(false)}
        />
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex gap-1 border-b border-borde">
          {PESTANAS.map((p) => (
            <button
              key={p.clave}
              onClick={() => setPestana(p.clave)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                pestana === p.clave
                  ? 'border-b-2 border-marca-500 text-marca-500'
                  : 'text-texto-suave hover:text-texto'
              }`}
            >
              {p.titulo}
            </button>
          ))}
        </div>

        {pestana === 'pedidos' && <PestanaPedidosGestionados usuarioId={id} />}
        {pestana === 'pagos' && <PestanaPagosRegistrados usuarioId={id} />}
      </Tarjeta>

      <ModalEditarUsuario
        abierto={modalEditar}
        usuario={usuario}
        onCerrar={() => setModalEditar(false)}
        onGuardado={() => {
          setModalEditar(false);
          refetch();
        }}
      />
      <ModalRestablecerPassword abierto={modalPassword} usuarioId={usuario.id} onCerrar={() => setModalPassword(false)} />
    </div>
  );

  function BotonVolver() {
    return (
      <Link to="/usuarios" className="text-sm font-medium text-marca-500 hover:underline">
        ← Volver a usuarios
      </Link>
    );
  }
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-texto">{valor ?? '—'}</dd>
    </div>
  );
}

/** PUT /admin/usuarios/:id — body: { nombre?, usuario? }. No cambia rol ni password. */
function ModalEditarUsuario({ abierto, usuario, onCerrar, onGuardado }) {
  const [campos, setCampos] = useState(() => ({ nombre: usuario.nombre || '', usuario: usuario.usuario || '' }));
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
      await usuariosApi.actualizar(usuario.id, {
        nombre: campos.nombre.trim(),
        usuario: campos.usuario.trim(),
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
      titulo="Editar usuario"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-usuario" cargando={cargando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-editar-usuario" onSubmit={enviar} className="space-y-4">
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <Campo etiqueta="Usuario" name="usuario" value={campos.usuario} onChange={actualizar('usuario')} required />
        <p className="text-xs text-texto-suave">El rol y la contraseña no se cambian aquí.</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

/** PUT /admin/usuarios/:id/restablecer-password — body: { nuevaPassword } (mín. 6 caracteres). */
function ModalRestablecerPassword({ abierto, usuarioId, onCerrar }) {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  function cerrar() {
    setNuevaPassword('');
    setConfirmacion('');
    setError(null);
    setExito(false);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    if (nuevaPassword !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await usuariosApi.restablecerPassword(usuarioId, nuevaPassword);
      setExito(true);
    } catch (err) {
      setError(err?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Restablecer contraseña"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        exito ? (
          <Boton onClick={cerrar}>Cerrar</Boton>
        ) : (
          <>
            <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
              Cancelar
            </Boton>
            <Boton type="submit" form="form-restablecer-password" cargando={cargando}>
              Restablecer
            </Boton>
          </>
        )
      }
    >
      {exito ? (
        <p className="text-sm text-texto-suave">Contraseña restablecida correctamente.</p>
      ) : (
        <form id="form-restablecer-password" onSubmit={enviar} className="space-y-4">
          <Campo
            etiqueta="Nueva contraseña"
            name="nuevaPassword"
            type="password"
            minLength={6}
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            required
            autoFocus
          />
          <Campo
            etiqueta="Confirmar contraseña"
            name="confirmacion"
            type="password"
            minLength={6}
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}
    </Modal>
  );
}

/** GET /admin/usuarios/:id/pedidos — pedidos que este usuario aprobó (pedidos.aprobado_por). */
function PestanaPedidosGestionados({ usuarioId }) {
  const { data, cargando, error, refetch } = useApi(() => usuariosApi.pedidosGestionados(usuarioId), [usuarioId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pedidos" descripcion="Este usuario no ha gestionado ningún pedido." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'cliente_nombre', titulo: 'Cliente' },
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'precio_pagado', titulo: 'Precio', render: (f) => moneda(f.precio_pagado) },
        {
          clave: 'estado',
          titulo: 'Estado',
          render: (f) => <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
        },
        { clave: 'fecha_pago', titulo: 'Aprobado', render: (f) => fecha(f.fecha_pago) },
      ]}
    />
  );
}

/** GET /admin/usuarios/:id/pagos — pagos que este usuario registró (pagos.registrado_por). */
function PestanaPagosRegistrados({ usuarioId }) {
  const { data, cargando, error, refetch } = useApi(() => usuariosApi.pagosRegistrados(usuarioId), [usuarioId]);
  const filas = Array.isArray(data) ? data : [];

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;
  if (filas.length === 0) return <EstadoVacio titulo="Sin pagos" descripcion="Este usuario no ha registrado ningún pago." />;

  return (
    <Tabla
      claveFila={(f) => f.id}
      filas={filas}
      columnas={[
        { clave: 'cliente_nombre', titulo: 'Cliente' },
        { clave: 'servicio_nombre', titulo: 'Servicio' },
        { clave: 'monto', titulo: 'Monto', render: (f) => moneda(f.monto) },
        { clave: 'tipo_pago', titulo: 'Tipo', render: (f) => humanizar(f.tipo_pago) },
        { clave: 'metodo', titulo: 'Método', render: (f) => f.metodo || '—' },
        { clave: 'fecha_registro', titulo: 'Registrado', render: (f) => fechaHora(f.fecha_registro) },
      ]}
    />
  );
}
