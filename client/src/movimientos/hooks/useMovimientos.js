import { useCallback, useEffect, useState } from 'react';
import { MENSAJES } from '@finanzas/shared';
import { listarCategorias } from '../../categorias/index.js';
import { listarCuentas } from '../../cuentas/index.js';
import { confirmar, notificar } from '../../shared/utils/notificaciones.js';
import { eliminarMovimiento, listarMovimientos } from '../services/movimientos.service.js';

const mensajeAlerta = (porcentaje, categoria) =>
  categoria ? MENSAJES.presupuesto.alertaCategoria(porcentaje, categoria) : MENSAJES.presupuesto.alerta(porcentaje);
const mensajeExcedido = (categoria) =>
  categoria ? MENSAJES.presupuesto.alertaExcedidoCategoria(categoria) : MENSAJES.presupuesto.alertaExcedido;

/**
 * Sección "Movimientos": historial paginado con el saldo que dejó cada uno, las cuentas y categorías para los
 * formularios, el panel de registrar o editar y la eliminación con confirmación.
 * `estado`: cargando | listo | error. `panel`: null o { modo: 'crear' | 'editar' | 'detalle', movimiento }.
 */
export function useMovimientos() {
  const [pagina, setPagina] = useState(1);
  const [filtros, setFiltros] = useState({}); // aplicados: desde, hasta, tipo, categoriaId, cuentaId
  const [intento, setIntento] = useState(0);
  // Última carga terminada. Mientras llega la siguiente (otra página, o tras guardar) se sigue mostrando la anterior.
  const [resultado, setResultado] = useState(null);
  const [panel, setPanel] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    const control = new AbortController();
    Promise.all([
      listarMovimientos({ page: pagina, filtros, signal: control.signal }),
      listarCuentas({ signal: control.signal }),
      listarCategorias({ signal: control.signal }),
    ])
      .then(([historial, cuentas, categorias]) =>
        setResultado({ movimientos: historial.data, meta: historial.meta, cuentas, categorias }),
      )
      .catch((error) => {
        if (error?.name !== 'AbortError') setResultado({ error: MENSAJES.movimiento.errorHistorial });
      });
    return () => control.abort();
  }, [pagina, filtros, intento]);

  const categoriasCargadas = resultado?.categorias;

  let estado = 'cargando';
  if (resultado) estado = resultado.error ? 'error' : 'listo';

  /** Aplicar o limpiar filtros vuelve a la primera página. */
  const aplicarFiltros = useCallback((nuevos) => {
    setFiltros(nuevos);
    setPagina(1);
  }, []);
  const limpiarFiltros = useCallback(() => aplicarFiltros({}), [aplicarFiltros]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);
  const cerrarPanel = useCallback(() => setPanel(null), []);

  /** Tras crear o editar: el saldo resultante de otras filas cambia, así que se vuelve a pedir el historial. */
  const guardado = useCallback(
    ({ editado, advertencias = [], alertas = [] }) => {
      setPanel(null);
      notificar.exito(editado ? MENSAJES.movimiento.actualizado : MENSAJES.movimiento.creado);
      for (const advertencia of advertencias) notificar.atencion(advertencia);
      for (const alerta of alertas) {
        const categoria = (categoriasCargadas ?? []).find((c) => c.id === alerta.categoriaId)?.nombre;
        if (alerta.umbral >= 100) notificar.error(mensajeExcedido(categoria));
        else notificar.atencion(mensajeAlerta(alerta.porcentaje, categoria));
      }
      recargar();
    },
    [recargar, categoriasCargadas],
  );

  const eliminar = async (movimiento) => {
    const acepto = await confirmar({
      titulo: 'Eliminar movimiento',
      texto: 'Se eliminará el movimiento y el saldo de la cuenta volverá a como estaba. Esta acción no se puede deshacer.',
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (!acepto) return; // sin confirmar no se llama a la API
    setEliminando(movimiento.id);
    try {
      await eliminarMovimiento(movimiento.id);
      notificar.exito(MENSAJES.movimiento.eliminado);
      recargar();
    } catch (error) {
      notificar.error(error.message);
    } finally {
      setEliminando(null);
    }
  };

  return {
    estado,
    mensaje: resultado?.error ?? '',
    movimientos: resultado?.movimientos ?? [],
    meta: resultado?.meta ?? null,
    cuentas: resultado?.cuentas ?? [],
    categorias: resultado?.categorias ?? [],
    pagina,
    filtros,
    hayFiltros: Object.values(filtros).some(Boolean),
    aplicarFiltros,
    limpiarFiltros,
    panel,
    eliminando,
    irAPagina: setPagina,
    abrirCrear: () => setPanel({ modo: 'crear' }),
    abrirEditar: (movimiento) => setPanel({ modo: 'editar', movimiento }),
    abrirDetalle: (movimiento) => setPanel({ modo: 'detalle', movimiento }),
    cerrarPanel,
    guardado,
    eliminar,
    reintentar: recargar,
  };
}
