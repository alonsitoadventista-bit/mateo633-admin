/**
 * pages/dashboard/PanelUltimosPedidos.jsx  (Dashboard 2026-09-24)
 * -----------------------------------------
 * GET /admin/dashboard/ultimos-pedidos?limite=7 (liviano: ya no descarga
 * la lista completa de pedidos como el PanelPedidosRecientes anterior).
 * Un pedido activo con entrega registrada se marca "Entregado".
 */
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { humanizar } from '../../utils/formato';

/** Fecha corta para la tabla: '24/09 21:15' (hora de Lima). */
const FECHA_CORTA = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' });
import { IconoServicio } from './piezas.jsx';

export function PanelUltimosPedidos({ recargar }) {
  const navigate = useNavigate();
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.ultimosPedidos(7), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta
      titulo="Últimos pedidos"
      acciones={
        <Link to="/pedidos" className="text-xs font-medium text-marca-500 hover:underline">
          Ver todos →
        </Link>
      }
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin pedidos" descripcion="Todavía no se ha registrado ningún pedido." />
      ) : (
        <Tabla
          claveFila={(f) => f.id}
          filas={filas}
          onFila={(f) => navigate(`/pedidos/${f.id}`)}
          columnas={[
            { clave: 'id', titulo: '#', render: (f) => <span className="font-semibold">#{f.id}</span> },
            { clave: 'cliente_nombre', titulo: 'Cliente', render: (f) => <span className="whitespace-nowrap">{f.cliente_nombre}</span> },
            {
              clave: 'servicio_nombre',
              titulo: 'Servicio',
              render: (f) => (
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <IconoServicio nombre={f.servicio_nombre} imagenUrl={f.servicio_imagen_url} />
                  {f.servicio_nombre}
                </span>
              ),
            },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (f) =>
                f.estado === 'activo' && f.entregado ? (
                  <Etiqueta color="blue">Entregado</Etiqueta>
                ) : (
                  <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>
                ),
            },
            { clave: 'fecha_solicitud', titulo: 'Fecha', render: (f) => <span className="whitespace-nowrap">{FECHA_CORTA.format(new Date(f.fecha_solicitud))}</span> },
          ]}
        />
      )}
    </Tarjeta>
  );
}
