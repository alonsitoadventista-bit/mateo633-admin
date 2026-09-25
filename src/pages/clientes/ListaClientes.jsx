/**
 * pages/clientes/ListaClientes.jsx  (Clientes CRM, F1 — 2026-09-24)
 * -----------------------------------------
 * Vista principal del módulo Clientes, pensada para quien no es técnico:
 * - guía "Flujo recomendado" (se puede ocultar);
 * - 4 tarjetas (GET /admin/clientes/tarjetas) que además filtran la lista;
 * - lista paginada con semáforo, servicios activos, vencimiento, último pago
 *   y próxima acción (GET /admin/clientes/listado; búsqueda y filtros en el
 *   servidor, ordenada por urgencia);
 * - acciones por fila: Ver, Editar, WhatsApp y Renovar (reutiliza POST /admin/pedidos/:id/renovar).
 * Alta de cliente: POST /admin/clientes (el backend normaliza el WhatsApp).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
import { Boton, Campo, EstadoCarga, EstadoError, EstadoVacio, Modal, Selector, Tabla, Tarjeta } from '../../components/ui';
import { IconoNav } from '../../components/IconoNav.jsx';
import { ESTADOS_CLIENTE, TEXTO_ACCESO_CLIENTE } from '../../utils/constantes';
import { fecha, fechaCalendario, moneda } from '../../utils/formato';
import { enlaceWhatsApp, whatsappVisible } from '../../utils/whatsapp';
import { IconoServicio, Segmentos } from '../dashboard/piezas.jsx';
import { TarjetasClientes } from './componentes/TarjetasClientes.jsx';
import { FlujoRecomendado } from './componentes/FlujoRecomendado.jsx';
import { EtiquetasCliente, Semaforo, textoDias } from './componentes/Semaforo.jsx';
import { AccionPill } from './componentes/ProximaAccion.jsx';
import { AyudaWhatsapp, ModalEditarCliente } from './componentes/ModalEditarCliente.jsx';
import { DialogoRenovar, objetivoRenovacion } from './componentes/DialogoRenovar.jsx';

const POR_PAGINA = 25;

const FILTROS_ESTADO = [
  { valor: '', texto: 'Todos' },
  { valor: 'vigentes', texto: 'Activos' },
  { valor: 'activo', texto: '🟢 Al día' },
  { valor: 'proximo_a_vencer', texto: '🟡 Por vencer' },
  { valor: 'vencido', texto: '🔴 Vencidos' },
  { valor: 'inactivo', texto: '⚪ Inactivos' },
];

const ORDENES = [
  { valor: 'urgencia', texto: 'Lo más urgente primero' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: 'recientes', texto: 'Registrados recientemente' },
];

const FECHA_LARGA = { day: '2-digit', month: 'short', year: 'numeric' };
const CAMPOS_VACIOS = { nombre: '', whatsapp: '', email: '' };

export function ListaClientes() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [acceso, setAcceso] = useState('');
  const [orden, setOrden] = useState('urgencia');
  const [pagina, setPagina] = useState(1);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [renovando, setRenovando] = useState(null);

  // La búsqueda va al servidor 300 ms después de dejar de escribir.
  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  useEffect(() => setPagina(1), [q, estado, acceso, orden]);

  const tarjetas = useApi(() => clientesApi.tarjetas(), []);
  const lista = useApi(
    () => clientesApi.listado({ q, estado_comercial: estado, acceso, orden, pagina, por_pagina: POR_PAGINA }),
    [q, estado, acceso, orden, pagina]
  );

  function recargar() {
    tarjetas.refetch();
    lista.refetch();
  }

  const filas = lista.data?.filas || [];
  const total = lista.data?.total || 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const hayFiltros = Boolean(q || estado || acceso);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-texto">Clientes</h1>
          <p className="text-sm text-texto-suave">Quién está al día, a quién renovar y a quién recuperar</p>
        </div>
        <Boton onClick={() => setModalNuevo(true)}>+ Nuevo cliente</Boton>
      </div>

      <FlujoRecomendado onCrearCliente={() => setModalNuevo(true)} onVerPorVencer={() => setEstado('proximo_a_vencer')} />

      <TarjetasClientes
        datos={tarjetas.data}
        cargando={tarjetas.cargando}
        error={tarjetas.error}
        onReintentar={tarjetas.refetch}
        filtro={estado}
        onFiltrar={setEstado}
      />

      <Tarjeta>
        <div className="mb-4 space-y-3">
          <div className="overflow-x-auto">
            <Segmentos opciones={FILTROS_ESTADO} valor={estado} onCambio={setEstado} etiqueta="Estado del cliente" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Campo
              etiqueta="Buscar"
              name="busqueda"
              placeholder="Nombre, WhatsApp o correo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="sm:flex-1"
            />
            <Selector
              etiqueta="Acceso"
              name="acceso"
              placeholder="Todos"
              opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: TEXTO_ACCESO_CLIENTE[e] }))}
              value={acceso}
              onChange={(e) => setAcceso(e.target.value)}
              className="sm:w-44"
            />
            <Selector
              etiqueta="Ordenar"
              name="orden"
              opciones={ORDENES}
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="sm:w-60"
            />
          </div>
        </div>

        {lista.error ? (
          <EstadoError error={lista.error} onReintentar={lista.refetch} />
        ) : lista.cargando && !lista.data ? (
          <EstadoCarga />
        ) : filas.length === 0 ? (
          <EstadoVacio
            titulo={hayFiltros ? 'Nada coincide' : 'Aún no hay clientes'}
            descripcion={
              hayFiltros
                ? 'Prueba con otro filtro o búsqueda.'
                : 'Empieza creando tu primer cliente con el botón "+ Nuevo cliente".'
            }
          />
        ) : (
          <>
            <Tabla
              claveFila={(f) => f.id}
              filas={filas}
              onFila={(f) => navigate(`/clientes/${f.id}`)}
              columnas={[
                {
                  clave: 'nombre',
                  titulo: 'Cliente',
                  render: (f) => (
                    <div className="min-w-40">
                      <p className="font-medium text-texto">{f.nombre}</p>
                      <EtiquetasCliente etiquetas={f.etiquetas} />
                      {f.acceso !== 'activo' && (
                        <p className="text-xs text-red-400">Acceso: {TEXTO_ACCESO_CLIENTE[f.acceso]}</p>
                      )}
                    </div>
                  ),
                },
                {
                  clave: 'whatsapp',
                  titulo: 'WhatsApp',
                  render: (f) => <span className="whitespace-nowrap">{whatsappVisible(f.whatsapp)}</span>,
                },
                { clave: 'servicios', titulo: 'Servicios activos', render: (f) => <ServiciosActivos servicios={f.servicios_activos} /> },
                { clave: 'estado', titulo: 'Estado', render: (f) => <Semaforo estado={f.estado_comercial} /> },
                {
                  clave: 'vencimiento',
                  titulo: 'Vencimiento',
                  render: (f) =>
                    f.proximo_vencimiento ? (
                      <div className="whitespace-nowrap">
                        <p>{fechaCalendario(f.proximo_vencimiento, FECHA_LARGA)}</p>
                        <p className="text-xs text-texto-suave">{textoDias(f.dias_restantes)}</p>
                      </div>
                    ) : f.ultimo_vencimiento ? (
                      <div className="whitespace-nowrap text-texto-suave">
                        <p>{fechaCalendario(f.ultimo_vencimiento, FECHA_LARGA)}</p>
                        <p className="text-xs">{textoDias(-f.dias_desde_vencimiento)}</p>
                      </div>
                    ) : (
                      <span className="text-texto-suave">—</span>
                    ),
                },
                {
                  clave: 'ultimo_pago',
                  titulo: 'Último pago',
                  render: (f) =>
                    f.ultimo_pago_monto !== null ? (
                      <div className="whitespace-nowrap">
                        <p>{moneda(f.ultimo_pago_monto)}</p>
                        <p className="text-xs text-texto-suave">{fecha(f.ultimo_pago_fecha)}</p>
                      </div>
                    ) : (
                      <span className="text-texto-suave">Sin pagos</span>
                    ),
                },
                { clave: 'accion', titulo: 'Próxima acción', render: (f) => <AccionPill accion={f.proxima_accion} /> },
                {
                  clave: 'acciones',
                  titulo: 'Acciones',
                  render: (f) => (
                    <AccionesFila
                      fila={f}
                      onVer={() => navigate(`/clientes/${f.id}`)}
                      onEditar={() => setEditando(f)}
                      onRenovar={(o) => setRenovando({ ...o, cliente_nombre: f.nombre })}
                    />
                  ),
                },
              ]}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-texto-suave">
              <span>
                {total} cliente{total === 1 ? '' : 's'}
                {paginas > 1 && ` · página ${lista.data.pagina} de ${paginas}`}
              </span>
              {paginas > 1 && (
                <div className="flex gap-2">
                  <Boton variante="secundario" tamano="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                    ← Anterior
                  </Boton>
                  <Boton variante="secundario" tamano="sm" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)}>
                    Siguiente →
                  </Boton>
                </div>
              )}
            </div>
          </>
        )}
      </Tarjeta>

      <ModalNuevoCliente
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        onCreado={(cliente) => {
          setModalNuevo(false);
          navigate(`/clientes/${cliente.id}`);
        }}
      />

      <DialogoRenovar objetivo={renovando} onCerrar={() => setRenovando(null)} />

      <ModalEditarCliente
        abierto={Boolean(editando)}
        cliente={editando}
        onCerrar={() => setEditando(null)}
        onGuardado={() => {
          setEditando(null);
          recargar();
        }}
      />
    </div>
  );
}

/** Íconos de los servicios vigentes (hasta 3) + nombre o cantidad. */
function ServiciosActivos({ servicios = [] }) {
  if (servicios.length === 0) return <span className="text-texto-suave">Ninguno</span>;
  return (
    <div className="flex items-center gap-2" title={servicios.map((s) => s.servicio_nombre).join(', ')}>
      <div className="flex -space-x-1.5">
        {servicios.slice(0, 3).map((s) => (
          <IconoServicio key={s.pedido_id} nombre={s.servicio_nombre} imagenUrl={s.servicio_imagen_url} />
        ))}
      </div>
      <span className="whitespace-nowrap text-xs text-texto/85">
        {servicios.length === 1 ? servicios[0].servicio_nombre : `${servicios.length} servicios`}
      </span>
    </div>
  );
}

/** Botones de la fila. stopPropagation: el clic en el resto de la fila abre la ficha. */
function AccionesFila({ fila, onVer, onEditar, onRenovar }) {
  const enlace = enlaceWhatsApp(fila.whatsapp);
  const renovar = objetivoRenovacion(fila);
  const base =
    'grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-texto-suave transition';
  const parar = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div className="grid w-max grid-cols-2 gap-1.5">
      <button type="button" title="Ver cliente" aria-label="Ver cliente" onClick={parar(onVer)} className={`${base} hover:border-marca-500/50 hover:text-marca-400`}>
        <IconoNav nombre="clientes" className="h-4 w-4" />
      </button>
      <button type="button" title="Editar datos" aria-label="Editar datos" onClick={parar(onEditar)} className={`${base} hover:border-marca-500/50 hover:text-marca-400`}>
        <IconoNav nombre="configuracion" className="h-4 w-4" />
      </button>
      {enlace && (
        <a
          href={enlace}
          target="_blank"
          rel="noopener noreferrer"
          title="Abrir chat de WhatsApp"
          aria-label="Abrir chat de WhatsApp"
          onClick={(e) => e.stopPropagation()}
          className={`${base} hover:border-emerald-500/50 hover:text-emerald-400`}
        >
          <IconoNav nombre="whatsapp" className="h-4 w-4" />
        </a>
      )}
      <button
        type="button"
        title={renovar.bloqueo || `Renovar ${renovar.servicio_nombre}`}
        aria-label="Renovar"
        disabled={Boolean(renovar.bloqueo)}
        onClick={parar(() => onRenovar(renovar))}
        className={`${base} hover:border-marca-500/50 hover:text-marca-400 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:text-texto-suave`}
      >
        <IconoNav nombre="actualizar" className="h-4 w-4" />
      </button>
    </div>
  );
}

/** POST /admin/clientes — body: { nombre, whatsapp, email? }. Al crear, abre la ficha del cliente nuevo. */
function ModalNuevoCliente({ abierto, onCerrar, onCreado }) {
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
      const cliente = await clientesApi.crear({
        nombre: campos.nombre.trim(),
        whatsapp: campos.whatsapp.trim(),
        email: campos.email.trim() || undefined,
      });
      setCampos(CAMPOS_VACIOS);
      onCreado(cliente);
    } catch (err) {
      setError(err?.message || 'No se pudo crear el cliente.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo cliente"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-nuevo-cliente" cargando={cargando}>
            Crear cliente
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-cliente" onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-texto-suave">
          Registra al cliente. Después asígnale su servicio desde Pedidos.
        </p>
        <Campo etiqueta="Nombre" name="nombre" value={campos.nombre} onChange={actualizar('nombre')} required autoFocus />
        <div className="space-y-1">
          <Campo
            etiqueta="WhatsApp"
            name="whatsapp"
            placeholder="+51 987 654 321"
            value={campos.whatsapp}
            onChange={actualizar('whatsapp')}
            required
          />
          <AyudaWhatsapp valor={campos.whatsapp} />
        </div>
        <Campo etiqueta="Email (opcional)" name="email" type="email" value={campos.email} onChange={actualizar('email')} />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
