# Spec Delta

## ADDED Requirements

### Requirement: Moneda en los reportes exportados
El sistema SHALL incluir la moneda de cada movimiento en los reportes PDF y Excel, y MUST presentar los totales agrupados por moneda, sin sumar montos de monedas distintas.

Origen: HU-16, HU-17 (ver `docs/historias-de-usuario.md`).

#### Scenario: Reporte Excel con movimientos en varias monedas
- **GIVEN** el usuario tiene movimientos en "PEN" y en "USD" dentro del período filtrado
- **WHEN** exporta el reporte a Excel
- **THEN** la hoja de movimientos incluye una columna "Moneda" y la hoja "Resumen" muestra los totales por categoría y tipo separados por moneda

#### Scenario: Reporte PDF con totales por moneda
- **GIVEN** el usuario tiene movimientos en "PEN" y en "USD" dentro del período filtrado
- **WHEN** exporta el reporte a PDF
- **THEN** el documento muestra el total de ingresos, gastos y balance por separado para cada moneda

### Requirement: Generación de reportes en el servidor
El sistema SHALL generar los archivos PDF y Excel en el servidor a partir de los datos del usuario autenticado y los filtros aplicados, y entregarlos como descarga. El archivo MUST contener solo datos del usuario que lo solicita.

Origen: HU-16, HU-17 (ver `docs/historias-de-usuario.md`).

#### Scenario: Descarga de un reporte generado por la API
- **GIVEN** el usuario aplicó el filtro del mes de agosto de 2026 en el historial
- **WHEN** selecciona "Exportar a Excel"
- **THEN** la API responde con un archivo .xlsx con nombre descriptivo (por ejemplo `movimientos-2026-08.xlsx`) que el navegador descarga

#### Scenario: Reporte aislado por usuario
- **GIVEN** los usuarios A y B tienen movimientos en el mismo período
- **WHEN** el usuario A exporta su reporte a PDF
- **THEN** el documento contiene solo los movimientos e indicadores del usuario A
