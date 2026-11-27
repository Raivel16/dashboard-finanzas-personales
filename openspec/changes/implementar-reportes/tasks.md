# Tasks

> Alcance: implementa HU-16, HU-17 y HU-31 completas (ver `proposal.md`) en la rama `feature/implementar-reportes`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [ ] 1.1 Crear la rama `feature/implementar-reportes` desde un `dev` actualizado y verificar con `git branch --show-current`
- [ ] 1.2 Instalar `jspdf`, `jspdf-autotable` y SheetJS (desde `https://cdn.sheetjs.com/`) en el workspace `server`; agregar en `shared/` el esquema de consulta de reportes y los mensajes de la spec; verificar con pruebas de `shared`

## 2. Servidor [HU-16, HU-17, HU-31]

- [ ] 2.1 Crear repositorio acotado, servicio, vista, controlador y rutas de `GET /reportes/movimientos.xlsx` con las hojas "Movimientos" y "Resumen" por moneda; verificar con pruebas "Exportación exitosa de movimientos a Excel", "Exportación con resumen por categoría y tipo", "Reporte Excel con varias monedas" y "Reporte aislado por usuario"
- [ ] 2.2 Crear `GET /reportes/movimientos.pdf` con encabezado del período (por defecto el mes en curso) y totales por moneda; verificar con pruebas "Exportación exitosa de reporte financiero en PDF", "Exportación con período por defecto" y "Reporte PDF con totales por moneda"
- [ ] 2.3 Rechazar con 400 los reportes vacíos y los que superan 5000 movimientos; verificar con pruebas "Exportación sin datos" y "Excel que supera el límite"

## 3. Cliente [HU-16, HU-17, HU-31]

- [ ] 3.1 Agregar a `movimientos/` el servicio de descarga, el hook `useExportacion` y los botones "Exportar a PDF" y "Exportar a Excel" con los filtros activos; verificar con pruebas "Exportación exitosa de reporte financiero en PDF" y "Exportación exitosa de movimientos a Excel"
- [ ] 3.2 Deshabilitar los botones sin datos con el mensaje "No hay datos disponibles para exportar"; verificar con pruebas "Exportación deshabilitada sin datos disponibles" (PDF y Excel)
- [ ] 3.3 Mostrar el indicador de carga y el aviso de proceso en segundo plano si tarda, y el error "Ocurrió un error al generar el archivo. Intenta nuevamente" sin descargar nada; verificar con pruebas "Generación controlada de PDF con alto volumen de movimientos" y "Cancelación segura de descarga ante interrupción de conexión"

## 4. Documentación e integración [RT-01]

- [ ] 4.1 Documentar en el README las rutas de reportes; verificar que `npm run lint`, `npm test` y `npm run build` pasan
