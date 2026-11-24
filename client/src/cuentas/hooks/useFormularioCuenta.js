import { useState } from 'react';
import { CODIGOS_ERROR, TIPOS_CUENTA, esquemaCuenta } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { actualizarCuenta, crearCuenta } from '../services/cuentas.service.js';

/**
 * Formulario de crear o editar una cuenta con las reglas de shared (los mismos mensajes que el servidor).
 * @param {{ panel: { modo: 'crear' } | { modo: 'editar', cuenta: object }, alGuardar: Function }} opciones
 */
export function useFormularioCuenta({ panel, alGuardar }) {
  const editando = panel.modo === 'editar';
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: esquemaCuenta,
    valoresIniciales: editando
      ? {
          nombre: panel.cuenta.nombre,
          tipo: panel.cuenta.tipo,
          moneda: panel.cuenta.moneda,
          saldoInicial: panel.cuenta.saldoInicial,
        }
      : { nombre: '', tipo: TIPOS_CUENTA.EFECTIVO, moneda: '', saldoInicial: '0.00' },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        const cuenta = editando ? await actualizarCuenta(panel.cuenta.id, datos) : await crearCuenta(datos);
        alGuardar(cuenta, editando);
      } catch (error) {
        if (error?.codigo === CODIGOS_ERROR.CONFLICT) {
          // Moneda con movimientos: junto a la moneda; nombre repetido: junto al nombre. Mensajes exactos del servidor.
          formulario.fijarErrores(
            error.message.includes('moneda') ? { moneda: error.message } : { nombre: error.message },
          );
        } else {
          const porCampo = erroresPorCampo(error);
          if (porCampo) formulario.fijarErrores(porCampo);
          else setErrorGeneral(error.message);
        }
      }
    },
  });

  return { formulario, errorGeneral, editando };
}
