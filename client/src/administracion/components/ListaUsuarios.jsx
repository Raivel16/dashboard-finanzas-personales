import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { ETIQUETAS_ROL } from '../etiquetas.js';
import { useT } from '../../shared/preferencias/traducir.js';

function Buscador({ texto, cambiarTexto, buscar }) {
  const t = useT();
  return (
    <form role="search" onSubmit={buscar} className="flex max-w-xl gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor="busqueda-usuarios" className="text-[0.8125rem] font-medium text-tinta-suave">
          {t('Buscar por nombre o correo')}
        </label>
        <input
          id="busqueda-usuarios"
          type="search"
          value={texto}
          onChange={cambiarTexto}
          maxLength={100}
          className="min-h-11 rounded-control border border-borde bg-hoja px-3 text-base text-tinta"
        />
      </div>
      <Boton type="submit" className="self-end">
        <Search aria-hidden="true" size={18} />
        {t('Buscar')}
      </Boton>
    </form>
  );
}

function Paginacion({ meta, irAPagina }) {
  const t = useT();
  if (meta.totalPages <= 1) return null;
  return (
    <nav aria-label={t('Paginación')} className="flex items-center gap-3">
      <Boton disabled={meta.page <= 1} onClick={() => irAPagina(meta.page - 1)}>
        {t('Anterior')}
      </Boton>
      <span className="text-sm text-tinta-suave">
        {t('Página {pagina} de {total}', { pagina: meta.page, total: meta.totalPages })}
      </span>
      <Boton disabled={meta.page >= meta.totalPages} onClick={() => irAPagina(meta.page + 1)}>
        {t('Siguiente')}
      </Boton>
    </nav>
  );
}

/** Presentación del listado de usuarios y del cambio de rol; los datos y acciones llegan por props. */
export function ListaUsuarios({
  estado,
  usuarios,
  meta,
  mensaje,
  texto,
  busqueda,
  cambiarTexto,
  buscar,
  irAPagina,
  reintentar,
  alCambiarRol,
  enCurso,
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      <Buscador texto={texto} cambiarTexto={cambiarTexto} buscar={buscar} />

      {estado === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <Aviso tipo="error">{mensaje}</Aviso>
          <Boton onClick={reintentar}>{t('Reintentar')}</Boton>
        </div>
      )}
      {estado === 'cargando' && (
        <p role="status" className="text-tinta-suave">
          {t('Cargando usuarios…')}
        </p>
      )}
      {estado === 'listo' && usuarios.length === 0 && (
        <p role="status" className="text-tinta-suave">
          {busqueda ? t('Ningún usuario coincide con "{busqueda}".', { busqueda }) : t('Todavía no hay usuarios.')}
        </p>
      )}

      {estado === 'listo' && usuarios.length > 0 && (
        <div className="overflow-x-auto rounded-superficie border border-filete bg-hoja">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">{t('Usuarios registrados')}</caption>
            <thead>
              <tr className="border-b border-filete text-sm text-tinta-suave">
                <th scope="col" className="px-4 py-3 font-medium">
                  {t('Usuario')}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  {t('Rol')}
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">{t('Datos')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-filete last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.nombre}</p>
                    <p className="text-sm text-tinta-suave">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={t('Rol de {nombre}', u)}
                      value={u.rol}
                      disabled={enCurso === u.id}
                      onChange={(evento) => alCambiarRol(u, evento.target.value)}
                      className="min-h-11 rounded-control border border-borde bg-hoja px-3 text-base text-tinta"
                    >
                      {Object.entries(ETIQUETAS_ROL).map(([valor, etiqueta]) => (
                        <option key={valor} value={valor}>
                          {t(etiqueta)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/administracion/usuarios/${u.id}`}
                      className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
                    >
                      {t('Ver datos')}
                      <span className="sr-only"> {t('de {nombre}', u)}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginacion meta={meta} irAPagina={irAPagina} />
    </div>
  );
}
