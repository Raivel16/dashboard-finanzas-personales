import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { FilaCuenta } from './FilaCuenta.jsx';
import { useT } from '../../shared/preferencias/traducir.js';

const BOTON_ICONO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-tinta-suave hover:bg-papel disabled:opacity-60';

/** Presentación de "Cuentas": los datos y las acciones llegan por props. */
export function ListaCuentas({ estado, mensaje, cuentas, eliminando, alCrear, alEditar, alEliminar, reintentar }) {
  const t = useT();
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        {t('Cargando cuentas…')}
      </p>
    );
  }
  if (estado === 'error') {
    return (
      <div className="flex flex-col items-start gap-3">
        <Aviso tipo="error">{mensaje}</Aviso>
        <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Boton variante="primario" onClick={alCrear} className="self-start">
        <Plus aria-hidden="true" size={18} />
        {t('Nueva cuenta')}
      </Boton>
      {cuentas.length === 0 ? (
        <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
          {t('Todavía no tienes cuentas. Crea una para registrar tus movimientos.')}
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-superficie border border-filete bg-hoja">
          {cuentas.map((cuenta) => (
            <FilaCuenta
              key={cuenta.id}
              cuenta={cuenta}
              acciones={
                <div className="flex shrink-0">
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={t('Editar {nombre}', cuenta)}
                    onClick={() => alEditar(cuenta)}
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                  <button
                    type="button"
                    className={BOTON_ICONO}
                    aria-label={t('Eliminar {nombre}', cuenta)}
                    disabled={eliminando === cuenta.id}
                    onClick={() => alEliminar(cuenta)}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
