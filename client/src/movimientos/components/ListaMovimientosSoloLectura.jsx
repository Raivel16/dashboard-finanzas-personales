import { Aviso } from '../../shared/components/Aviso.jsx';
import { FilaMovimiento } from './FilaMovimiento.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const nombreDe = (lista, id) => lista.find((elemento) => elemento.id === id)?.nombre;

/**
 * Movimientos recientes de otra persona para la consulta de administración: sin botones de crear, editar ni
 * eliminar. `cuentas` y `categorias` (de la misma persona) solo sirven para mostrar sus nombres.
 */
export function ListaMovimientosSoloLectura({ estado, mensaje, movimientos, total, cuentas = [], categorias = [] }) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando movimientos…')}
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;
  if (movimientos.length === 0) {
    return (
      <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
        {t('Este usuario aún no tiene movimientos')}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
        {movimientos.map((movimiento) => (
          <FilaMovimiento
            key={movimiento.id}
            movimiento={movimiento}
            categoria={nombreDe(categorias, movimiento.categoriaId)}
            cuenta={nombreDe(cuentas, movimiento.cuentaId)}
          />
        ))}
      </ul>
      {total > movimientos.length && (
        <p className="text-sm text-tinta-suave">
          {t('Se muestran los {cantidad} más recientes de {total}.', { cantidad: movimientos.length, total })}
        </p>
      )}
    </div>
  );
}
