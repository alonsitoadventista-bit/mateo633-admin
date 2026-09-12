/**
 * pages/pagos-por-revisar/ListaPagosPorRevisar.jsx  (Fase 5)
 * -----------------------------------------
 * Bandeja completa de pagos reportados sin confirmar (GET
 * /admin/dashboard/pagos-por-revisar -- la lista vive en el
 * controller de dashboard, ya consumida sin tope en
 * PanelPagosPorRevisar.jsx del Dashboard). Búsqueda por cliente/
 * servicio (cliente, sobre la lista ya cargada -- mismo criterio que
 * ListaClientes.jsx/ListaPedidos.jsx). Cada fila navega al detalle
 * (/pagos-por-revisar/:pedidoId).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, Campo, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { fechaHora, humanizar, moneda } from '../../utils/formato';

const ORIGEN = {
  pago_reportado_cliente: 'App del cliente',
  pago_reportado_manychat: 'ManyChat',
};

export function ListaPagosPorRevisar() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');

  const { data, cargando, error, refetch } = useApi(() => dashboardApi.pagosPorRevisar(), []);
  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((f) =>
      [f.cliente_nombre, f.cliente_whatsapp, f.servicio_nombre].some(
        (v) => v && String(v).toLowerCase().includes(texto)
      )
    );
  }, [filas, busqueda]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Pagos por revisar</h1>
        <p className="text-sm text-slate-500">
          Pagos reportados por el cliente o por ManyChat, pendientes de confirmar o rechazar.
        </p>
      </div>

      <Tarjeta>
        <div className="mb-4">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Cliente, WhatsApp o servicio…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:max-w-sm"
          />
        </div>

        {error ? (
          <EstadoError error={error} onReintentar={refetch} />
        ) : cargando && !data ? (
          <EstadoCarga />
        ) : filasFiltradas.length === 0 ? (
          <EstadoVacio
            titulo="Nada pendiente"
            descripcion={
              busqueda ? 'Nada coincide con el filtro actual.' : 'No hay pagos reportados sin revisar.'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.pedido_id}
            filas={filasFiltradas}
            onFila={(f) => navigate(`/pagos-por-revisar/${f.pedido_id}`)}
            columnas={[
              {
                clave: 'cliente_nombre',
                titulo: 'Cliente',
                render: (f) => (
                  <div>
                    <p className="font-medium text-slate-800">{f.cliente_nombre}</p>
                    <p className="text-xs text-slate-400">{f.cliente_whatsapp}</p>
                  </div>
                ),
              },
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              { clave: 'monto', titulo: 'Monto reportado', render: (f) => moneda(f.detalles?.monto ?? f.precio_pagado) },
              {
                clave: 'origen',
                titulo: 'Origen',
                render: (f) => <Etiqueta color="blue">{ORIGEN[f.origen_reporte] || humanizar(f.origen_reporte)}</Etiqueta>,
              },
              { clave: 'fecha_reporte', titulo: 'Reportado', render: (f) => fechaHora(f.fecha_reporte) },
            ]}
          />
        )}
      </Tarjeta>
    </div>
  );
}
