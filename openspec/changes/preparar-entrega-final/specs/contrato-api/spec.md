## ADDED Requirements

### Requirement: Identificar los recursos con UUID públicos
El sistema SHALL identificar cada recurso expuesto por la API (usuarios, cuentas, categorías, movimientos y presupuestos) con un UUID versión 4 generado por el servidor, y MUST usar ese mismo identificador en las rutas y en las referencias entre recursos. El cliente MUST NOT poder elegir el identificador de un recurso.

Origen: RT-08, requisito técnico que habilita todas las historias con datos (ver `docs/trazabilidad.md`).

#### Scenario: Recurso creado con un UUID
- **GIVEN** un usuario autenticado
- **WHEN** registra una cuenta, una categoría, un movimiento o un presupuesto
- **THEN** la respuesta devuelve un `id` con formato UUID versión 4, y el usuario creado al registrarse también se identifica con un UUID

#### Scenario: Referencias y consultas por UUID
- **GIVEN** un movimiento registrado en una cuenta y una categoría del usuario
- **WHEN** el usuario consulta, edita o elimina el movimiento usando su UUID
- **THEN** la operación se completa y el movimiento referencia su cuenta y su categoría por sus UUID

#### Scenario: Identificador mal formado
- **GIVEN** un usuario autenticado
- **WHEN** usa en una ruta un identificador que no es un UUID, o envía en el cuerpo una cuenta o categoría con un identificador que no es un UUID
- **THEN** la ruta responde 404 y el cuerpo se rechaza con 400 y el mensaje "El identificador no es válido"

#### Scenario: UUID de otro usuario
- **GIVEN** dos usuarios, cada uno con sus propias cuentas
- **WHEN** uno de ellos usa el UUID de una cuenta del otro, o envía un identificador propio al crear un recurso
- **THEN** la API responde 404 sin revelar datos del otro usuario, y el identificador enviado en el cuerpo se ignora
