// Notificaciones (react-toastify) y confirmaciones (SweetAlert2) con el sistema visual de DESIGN.md.
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { traducir } from '../preferencias/traducir.js';

// Los mensajes se traducen al idioma vigente (HU-32): pueden venir de MENSAJES, de la API o de t('…').
export const notificar = {
  exito: (mensaje) => toast.success(traducir(mensaje)),
  error: (mensaje) => toast.error(traducir(mensaje)),
  atencion: (mensaje) => toast.warning(traducir(mensaje)),
  info: (mensaje) => toast.info(traducir(mensaje)),
};

/** Configuración de SweetAlert2: los estilos viven en index.css (clases swal-finanzas). */
export const OPCIONES_DIALOGO = Object.freeze({
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    popup: 'swal-finanzas',
    confirmButton: 'swal-finanzas__confirmar',
    cancelButton: 'swal-finanzas__cancelar',
  },
});

/**
 * Pide confirmación antes de una acción destructiva o irreversible.
 * @returns {Promise<boolean>} true si la persona confirmó.
 */
export async function confirmar({
  titulo,
  texto,
  confirmar: textoConfirmar = 'Confirmar',
  cancelar = 'Cancelar',
  peligro = false,
}) {
  const resultado = await Swal.fire({
    ...OPCIONES_DIALOGO,
    title: traducir(titulo),
    text: traducir(texto),
    showCancelButton: true,
    confirmButtonText: traducir(textoConfirmar),
    cancelButtonText: traducir(cancelar),
    customClass: {
      ...OPCIONES_DIALOGO.customClass,
      confirmButton: `swal-finanzas__confirmar${peligro ? ' swal-finanzas__confirmar--peligro' : ''}`,
    },
  });
  return resultado.isConfirmed;
}
