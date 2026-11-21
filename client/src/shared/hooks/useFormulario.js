import { useEffect, useRef, useState } from 'react';
import { validar } from '@finanzas/shared';

/**
 * Estado y validación de un formulario con los esquemas de shared (los mismos mensajes que el servidor).
 * Si hay errores al enviar, el foco va al primer campo inválido.
 *
 * @param {object} opciones
 * @param {object} opciones.esquema  esquema de @finanzas/shared
 * @param {object} opciones.valoresIniciales
 * @param {(datos: object) => Promise<void> | void} opciones.alEnviar  recibe los datos ya saneados
 */
export function useFormulario({ esquema, valoresIniciales, alEnviar }) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const formularioRef = useRef(null);

  useEffect(() => {
    if (intentosFallidos > 0) formularioRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [intentosFallidos]);

  const cambiar = (campo, valor) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErrores((anteriores) => (anteriores[campo] ? { ...anteriores, [campo]: undefined } : anteriores));
  };

  const enviar = async (evento) => {
    evento?.preventDefault();
    const resultado = validar(esquema, valores);
    if (!resultado.valido) {
      setErrores(Object.fromEntries(resultado.errores.map((e) => [e.campo, e.mensaje])));
      setIntentosFallidos((n) => n + 1);
      return false;
    }
    setErrores({});
    setEnviando(true);
    try {
      await alEnviar(resultado.datos);
      return true;
    } finally {
      setEnviando(false);
    }
  };

  /** Muestra errores que vienen del servidor ({ campo: mensaje }) y lleva el foco al primer campo inválido. */
  const fijarErrores = (porCampo) => {
    setErrores(porCampo);
    setIntentosFallidos((n) => n + 1);
  };

  const reiniciar = () => {
    setValores(valoresIniciales);
    setErrores({});
  };

  /** Props listas para un <Campo>. */
  const propsCampo = (campo) => ({
    id: `campo-${campo}`,
    nombre: campo,
    valor: valores[campo] ?? '',
    error: errores[campo],
    alCambiar: (evento) => cambiar(campo, evento.target.value),
  });

  return { valores, errores, enviando, formularioRef, cambiar, enviar, reiniciar, fijarErrores, propsCampo };
}
