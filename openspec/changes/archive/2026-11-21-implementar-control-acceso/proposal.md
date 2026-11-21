# Proposal

## Why

La aplicación ya identifica a cada persona y guarda su rol, pero ese rol todavía no restringe nada: no existe la sección "Administración", ningún administrador puede ver a los demás usuarios ni cambiarles el rol, y nada impide que un usuario estándar llame a una ruta de administración. Esta es la segunda épica de `docs/trazabilidad.md` (versión `v0.3.0`) y fija las reglas de acceso sobre las que se construirán todas las épicas de datos financieros.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento **ya especificado** en `control-acceso` que se puede ejecutar hoy: control de acceso por rol (HU-04), listado y búsqueda de usuarios y gestión de roles (HU-23) y la consulta en solo lectura de usuarios (HU-22).
- Servidor: middleware `requerirRol` y autorización también en la capa de servicios (defensa en profundidad), con registro en el log de cada acceso denegado; rutas `GET /api/v1/admin/usuarios`, `GET /api/v1/admin/usuarios/:id` y `PATCH /api/v1/admin/usuarios/:id/rol`; regla de "al menos un administrador" aplicada de forma atómica; y `RepositorioLectura`, el único camino por el que un administrador leerá datos de otro inquilino (no tiene métodos de escritura).
- Cliente: dominio `administracion/` con el listado paginado y buscable, el cambio de rol con confirmación (SweetAlert2) y el detalle de un usuario en solo lectura; destino "Administración" visible solo para administradores y protegido también por ruta.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). **Alcance acotado por dependencias:** HU-04 (administración ve datos ajenos), HU-05 (privacidad) y HU-22 (consulta de datos financieros) mencionan categorías, cuentas, movimientos y presupuestos, que aún no existen. Este cambio entrega y prueba el **mecanismo** con un recurso de prueba (acceso ajeno de solo lectura, 404 al intentar escribir, aislamiento por inquilino) y deja en el detalle del usuario las secciones con su estado vacío. Cuando cada épica de datos (`implementar-categorias`, `-cuentas`, `-movimientos`, `-presupuestos`) cree su recurso, debe agregar su ruta de lectura de administrador y las pruebas de los escenarios de HU-04, HU-05 y HU-22 sobre datos reales; `docs/trazabilidad.md` lo deja anotado. Por eso HU-04, HU-05 y HU-22 solo se marcan como hechas al cerrar esas épicas.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de control-acceso no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: middleware `requerirRol`, servicio `autorizacion` y servicio, controlador, vista y rutas de `admin`; `RepositorioLectura` en `base.repository.js`; métodos nuevos en `usuarioRepository` (listar con búsqueda, cambiar rol atómico).
- **Cliente**: nuevo dominio `administracion/`; `autenticacion/` expone `RutaAdmin`; `router/` registra las rutas de administración y el destino `soloAdmin`.
- **Datos**: ninguna colección de negocio nueva; una colección mínima `bloqueos` con un documento centinela para serializar los cambios de rol.
- **Seguridad**: el rol se sigue leyendo de la base en cada solicitud, así que una degradación surte efecto de inmediato.
- **Trazabilidad**: rama `feature/implementar-control-acceso`; HU-23 se marca hecha al fusionar; HU-04, HU-05 y HU-22 quedan parciales hasta las épicas de datos.
