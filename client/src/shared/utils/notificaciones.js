// Notificaciones (react-toastify) y confirmaciones (SweetAlert2) con el sistema visual de DESIGN.md.
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export const notificar = {
  exito: (mensaje) => toast.success(mensaje),
  error: (mensaje) => toast.error(mensaje),
  atencion: (mensaje) => toast.warning(mensaje),
  info: (mensaje) => toast.info(mensaje),
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
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: cancelar,
    customClass: {
      ...OPCIONES_DIALOGO.customClass,
      confirmButton: `swal-finanzas__confirmar${peligro ? ' swal-finanzas__confirmar--peligro' : ''}`,
    },
  });
  return resultado.isConfirmed;
}
