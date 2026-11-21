import { Outlet } from 'react-router-dom';

/** Marco de las pantallas sin sesión: una hoja centrada sobre el papel. */
export function LayoutPublico() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <p className="text-lg font-semibold text-tapa">Finanzas personales</p>
      <main
        id="contenido"
        className="w-full max-w-[420px] rounded-superficie border border-filete bg-hoja p-6 shadow-flota"
      >
        <Outlet />
      </main>
    </div>
  );
}
