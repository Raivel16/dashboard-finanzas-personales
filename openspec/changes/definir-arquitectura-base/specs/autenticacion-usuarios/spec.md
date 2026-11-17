# Spec Delta

## MODIFIED Requirements

### Requirement: Inicio de sesión
El sistema SHALL permitir que un usuario registrado inicie sesión con su correo electrónico y contraseña, emitiendo un token JWT y dirigiéndolo al dashboard según su rol. La sesión MUST expirar tras 30 minutos sin actividad.

Origen: HU-02 (ver `docs/historias-de-usuario.md`).

#### Scenario: Inicio de sesión exitoso con credenciales válidas
- **GIVEN** el usuario registrado se encuentra en la pantalla de inicio de sesión
- **WHEN** ingresa su correo electrónico y contraseña correctos y presiona "Iniciar sesión"
- **THEN** el sistema valida las credenciales, genera un token JWT válido y redirige al usuario al dashboard principal según su rol

#### Scenario: Acceso ampliado para un administrador
- **GIVEN** el usuario ha iniciado sesión correctamente y su rol es "administrador"
- **WHEN** el sistema carga el dashboard
- **THEN** el usuario visualiza además la sección "Administración", con la consulta de solo lectura de los datos de todos los usuarios y la gestión de roles, no disponible para el rol "usuario estándar"

#### Scenario: Bloqueo temporal por credenciales incorrectas
- **GIVEN** el usuario se encuentra en la pantalla de inicio de sesión
- **WHEN** ingresa una contraseña incorrecta tres veces consecutivas
- **THEN** el sistema muestra el mensaje "Credenciales inválidas" y bloquea temporalmente los intentos de inicio de sesión durante 5 minutos

#### Scenario: Sesión invalidada por expiración del token
- **GIVEN** el usuario ha permanecido con la sesión iniciada sin actividad durante 30 minutos
- **WHEN** intenta realizar una acción dentro del dashboard
- **THEN** el sistema invalida la sesión, redirige a la pantalla de inicio de sesión y muestra el mensaje "Tu sesión ha expirado, por favor inicia sesión nuevamente"

## ADDED Requirements

### Requirement: Renovación de sesión por actividad
El sistema SHALL mantener activa la sesión mientras el usuario siga utilizando la aplicación, renovando sus credenciales de forma transparente sin pedirle que vuelva a iniciar sesión. Las credenciales de sesión MUST almacenarse en cookies inaccesibles para el código JavaScript del navegador.

Origen: HU-02 (ver `docs/historias-de-usuario.md`).

#### Scenario: Sesión renovada mientras el usuario está activo
- **GIVEN** el usuario inició sesión hace 2 horas y ha realizado acciones con intervalos menores a 30 minutos
- **WHEN** realiza una nueva acción en el dashboard
- **THEN** el sistema completa la acción sin solicitarle iniciar sesión nuevamente

#### Scenario: Credenciales no accesibles desde el navegador
- **GIVEN** el usuario ha iniciado sesión
- **WHEN** un script del navegador intenta leer las credenciales de sesión
- **THEN** las credenciales no están disponibles para el script porque solo viajan en cookies `httpOnly`

### Requirement: Cierre de sesión
El sistema SHALL permitir que el usuario cierre su sesión, invalidando sus credenciales en el servidor de modo que no puedan reutilizarse.

Origen: HU-02 (ver `docs/historias-de-usuario.md`).

#### Scenario: Cierre de sesión exitoso
- **GIVEN** el usuario ha iniciado sesión
- **WHEN** selecciona "Cerrar sesión"
- **THEN** el sistema invalida la sesión, elimina las cookies de sesión y redirige a la pantalla de inicio de sesión

#### Scenario: Credenciales reutilizadas tras el cierre de sesión
- **GIVEN** el usuario cerró su sesión
- **WHEN** se intenta renovar la sesión con las credenciales anteriores
- **THEN** el sistema rechaza la solicitud con código 401 y exige iniciar sesión nuevamente
