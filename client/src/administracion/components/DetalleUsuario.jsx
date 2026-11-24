import { Link } from 'react-router-dom';
import { ListaCategoriasSoloLectura } from '../../categorias/index.js';
import { ListaCuentasSoloLectura } from '../../cuentas/index.js';
import { ListaMovimientosSoloLectura } from '../../movimientos/index.js';
import { ListaPresupuestosSoloLectura } from '../../presupuestos/index.js';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { ETIQUETAS_ROL } from '../etiquetas.js';

export function DetalleUsuario({ estado, usuario, mensaje, categorias, cuentas, movimientos, presupuestos }) {
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
      <section aria-labelledby="seccion-categorias" className="flex flex-col gap-2">
        <h3 id="seccion-categorias" className="text-lg font-semibold">
          Categorías
        </h3>
        <ListaCategoriasSoloLectura {...categorias} />
      </section>
      <section aria-labelledby="seccion-cuentas" className="flex flex-col gap-2">
        <h3 id="seccion-cuentas" className="text-lg font-semibold">
          Cuentas
        </h3>
        <ListaCuentasSoloLectura {...cuentas} />
      </section>
      <section aria-labelledby="seccion-movimientos" className="flex flex-col gap-2">
        <h3 id="seccion-movimientos" className="text-lg font-semibold">
          Movimientos
        </h3>
        <ListaMovimientosSoloLectura
          {...movimientos}
          cuentas={cuentas.cuentas}
          categorias={[...categorias.gastos, ...categorias.ingresos]}
        />
      </section>
      <section aria-labelledby="seccion-presupuestos" className="flex flex-col gap-2">
        <h3 id="seccion-presupuestos" className="text-lg font-semibold">
          Presupuestos
        </h3>
        <ListaPresupuestosSoloLectura
          {...presupuestos}
          categorias={[...categorias.gastos, ...categorias.ingresos]}
        />
      </section>
      <Link
        to="/administracion"
        className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
      >
        Volver a usuarios
      </Link>
    </div>
  );
}
