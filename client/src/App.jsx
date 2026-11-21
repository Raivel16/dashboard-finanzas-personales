import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { crearRouterNavegador } from './router/index.jsx';

export default function App() {
  const [router] = useState(() => crearRouterNavegador());
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="bottom-right" newestOnTop />
    </>
  );
}
