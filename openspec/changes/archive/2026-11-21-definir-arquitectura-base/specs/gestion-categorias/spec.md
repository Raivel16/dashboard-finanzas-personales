# Spec Delta

## ADDED Requirements

### Requirement: Recibir categorías predeterminadas
El sistema SHALL crear para cada usuario nuevo categorías predeterminadas propias, editables y eliminables. Las categorías globales compartidas entre usuarios MUST NOT existir.

Origen: HU-24 (ver `docs/historias-de-usuario.md`).

#### Scenario: Categorías disponibles tras el registro
- **GIVEN** un visitante completó su registro
- **WHEN** ingresa por primera vez a "Categorías"
- **THEN** el sistema muestra categorías de gasto ("Alimentación", "Transporte", "Vivienda", "Salud", "Entretenimiento", "Educación", "Otros gastos") y de ingreso ("Sueldo", "Ventas", "Otros ingresos") asociadas a su usuario

#### Scenario: Edición sin afectar a otros usuarios
- **GIVEN** los usuarios A y B tienen la categoría predeterminada "Transporte"
- **WHEN** el usuario A la renombra a "Movilidad"
- **THEN** la categoría del usuario B sigue llamándose "Transporte"

#### Scenario: Falla al crear las categorías iniciales
- **GIVEN** ocurre un error al crear las categorías durante el registro
- **WHEN** el sistema procesa el registro
- **THEN** no queda una cuenta incompleta y el visitante recibe un mensaje para intentarlo nuevamente

#### Scenario: Categoría predeterminada eliminada
- **GIVEN** el usuario eliminó una categoría predeterminada sin movimientos
- **WHEN** vuelve a iniciar sesión
- **THEN** la categoría no reaparece
