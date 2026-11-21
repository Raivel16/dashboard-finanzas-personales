import { Link } from 'react-router-dom';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { ETIQUETAS_ROL } from '../etiquetas.js';

// Cada épica de datos llenará su sección; mientras tanto se muestra el estado vacío. Solo lectura: sin acciones.
const SECCIONES = [
  { clave: 'categorias', titulo: 'Categorías', vacio: 'Este usuario aún no tiene categorías' },
  { clave: 'cuentas', titulo: 'Cuentas', vacio: 'Este usuario aún no tiene cuentas' },
  { clave: 'movimientos', titulo: 'Movimientos', vacio: 'Este usuario aún no tiene movimientos' },
  { clave: 'presupuestos', titulo: 'Presupuestos', vacio: 'Este usuario aún no tiene presupuestos' },
];

export function DetalleUsuario({ estado, usuario, mensaje }) {
  if (estado === 'cargando') {
    return (
      <p role="status" className="text-tinta-suave">
        Cargando datos del usuario…
      </p>
    );
  }
  if (estado === 'error') return <Aviso tipo="error">{mensaje}</Aviso>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">{usuario.nombre}</h2>
        <p className="text-tinta-suave">{usuario.email}</p>
        <p className="text-sm text-tinta-suave">
          {ETIQUETAS_ROL[usuario.rol]} · Moneda principal {usuario.monedaPrincipal}
        </p>
      </div>
      <p className="text-sm text-tinta-suave">
        Vista de solo lectura: no puedes crear, editar ni eliminar sus datos.
      </p>
      {SECCIONES.map((seccion) => (
        <section
          key={seccion.clave}
          aria-labelledby={`seccion-${seccion.clave}`}
          className="flex flex-col gap-2"
        >
          <h3 id={`seccion-${seccion.clave}`} className="text-lg font-semibold">
            {seccion.titulo}
          </h3>
          <p className="rounded-superficie border border-filete bg-hoja p-4 text-tinta-suave">
            {seccion.vacio}
          </p>
        </section>
      ))}
      <Link
        to="/administracion"
        className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
      >
        Volver a usuarios
      </Link>
    </div>
  );
}
