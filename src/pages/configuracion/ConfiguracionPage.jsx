/**
 * pages/configuracion/ConfiguracionPage.jsx  (Fase 9)
 * -----------------------------------------
 * Edición de las 14 claves de configuración precargadas por la
 * migración 012 (ver utils/configuracionClaves.js -- fuente única de
 * verdad de qué claves existen, su categoría, tipo de editor y, para
 * los "objeto" con forma conocida, sus campos). El backend SOLO
 * permite UPDATE sobre claves ya existentes (nunca crea claves
 * nuevas), así que aquí tampoco se ofrece esa opción.
 *
 * Igual que Auditoría (Fase 8), es una sola página sin router
 * anidado -- no hay un "detalle" separado por clave, cada una se
 * edita en un modal, mismo patrón que ModalEditarCliente/
 * ModalEditarServicio/ModalEditarUsuario del resto del panel.
 */
import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import * as configuracionApi from '../../api/configuracion';
import { Tarjeta, Tabla, Boton, Campo, Modal, EstadoCarga, EstadoError } from '../../components/ui';
import { CLAVES_CONFIG } from '../../utils/configuracionClaves';
import { fechaHora } from '../../utils/formato';

const CATEGORIAS = [
  { clave: 'negocio', titulo: 'Negocio' },
  { clave: 'comercial', titulo: 'Comercial' },
  { clave: 'sistema', titulo: 'Sistema' },
];

/** Vista previa corta del valor guardado, según su tipo. */
function VistaPreviaValor({ definicion, valor }) {
  if (valor === null || valor === undefined || valor === '') return <span className="text-slate-400">—</span>;
  if (definicion.tipo === 'texto' || definicion.tipo === 'url') {
    return <span className="text-slate-700">{String(valor)}</span>;
  }
  if (definicion.tipo === 'textarea') {
    const texto = String(valor);
    return <span className="text-slate-700">{texto.length > 60 ? `${texto.slice(0, 60)}…` : texto}</span>;
  }
  // objeto / arreglo: sin forma fija garantizada -- se muestra como JSON compacto,
  // mismo criterio ya usado para `detalles` en Auditoría/Pedidos.
  return <code className="text-xs text-slate-500">{JSON.stringify(valor)}</code>;
}

export function ConfiguracionPage() {
  const { data, cargando, error, refetch } = useApi(() => configuracionApi.listar(), []);
  const [editando, setEditando] = useState(null); // definicion de CLAVES_CONFIG en edicion

  const filasPorClave = new Map((data || []).map((fila) => [fila.clave, fila]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500">
          Datos del negocio, métodos de pago y ajustes del sistema. No se pueden crear claves nuevas.
        </p>
      </div>

      {error ? (
        <Tarjeta>
          <EstadoError error={error} onReintentar={refetch} />
        </Tarjeta>
      ) : cargando && !data ? (
        <Tarjeta>
          <EstadoCarga />
        </Tarjeta>
      ) : (
        CATEGORIAS.map((cat) => {
          const definiciones = CLAVES_CONFIG.filter((c) => c.categoria === cat.clave);
          return (
            <Tarjeta key={cat.clave} titulo={cat.titulo}>
              <Tabla
                claveFila={(d) => d.clave}
                filas={definiciones}
                columnas={[
                  { clave: 'etiqueta', titulo: 'Clave' },
                  {
                    clave: 'valor',
                    titulo: 'Valor actual',
                    render: (d) => <VistaPreviaValor definicion={d} valor={filasPorClave.get(d.clave)?.valor} />,
                  },
                  {
                    clave: 'actualizado',
                    titulo: 'Última edición',
                    render: (d) => fechaHora(filasPorClave.get(d.clave)?.fecha_actualizacion),
                  },
                  {
                    clave: 'acciones',
                    titulo: '',
                    render: (d) => (
                      <Boton variante="secundario" tamano="sm" onClick={() => setEditando(d)}>
                        Editar
                      </Boton>
                    ),
                  },
                ]}
              />
            </Tarjeta>
          );
        })
      )}

      <ModalEditarClave
        abierto={!!editando}
        definicion={editando}
        fila={editando ? filasPorClave.get(editando.clave) : undefined}
        onCerrar={() => setEditando(null)}
        onGuardado={() => {
          setEditando(null);
          refetch();
        }}
      />
    </div>
  );
}

/** Textarea con el mismo estilo de <Campo>, para tipos 'textarea' y el editor JSON crudo. */
function CampoTextarea({ etiqueta, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      {etiqueta && <span className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</span>}
      <textarea
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition
          focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30"
        rows={5}
        {...props}
      />
    </label>
  );
}

/**
 * PUT /admin/configuracion/:clave — body: { valor }. Un solo modal
 * cubre los 5 tipos de editor (texto, url, textarea, objeto, arreglo):
 * - texto/url/textarea: valor simple.
 * - objeto CON `campos` definidos (ej. redes_sociales): un Campo por
 *   campo nombrado.
 * - objeto SIN `campos` (ej. datos_bancarios) y arreglo (metodos_pago):
 *   sin forma fija garantizada, se edita como JSON crudo, validado con
 *   JSON.parse antes de enviar.
 */
function ModalEditarClave({ abierto, definicion, fila, onCerrar, onGuardado }) {
  const [valorSimple, setValorSimple] = useState('');
  const [valorObjeto, setValorObjeto] = useState({});
  const [valorJson, setValorJson] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Re-inicializa los campos locales cada vez que se abre para una clave
  // distinta (el modal permanece montado entre ediciones, mismo patrón que
  // ModalPlan en DetalleServicio.jsx / ModalAprobar en Pagos por revisar).
  useEffect(() => {
    if (!abierto || !definicion) return;
    const valorActual = fila?.valor;
    if (definicion.tipo === 'texto' || definicion.tipo === 'url' || definicion.tipo === 'textarea') {
      setValorSimple(valorActual ?? '');
    } else if (definicion.tipo === 'objeto' && definicion.campos) {
      setValorObjeto(valorActual && typeof valorActual === 'object' ? valorActual : {});
    } else {
      setValorJson(JSON.stringify(valorActual ?? (definicion.tipo === 'arreglo' ? [] : {}), null, 2));
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, definicion?.clave]);

  if (!definicion) return null;

  function cerrar() {
    setError(null);
    onCerrar();
  }

  async function enviar(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      let valorFinal;
      if (definicion.tipo === 'texto' || definicion.tipo === 'url' || definicion.tipo === 'textarea') {
        valorFinal = valorSimple;
      } else if (definicion.tipo === 'objeto' && definicion.campos) {
        valorFinal = valorObjeto;
      } else {
        try {
          valorFinal = JSON.parse(valorJson);
        } catch {
          throw new Error('El valor no es JSON válido.');
        }
      }
      await configuracionApi.actualizar(definicion.clave, valorFinal);
      onGuardado();
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el cambio.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={`Editar: ${definicion.etiqueta}`}
      onCerrar={cargando ? undefined : cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton type="submit" form="form-editar-clave" cargando={cargando}>
            Guardar cambios
          </Boton>
        </>
      }
    >
      <form id="form-editar-clave" onSubmit={enviar} className="space-y-4">
        {definicion.nota && <p className="text-xs text-slate-500">{definicion.nota}</p>}

        {(definicion.tipo === 'texto' || definicion.tipo === 'url') && (
          <Campo
            etiqueta={definicion.etiqueta}
            name={definicion.clave}
            type={definicion.tipo === 'url' ? 'url' : 'text'}
            value={valorSimple}
            onChange={(e) => setValorSimple(e.target.value)}
            autoFocus
          />
        )}

        {definicion.tipo === 'textarea' && (
          <CampoTextarea
            etiqueta={definicion.etiqueta}
            name={definicion.clave}
            value={valorSimple}
            onChange={(e) => setValorSimple(e.target.value)}
            autoFocus
          />
        )}

        {definicion.tipo === 'objeto' && definicion.campos && (
          <div className="space-y-4">
            {definicion.campos.map((campo, i) => (
              <Campo
                key={campo}
                etiqueta={campo}
                name={campo}
                value={valorObjeto[campo] || ''}
                onChange={(e) => setValorObjeto((v) => ({ ...v, [campo]: e.target.value }))}
                autoFocus={i === 0}
              />
            ))}
          </div>
        )}

        {((definicion.tipo === 'objeto' && !definicion.campos) || definicion.tipo === 'arreglo') && (
          <CampoTextarea
            etiqueta={`${definicion.etiqueta} (JSON)`}
            name={definicion.clave}
            value={valorJson}
            onChange={(e) => setValorJson(e.target.value)}
            rows={8}
            className="font-mono"
            autoFocus
          />
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
