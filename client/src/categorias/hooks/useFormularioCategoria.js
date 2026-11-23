import { useState } from 'react';
import { CODIGOS_ERROR, ICONO_CATEGORIA_POR_DEFECTO, esquemaCategoria } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { actualizarCategoria, crearCategoria } from '../services/categorias.service.js';

/** Al editar solo cambian nombre e ícono: el tipo se muestra pero no se envía. */
const ESQUEMA_EDICION = { nombre: esquemaCategoria.nombre, icono: esquemaCategoria.icono };

/**
 * Formulario de crear o editar una categoría con las reglas de shared (los mismos mensajes que el servidor).
 * @param {{ panel: { modo: 'crear' } | { modo: 'editar', categoria: object }, alGuardar: Function }} opciones
 */
export function useFormularioCategoria({ panel, alGuardar }) {
  const editando = panel.modo === 'editar';
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: editando ? ESQUEMA_EDICION : esquemaCategoria,
    valoresIniciales: editando
      ? { nombre: panel.categoria.nombre, icono: panel.categoria.icono }
      : { nombre: '', tipo: 'gasto', icono: ICONO_CATEGORIA_POR_DEFECTO },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        const categoria = editando
          ? await actualizarCategoria(panel.categoria.id, datos)
          : await crearCategoria(datos);
        alGuardar(categoria, editando);
      } catch (error) {
        // Nombre repetido: el 409 se muestra junto al campo, con el mensaje exacto del servidor.
        if (error?.codigo === CODIGOS_ERROR.CONFLICT) formulario.fijarErrores({ nombre: error.message });
        else {
          const porCampo = erroresPorCampo(error);
          if (porCampo) formulario.fijarErrores(porCampo);
          else setErrorGeneral(error.message);
        }
      }
    },
  });

  return {
    formulario,
    errorGeneral,
    editando,
    tipo: editando ? panel.categoria.tipo : formulario.valores.tipo,
  };
}
