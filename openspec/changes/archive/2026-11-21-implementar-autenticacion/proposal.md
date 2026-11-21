# Proposal

## Why

La base técnica ya está fusionada, pero la aplicación no tiene identidad: nadie puede registrarse, iniciar sesión ni proteger sus datos, y todas las épicas siguientes (cuentas, movimientos, presupuestos) dependen de saber quién es el usuario y de aislar sus datos por `tenantId`. Esta es la primera épica del plan de `docs/trazabilidad.md` (versión `v0.2.0`) y la que habilita al resto.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento que **ya está especificado** en `autenticacion-usuarios` para cinco historias: registro (HU-01), inicio de sesión (HU-02), recuperación de contraseña (HU-03), cierre de sesión (HU-18) y sesión activa durante el uso (HU-19).
- Servidor: endpoints bajo `/api/v1/auth` (registro, inicio de sesión, renovación, cierre de sesión, olvidé mi contraseña, restablecer contraseña y sesión actual), colecciones `usuarios`, `sesiones` y `tokensrecuperacion`, middleware de autenticación que valida el token de acceso y la sesión, bloqueo por intentos fallidos y correos de bienvenida y recuperación.
- Cliente: dominio `autenticacion/` con las pantallas de registro, inicio de sesión, "¿Olvidaste tu contraseña?" y restablecimiento; proveedor de sesión, rutas protegidas, renovación transparente del token y botón "Cerrar sesión" en el layout.
- Se agrega el código de error `SESSION_REVOKED` al contrato compartido, para el mensaje "Tu sesión se cerró, por favor inicia sesión nuevamente" de HU-19.
- **No cambia ningún requisito ni escenario**: las specs ya describen el comportamiento esperado, por eso el cambio declara `skip_specs: true`. Fuera de alcance, y asignado a otros cambios de `docs/trazabilidad.md`:
  - Perfil y cambio de contraseña (HU-20, HU-21): `implementar-perfil`.
  - Categorías predeterminadas al registrarse (HU-24): `implementar-categorias`, que agregará esa creación dentro del registro.
  - La sección "Administración" del dashboard y la gestión de roles (HU-22, HU-23): `implementar-control-acceso`. Este cambio solo deja el rol disponible en la sesión y en el layout.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de autenticacion-usuarios no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevos modelos, repositorios, servicios, controladores, vistas, rutas y middleware de autenticación; dependencia `jsonwebtoken`; nuevo código `SESSION_REVOKED` en `shared/`.
- **Cliente**: nuevo dominio `autenticacion/`; cambios en `shared/api/clienteHttp.js` (renovación automática), `AppLayout` (ranura de menú de usuario) y `router/` (rutas públicas y protegidas).
- **Datos**: tres colecciones nuevas con índices (`email` único, TTL en sesiones y tokens). El seed ya genera `usuarios` con la forma definida en el diseño.
- **Correo**: primer uso real del SMTP de Brevo (bienvenida y recuperación).
- **Trazabilidad**: rama `feature/implementar-autenticacion`; al completar los 20 escenarios y fusionar en `dev`, se marcan HU-01, HU-02, HU-03, HU-18 y HU-19 como hechas.
