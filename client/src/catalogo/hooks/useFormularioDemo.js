import { useState } from 'react';
import { esquemaCuenta } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';

/**
 * Formulario de demostración (solo desarrollo) que ejercita las reglas de RT-05: el monto va primero,
 * los errores se anuncian y el foco va al primer campo inválido. Reutiliza el esquema de cuenta de shared
 * para no inventar reglas: un nombre obligatorio y un saldo.
 */
export function useFormularioDemo({ alAsentar }) {
  const [asentado, setAsentado] = useState(false);
  const formulario = useFormulario({
    esquema: esquemaCuenta,
    valoresIniciales: { saldoInicial: '', nombre: '', tipo: 'efectivo', moneda: 'PEN' },
    alEnviar: () => {
      setAsentado(true);
      alAsentar?.();
    },
  });
  return { ...formulario, asentado };
}
