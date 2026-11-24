import { useState } from 'react';
import { MENSAJES, TIPOS_MOVIMIENTO, crearEsquemaMovimiento, fechaHoy } from '@finanzas/shared';
import { useFormulario } from '../../shared/hooks/useFormulario.js';
import { erroresPorCampo } from '../../shared/utils/erroresApi.js';
import { actualizarMovimiento, crearMovimiento } from '../services/movimientos.service.js';

const MENSAJE_CATEGORIA = {
  [TIPOS_MOVIMIENTO.INGRESO]: MENSAJES.movimiento.categoriaIngreso,
  [TIPOS_MOVIMIENTO.GASTO]: MENSAJES.movimiento.categoriaGasto,
};

/**
 * Formulario de registrar o editar un movimiento con las reglas de shared (los mismos mensajes que el servidor).
 * @param {{ panel: object, cuentas: object[], categorias: object[], alGuardar: Function }} opciones
 */
export function useFormularioMovimiento({ panel, cuentas, categorias, alGuardar }) {
  const editando = panel.modo === 'editar';
  const hoy = fechaHoy();
  const [errorGeneral, setErrorGeneral] = useState('');

  const formulario = useFormulario({
    esquema: crearEsquemaMovimiento({ hoy }),
    valoresIniciales: editando
      ? {
          tipo: panel.movimiento.tipo,
          monto: panel.movimiento.monto,
          categoriaId: panel.movimiento.categoriaId,
          cuentaId: panel.movimiento.cuentaId,
          fecha: panel.movimiento.fecha,
          descripcion: panel.movimiento.descripcion,
        }
      : {
          tipo: TIPOS_MOVIMIENTO.GASTO,
          monto: '',
          categoriaId: '',
          cuentaId: cuentas.length === 1 ? cuentas[0].id : '',
          fecha: hoy,
          descripcion: '',
        },
    alEnviar: async (datos) => {
      setErrorGeneral('');
      try {
        const { data, meta } = editando
          ? await actualizarMovimiento(panel.movimiento.id, datos)
          : await crearMovimiento(datos);
        alGuardar({ movimiento: data, editado: editando, advertencias: meta?.advertencias ?? [], alertas: meta?.alertas ?? [] });
      } catch (error) {
        const porCampo = erroresPorCampo(error);
        if (porCampo) formulario.fijarErrores(porCampo);
        else setErrorGeneral(error.message);
      }
    },
  });

  /** Al cambiar el tipo, una categoría del otro tipo se quita y se avisa (HU-27). */
  const cambiarTipo = (evento) => {
    const tipo = evento.target.value;
    const categoria = categorias.find((c) => c.id === formulario.valores.categoriaId);
    formulario.propsCampo('tipo').alCambiar(evento);
    if (categoria && categoria.tipo !== tipo) {
      formulario.cambiar('categoriaId', '');
      formulario.fijarErrores({ categoriaId: MENSAJE_CATEGORIA[tipo] });
    }
  };

  return {
    formulario,
    errorGeneral,
    editando,
    hoy,
    cambiarTipo,
    categoriasDelTipo: categorias.filter((c) => c.tipo === formulario.valores.tipo),
    cuentas,
  };
}
