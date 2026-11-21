# Design

## Context

La sesión ya carga al usuario desde la base en cada solicitud, así que `req.usuario.rol` es el rol **vigente**, no el del token (decisión 9 de `openspec/changes/archive/2026-11-21-definir-arquitectura-base/design.md`). `RepositorioBase` filtra siempre por el `tenantId` del usuario autenticado. Los requisitos están en `openspec/specs/control-acceso/spec.md`; el motivo y el alcance, en `proposal.md`.

Estado del código del que se parte:

- `ForbiddenError` (403 "Acceso no autorizado") y `TooManyRequests`, el manejador de errores, `validarCuerpo`, `validarConsulta` con `esquemaPaginacion` y `cuerpoLista` ya existen.
- `usuarioRepository` solo tiene operaciones por correo e id; no lista ni cambia roles.
- El cliente tiene `AppLayout` con destinos `soloAdmin` y `esAdmin` en la sesión, pero ninguna ruta de administración.

## Goals / Non-Goals

**Goals:**

- Que cada escenario de HU-23 y los de HU-04 y HU-22 que no dependen de datos financieros tengan una prueba automatizada que pase.
- Que ninguna operación de administración dependa solo de que la interfaz oculte una opción.
- Que el sistema nunca se quede sin administradores, ni siquiera con dos cambios simultáneos.
- Que el camino de lectura de datos ajenos exista ya, sea de solo lectura por construcción y esté probado, para que las épicas siguientes solo lo usen.

**Non-Goals:**

- Las pantallas y rutas de lectura de categorías, cuentas, movimientos y presupuestos ajenos: pertenecen a sus épicas (ver `proposal.md`).
- Desactivar o eliminar usuarios, auditoría persistente y permisos más finos que los dos roles.

## Decisions

### 1. Autorización en dos capas

`requerirRol('admin')` es un middleware que lee `req.usuario.rol` y, si no corresponde, lanza `ForbiddenError`. Además, `autorizacion.service.js` ofrece `exigirAdmin(actor)` y todo método del servicio de administración lo llama primero, así la regla no depende de que alguien monte bien las rutas. Cada denegación escribe en el log (`warn`) el usuario, el método, la ruta y el motivo, que es el "registro del intento" de la spec. Como el rol sale de la base en cada solicitud, una degradación se aplica en la siguiente petición sin esperar a que el token venza.

### 2. Rutas de administración bajo `/api/v1/admin`

`GET /admin/usuarios` (paginado, `q` busca por nombre o correo con la cadena escapada para que no se interprete como expresión regular, orden por nombre), `GET /admin/usuarios/:id` y `PATCH /admin/usuarios/:id/rol` con `{ rol }`. Un identificador inválido o inexistente responde 404 con el mensaje estándar. La vista de usuario para administración (`id`, `nombre`, `email`, `rol`, `activo`, `creadoEn`) nunca incluye el hash ni los datos de bloqueo.

### 3. Lectura de datos ajenos: `RepositorioLectura`

Se agrega a `base.repository.js` una clase `RepositorioLectura` con solo `encontrarPorId`, `listar`, `contar` y `agregar`, construida con el `tenantId` de la persona consultada (obtenido del servicio de administración tras comprobar el rol). No tiene métodos de escritura, y el cliente de administración solo usará rutas `GET`. Las rutas de escritura de cada recurso siguen usando el `tenantId` del propio solicitante, de modo que un administrador que apunte a un recurso ajeno obtiene el 404 estándar. Se prueba con un modelo de prueba: el administrador lee datos de otra persona, no puede escribirlos y el usuario estándar no accede a las rutas de lectura.

### 4. "Al menos un administrador", también con concurrencia

El cambio de rol se hace en una transacción (el replica set ya es obligatorio): se actualiza un documento centinela de la colección `bloqueos` (así dos transacciones simultáneas chocan y una se reintenta), se cuenta cuántos administradores quedarían y, si fuera cero, se rechaza con 409 "Debe existir al menos un administrador". Un administrador puede degradarse a sí mismo si hay otro. Cambiar al mismo rol que ya tiene es un éxito sin cambios.

### 5. Cliente: `administracion/` y doble protección

El dominio `administracion/` tiene servicio, hooks (`useUsuarios` con búsqueda y paginación, `useCambioRol`, `useDetalleUsuario`), componentes de presentación y las páginas `/administracion` y `/administracion/usuarios/:id`. El cambio de rol pide confirmación con `confirmar` (SweetAlert2): al cancelar no se llama a la API y el selector vuelve al valor anterior. `autenticacion/` exporta `RutaAdmin`: si la sesión no es de administrador muestra "Acceso no autorizado"; si la API responde 403 (rol degradado durante la sesión) se refresca la sesión con `/auth/me` para que el menú oculte la opción. El destino "Administración" se declara con `soloAdmin`. El detalle de un usuario muestra sus datos y las secciones de categorías, cuentas, movimientos y presupuestos con el estado vacío ("Este usuario aún no tiene movimientos"), sin botones de crear, editar ni eliminar; cada épica de datos llenará su sección.

## Risks / Trade-offs

- [Los escenarios de HU-04, HU-05 y HU-22 sobre datos reales no se pueden probar todavía] → Se prueba el mecanismo con un recurso de prueba y la obligación queda escrita en `docs/trazabilidad.md` para cada épica de datos; esas historias no se marcan hechas hasta entonces.
- [El documento centinela serializa todos los cambios de rol] → Los cambios de rol son raros y el costo es despreciable; evita una condición de carrera real.
- [Un administrador degradado ve la opción hasta su próxima petición] → La API ya lo deniega; el cliente refresca la sesión al recibir el 403.
