import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/public-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App.jsx';
import { aplicarTemaGraficos } from './shared/utils/graficos.js';

aplicarTemaGraficos();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
