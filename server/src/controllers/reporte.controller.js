// Capa HTTP de los reportes. Responde el archivo ya generado como descarga.
import { excelDeMovimientos, nombreArchivo, pdfDeMovimientos } from '../views/reporte.view.js';

const TIPOS = {
  pdf: { mime: 'application/pdf', generar: pdfDeMovimientos },
  xlsx: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    generar: excelDeMovimientos,
  },
};

export function crearReporteController({ reportes }) {
  const descargar = (extension) => async (req, res) => {
    const datos = await reportes.movimientos(req.usuario, req.consulta);
    const archivo = TIPOS[extension].generar(datos);
    res.set({
      'Content-Type': TIPOS[extension].mime,
      'Content-Disposition': `attachment; filename="${nombreArchivo(datos, extension)}"`,
      'Content-Length': archivo.length,
    });
    res.send(archivo);
  };
  return { pdf: descargar('pdf'), excel: descargar('xlsx') };
}
