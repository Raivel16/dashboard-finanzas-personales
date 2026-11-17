# presupuestos Specification

## Purpose
Permitir que el usuario defina presupuestos mensuales (generales o por categoría) y haga seguimiento de su cumplimiento para controlar sus gastos.

Épica de origen: Presupuestos (HU-14, HU-15).

## Requirements

### Requirement: Definir presupuesto mensual
El sistema SHALL permitir que el usuario defina un presupuesto mensual general o por categoría de gasto, con montos mayores a cero y confirmación antes de reemplazar uno existente.

Origen: HU-14 (ver `docs/historias-de-usuario.md`).

#### Scenario: Definición exitosa de presupuesto mensual
- **GIVEN** el usuario se encuentra en la sección "Presupuesto"
- **WHEN** define un presupuesto mensual de 1500.00 para el mes en curso y lo guarda
- **THEN** el sistema almacena el presupuesto asociado a su userId y al período seleccionado, y lo muestra disponible para su seguimiento

#### Scenario: Asignación exitosa de presupuesto por categoría
- **GIVEN** el usuario ya cuenta con un presupuesto general definido para el mes
- **WHEN** adicionalmente asigna un sub-presupuesto de 300.00 a la categoría "Entretenimiento"
- **THEN** el sistema registra el presupuesto por categoría y lo utiliza para el seguimiento específico de dicha categoría

#### Scenario: Presupuesto rechazado por monto inválido
- **GIVEN** el usuario intenta definir un presupuesto mensual
- **WHEN** ingresa un monto negativo o deja el campo vacío
- **THEN** el sistema bloquea el guardado y muestra el mensaje "El presupuesto debe ser un monto mayor a 0"

#### Scenario: Confirmación para reemplazar un presupuesto existente
- **GIVEN** el usuario intenta definir un nuevo presupuesto para un mes que ya tiene un presupuesto previamente configurado
- **WHEN** confirma el guardado
- **THEN** el sistema le solicita confirmación explícita "Ya existe un presupuesto para este mes, ¿deseas reemplazarlo?" antes de sobrescribir el valor anterior

### Requirement: Seguimiento del cumplimiento del presupuesto
El sistema SHALL mostrar el porcentaje de avance del gasto respecto al presupuesto del mes y advertir al usuario cuando alcance el umbral de alerta o lo exceda.

Origen: HU-15 (ver `docs/historias-de-usuario.md`).

#### Scenario: Visualización exitosa del avance del presupuesto
- **GIVEN** el usuario tiene un presupuesto mensual de 1500.00 definido y ha registrado gastos por 900.00 en el mes en curso
- **WHEN** accede al indicador de seguimiento de presupuesto en el dashboard
- **THEN** el sistema muestra una barra de progreso indicando 60% de presupuesto utilizado y el monto restante disponible (600.00)

#### Scenario: Notificación al alcanzar el umbral de alerta
- **GIVEN** el usuario ha alcanzado el 90% de su presupuesto mensual
- **WHEN** el sistema detecta dicho umbral
- **THEN** muestra una notificación tipo Toastify de advertencia "Has utilizado el 90% de tu presupuesto mensual"

#### Scenario: Seguimiento no disponible sin presupuesto definido
- **GIVEN** el usuario no ha definido ningún presupuesto para el mes en curso
- **WHEN** intenta visualizar el indicador de seguimiento de presupuesto
- **THEN** el sistema muestra el mensaje "No has definido un presupuesto para este mes" junto con un acceso directo para crearlo

#### Scenario: Visualización del presupuesto excedido
- **GIVEN** el usuario ha registrado gastos que superan el 100% del presupuesto mensual definido
- **WHEN** visualiza el indicador de seguimiento
- **THEN** el sistema muestra la barra de progreso al límite en color de alerta (rojo), indica el porcentaje excedido (por ejemplo 115%) y el monto sobregirado
