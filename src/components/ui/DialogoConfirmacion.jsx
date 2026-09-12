import { useState } from 'react';
import { Modal } from './Modal';
import { Boton } from './Boton';

/**
 * Confirmación para acciones sensibles (cancelar pedido, bloquear
 * cliente, desactivar usuario…).
 *
 *   <DialogoConfirmacion
 *     abierto={abierto}
 *     titulo="Cancelar pedido"
 *     mensaje="Esta acción no se puede deshacer."
 *     textoConfirmar="Sí, cancelar"
 *     variante="peligro"
 *     onConfirmar={async () => { await pedidosApi.cancelar(id); }}
 *     onCerrar={() => setAbierto(false)}
 *   />
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'primario',
  onConfirmar,
  onCerrar,
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function confirmar() {
    setCargando(true);
    setError(null);
    try {
      await onConfirmar?.();
      onCerrar?.();
    } catch (e) {
      setError(e?.message || 'No se pudo completar la acción.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={cargando ? undefined : onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
            {textoCancelar}
          </Boton>
          <Boton variante={variante} onClick={confirmar} cargando={cargando}>
            {textoConfirmar}
          </Boton>
        </>
      }
    >
      <p className="text-sm text-slate-600">{mensaje}</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </Modal>
  );
}
