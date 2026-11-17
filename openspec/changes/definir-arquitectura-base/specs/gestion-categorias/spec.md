# Spec Delta

## ADDED Requirements

### Requirement: Categorías iniciales predeterminadas
El sistema SHALL crear para cada usuario nuevo, al registrarse, un conjunto de categorías predeterminadas de ingresos y gastos que le pertenecen y que puede editar o eliminar como cualquier otra categoría propia. No existen categorías globales compartidas entre usuarios.

Origen: HU-06 (ver `docs/historias-de-usuario.md`).

#### Scenario: Categorías disponibles tras el registro
- **GIVEN** un visitante completa su registro exitosamente
- **WHEN** ingresa por primera vez a la sección "Categorías"
- **THEN** el sistema muestra categorías predeterminadas de gasto (por ejemplo "Alimentación", "Transporte", "Vivienda", "Salud", "Entretenimiento", "Educación", "Otros gastos") y de ingreso (por ejemplo "Sueldo", "Ventas", "Otros ingresos"), todas asociadas a su usuario

#### Scenario: Edición de una categoría predeterminada sin afectar a otros usuarios
- **GIVEN** los usuarios A y B tienen la categoría predeterminada "Transporte"
- **WHEN** el usuario A la renombra a "Movilidad"
- **THEN** la categoría del usuario A se llama "Movilidad" y la del usuario B sigue llamándose "Transporte"
