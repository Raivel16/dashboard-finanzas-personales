import { Link } from 'react-router-dom';
import { MENSAJES } from '@finanzas/shared';
import { BarraProgreso } from '../../presupuestos/index.js';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { formatearMonto, formatearSaldo } from '../../shared/utils/formato.js';

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
  if (!presupuesto) {
    return (
      <>
        <p className="text-tinta-suave">{MENSAJES.dashboard.sinPresupuesto}</p>
        <Link
          to="/presupuestos"
          className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
        >
          Definir presupuesto
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
        etiqueta={`Presupuesto utilizado: ${presupuesto.porcentaje}%`}
      />
      <p className="text-sm text-tinta-suave">
        {presupuesto.excedido
          ? `Excedido por ${formatearMonto(presupuesto.sobregiro, moneda)}`
          : `Quedan ${formatearMonto(presupuesto.restante, moneda)}`}
      </p>
    </>
  );
}

/** Indicadores del mes: ingresos, gastos, balance y presupuesto utilizado. Con error conserva los datos anteriores. */
export function TarjetasIndicadores({ estado, datos, mensaje, reintentar }) {
  if (!datos) {
    if (estado === 'error') {
      return (
        <div className="flex flex-col items-start gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      );
    }
    return (
      <p role="status" className="text-tinta-suave">
        Cargando indicadores…
      </p>
    );
  }

  const { moneda } = datos;
  return (
    <div className="flex flex-col gap-3">
      {estado === 'error' && (
        <div className="flex flex-wrap items-center gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>Reintentar</Boton>
        </div>
      )}
      <section aria-label="Indicadores del período" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Total de ingresos">
          <p className={`${CIFRA} text-ingreso`}>{formatearMonto(datos.ingresos, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo="Total de gastos">
          <p className={`${CIFRA} text-gasto`}>{formatearMonto(datos.gastos, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo="Balance neto">
          <p className={CIFRA}>{formatearSaldo(datos.balance, moneda)}</p>
        </Tarjeta>
        <Tarjeta titulo="Presupuesto utilizado">
          <Presupuesto presupuesto={datos.presupuesto} moneda={moneda} />
        </Tarjeta>
      </section>
      {!datos.hayMovimientos && (
        <p className="rounded-superficie border border-filete bg-papel p-4 text-tinta-suave">
          {MENSAJES.dashboard.sinMovimientos}
        </p>
      )}
    </div>
  );
}
