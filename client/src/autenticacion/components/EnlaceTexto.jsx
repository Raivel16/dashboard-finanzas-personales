import { Link } from 'react-router-dom';

export function EnlaceTexto({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center font-medium text-sello underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
