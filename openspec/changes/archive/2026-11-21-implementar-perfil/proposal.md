# Proposal

## Why

Con el registro y el inicio de sesión ya fusionados, una persona puede entrar a la aplicación pero no puede mantener sus datos: no puede corregir su nombre, elegir la moneda en la que quiere ver su dashboard ni cambiar su contraseña si sospecha que alguien la conoce. Este cambio cierra la épica 1 de `docs/trazabilidad.md` (versión `v0.2.0`) y deja disponible la moneda principal que usarán las épicas de cuentas, presupuestos y dashboard.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento que **ya está especificado** en `autenticacion-usuarios` para dos historias: gestionar mi perfil (HU-20) y cambiar mi contraseña (HU-21), 8 escenarios en total.
- Servidor: `PATCH /api/v1/perfil` (nombre y moneda principal; el correo no se puede enviar ni cambiar) y `PUT /api/v1/perfil/contrasena` (contraseña actual y nueva). El cambio de contraseña conserva la sesión actual, cierra las demás y avisa por correo.
- Cliente: dominio `perfil/` con la pantalla "Mi perfil" (datos, moneda principal, correo de solo lectura y formulario de cambio de contraseña con confirmación), un destino "Mi perfil" en la navegación y la actualización inmediata del nombre en el menú de la persona.
- Se agregan al contrato compartido los esquemas `esquemaActualizarPerfil` y `esquemaCambiarContrasena` y los mensajes "La contraseña actual es incorrecta" y "La nueva contraseña debe ser distinta de la actual".
- **No cambia ningún requisito ni escenario**: las specs ya describen el comportamiento esperado, por eso el cambio declara `skip_specs: true`. Fuera de alcance:
  - Que el dashboard use la moneda principal: pertenece a `implementar-dashboard`; este cambio solo la guarda y la entrega en la sesión.
  - Cambiar el correo, eliminar la cuenta y exportar datos personales: no están en las historias.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de autenticacion-usuarios no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevo servicio, controlador, rutas y vista de perfil; un método nuevo en el repositorio de usuarios (actualizar datos) y otro en el de sesiones (revocar las demás); reutiliza la reserva atómica de intentos de HU-02.
- **Cliente**: nuevo dominio `perfil/`; el dominio `autenticacion/` expone una función para reemplazar los datos de la persona en la sesión; `router/` registra la ruta `/perfil`.
- **Datos**: ninguna colección nueva; solo cambian `nombre` y `monedaPrincipal` del usuario. Los datos financieros existentes no se tocan.
- **Correo**: aviso de contraseña actualizada (la plantilla ya existe).
- **Trazabilidad**: rama `feature/implementar-perfil`; al completar los 8 escenarios y fusionar en `dev`, se marcan HU-20 y HU-21 como hechas y la épica 1 queda lista para `v0.2.0`.
