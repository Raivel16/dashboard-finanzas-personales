import { useState } from 'react';
import { MENSAJES, esquemaPresupuesto } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { confirmar } from '../../shared/utils/notificaciones.js';
import { crearPresupuesto, reemplazarPresupuesto } from '../services/presupuestos.service.js';
import { mesActual } from './usePresupuestos.js';

/** ¿Es el presupuesto de esa misma clave (mes, moneda y categoría; vacío = general)? */
const mismaClave = (item, datos) =>
  item.periodo === datos.periodo && item.moneda === datos.moneda && (item.categoriaId ?? '') === (datos.categoriaId ?? '');

/**
 * Formulario de definir o cambiar un presupuesto con las reglas de shared (los mismos mensajes que el servidor).
 * Si ya existe uno para el mismo mes, moneda y categoría pide confirmación antes de reemplazarlo.
 * @param {{ panel: { modo: 'crear' } | { modo: 'editar', presupuesto: object }, periodo: string, items: object[], alGuardar: Function }} opciones
 */
export function useFormularioPresupuesto({ panel, periodo, items, alGuardar }) {
  const editando = panel.modo === 'editar';
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: esquemaPresupuesto,
    valoresIniciales: editando
      ? {
          periodo: panel.presupuesto.periodo,
          moneda: panel.presupuesto.moneda,
          categoriaId: panel.presupuesto.categoriaId ?? '',
          monto: panel.presupuesto.monto,
        }
      : {
          periodo: periodo < mesActual() ? mesActual() : periodo,
          moneda: items[0]?.moneda ?? 'PEN',
          categoriaId: '',
          monto: '',
        },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      if (datos.periodo < mesActual()) {
        formulario.fijarErrores({ periodo: MENSAJES.presupuesto.mesPasado });
        return;
      }
      const existente = editando ? panel.presupuesto : items.find((item) => mismaClave(item, datos));
      if (existente && !editando) {
        const acepto = await confirmar({
          titulo: 'Reemplazar presupuesto',
          texto: MENSAJES.presupuesto.existente,
          confirmar: 'Reemplazar',
        });
        if (!acepto) return; // sin confirmar no se llama a la API
      }
      try {
        const presupuesto = existente
          ? await reemplazarPresupuesto(existente.id, { monto: datos.monto })
          : await crearPresupuesto(datos);
        alGuardar({ presupuesto, reemplazado: Boolean(existente) });
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
      }
    },
  });

  return { formulario, errorGeneral, editando };
}
