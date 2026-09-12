/**
 * pages/clientes/ListaClientes.jsx  (Fase 3)
 * -----------------------------------------
 * Lista de clientes con filtro por estado (servidor, GET /admin/clientes?estado=)
 * y búsqueda por nombre/WhatsApp/email (cliente, sobre la lista ya cargada --
 * el backend no expone búsqueda de texto en ese endpoint). Alta vía modal
 * conectado a POST /admin/clientes. Cada fila navega al detalle (/clientes/:id).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import * as clientesApi from '../../api/clientes';
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
import { ESTADOS_CLIENTE, COLOR_ESTADO_CLIENTE } from '../../utils/constantes';
import { fecha, humanizar, whatsapp as formatoWhatsapp } from '../../utils/formato';

const CAMPOS_VACIOS = { nombre: '', whatsapp: '', email: '' };

export function ListaClientes() {
  const navigate = useNavigate();
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data, cargando, error, refetch } = useApi(
    () => clientesApi.listar(estadoFiltro),
    [estadoFiltro]
  );

  const filas = Array.isArray(data) ? data : [];

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return filas;
    return filas.filter((c) =>
      [c.nombre, c.whatsapp, c.email].some((v) => v && String(v).toLowerCase().includes(texto))
    );
  }, [filas, busqueda]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">Alta, búsqueda y estado de los clientes registrados</p>
        </div>
        <Boton onClick={() => setModalAbierto(true)}>+ Nuevo cliente</Boton>
      </div>

      <Tarjeta>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Campo
            etiqueta="Buscar"
            name="busqueda"
            placeholder="Nombre, WhatsApp o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="sm:flex-1"
          />
          <Selector
            etiqueta="Estado"
            name="estado"
            placeholder="Todos"
            opciones={ESTADOS_CLIENTE.map((e) => ({ valor: e, texto: humanizar(e) }))}
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
            titulo="Sin clientes"
            descripcion={
              busqueda || estadoFiltro
                ? 'Nada coincide con el filtro actual.'
                : 'Aún no hay clientes registrados.'
            }
          />
        ) : (
          <Tabla
            claveFila={(f) => f.id}
            filas={filasFiltradas}
            onFila={(f) => navigate(`/clientes/${f.id}`)}
            columnas={[
              { clave: 'nombre', titulo: 'Nombre' },
              { clave: 'whatsapp', titulo: 'WhatsApp', render: (f) => formatoWhatsapp(f.whatsapp) },
              { clave: 'email', titulo: 'Email' },
              {
                clave: 'estado',
                titulo: 'Estado',
                render: (f) => <Etiqueta color={COLOR_ESTADO_CLIENTE[f.estado]}>{humanizar(f.estado)}</Etiqueta>,
              },
              { clave: 'fecha_registro', titulo: 'Registrado', render: (f) => fecha(f.fecha_registro) },
            ]}
          />
        )}
      </Tarjeta>

      <ModalNuevoCliente
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

/** POST /admin/clientes — body: { nombre, whatsapp, email? }. */
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
      await clientesApi.crear({
        nombre: campos.nombre.trim(),
        whatsapp: campos.whatsapp.trim(),
        email: campos.email.trim() || undefined,
      });
      setCampos(CAMPOS_VACIOS);
      onCreado();
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
        <Campo
          etiqueta="Nombre"
          name="nombre"
          value={campos.nombre}
          onChange={actualizar('nombre')}
          required
          autoFocus
        />
        <Campo
          etiqueta="WhatsApp"
          name="whatsapp"
          placeholder="+52..."
          value={campos.whatsapp}
          onChange={actualizar('whatsapp')}
          required
        />
        <Campo
          etiqueta="Email (opcional)"
          name="email"
          type="email"
          value={campos.email}
          onChange={actualizar('email')}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </Modal>
  );
}
