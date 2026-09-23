/**
 * pages/inventario/DetalleCuenta.jsx  (Fase 3A)
 * -----------------------------------------
 * Vista "Cuenta": todos los perfiles de una cuenta de servicio en una
 * grilla (nombre, cliente, WhatsApp, estado, candado, PIN), con edición
 * de perfil/PIN, confirmación de "PIN ajustado en la plataforma" e
 * historial de cambios. Ver docs/DISENO_INVENTARIO_REPOSICIONES.md §2-§3,
 * §7 (backend).
 *
 * Capacidad (migración 020): en servicios de capacidad fija (Netflix = 5)
 * los N espacios los crea el sistema y la capacidad no se edita por cuenta.
 *
 * El cliente y el WhatsApp NO se editan aquí: vienen en vivo del pedido
 * asignado (perfil -> pedido -> cliente). Los PIN y la contraseña solo
 * se traen del backend al pulsar "Ver secretos".
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as inventarioApi from '../../api/inventario';
import {
  Tarjeta,
  Tabla,
  Boton,
  Campo,
  Etiqueta,
  Modal,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
} from '../../components/ui';
import { COLOR_ESTADO_INVENTARIO } from '../../utils/constantes';
import { fecha, fechaHora, humanizar, moneda, whatsapp as formatoWhatsapp } from '../../utils/formato';

const TEXTO_EVENTO = {
  creado: 'Perfil creado',
  configurado: 'Datos del perfil cargados',
  asignado: 'Asignado a cliente',
  liberado: 'Liberado del pedido',
  habilitado: 'Vuelve a estar disponible',
  nombre_cambiado: 'Nombre cambiado',
  numero_cambiado: 'Número cambiado',
  pin_activado: 'Candado activado',
  pin_cambiado: 'PIN cambiado',
  pin_quitado: 'Candado quitado',
  pin_ajustado_en_plataforma: 'PIN ajustado en la plataforma',
  credenciales_actualizadas: 'Credenciales actualizadas',
  repuesto_desde: 'Repuesto desde otro perfil',
  repuesto_hacia: 'Repuesto hacia otro perfil',
  bloqueado: 'Bloqueado',
};

const textoEvento = (tipo) => TEXTO_EVENTO[tipo] || humanizar(tipo);

export function DetalleCuenta() {
  const { cuentaId } = useParams();
  const navigate = useNavigate();
  const [verSecretos, setVerSecretos] = useState(false);
  const { data, cargando, error, refetch } = useApi(
    () => inventarioApi.cuenta(cuentaId, verSecretos),
    [cuentaId, verSecretos]
  );
  const { data: historial, refetch: refetchHistorial } = useApi(() => inventarioApi.historialCuenta(cuentaId), [cuentaId]);

  const [perfilEditando, setPerfilEditando] = useState(null);
  const [perfilHistorial, setPerfilHistorial] = useState(null);
  const [modalCapacidad, setModalCapacidad] = useState(false);
  const [accionError, setAccionError] = useState(null);
  const [ocupado, setOcupado] = useState(null);

  function recargar() {
    refetch();
    refetchHistorial();
  }

  async function ejecutar(clave, fn) {
    setOcupado(clave);
    setAccionError(null);
    try {
      await fn();
      recargar();
    } catch (err) {
      setAccionError(err?.message || 'No se pudo completar la acción.');
    } finally {
      setOcupado(null);
    }
  }

  const volver = (
    <Boton variante="fantasma" tamano="sm" onClick={() => navigate('/inventario')}>
      ← Volver a Inventario
    </Boton>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {volver}
        <EstadoError error={error} onReintentar={refetch} />
      </div>
    );
  }
  if (cargando && !data) {
    return (
      <div className="space-y-4">
        {volver}
        <EstadoCarga />
      </div>
    );
  }
  if (!data) return null;

  const { cuenta, perfiles } = data;
  // Migración 020: 'perfil' (candado/PIN), 'cuenta_completa' (1 usuario) o 'miembro' (Apple TV+).
  const usaPines = (cuenta.tipo_espacio || 'perfil') === 'perfil';
  const tituloEspacios =
    { perfil: 'Perfiles', cuenta_completa: 'Usuario de la cuenta', miembro: 'Miembros' }[cuenta.tipo_espacio] || 'Perfiles';
  const pendientesAjuste = perfiles.filter((p) => p.pin_estado === 'pendiente_ajuste').length;
  // Capacidad efectiva: la FIJA del servicio (Netflix = 5) o la indicada en la cuenta.
  const faltanPerfiles = cuenta.capacidad ? Math.max(cuenta.capacidad - perfiles.length, 0) : 0;

  return (
    <div className="space-y-4">
      {volver}

      <Tarjeta
        titulo={`${cuenta.servicio_nombre} · ${cuenta.identificador_cuenta}`}
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={() => setVerSecretos((v) => !v)}>
            {verSecretos ? '🙈 Ocultar secretos' : '👁 Ver secretos'}
          </Boton>
        }
      >
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato etiqueta="Proveedor" valor={cuenta.proveedor_nombre || cuenta.proveedor || '—'} />
          <Dato
            etiqueta={tituloEspacios}
            valor={
              <span className="flex items-center gap-2">
                {perfiles.length}
                {cuenta.capacidad ? ` / ${cuenta.capacidad}` : ' (capacidad sin indicar)'}
                {cuenta.capacidad_fija ? (
                  <span className="text-xs text-texto-suave">· fijo por {cuenta.servicio_nombre}</span>
                ) : (
                  <button className="text-xs text-marca-500 hover:underline" onClick={() => setModalCapacidad(true)}>
                    editar
                  </button>
                )}
              </span>
            }
          />
          <Dato etiqueta="Costo" valor={cuenta.costo != null ? moneda(cuenta.costo) : '—'} />
          <Dato etiqueta="Vence (proveedor)" valor={fecha(cuenta.fecha_vence)} />
          <Dato
            etiqueta="Credenciales"
            valor={`v${cuenta.version_credenciales}${cuenta.credenciales_actualizadas_en ? ` · ${fecha(cuenta.credenciales_actualizadas_en)}` : ''}`}
          />
          {verSecretos && <Dato etiqueta="Contraseña" valor={<code>{cuenta.contrasena || '—'}</code>} />}
        </dl>

        {(pendientesAjuste > 0 || faltanPerfiles > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-borde pt-4">
            {pendientesAjuste > 0 && (
              <Etiqueta color="amber">⚠ {pendientesAjuste} perfil(es) con PIN pendiente de ajuste</Etiqueta>
            )}
            {faltanPerfiles > 0 && (
              <Boton
                variante="secundario"
                tamano="sm"
                cargando={ocupado === 'completar'}
                onClick={() => ejecutar('completar', () => inventarioApi.completarPerfiles(cuenta.id))}
              >
                + Crear los {faltanPerfiles} perfil(es) que faltan
              </Boton>
            )}
          </div>
        )}
        {accionError && <p className="mt-3 text-xs text-red-400">{accionError}</p>}
      </Tarjeta>

      <Tarjeta titulo={tituloEspacios}>
        {perfiles.length === 0 ? (
          <EstadoVacio titulo="Sin perfiles" descripcion="Indica la capacidad de la cuenta y crea sus perfiles." />
        ) : (
          <Tabla
            claveFila={(p) => p.id}
            filas={perfiles}
            columnas={[
              { clave: 'numero_perfil', titulo: '#', render: (p) => p.numero_perfil || '—' },
              { clave: 'nombre_perfil', titulo: 'Nombre', render: (p) => p.nombre_perfil || '—' },
              {
                clave: 'cliente_nombre',
                titulo: 'Cliente',
                render: (p) =>
                  p.pedido_id_actual ? (
                    <Link to={`/pedidos/${p.pedido_id_actual}`} className="text-marca-500 hover:underline">
                      {p.cliente_nombre || `Pedido #${p.pedido_id_actual}`}
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              { clave: 'cliente_whatsapp', titulo: 'WhatsApp', render: (p) => (p.cliente_whatsapp ? formatoWhatsapp(p.cliente_whatsapp) : '—') },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (p) => <Etiqueta color={COLOR_ESTADO_INVENTARIO[p.estado]}>{humanizar(p.estado)}</Etiqueta>,
              },
              ...(!usaPines
                ? []
                : [
              {
                clave: 'usa_pin',
                titulo: 'Candado',
                render: (p) => (
                  <span className="flex flex-wrap items-center gap-1">
                    {p.usa_pin ? 'Sí' : 'No'}
                    {p.pin_coincide_preferencia === false && (
                      <Etiqueta color="amber">
                        cliente pidió {p.preferencia_pin === 'con_pin' ? 'PIN' : 'sin candado'}
                      </Etiqueta>
                    )}
                  </span>
                ),
              },
              {
                clave: 'pin',
                titulo: 'PIN',
                render: (p) => (
                  <span className="flex flex-wrap items-center gap-1">
                    {!p.usa_pin ? '—' : verSecretos ? <code>{p.pin_perfil || '—'}</code> : '••••'}
                    {p.pin_estado === 'pendiente_ajuste' && <Etiqueta color="amber">⚠ pendiente de ajuste</Etiqueta>}
                  </span>
                ),
              },
                  ]),
              {
                clave: 'acciones',
                titulo: '',
                render: (p) => (
                  <div className="flex flex-wrap justify-end gap-1">
                    {p.pin_estado === 'pendiente_ajuste' && (
                      <Boton
                        tamano="sm"
                        cargando={ocupado === `ajuste-${p.id}`}
                        onClick={() => ejecutar(`ajuste-${p.id}`, () => inventarioApi.pinAjustado(p.id))}
                      >
                        Marcar ajustado
                      </Boton>
                    )}
                    <Boton variante="secundario" tamano="sm" onClick={() => setPerfilEditando(p)}>
                      Editar
                    </Boton>
                    <Boton variante="fantasma" tamano="sm" onClick={() => setPerfilHistorial(p)}>
                      Historial
                    </Boton>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Tarjeta>

      <Tarjeta titulo="Historial de la cuenta">
        {!Array.isArray(historial) || historial.length === 0 ? (
          <EstadoVacio titulo="Sin eventos" descripcion="Todavía no hay cambios registrados en los perfiles de esta cuenta." />
        ) : (
          <TablaEventos eventos={historial} conPerfil />
        )}
      </Tarjeta>

      <ModalEditarPerfil
        perfil={perfilEditando}
        usaPines={usaPines}
        onCerrar={() => setPerfilEditando(null)}
        onGuardado={() => {
          setPerfilEditando(null);
          recargar();
        }}
      />
      <ModalHistorialPerfil perfil={perfilHistorial} onCerrar={() => setPerfilHistorial(null)} />
      <ModalCapacidad
        abierto={modalCapacidad}
        cuenta={cuenta}
        onCerrar={() => setModalCapacidad(false)}
        onGuardado={() => {
          setModalCapacidad(false);
          recargar();
        }}
      />
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-texto-suave">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-texto">{valor}</dd>
    </div>
  );
}

function TablaEventos({ eventos, conPerfil = false }) {
  return (
    <Tabla
      claveFila={(e) => e.id}
      filas={eventos}
      columnas={[
        { clave: 'creado_en', titulo: 'Fecha', render: (e) => fechaHora(e.creado_en) },
        ...(conPerfil
          ? [{ clave: 'perfil', titulo: 'Perfil', render: (e) => [e.numero_perfil, e.nombre_perfil].filter(Boolean).join(' · ') || '—' }]
          : []),
        { clave: 'tipo', titulo: 'Evento', render: (e) => textoEvento(e.tipo) },
        { clave: 'cliente_nombre', titulo: 'Cliente', render: (e) => e.cliente_nombre || '—' },
        { clave: 'pedido_id', titulo: 'Pedido', render: (e) => (e.pedido_id ? `#${e.pedido_id}` : '—') },
        { clave: 'actor', titulo: 'Por', render: (e) => humanizar(e.actor_tipo || 'sistema') },
      ]}
    />
  );
}

/**
 * PUT /admin/inventario/:id — nombre, número, candado y PIN. Cualquier
 * cambio de candado/PIN deja el perfil "pendiente de ajuste" hasta
 * confirmar que se aplicó en la plataforma.
 */
function ModalEditarPerfil({ perfil, usaPines, onCerrar, onGuardado }) {
  const [nombre, setNombre] = useState('');
  const [numero, setNumero] = useState('');
  const [usaPin, setUsaPin] = useState(false);
  const [pin, setPin] = useState('');
  const [generar, setGenerar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [perfilCargado, setPerfilCargado] = useState(null);

  // Reinicia el formulario cada vez que se abre con otro perfil.
  if (perfil && perfil !== perfilCargado) {
    setPerfilCargado(perfil);
    setNombre(perfil.nombre_perfil || '');
    setNumero(perfil.numero_perfil || '');
    setUsaPin(Boolean(perfil.usa_pin));
    setPin('');
    setGenerar(false);
    setError(null);
  }
  if (!perfil && perfilCargado) setPerfilCargado(null);

  const pinInvalido = usaPin && !generar && pin !== '' && !/^[0-9]{4}$/.test(pin);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const datos = usaPines
        ? { nombre_perfil: nombre, numero_perfil: numero, usa_pin: usaPin }
        : { nombre_perfil: nombre, numero_perfil: numero };
      if (usaPin && generar) datos.generar_pin = true;
      else if (usaPin && pin) datos.pin = pin;
      await inventarioApi.actualizarPerfil(perfil.id, datos);
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el perfil.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={Boolean(perfil)}
      titulo={perfil ? `Editar perfil ${perfil.numero_perfil || ''}` : ''}
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-perfil" cargando={cargando} disabled={pinInvalido}>
            Guardar
          </Boton>
        </>
      }
    >
      {perfil && (
        <form id="form-editar-perfil" onSubmit={enviar} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Número de perfil" name="numero_perfil" value={numero} onChange={(e) => setNumero(e.target.value)} />
            <Campo etiqueta="Nombre del perfil" name="nombre_perfil" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <p className="text-sm text-texto-suave">
            Cliente: {perfil.cliente_nombre || 'sin asignar'}
            {perfil.preferencia_pin && ` · pidió ${perfil.preferencia_pin === 'con_pin' ? 'perfil con PIN' : 'perfil sin candado'}`}
          </p>
          {usaPines && (
            <label className="flex items-center gap-2 text-sm text-texto">
              <input type="checkbox" checked={usaPin} onChange={(e) => setUsaPin(e.target.checked)} />
              Usa candado (PIN de 4 dígitos)
            </label>
          )}
          {usaPines && usaPin && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-texto">
                <input type="checkbox" checked={generar} onChange={(e) => setGenerar(e.target.checked)} />
                Generar un PIN nuevo automáticamente
              </label>
              {!generar && (
                <Campo
                  etiqueta={perfil.usa_pin ? 'Nuevo PIN (vacío = conservar el actual)' : 'PIN (vacío = generar uno)'}
                  name="pin"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  error={pinInvalido ? 'El PIN debe tener exactamente 4 dígitos' : undefined}
                />
              )}
            </div>
          )}
          <p className="text-xs text-texto-suave">
            Si cambias el candado o el PIN, el perfil queda "pendiente de ajuste" hasta que lo apliques en la plataforma y
            pulses "Marcar ajustado".
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}
    </Modal>
  );
}

function ModalHistorialPerfil({ perfil, onCerrar }) {
  const { data, cargando, error } = useApi(
    () => (perfil ? inventarioApi.historialPerfil(perfil.id) : Promise.resolve(null)),
    [perfil?.id]
  );
  const eventos = data?.eventos || [];

  return (
    <Modal
      abierto={Boolean(perfil)}
      titulo={perfil ? `Historial · perfil ${perfil.numero_perfil || ''} ${perfil.nombre_perfil || ''}` : ''}
      onCerrar={onCerrar}
      pie={
        <Boton variante="secundario" onClick={onCerrar}>
          Cerrar
        </Boton>
      }
    >
      {error ? (
        <p className="text-xs text-red-400">No se pudo cargar el historial.</p>
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : eventos.length === 0 ? (
        <EstadoVacio titulo="Sin eventos" descripcion="Este perfil todavía no tiene cambios registrados." />
      ) : (
        <TablaEventos eventos={eventos} />
      )}
    </Modal>
  );
}

function ModalCapacidad({ abierto, cuenta, onCerrar, onGuardado }) {
  const [valor, setValor] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [abiertoAntes, setAbiertoAntes] = useState(false);

  if (abierto && !abiertoAntes) {
    setAbiertoAntes(true);
    setValor(cuenta.max_perfiles ? String(cuenta.max_perfiles) : '');
    setError(null);
  }
  if (!abierto && abiertoAntes) setAbiertoAntes(false);

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await inventarioApi.actualizarCuenta(cuenta.id, { max_perfiles: valor === '' ? null : Number(valor) });
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Capacidad de la cuenta"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-capacidad" cargando={cargando}>
            Guardar
          </Boton>
        </>
      }
    >
      <form id="form-capacidad" onSubmit={enviar} className="space-y-3">
        <Campo
          etiqueta={cuenta.tipo_espacio === 'miembro' ? '¿Cuántos miembros admite esta cuenta?' : '¿Cuántos perfiles tiene esta cuenta?'}
          name="max_perfiles"
          type="number"
          min={1}
          max={20}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
