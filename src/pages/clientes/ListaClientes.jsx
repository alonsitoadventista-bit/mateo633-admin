/**
 * pages/clientes/ListaClientes.jsx  (Clientes CRM — F1 lógica, F2 visual)
 * -----------------------------------------
 * Vista principal del módulo Clientes, con aspecto de CRM:
 * - "¿Cómo funciona?" (guía de 4 pasos) y "+ Nuevo cliente";
 * - 4 indicadores (GET /admin/clientes/tarjetas) que además filtran;
 * - pestañas de estado con contadores, búsqueda, acceso y orden
 *   (GET /admin/clientes/listado: filtros y paginación en el servidor);
 * - TablaClientes: servicio principal, vencimiento, próxima acción
 *   ejecutable, WhatsApp, Renovar (POST /admin/pedidos/:id/renovar) y ⋯.
 * Alta: POST /admin/clientes (el backend normaliza el WhatsApp).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
import { Boton, Campo, EstadoCarga, EstadoError, EstadoVacio, Modal, Selector } from '../../components/ui';
import { ESTADOS_CLIENTE, TEXTO_ACCESO_CLIENTE } from '../../utils/constantes';
import { numero } from '../../utils/formato';
import { Segmentos } from '../dashboard/piezas.jsx';
import { TarjetasClientes } from './componentes/TarjetasClientes.jsx';
import { FlujoRecomendado } from './componentes/FlujoRecomendado.jsx';
import { TablaClientes } from './componentes/TablaClientes.jsx';
import { AyudaWhatsapp, ModalEditarCliente } from './componentes/ModalEditarCliente.jsx';
import { DialogoRenovar } from './componentes/DialogoRenovar.jsx';
import { ModalMensajeWhatsApp } from './componentes/ModalMensajeWhatsApp.jsx';

const POR_PAGINA = 25;

const ORDENES = [
  { valor: 'urgencia', texto: 'Lo más urgente primero' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: 'recientes', texto: 'Registrados recientemente' },
];

const CAMPOS_VACIOS = { nombre: '', whatsapp: '', email: '' };

/** Pestañas de estado con su contador (de las tarjetas). */
function pestanas(t) {
  const n = (v) => (t ? ` ${numero(v)}` : '');
  return [
    { valor: '', texto: `Todos${n(t?.total)}` },
    { valor: 'vigentes', texto: `Activos${n(t?.vigentes)}` },
    { valor: 'activo', texto: `🟢 Al día${n(t?.activos)}` },
    { valor: 'proximo_a_vencer', texto: `🟡 Por vencer${n(t?.proximos_a_vencer)}` },
    { valor: 'vencido', texto: `🔴 Vencidos${n(t?.vencidos)}` },
    { valor: 'inactivo', texto: `⚪ Inactivos${n(t?.inactivos)}` },
  ];
}

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
  const [mensaje, setMensaje] = useState(null); // { mensaje, nombre }

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
  const desde = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);
  const hayFiltros = Boolean(q || estado || acceso);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-texto">Clientes</h1>
          <p className="text-sm text-texto-suave">Quién está al día, a quién renovar y a quién recuperar</p>
        </div>
        <div className="flex gap-2">
          <FlujoRecomendado onCrearCliente={() => setModalNuevo(true)} onVerPorVencer={() => setEstado('proximo_a_vencer')} />
          <Boton onClick={() => setModalNuevo(true)}>+ Nuevo cliente</Boton>
        </div>
      </div>

      <TarjetasClientes
        datos={tarjetas.data}
        cargando={tarjetas.cargando}
        error={tarjetas.error}
        onReintentar={tarjetas.refetch}
        filtro={estado}
        onFiltrar={setEstado}
      />

      <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#16171b] to-[#0e0f12] p-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] sm:p-5">
        <div className="mb-4 space-y-3">
          <div className="overflow-x-auto [&_button]:whitespace-nowrap">
            <Segmentos opciones={pestanas(tarjetas.data)} valor={estado} onCambio={setEstado} etiqueta="Estado del cliente" />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Campo
              etiqueta="Buscar"
              name="busqueda"
              placeholder="🔍  Nombre, WhatsApp o correo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="lg:flex-1"
            />
            <div className="grid grid-cols-2 gap-3 lg:flex">
              <Selector
                etiqueta="Acceso"
                name="acceso"
                placeholder="Todos"
                opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: TEXTO_ACCESO_CLIENTE[e] }))}
                value={acceso}
                onChange={(e) => setAcceso(e.target.value)}
                className="lg:w-40"
              />
              <Selector
                etiqueta="Ordenar"
                name="orden"
                opciones={ORDENES}
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
                className="lg:w-56"
              />
            </div>
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
            <TablaClientes
              filas={filas}
              onVer={(c) => navigate(`/clientes/${c.id}`)}
              onEditar={setEditando}
              onRenovar={setRenovando}
              onMensaje={(m, c) => setMensaje({ mensaje: m, nombre: c.nombre })}
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-texto-suave">
              <span>
                Mostrando <span className="font-medium text-texto">{desde}–{hasta}</span> de{' '}
                <span className="font-medium text-texto">{numero(total)}</span> cliente{total === 1 ? '' : 's'}
              </span>
              {paginas > 1 && (
                <div className="flex items-center gap-2">
                  <Boton variante="secundario" tamano="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
                    ← Anterior
                  </Boton>
                  <span className="tabular-nums">
                    {pagina} / {paginas}
                  </span>
                  <Boton variante="secundario" tamano="sm" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)}>
                    Siguiente →
                  </Boton>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <ModalNuevoCliente
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        onCreado={(cliente) => {
          setModalNuevo(false);
          navigate(`/clientes/${cliente.id}`);
        }}
      />

      <ModalEditarCliente
        abierto={Boolean(editando)}
        cliente={editando}
        onCerrar={() => setEditando(null)}
        onGuardado={() => {
          setEditando(null);
          recargar();
        }}
      />

      <DialogoRenovar objetivo={renovando} onCerrar={() => setRenovando(null)} />

      <ModalMensajeWhatsApp mensaje={mensaje?.mensaje} nombreCliente={mensaje?.nombre} onCerrar={() => setMensaje(null)} />
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
        <p className="text-sm text-texto-suave">Registra al cliente. Después asígnale su servicio desde Pedidos.</p>
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
