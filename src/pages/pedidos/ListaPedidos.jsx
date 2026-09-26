/**
 * pages/pedidos/ListaPedidos.jsx  (Fase 4)
 * -----------------------------------------
 * Lista de pedidos con filtro por estado (servidor, GET /admin/pedidos?estado=)
 * y búsqueda por cliente/whatsapp/servicio (cliente, sobre la lista ya
 * cargada -- el backend no expone búsqueda de texto en ese endpoint,
 * mismo criterio que ListaClientes.jsx). Alta vía modal: cliente + servicio
 * + plan (el precio y la duración los deriva el backend del plan elegido,
 * el frontend nunca los envía). Cada fila navega al detalle (/pedidos/:id).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import * as clientesApi from '../../api/clientes';
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
import { ESTADOS_PEDIDO, COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fecha, humanizar, moneda, whatsapp as formatoWhatsapp } from '../../utils/formato';

export function ListaPedidos() {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data, cargando, error, refetch } = useApi(
    () => pedidosApi.listar(estadoFiltro),
    [estadoFiltro]
  );

  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((p) =>
      [p.cliente_nombre, p.cliente_whatsapp, p.servicio_nombre].some(
        (v) => v && String(v).toLowerCase().includes(texto)
      )
    );
  }, [filas, busqueda]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-texto">Pedidos</h1>
          <p className="text-sm text-texto-suave">Compras y renovaciones de servicios por cliente</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo pedido</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Cliente, WhatsApp o servicio…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <Selector
            etiqueta="Estado"
            name="estado"
            placeholder="Todos"
            opciones={ESTADOS_PEDIDO.map((e) => ({ valor: e, texto: humanizar(e) }))}
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
            titulo="Sin pedidos"
            descripcion={
              busqueda || estadoFiltro
                ? 'Nada coincide con el filtro actual.'
                : 'Aún no hay pedidos registrados.'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            onFila={(f) => navigate(`/pedidos/${f.id}`)}
            columnas={[
              {
                clave: 'cliente_nombre',
                titulo: 'Cliente',
                render: (f) => (
                  <div>
                    <p className="font-medium text-texto">{f.cliente_nombre}</p>
                    <p className="text-xs text-texto-suave">{formatoWhatsapp(f.cliente_whatsapp)}</p>
                  </div>
                ),
              },
              {
                clave: 'servicio_nombre',
                titulo: 'Servicio',
                // Tipo: compra nueva o renovación (regla 2026-09-25: la renovación extiende la vigencia).
                render: (f) => (
                  <span className="flex items-center gap-2">
                    {f.servicio_nombre}
                    {f.pedido_origen_id && <Etiqueta color="blue">Renovación</Etiqueta>}
                  </span>
                ),
              },
              { clave: 'precio_pagado', titulo: 'Precio', render: (f) => moneda(f.precio_pagado) },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (f) => <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
              },
              { clave: 'fecha_solicitud', titulo: 'Solicitado', render: (f) => fecha(f.fecha_solicitud) },
              { clave: 'fecha_vencimiento', titulo: 'Vence', render: (f) => fecha(f.fecha_vencimiento) },
            ]}
          />
        )}
      </Tarjeta>

      <ModalNuevoPedido
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

/**
 * POST /admin/pedidos — body: { cliente_id, plan_id }.
 * Selección en cascada: primero el servicio (para saber qué planes
 * ofrecer), luego el plan de ese servicio. El precio y la duración
 * los muestra el plan elegido, tal cual los calculará el backend.
 */
function ModalNuevoPedido({ abierto, onCerrar, onCreado }) {
  const { data: clientes } = useApi(() => clientesApi.listar(), []);
  const { data: servicios } = useApi(() => serviciosApi.listar(), []);

  const [clienteId, setClienteId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [planId, setPlanId] = useState('');
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!servicioId) {
      setPlanes([]);
      setPlanId('');
      return;
    }
    let vivo = true;
    setCargandoPlanes(true);
    setPlanId('');
    serviciosApi
      .detalle(servicioId)
      .then((s) => {
        if (vivo) setPlanes((s.planes || []).filter((p) => p.activo));
      })
      .catch((e) => {
        if (vivo) setError(e?.message || 'No se pudieron cargar los planes de este servicio.');
      })
      .finally(() => {
        if (vivo) setCargandoPlanes(false);
      });
    return () => {
      vivo = false;
    };
  }, [servicioId]);

  function cerrar() {
    setClienteId('');
    setServicioId('');
    setPlanId('');
    setPlanes([]);
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      await pedidosApi.crear({ cliente_id: clienteId, plan_id: planId });
      cerrar();
      onCreado();
    } catch (err) {
      setError(err?.message || 'No se pudo crear el pedido.');
    } finally {
      setCargando(false);
    }
  }

  const opcionesCliente = (clientes || []).map((c) => ({
    valor: c.id,
    texto: `${c.nombre} (${formatoWhatsapp(c.whatsapp)})`,
  }));
  const opcionesServicio = (servicios || []).filter((s) => s.activo).map((s) => ({ valor: s.id, texto: s.nombre }));
  const opcionesPlan = planes.map((p) => ({
    valor: p.id,
    texto: `${p.duracion_dias} días — ${moneda(p.precio)}`,
  }));

  return (
    <Modal
      abierto={abierto}
      titulo="Nuevo pedido"
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            form="form-nuevo-pedido"
            cargando={cargando}
            disabled={!clienteId || !planId}
          >
            Crear pedido
          </Boton>
        </>
      }
    >
      <form id="form-nuevo-pedido" onSubmit={enviar} className="space-y-4">
        <Selector
          etiqueta="Cliente"
          name="cliente"
          placeholder="Selecciona un cliente…"
          opciones={opcionesCliente}
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          required
        />
        <Selector
          etiqueta="Servicio"
          name="servicio"
          placeholder="Selecciona un servicio…"
          opciones={opcionesServicio}
          value={servicioId}
          onChange={(e) => setServicioId(e.target.value)}
          required
        />
        <Selector
          etiqueta="Plan"
          name="plan"
          placeholder={cargandoPlanes ? 'Cargando planes…' : 'Selecciona un plan…'}
          opciones={opcionesPlan}
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          disabled={!servicioId || cargandoPlanes}
          required
        />
        {servicioId && !cargandoPlanes && opcionesPlan.length === 0 && (
          <p className="text-xs text-amber-400">Este servicio no tiene planes activos.</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}
