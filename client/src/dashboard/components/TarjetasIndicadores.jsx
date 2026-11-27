import { Link } from 'react-router-dom';
import { MENSAJES } from '@finanzas/shared';
import { BarraProgreso } from '../../presupuestos/index.js';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { formatearMonto, formatearSaldo } from '../../shared/utils/formato.js';
import { useT } from '../../shared/preferencias/traducir.js';

const CIFRA = 'font-mono text-xl font-semibold tabular-nums';

function Tarjeta({ titulo, children }) {
  return (
    <div className="flex flex-col gap-1 rounded-superficie border border-filete bg-hoja p-4">
      <h3 className="text-[0.8125rem] font-medium text-tinta-suave">{titulo}</h3>
      {children}
    </div>
  );
}

function Presupuesto({ presupuesto, moneda }) {
  const t = useT();
  if (!presupuesto) {
    return (
      <>
        <p className="text-tinta-suave">{t(MENSAJES.dashboard.sinPresupuesto)}</p>
        <Link
          to="/presupuestos"
          className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
        >
          {t('Definir presupuesto')}
        </Link>
      </>
    );
  }
  return (
    <>
      <p className={`${CIFRA} ${presupuesto.excedido ? 'text-gasto' : ''}`}>{presupuesto.porcentaje} %</p>
      <BarraProgreso
        porcentaje={presupuesto.porcentaje}
        excedido={presupuesto.excedido}
        etiqueta={t('Presupuesto utilizado: {porcentaje}%', presupuesto)}
      />
      <p className="text-sm text-tinta-suave">
        {presupuesto.excedido
          ? t('Excedido por {monto}', { monto: formatearMonto(presupuesto.sobregiro, moneda) })
          : t('Quedan {monto}', { monto: formatearMonto(presupuesto.restante, moneda) })}
      </p>
    </>
  );
}

/** Indicadores del mes: ingresos, gastos, balance y presupuesto utilizado. Con error conserva los datos anteriores. */
export function TarjetasIndicadores({ estado, datos, mensaje, reintentar }) {
  const t = useT();
  if (!datos) {
    if (estado === 'error') {
      return (
        <div className="flex flex-col items-start gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
        </div>
      );
    }
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando indicadores…')}
      </p>
    );
  }

  const { moneda } = datos;
  return (
    <div className="flex flex-col gap-3">
      {estado === 'error' && (
        <div className="flex flex-wrap items-center gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
        </div>
      )}
      <section aria-label={t('Indicadores del período')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo={t('Total de ingresos')}>
          <p className={`${CIFRA} text-ingreso`}>{formatearMonto(datos.ingresos, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo={t('Total de gastos')}>
          <p className={`${CIFRA} text-gasto`}>{formatearMonto(datos.gastos, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo={t('Balance neto')}>
          <p className={CIFRA}>{formatearSaldo(datos.balance, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo={t('Presupuesto utilizado')}>
          <Presupuesto presupuesto={datos.presupuesto} moneda={moneda} />
        </Tarjeta>
      </section>
      {!datos.hayMovimientos && (
        <p className="rounded-superficie border border-filete bg-papel p-4 text-tinta-suave">
          {t(MENSAJES.dashboard.sinMovimientos)}
        </p>
      )}
    </div>
  );
}
