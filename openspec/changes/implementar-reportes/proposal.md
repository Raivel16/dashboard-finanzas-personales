# Proposal

## Why

Con movimientos, presupuestos y dashboard ya funcionando, falta que la persona pueda llevarse sus datos: conservarlos, imprimirlos, compartirlos o analizarlos en una hoja de cálculo. La novena y última épica de `docs/trazabilidad.md` (versión `v0.10.0`) construye los reportes exportables a PDF y Excel, generados en el servidor.

## What Changes

- Se implementa el comportamiento **ya especificado** en `reportes-exportacion`: exportar a PDF con encabezado del período (por defecto el mes en curso), botón deshabilitado sin datos y generación controlada con indicador de carga (HU-16); exportar a Excel con las columnas fecha, tipo, categoría, cuenta, moneda, monto y descripción, una hoja "Resumen" por categoría y tipo, botón deshabilitado sin datos y error sin archivo corrupto (HU-17); y totales separados por moneda, tope de 5000 movimientos y aislamiento por usuario (HU-31).
- Servidor: nuevo recurso `/api/v1/reportes` con `GET /reportes/movimientos.pdf` y `GET /reportes/movimientos.xlsx`, que reciben los mismos filtros del historial y responden el archivo con `Content-Disposition: attachment`. El PDF se genera con jsPDF + jspdf-autotable y el Excel con SheetJS (instalado desde `https://cdn.sheetjs.com/`), ambos en Node.
- Cliente: botones "Exportar a PDF" y "Exportar a Excel" en el historial de movimientos, que descargan con los filtros activos, se deshabilitan sin datos con el mensaje "No hay datos disponibles para exportar", muestran un indicador de carga y un error claro si falla.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). Fuera de alcance: gráficos dentro del PDF, programar o enviar reportes por correo, generación en segundo plano con cola de trabajos y reportes de presupuestos.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de reportes-exportacion no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevo recurso `reportes` en todas las capas (la vista genera los archivos); dependencias `jspdf`, `jspdf-autotable` y SheetJS en el workspace `server`; el repositorio de movimientos gana una lectura acotada con tope.
- **Cliente**: el dominio `movimientos/` gana los botones de exportación y un servicio de descarga; la descarga usa `fetch` con cookies y `Blob`.
- **Trazabilidad**: rama `feature/implementar-reportes`; HU-16, HU-17 y HU-31 hechas al fusionar.
