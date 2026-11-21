# Design

## Context

La sesión, las cookies, el middleware `autenticar`, los repositorios de identidad y el correo ya existen (ver `openspec/changes/archive/2026-11-21-implementar-autenticacion/design.md`). Los requisitos y escenarios están en `openspec/specs/autenticacion-usuarios/spec.md`; el motivo, en `proposal.md`.

Estado del código del que se parte:

- `autenticar` deja en `req.usuario` los datos de la persona y en `req.sesionId` la sesión actual.
- `usuarioRepository` tiene `buscarPorId`, `reservarIntento`, `reiniciarIntentos` y `actualizarPassword`; `sesionRepository` tiene `revocarTodasDeUsuario`.
- `shared/` define la contraseña segura, la moneda (`MONEDAS`) y el mensaje "El nombre es obligatorio" se obtiene de la regla `requerido` del nombre.
- En el cliente, el contexto de sesión guarda la persona en memoria y el menú de usuario la muestra.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-20 y HU-21 tenga una prueba automatizada que pase.
- Que una persona solo pueda leer y modificar **su propio** perfil: el identificador sale siempre de la sesión, nunca del cuerpo ni de la URL.
- Que adivinar la contraseña actual desde una sesión robada no esquive el límite de intentos de HU-02.

**Non-Goals:**

- Uso de la moneda principal en el dashboard, cambio de correo, eliminación de cuenta (ver `proposal.md`).

## Decisions

### 1. Recurso `perfil`, no `usuarios/:id`

`PATCH /api/v1/perfil` y `PUT /api/v1/perfil/contrasena` actúan sobre la persona autenticada. No hay identificador en la ruta, así que no existe forma de apuntar al perfil de otra persona (la consulta de usuarios ajenos por el administrador es de `implementar-control-acceso`). La lectura del perfil sigue siendo `GET /api/v1/auth/me`, que ya entrega nombre, correo, rol y moneda principal. Como `usuarios` es una colección de identidad, no usa `RepositorioBase`: se actualiza por `_id` tomado de `req.usuario.id`.

### 2. Actualización parcial con el correo fuera del esquema

`esquemaActualizarPerfil` define `nombre` (obligatorio, mismas reglas que el registro) y `monedaPrincipal` (opcional; si falta se conserva). El correo no está en el esquema y el validador descarta los campos desconocidos, así que enviarlo no tiene efecto: el servidor ignora el intento en lugar de fallar. El cliente muestra el correo como dato de solo lectura con la nota "El correo no se puede cambiar".

### 3. Cambio de contraseña

1. Se reserva un intento con `reservarIntento` (el mismo contador y bloqueo de HU-02). Si hay bloqueo vigente responde 429. Así, quien robe una sesión no puede adivinar la contraseña actual sin límite.
2. Se compara la contraseña actual con bcrypt. Si falla, responde 400 `VALIDATION_ERROR` con `details: [{ campo: 'passwordActual', mensaje: 'La contraseña actual es incorrecta' }]`. Se usa 400 y no 401 porque el cliente interpreta un 401 como pérdida de sesión.
3. Si es correcta se reinicia el contador y se comprueba que la nueva no sea igual a la actual (`400` con `campo: 'passwordNueva'` y "La nueva contraseña debe ser distinta de la actual"). Esta comparación va después de verificar la actual para no revelar nada a quien no la conoce.
4. Se guarda el hash nuevo, se revocan **todas las demás sesiones** (`revocarOtras(usuarioId, sesionId)`: filtro `_id != sesión actual`) y la actual sigue activa. Se envía el aviso por correo sin bloquear la respuesta, con un texto que aclara que la sesión desde la que se cambió sigue abierta.

La confirmación de la nueva contraseña ("confirma" en el escenario) se valida en el cliente con el mensaje compartido `Las contraseñas no coinciden`; el servidor no recibe ese campo.

### 4. Moneda principal solo se guarda

Se valida contra `MONEDAS` y se guarda en el usuario. Los datos financieros no se tocan porque no dependen de ella: cada cuenta y movimiento conserva su propia moneda (HU-25). El dashboard la leerá de la sesión cuando exista.

### 5. Cliente: dominio `perfil/` y nombre al instante

`perfil/` tiene servicio, hooks (`usePerfil`, `useCambiarContrasena`), componentes de presentación y la página `/perfil`. Importa del dominio `autenticacion/` solo por su `index.js`: `useSesion` y la nueva función `reemplazarUsuario`, que sustituye los datos de la persona en el contexto de sesión. Tras guardar, el nombre del menú cambia sin recargar y se muestra la notificación de éxito. El destino "Mi perfil" se agrega a la navegación del router.

## Risks / Trade-offs

- [El cambio de contraseña comparte el contador de intentos con el inicio de sesión: fallar al cambiarla puede bloquear también el login durante 5 minutos] → Es intencional y coherente con la cuenta única; el mensaje de bloqueo es el mismo de HU-02.
- [El aviso por correo puede no llegar] → No bloquea el cambio; se registra el error en el log, igual que en la recuperación.
- [Cambiar la moneda principal no afecta aún a ninguna pantalla] → Se prueba que se guarda y se entrega en la sesión; el efecto visible llega con `implementar-dashboard`.
