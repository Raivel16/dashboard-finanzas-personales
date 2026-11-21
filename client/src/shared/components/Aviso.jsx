import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const TIPOS = {
  error: { icono: CircleAlert, clase: 'border-gasto bg-gasto-fondo text-gasto', rol: 'alert' },
  atencion: { icono: CircleAlert, clase: 'border-atencion bg-atencion-fondo text-atencion', rol: 'alert' },
  exito: { icono: CircleCheck, clase: 'border-ingreso bg-ingreso-fondo text-ingreso', rol: 'status' },
  info: { icono: Info, clase: 'border-filete bg-papel text-tinta', rol: 'status' },
};

/** Mensaje destacado de un formulario. Lleva ícono y texto, no solo color. */
export function Aviso({ tipo = 'info', children }) {
  const { icono: Icono, clase, rol } = TIPOS[tipo];
  return (
    <p
      role={rol}
      className={`flex items-start gap-2 rounded-control border px-3 py-2 text-sm font-medium ${clase}`}
    >
      <Icono aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
