/**
 * pages/dashboard/PanelServiciosVencidos.jsx  (Fase 2)
 * -----------------------------------------
 * GET /admin/dashboard/servicios-vencidos
 * Pedidos en estado 'activo' cuya fecha_vencimiento ya pasó. Es un
 * CÁLCULO en vivo: el `estado` almacenado NO cambia hasta que alguien
 * cancele o active una renovación. Filas: { id, cliente_nombre,
 * servicio_nombre, fecha_vencimiento, dias_vencido, ... }.
 */
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as dashboardApi from '../../api/dashboard';
import { Tarjeta, Tabla, Etiqueta, EstadoCarga, EstadoError, EstadoVacio } from '../../components/ui';
import { fecha } from '../../utils/formato';

const TOPE_VISIBLE = 8;

export function PanelServiciosVencidos({ recargar }) {
  const { data, cargando, error, refetch } = useApi(() => dashboardApi.serviciosVencidos(), [recargar]);
  const filas = Array.isArray(data) ? data : [];

  return (
    <Tarjeta
      titulo={`Servicios vencidos${filas.length ? ` · ${filas.length}` : ''}`}
      acciones={
        <Link to="/pedidos" className="text-xs font-medium text-marca-700 hover:underline">
          Ver pedidos
        </Link>
      }
    >
      {error ? (
        <EstadoError error={error} onReintentar={refetch} />
      ) : cargando && !data ? (
        <EstadoCarga />
      ) : filas.length === 0 ? (
        <EstadoVacio titulo="Sin vencidos" descripcion="Ningún servicio activo pasó su fecha de vencimiento." />
      ) : (
        <>
          <Tabla
            claveFila={(f) => f.id}
            filas={filas.slice(0, TOPE_VISIBLE)}
            columnas={[
              { clave: 'cliente_nombre', titulo: 'Cliente' },
              { clave: 'servicio_nombre', titulo: 'Servicio' },
              { clave: 'fecha_vencimiento', titulo: 'Venció', render: (f) => fecha(f.fecha_vencimiento) },
              {
                clave: 'dias_vencido',
                titulo: 'Días',
                render: (f) => <Etiqueta color="red">{f.dias_vencido} d</Etiqueta>,
              },
            ]}
          />
          {filas.length > TOPE_VISIBLE && (
            <p className="mt-2 text-xs text-slate-500">+{filas.length - TOPE_VISIBLE} más</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Cálculo en vivo: el estado guardado sigue siendo “activo” hasta cancelar o renovar.
          </p>
        </>
      )}
    </Tarjeta>
  );
}
