import { Boton } from '../../shared/components/Boton.jsx';
import { Monto } from '../../shared/components/Monto.jsx';
import { formatearFecha, formatearSaldo } from '../../shared/utils/formato.js';
import { useT } from '../../shared/preferencias/traducir.js';

const TIPOS = { ingreso: 'Ingreso', gasto: 'Gasto' };

function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.8125rem] font-medium text-tinta-suave">{etiqueta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** Detalle completo de un movimiento con las acciones de editar y eliminar. */
export function DetalleMovimiento({ movimiento, categoria, cuenta, alEditar, alEliminar, alCerrar }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <dl className="flex flex-col gap-3">
        <Dato etiqueta={t('Tipo')}>{t(TIPOS[movimiento.tipo])}</Dato>
        <Dato etiqueta={t('Monto')}>
          <Monto valor={movimiento.monto} moneda={movimiento.moneda} tipo={movimiento.tipo} className="text-lg font-semibold" />
        </Dato>
        <Dato etiqueta={t('Categoría')}>{categoria ?? t('Sin categoría')}</Dato>
        <Dato etiqueta={t('Cuenta')}>{cuenta ?? t('Sin cuenta')}</Dato>
        <Dato etiqueta={t('Fecha')}>{formatearFecha(movimiento.fecha)}</Dato>
        <Dato etiqueta={t('Descripción')}>{movimiento.descripcion || t('Sin descripción')}</Dato>
        {movimiento.saldoResultante !== undefined && (
          <Dato etiqueta={t('Saldo de la cuenta tras el movimiento')}>
            {formatearSaldo(movimiento.saldoResultante, movimiento.moneda)}
          </Dato>
        )}
        {movimiento.creadoEn && <Dato etiqueta={t('Registrado el')}>{formatearFecha(movimiento.creadoEn.slice(0, 10))}</Dato>}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Boton variante="primario" onClick={alEditar}>
          {t('Editar')}
        </Boton>
        <Boton onClick={alEliminar}>{t('Eliminar')}</Boton>
        <Boton onClick={alCerrar}>{t('Cerrar')}</Boton>
      </div>
    </div>
  );
}
