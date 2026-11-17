# reportes-exportacion Specification

## Purpose
Permitir que el usuario exporte sus movimientos e indicadores financieros a PDF y Excel para conservarlos, imprimirlos, compartirlos o analizarlos externamente.

Épica de origen: Reportes y Exportación (HU-16, HU-17).

## Requirements

### Requirement: Exportar reporte financiero en PDF
El sistema SHALL permitir que el usuario exporte en formato PDF sus movimientos y/o indicadores financieros según los filtros aplicados.

Origen: HU-16 (ver `docs/historias-de-usuario.md`).

#### Scenario: Exportación exitosa de reporte financiero en PDF
- **GIVEN** el usuario se encuentra en la sección de historial o dashboard con datos filtrados según sus necesidades
- **WHEN** selecciona la opción "Exportar a PDF"
- **THEN** el sistema genera, mediante jsPDF, un documento PDF con los movimientos o indicadores correspondientes al filtro aplicado y lo descarga automáticamente al dispositivo del usuario

#### Scenario: Exportación con período por defecto
- **GIVEN** el usuario exporta un reporte en PDF sin aplicar ningún filtro previo
- **WHEN** confirma la exportación
- **THEN** el sistema genera el reporte considerando el período por defecto (mes en curso) e indica dicho período en el encabezado del documento

#### Scenario: Exportación deshabilitada sin datos disponibles
- **GIVEN** el usuario intenta exportar un reporte en PDF
- **WHEN** no existen movimientos que coincidan con los filtros aplicados
- **THEN** el sistema deshabilita el botón "Exportar a PDF" y muestra el mensaje "No hay datos disponibles para exportar"

#### Scenario: Generación controlada de PDF con alto volumen de movimientos
- **GIVEN** el usuario intenta exportar un reporte con un volumen muy alto de movimientos (por ejemplo, más de 1000 registros)
- **WHEN** confirma la exportación
- **THEN** el sistema procesa la generación del PDF mostrando un indicador de carga y, de exceder un tiempo razonable, informa al usuario que el proceso continúa en segundo plano sin bloquear la interfaz

### Requirement: Exportar reporte financiero en Excel
El sistema SHALL permitir que el usuario exporte sus movimientos financieros a un archivo Excel (.xlsx) según los filtros aplicados.

Origen: HU-17 (ver `docs/historias-de-usuario.md`).

#### Scenario: Exportación exitosa de movimientos a Excel
- **GIVEN** el usuario se encuentra en la sección de historial de movimientos con datos filtrados
- **WHEN** selecciona la opción "Exportar a Excel"
- **THEN** el sistema genera, mediante SheetJS, un archivo .xlsx con columnas correspondientes a fecha, tipo, categoría, cuenta, monto y descripción, y lo descarga al dispositivo del usuario

#### Scenario: Exportación con resumen por categoría y tipo
- **GIVEN** el usuario exporta un reporte a Excel con múltiples categorías filtradas
- **WHEN** el sistema genera el archivo
- **THEN** el archivo Excel incluye una hoja adicional de "Resumen" con los totales agrupados por categoría y tipo de movimiento

#### Scenario: Exportación deshabilitada sin datos disponibles
- **GIVEN** el usuario intenta exportar un reporte a Excel
- **WHEN** no existen movimientos que coincidan con los filtros aplicados
- **THEN** el sistema deshabilita el botón "Exportar a Excel" y muestra el mensaje "No hay datos disponibles para exportar"

#### Scenario: Cancelación segura de descarga ante interrupción de conexión
- **GIVEN** el usuario exporta un reporte a Excel mientras la conexión con el servidor se interrumpe a mitad de la generación
- **WHEN** ocurre el corte de conexión
- **THEN** el sistema cancela la descarga, muestra el mensaje "Ocurrió un error al generar el archivo. Intenta nuevamente" y no genera un archivo corrupto o incompleto
