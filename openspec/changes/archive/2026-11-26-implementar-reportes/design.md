# Design

## Contexto

El diseño base (§13, §227, §250) ya fijó las decisiones principales: reportes en el servidor, jsPDF y SheetJS, PDF sin gráficos, máximo 5000 movimientos. Este documento solo concreta lo que falta para implementarlo.

## Decisiones

### 1. Dos rutas GET con los mismos filtros del historial
`GET /api/v1/reportes/movimientos.pdf` y `.xlsx` validan la consulta con un esquema que reutiliza `desde`, `hasta`, `tipo`, `categoriaId`, `cuentaId` y `moneda` de `esquemaConsultaMovimientos` (sin paginación ni orden). El servicio reutiliza `filtroDe` del servicio de movimientos (se exporta desde un módulo de utilidades para no duplicarlo).

### 2. Período por defecto
Si no llegan `desde` ni `hasta`, el reporte usa el mes en curso (de `periodoActual` y `limitesDelMes`) y lo indica en el encabezado; si llega alguno, el encabezado muestra el rango efectivo ("desde … hasta …" o "Todo el historial" cuando falta un extremo).

### 3. Lectura acotada y límite
El repositorio ofrece una lectura para reportes con tope: cuenta primero; si supera 5000 responde `ValidationError` 400 con el mensaje "El reporte supera los 5000 movimientos. Reduce el período o aplica más filtros"; si es 0 responde 400 con "No hay datos disponibles para exportar" (defensa en profundidad del botón deshabilitado). Si cabe, lee los movimientos ordenados por fecha y resuelve nombres de categoría y cuenta con una lectura por lote (nunca por fila). Siempre filtrado por `tenantId` en el repositorio.

### 4. Totales con decimal.js, por moneda
El servicio calcula, por moneda, ingresos, gastos y balance y, por moneda + tipo + categoría, el total y la cantidad. Los montos viajan como texto con dos decimales; en el Excel las celdas de monto son numéricas (formato `#,##0.00`) convertidas desde ese texto, porque una hoja de cálculo necesita números para sumar.

### 5. Vistas que generan los archivos
`views/reporte.view.js` expone `pdfDeMovimientos(datos)` y `excelDeMovimientos(datos)`, que devuelven `Buffer`. El PDF (A4 vertical, jsPDF + autotable) tiene: título, período, fecha de generación, un bloque de ingresos/gastos/balance por moneda y la tabla de movimientos con encabezado repetido por página. El Excel tiene la hoja "Movimientos" (fecha, tipo, categoría, cuenta, moneda, monto, descripción) y la hoja "Resumen" (moneda, tipo, categoría, cantidad, total). El archivo se genera completo en memoria y solo entonces se responde, de modo que un fallo nunca deja un archivo parcial.

### 6. Respuesta HTTP
El controlador responde `200` con el `Content-Type` del formato, `Content-Disposition: attachment; filename="movimientos-AAAA-MM.pdf"` y `Content-Length`. Los errores siguen el contrato JSON habitual, con lo que el cliente distingue un fallo de un archivo.

### 7. Cliente: descarga con fetch y Blob
El servicio de movimientos agrega `descargarReporte(formato, filtros)`: `fetch` con credenciales; si la respuesta no es correcta lee el error JSON y lanza su mensaje; si lo es devuelve el `Blob` y el nombre del encabezado. El hook `useExportacion` gestiona `cargando`, `error` y `lenta`: si la generación pasa de 3 segundos muestra un aviso de que continúa en segundo plano sin bloquear la interfaz. Si la descarga falla o se corta, muestra "Ocurrió un error al generar el archivo. Intenta nuevamente" y no dispara ninguna descarga. Los botones se deshabilitan cuando el historial filtrado no tiene movimientos, con el mensaje "No hay datos disponibles para exportar".

## Riesgos
- Generar PDF grandes bloquea el hilo de Node → tope de 5000 movimientos (ya decidido).
- SheetJS desde CDN: se fija la versión exacta en `server/package.json` para que `npm ci` sea reproducible.
