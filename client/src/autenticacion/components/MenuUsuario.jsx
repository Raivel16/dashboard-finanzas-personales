import { LogOut } from 'lucide-react';

/** Datos de la persona y botón para cerrar sesión. Se muestra sobre la barra de color tapa. */
export function MenuUsuario({ usuario, alCerrarSesion, compacto = false }) {
  return (
    <div className={`flex ${compacto ? 'items-center gap-2' : 'flex-col gap-2 px-3'} text-tapa-texto`}>
      {!compacto && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{usuario.nombre}</p>
          <p className="truncate text-xs text-tapa-texto-suave">{usuario.email}</p>
        </div>
      )}
      <button
        type="button"
        onClick={alCerrarSesion}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-tapa-texto-suave px-3 text-sm font-medium hover:bg-white/10"
      >
        <LogOut aria-hidden="true" size={18} />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
}
