/**
 * utils/configuracionClaves.js
 * -----------------------------------------
 * Las 14 claves de configuración precargadas por la migración 012 del
 * backend (database/migrations/012_create_configuracion.sql). La API
 * NO permite crear claves nuevas, solo editar estas.
 *
 * `tipo` guía qué editor renderiza el módulo Configuración (Fase 9):
 *   texto | textarea | url | objeto | arreglo
 */
export const CLAVES_CONFIG = [
  { clave: 'nombre_comercial', categoria: 'negocio', tipo: 'texto', etiqueta: 'Nombre comercial' },
  { clave: 'logo_url', categoria: 'negocio', tipo: 'url', etiqueta: 'Logo (URL)' },
  { clave: 'favicon_url', categoria: 'negocio', tipo: 'url', etiqueta: 'Favicon (URL)' },
  { clave: 'descripcion', categoria: 'negocio', tipo: 'textarea', etiqueta: 'Descripción' },
  { clave: 'whatsapp_contacto', categoria: 'negocio', tipo: 'texto', etiqueta: 'WhatsApp de contacto' },
  {
    clave: 'redes_sociales',
    categoria: 'negocio',
    tipo: 'objeto',
    etiqueta: 'Redes sociales',
    campos: ['facebook', 'instagram', 'tiktok'],
  },
  { clave: 'correo_soporte', categoria: 'negocio', tipo: 'texto', etiqueta: 'Correo de soporte' },
  {
    clave: 'metodos_pago',
    categoria: 'comercial',
    tipo: 'arreglo',
    etiqueta: 'Métodos de pago',
    nota: 'Cada ítem tiene al menos { tipo }. El backend expone el de tipo "Yape" a la app móvil.',
  },
  { clave: 'datos_bancarios', categoria: 'comercial', tipo: 'objeto', etiqueta: 'Datos bancarios' },
  { clave: 'mensaje_pago', categoria: 'comercial', tipo: 'textarea', etiqueta: 'Mensaje de pago' },
  { clave: 'terminos_condiciones', categoria: 'comercial', tipo: 'textarea', etiqueta: 'Términos y condiciones' },
  { clave: 'politicas_servicio', categoria: 'comercial', tipo: 'textarea', etiqueta: 'Políticas de servicio' },
  { clave: 'zona_horaria', categoria: 'sistema', tipo: 'texto', etiqueta: 'Zona horaria' },
  { clave: 'moneda', categoria: 'sistema', tipo: 'texto', etiqueta: 'Moneda (ISO 4217)' },
];
