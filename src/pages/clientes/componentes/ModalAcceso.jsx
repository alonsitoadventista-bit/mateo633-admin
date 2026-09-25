/**
 * pages/clientes/componentes/ModalAcceso.jsx  (Clientes CRM, F2 visual)
 * -----------------------------------------
 * PUT /admin/clientes/:id/estado — "Acceso" del cliente (clientes.estado:
 * activo/inactivo/bloqueado). En F1 era una tarjeta fija en la ficha; en F2
 * se abre desde el menú ⋯ porque se usa poco. Misma lógica y confirmación.
 */
import { useEffect, useState } from 'react';
import * as clientesApi from '../../../api/clientes';
import { Boton, Etiqueta, Modal, Selector } from '../../../components/ui';
import { COLOR_ESTADO_CLIENTE, ESTADOS_CLIENTE, TEXTO_ACCESO_CLIENTE } from '../../../utils/constantes';
import { humanizar } from '../../../utils/formato';

const texto = (e) => TEXTO_ACCESO_CLIENTE[e] || humanizar(e);

export function ModalAcceso({ abierto, cliente, onCerrar, onCambiado }) {
  const [nuevo, setNuevo] = useState(cliente.acceso);
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (abierto) {
      setNuevo(cliente.acceso);
      setConfirmando(false);
      setError(null);
    }
  }, [abierto, cliente.acceso]);

  async function guardar() {
    setCargando(true);
    setError(null);
    try {
      await clientesApi.actualizarEstado(cliente.id, nuevo);
      onCambiado();
      onCerrar();
    } catch (e) {
      setError(e?.message || 'No se pudo cambiar el acceso.');
    } finally {
      setCargando(false);
    }
  }

  const hayCambio = nuevo !== cliente.acceso;
  const peligro = nuevo === 'bloqueado';

  return (
    <Modal
      abierto={abierto}
      titulo="Acceso del cliente"
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          {confirmando ? (
            <Boton variante={peligro ? 'peligro' : 'primario'} onClick={guardar} cargando={cargando}>
              Sí, cambiar a {texto(nuevo)}
            </Boton>
          ) : (
            <Boton variante={peligro ? 'peligro' : 'primario'} disabled={!hayCambio} onClick={() => setConfirmando(true)}>
              Guardar
            </Boton>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-texto-suave">Acceso actual de {cliente.nombre}</p>
          <Etiqueta color={COLOR_ESTADO_CLIENTE[cliente.acceso]}>{texto(cliente.acceso)}</Etiqueta>
        </div>
        <Selector
          etiqueta="Cambiar a"
          name="nuevo-acceso"
          opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: texto(e) }))}
          value={nuevo}
          onChange={(e) => {
            setNuevo(e.target.value);
            setConfirmando(false);
          }}
        />
        <p className="text-xs text-texto-suave">
          Bloquear impide que el cliente entre a la app. No cambia sus servicios ni su estado comercial.
        </p>
        {confirmando && (
          <p className="text-sm text-amber-300">
            ¿Cambiar el acceso de "{cliente.nombre}" de "{texto(cliente.acceso)}" a "{texto(nuevo)}"? Confirma con el botón.
          </p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
