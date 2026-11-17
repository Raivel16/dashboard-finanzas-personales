# Spec Delta

## MODIFIED Requirements

### Requirement: Control de acceso basado en roles
El sistema SHALL restringir las funcionalidades disponibles según el rol asignado a cada usuario (usuario estándar o administrador), validando el rol vigente tanto en la interfaz como en la capa de servicios. El administrador MUST tener acceso de solo lectura a los datos de otros usuarios: no puede crear, editar ni eliminar sus categorías, cuentas, movimientos ni presupuestos.

Origen: HU-04 (ver `docs/historias-de-usuario.md`).

#### Scenario: Restricción de acceso para usuario estándar
- **GIVEN** un usuario con rol "usuario estándar" ha iniciado sesión
- **WHEN** intenta acceder a la sección de "Administración"
- **THEN** el sistema oculta dicha opción del menú y, si se accede directamente por URL, responde con un error 403 "Acceso no autorizado"

#### Scenario: Administración autorizada para usuario administrador
- **GIVEN** un usuario con rol "administrador" ha iniciado sesión
- **WHEN** accede a la sección de "Administración" y consulta las categorías, cuentas y movimientos de cualquier usuario
- **THEN** el sistema le muestra dicha información en modo de solo lectura, sin opciones para crear, editar ni eliminar

#### Scenario: Operación rechazada por falta de permisos
- **GIVEN** la capa de servicios recibe una solicitud para cambiar el rol de un usuario
- **WHEN** la solicitud proviene de un token JWT correspondiente a un rol "usuario estándar"
- **THEN** el sistema rechaza la operación en la capa de servicios con un error 403 y registra el intento de acceso no autorizado

#### Scenario: Denegación tras degradación de rol durante una sesión
- **GIVEN** un usuario administrador es degradado a "usuario estándar" durante una sesión activa
- **WHEN** el usuario intenta ejecutar nuevamente una acción exclusiva de administrador
- **THEN** el sistema revalida el rol vigente en el token/base de datos y deniega la operación aunque la interfaz aún mostrara la opción previamente

#### Scenario: Modificación de datos ajenos rechazada para el administrador
- **GIVEN** un usuario con rol "administrador" visualiza los movimientos de otro usuario
- **WHEN** envía directamente a la API una solicitud para editar o eliminar uno de esos movimientos
- **THEN** el sistema rechaza la operación con un error 404 y el movimiento permanece sin cambios

## ADDED Requirements

### Requirement: Gestión de roles por el administrador
El sistema SHALL permitir que un administrador liste a los usuarios registrados y cambie el rol de cualquiera de ellos entre "usuario estándar" y "administrador". El sistema MUST impedir que se quede sin ningún administrador.

Origen: HU-04 (ver `docs/historias-de-usuario.md`).

#### Scenario: Promoción de un usuario a administrador
- **GIVEN** un administrador se encuentra en el listado de usuarios de la sección "Administración"
- **WHEN** cambia el rol del usuario "ana@correo.com" a "administrador" y confirma la acción
- **THEN** el sistema actualiza el rol y el usuario obtiene acceso a la sección "Administración" en su siguiente acción

#### Scenario: Degradación del último administrador rechazada
- **GIVEN** existe un único usuario con rol "administrador"
- **WHEN** ese administrador intenta cambiar su propio rol a "usuario estándar"
- **THEN** el sistema rechaza el cambio con un error 409 y el mensaje "Debe existir al menos un administrador"
