# Proposal

## Why

La aplicación ya autentica a las personas y separa roles, pero todavía no guarda ningún dato financiero: no hay forma de clasificar un ingreso o un gasto. Las categorías son el primer recurso de datos y la base de los movimientos, los presupuestos por categoría y los gráficos del dashboard. Esta es la tercera épica de `docs/trazabilidad.md` (versión `v0.4.0`) y, además, es la primera que debe cumplir las obligaciones de acceso de administrador que dejó `implementar-control-acceso`.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento **ya especificado** en `gestion-categorias`: crear, editar, listar y eliminar las propias categorías de ingresos y gastos, sin nombres duplicados por tipo y sin eliminar categorías con movimientos asociados (HU-06), y recibir categorías predeterminadas propias al registrarse (HU-24).
- Servidor: modelo, repositorio, servicio, controlador, vista y rutas `GET/POST /api/v1/categorias` y `PATCH/DELETE /api/v1/categorias/:id`; nombre único por usuario y tipo sin distinguir mayúsculas, garantizado por un índice único con intercalación; el registro crea al usuario y sus diez categorías en **una sola transacción**, de modo que un fallo no deja una cuenta a medias.
- Cliente: dominio `categorias/` con la sección "Categorías" (gastos e ingresos, crear, editar y eliminar con confirmación de SweetAlert2, selector de ícono) y destino "Categorías" en el menú.
- **Obligaciones de acceso de administrador (HU-04, HU-05, HU-22)**, tal como las deja escritas `docs/trazabilidad.md`: ruta `GET /api/v1/admin/usuarios/:id/categorias` apoyada en `repositorioLecturaDe`, sección "Categorías" en el detalle de usuario de "Administración" (solo lectura) y pruebas de los escenarios de esas tres historias sobre categorías reales.
- Pequeños ajustes de apoyo: el esquema compartido valida el ícono contra una lista cerrada, y el seed reutiliza `CATEGORIAS_PREDETERMINADAS` de `shared/` en lugar de su copia.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). **Alcance acotado por dependencias:** el escenario "Eliminación impedida por movimientos asociados" depende de la colección de movimientos, que llega en la épica 5; aquí se comprueba contra documentos de movimiento insertados en la colección `movimientos` (mismo nombre y campos que fija el diseño base), y `implementar-movimientos` lo reutiliza sin cambios. Por eso HU-04, HU-05 y HU-22 siguen parciales hasta cerrar cuentas, movimientos y presupuestos; HU-06 y HU-24 se marcan hechas al fusionar.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de gestion-categorias no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevos `categoria.model.js`, `categoria.repository.js`, `categoria.service.js`, `categoria.controller.js`, `categoria.view.js` y `categorias.routes.js`; `auth.service.js` y `usuario.repository.js` pasan a crear al usuario y sus categorías dentro de una transacción; `admin.routes.js` agrega la lectura de categorías de otra persona; `scripts/seed.js` usa la constante compartida.
- **Shared**: lista `ICONOS_CATEGORIA`, validación del ícono y mensajes de categoría y de fallo de registro.
- **Cliente**: nuevo dominio `categorias/` (con un componente de solo lectura que `administracion/` reutiliza por su `index.js`); `router/` registra `/categorias`; el detalle de usuario muestra sus categorías.
- **Datos**: colección `categorias` con índice único `(tenantId, tipo, nombre)` sin distinguir mayúsculas; las cuentas registradas antes de este cambio (solo datos de desarrollo) no reciben categorías de forma retroactiva.
- **Trazabilidad**: rama `feature/implementar-categorias`; HU-06 y HU-24 hechas al fusionar; HU-04, HU-05 y HU-22 siguen parciales y `docs/trazabilidad.md` registra qué recursos ya cumplen su obligación.
