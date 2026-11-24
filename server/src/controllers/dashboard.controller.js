// Capa HTTP del dashboard. Nunca toca modelos ni repositorios.
import { cuerpoExito } from '../views/respuesta.view.js';
import { graficosJson, indicadoresJson } from '../views/dashboard.view.js';

export function crearDashboardController({ dashboard }) {
  return {
    async monedas(req, res) {
      res.json(cuerpoExito(await dashboard.monedas(req.usuario)));
    },

    async indicadores(req, res) {
      res.json(cuerpoExito(indicadoresJson(await dashboard.indicadores(req.usuario, req.consulta))));
    },

    async graficos(req, res) {
      res.json(cuerpoExito(graficosJson(await dashboard.graficos(req.usuario, req.consulta))));
    },
  };
}
