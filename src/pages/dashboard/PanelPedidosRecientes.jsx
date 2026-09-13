/**
 * pages/dashboard/PanelPedidosRecientes.jsx  (rediseño visual, sin endpoint nuevo)
 * -----------------------------------------
 * Reutiliza GET /admin/pedidos (ya existente, api/pedidos.js -> listar())
 * -- el propio backend ya devuelve los pedidos ordenados por
 * fecha_solicitud DESC, así que los primeros N son los más recientes.
 * Ningún dato inventado: son los pedidos reales del negocio.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as pedidosApi from '../../api/pedidos';
import { Tarjeta, Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { COLOR_ESTADO_PEDIDO } from '../../utils/constantes';
import { fecha, humanizar } from '../../utils/formato';

const TOPE_VISIBLE = 5;

export function PanelPedidosRecientes({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => pedidosApi.listar(), [recargar]);
  const filas = (Array.isArray(data) ? data : []).slice(0, TOPE_VISIBLE);

  return (
    <Tarjeta
      titulo="Pedidos recientes"
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
          columnas={[
            { clave: 'cliente_nombre', titulo: 'Cliente' },
            { clave: 'servicio_nombre', titulo: 'Servicio' },
            {
              clave: 'estado',
              titulo: 'Estado',
              render: (f) => <Etiqueta color={COLOR_ESTADO_PEDIDO[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
            },
            { clave: 'fecha_solicitud', titulo: 'Fecha', render: (f) => fecha(f.fecha_solicitud) },
          ]}
        />
      )}
    </Tarjeta>
  );
}
