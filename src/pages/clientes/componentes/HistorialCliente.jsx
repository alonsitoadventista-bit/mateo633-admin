/**
 * pages/clientes/componentes/HistorialCliente.jsx  (Clientes CRM, F1)
 * -----------------------------------------
 * GET /admin/clientes/:id/historial → línea de tiempo en lenguaje simple:
 * compras, renovaciones, pagos, activaciones (con su vencimiento), perfiles,
 * entregas, vencimientos y cambios de datos (antes → después), con quién lo
 * hizo. Filtro rápido por tipo. F2: agrupado por mes y con chip de color por tipo.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import * as clientesApi from '../../../api/clientes';
import { EstadoCarga, EstadoError, EstadoVacio } from '../../../components/ui';
import { IconoNav } from '../../../components/IconoNav.jsx';
import { TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { capitalizar, fecha, fechaHora, humanizar, moneda } from '../../../utils/formato';
import { Segmentos } from '../../dashboard/piezas.jsx';

const FILTROS = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'compras', texto: 'Compras y renovaciones' },
  { valor: 'pagos', texto: 'Pagos' },
  { valor: 'servicio', texto: 'Perfiles y entregas' },
  { valor: 'cambios', texto: 'Cambios de datos' },
];

const CAMPOS = { nombre: 'Nombre', email: 'Correo', whatsapp: 'WhatsApp', estado: 'Acceso' };

function valorCampo(campo, v) {
  if (v === null || v === undefined || v === '') return 'vacío';
  return campo === 'estado' ? TEXTO_ACCESO_CLIENTE[v] || v : v;
}

/** Texto, ícono, color y categoría de cada acción de auditoría. */
function describir(e) {
  const d = e.detalles || {};
  switch (e.accion) {
    case 'pedido_creado':
      return e.es_renovacion
        ? { cat: 'compras', icono: 'actualizar', color: 'text-marca-400', titulo: 'Renovación solicitada' }
        : { cat: 'compras', icono: 'carrito', color: 'text-marca-400', titulo: 'Compra solicitada' };
    case 'servicio_activado':
      return {
        cat: 'compras',
        icono: 'check',
        color: 'text-emerald-400',
        titulo: 'Servicio activado',
        detalle: d.fecha_vencimiento ? `Vencimiento: ${fecha(d.fecha_vencimiento)}` : null,
      };
    // Renovación = extensión de vigencia (regla 2026-09-25).
    case 'renovacion_confirmada':
      return {
        cat: 'compras',
        icono: 'actualizar',
        color: 'text-emerald-400',
        titulo: `Renovación confirmada: +${d.dias || ''} días`,
        detalle: [
          d.vencimiento_nuevo ? `Nuevo vencimiento: ${fecha(d.vencimiento_nuevo)}` : null,
          d.perfil_conservado === false ? 'con otro perfil (renovación modificada)' : 'mismo perfil y cuenta',
        ]
          .filter(Boolean)
          .join(' · '),
      };
    case 'pedido_renovado':
      return { cat: 'compras', icono: 'actualizar', color: 'text-texto-suave', titulo: 'Servicio renovado', detalle: d.renovacion ? `Continúa en la renovación #${d.renovacion}` : null };
    case 'renovacion_modificada':
      return {
        cat: 'servicio',
        icono: 'alerta',
        color: 'text-amber-400',
        titulo: 'Renovación modificada (cambio de credenciales)',
        detalle: d.motivo ? `Motivo: ${d.motivo}` : null,
        cambios: (d.cambios || []).map((c) => ({ cuenta: 'Cuenta', correo: 'Correo', contrasena: 'Contraseña', perfil: 'Perfil', pin: 'PIN' })[c] || c).map((c) => `${c}: cambió`),
      };
    case 'cuenta_perfil_modificado':
      return {
        cat: 'servicio',
        icono: 'alerta',
        color: 'text-amber-400',
        titulo: 'Cuenta/perfil modificado (cambio excepcional)',
        detalle: d.motivo ? `Motivo: ${d.motivo}` : null,
        cambios: (d.cambios || []).map((c) => ({ cuenta: 'Cuenta', correo: 'Correo', contrasena: 'Contraseña', perfil: 'Perfil', pin: 'PIN' })[c] || c).map((c) => `${c}: cambió`),
      };
    case 'renovacion_perfil_no_conservable':
      return { cat: 'servicio', icono: 'alerta', color: 'text-amber-400', titulo: 'Renovación sin confirmar: no se pudo conservar el perfil', detalle: d.motivo || null };
    case 'renovacion_reenlazada':
      return { cat: 'compras', icono: 'info', color: 'text-texto-suave', titulo: 'Renovación enlazada al último pedido del servicio' };
    case 'pedido_vencido':
      return { cat: 'compras', icono: 'reloj', color: 'text-rose-400', titulo: 'Servicio vencido' };
    case 'pedido_cancelado':
      return { cat: 'compras', icono: 'critico', color: 'text-texto-suave', titulo: 'Pedido cancelado' };
    case 'pago_confirmado':
      return { cat: 'pagos', icono: 'billetera', color: 'text-emerald-400', titulo: `Pago confirmado${d.monto ? `: ${moneda(d.monto)}` : ''}`, detalle: d.metodo ? `Método: ${d.metodo}` : null };
    case 'pago_rechazado':
      return { cat: 'pagos', icono: 'alerta', color: 'text-rose-400', titulo: 'Pago rechazado', detalle: d.motivo || null };
    case 'pago_reportado_cliente':
    case 'pago_reportado_manychat':
      return { cat: 'pagos', icono: 'pagos', color: 'text-sky-400', titulo: 'El cliente reportó un pago' };
    case 'perfil_asignado':
      if (d.conservado_de_renovacion) {
        return { cat: 'servicio', icono: 'inventario', color: 'text-emerald-400', titulo: `Mismo perfil conservado${d.numero_perfil ? ` (perfil ${d.numero_perfil})` : ''}` };
      }
      return { cat: 'servicio', icono: 'inventario', color: 'text-sky-400', titulo: `Perfil asignado${d.numero_perfil ? ` (perfil ${d.numero_perfil})` : ''}` };
    case 'cuenta_liberada':
      return { cat: 'servicio', icono: 'inventario', color: 'text-texto-suave', titulo: 'Perfil liberado' };
    case 'credenciales_entregadas':
      return { cat: 'servicio', icono: 'whatsapp', color: 'text-emerald-400', titulo: `Credenciales entregadas${d.canal === 'whatsapp' ? ' por WhatsApp' : d.canal === 'copiado' ? ' (copiadas)' : ''}` };
    case 'entrega_manual_emergencia':
      return { cat: 'servicio', icono: 'alerta', color: 'text-amber-400', titulo: 'Entrega manual de emergencia' };
    case 'datos_cliente_editados':
    case 'estado_cliente_cambiado': {
      const cambios = Object.entries(d.campos_modificados || {});
      return {
        cat: 'cambios',
        icono: 'configuracion',
        color: 'text-texto-suave',
        titulo: e.accion === 'estado_cliente_cambiado' ? 'Acceso cambiado' : 'Datos del cliente editados',
        cambios: cambios.map(([campo, v]) => `${CAMPOS[campo] || campo}: ${valorCampo(campo, v.antes)} → ${valorCampo(campo, v.despues)}`),
      };
    }
    case 'cliente_registrado_por_staff':
      return { cat: 'cambios', icono: 'clientes', color: 'text-marca-400', titulo: 'Cliente registrado desde el panel' };
    case 'cliente_registrado':
      return { cat: 'cambios', icono: 'clientes', color: 'text-marca-400', titulo: 'Cliente registrado' };
    default:
      return { cat: 'todo', icono: 'info', color: 'text-texto-suave', titulo: humanizar(e.accion) };
  }
}

export function HistorialCliente({ clienteId }) {
  const { data, cargando, error, refetch } = useApi(() => clientesApi.historial(clienteId), [clienteId]);
  const [filtro, setFiltro] = useState('todo');

  if (error) return <EstadoError error={error} onReintentar={refetch} />;
  if (cargando && !data) return <EstadoCarga />;

  const eventos = (data || []).map((e) => ({ ...e, ...describir(e) })).filter((e) => filtro === 'todo' || e.cat === filtro);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto [&_button]:whitespace-nowrap">
        <Segmentos opciones={FILTROS} valor={filtro} onCambio={setFiltro} etiqueta="Tipo de evento" />
      </div>
      {eventos.length === 0 ? (
        <EstadoVacio titulo="Sin eventos" descripcion="No hay movimientos de este tipo." />
      ) : (
        agruparPorMes(eventos).map(([mes, grupo]) => (
        <section key={mes}>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-texto-suave">{mes}</h4>
        <ol className="relative mb-2 space-y-4 border-l border-white/10 pl-6">
          {grupo.map((e, i) => (
            <li key={e.id ?? `alta-${i}`} className="relative">
              <span className={`absolute -left-[37px] grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#121316] ${e.color}`}>
                <IconoNav nombre={e.icono} className="h-3.5 w-3.5" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-texto">
                  <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CHIP[e.cat] || CHIP.todo}`}>
                    {TEXTO_CHIP[e.cat] || 'Otro'}
                  </span>
                  {e.titulo}
                  {e.servicio_nombre && <span className="text-texto-suave"> · {e.servicio_nombre}</span>}
                </p>
                <time className="text-xs text-texto-suave">{fechaHora(e.fecha)}</time>
              </div>
              {e.detalle && <p className="text-xs text-texto/80">{e.detalle}</p>}
              {e.cambios?.map((c) => (
                <p key={c} className="text-xs text-texto/80">
                  {c}
                </p>
              ))}
              <p className="text-xs text-texto-suave">
                {e.actor_nombre || 'Panel'}
                {e.pedido_id && (
                  <>
                    {' · '}
                    <Link to={`/pedidos/${e.pedido_id}`} className="text-marca-400 hover:underline">
                      pedido #{e.pedido_id}
                    </Link>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
        </section>
        ))
      )}
    </div>
  );
}

const CHIP = {
  compras: 'bg-marca-500/15 text-marca-400',
  pagos: 'bg-emerald-500/15 text-emerald-300',
  servicio: 'bg-sky-500/15 text-sky-300',
  cambios: 'bg-white/[0.07] text-texto-suave',
  todo: 'bg-white/[0.07] text-texto-suave',
};

const TEXTO_CHIP = { compras: 'Servicio', pagos: 'Pago', servicio: 'Perfil', cambios: 'Cliente' };

/** [["Setiembre 2026", [eventos...]], ...] respetando el orden (más reciente primero). */
function agruparPorMes(eventos) {
  const grupos = new Map();
  for (const e of eventos) {
    const d = new Date(e.fecha);
    const mes = Number.isNaN(d.getTime())
      ? 'Sin fecha'
      : capitalizar(new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(d));
    if (!grupos.has(mes)) grupos.set(mes, []);
    grupos.get(mes).push(e);
  }
  return [...grupos.entries()];
}
