import { CircleAlert, CircleCheck } from 'lucide-react';
import { Boton } from '../../shared/components/Boton.jsx';

function Fila({ etiqueta, correcto, textoOk, textoError }) {
  const Icono = correcto ? CircleCheck : CircleAlert;
  return (
    <li className="flex items-center gap-2 border-b border-filete py-2 last:border-b-0">
      <Icono aria-hidden="true" size={20} className={correcto ? 'text-ingreso' : 'text-gasto'} />
      <span className="font-medium">{etiqueta}</span>
      <span className={correcto ? 'text-ingreso' : 'text-gasto'}>{correcto ? textoOk : textoError}</span>
    </li>
  );
}

/** Presentación del estado de la API y de la base de datos; los datos llegan por props. */
export function EstadoSistema({ estado, datos, mensaje, alReintentar }) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Comprobando el estado del sistema…
      </p>
    );
  }

  if (estado === 'error') {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="flex items-start gap-2 font-medium text-gasto">
          <CircleAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
          <span>{mensaje}</span>
        </p>
        <Boton onClick={alReintentar}>Reintentar</Boton>
      </div>
    );
  }

  return (
    <ul aria-label="Estado del sistema" className="max-w-md">
      <Fila etiqueta="API" correcto={datos.api === 'ok'} textoOk="en línea" textoError="sin respuesta" />
      <Fila
        etiqueta="Base de datos"
        correcto={datos.baseDatos === 'ok'}
        textoOk="conectada"
        textoError="sin conexión"
      />
    </ul>
  );
}
