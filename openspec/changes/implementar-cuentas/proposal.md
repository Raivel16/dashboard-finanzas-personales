# Proposal

## Why

Con las categorías ya disponibles, falta el otro eje de cada movimiento: la cuenta o medio de pago de donde sale o adonde entra el dinero, con su moneda y su saldo. Sin cuentas no se pueden registrar movimientos (épica 5), ni consultar saldos, ni separar el dashboard por moneda. Esta es la cuarta épica de `docs/trazabilidad.md` (versión `v0.5.0`) y, como segundo recurso de datos, debe cumplir también las obligaciones de acceso de administrador que dejó `implementar-control-acceso`.

## What Changes

- Se implementa, en servidor y cliente, el comportamiento **ya especificado** en `gestion-cuentas`: registrar, editar, listar y eliminar las propias cuentas o medios de pago, sin eliminar cuentas con movimientos asociados (HU-07), y exigir moneda y saldo inicial, con corrección del saldo inicial y moneda fija cuando hay movimientos (HU-25).
- Servidor: modelo, repositorio, servicio, controlador, vista y rutas `GET/POST /api/v1/cuentas` y `GET/PATCH/DELETE /api/v1/cuentas/:id`; nombre único por usuario sin distinguir mayúsculas ni tildes, garantizado por un índice único; los importes se guardan como `Decimal128` y se calculan con `decimal.js`, nunca con `Number`; la corrección del saldo inicial ajusta el saldo actual en la misma transacción.
- Cliente: dominio `cuentas/` con la sección "Cuentas" (listado con saldo y moneda, crear, editar y eliminar con confirmación de SweetAlert2) y destino "Cuentas" en el menú.
- **Obligaciones de acceso de administrador (HU-04, HU-05, HU-22)**, tal como las deja escritas `docs/trazabilidad.md`: ruta `GET /api/v1/admin/usuarios/:id/cuentas` apoyada en `repositorioLecturaDe`, sección "Cuentas" en el detalle de usuario de "Administración" (solo lectura) y pruebas de los escenarios de esas tres historias sobre cuentas reales.
- Los mensajes que exigen las specs ("El nombre de la cuenta es obligatorio", "La moneda es obligatoria") se corrigen en el esquema compartido, que hoy usa otros textos.
- **No cambia ningún requisito ni escenario** (`skip_specs: true`). **Alcance acotado por dependencias:** "Eliminación impedida por movimientos asociados", "Cambio de moneda impedido" y la corrección del saldo con movimientos dependen de la colección de movimientos, que llega en la épica 5; aquí se prueban con documentos insertados en la colección `movimientos` (mismo nombre y campos que fija el diseño base), y `implementar-movimientos` los reutiliza. El recálculo automático del saldo al crear, editar o eliminar movimientos (HU-26) es de la épica 5. HU-04, HU-05 y HU-22 siguen parciales hasta movimientos y presupuestos; HU-07 y HU-25 se marcan hechas al fusionar.

## Capabilities

### New Capabilities
<!-- Ninguna: no se introduce comportamiento nuevo. -->

### Modified Capabilities
<!-- Ninguna: los requisitos de gestion-cuentas no cambian; este cambio solo los implementa. -->

## Impact

- **Servidor**: nuevos `cuenta.model.js`, `cuenta.repository.js`, `cuenta.service.js`, `cuenta.controller.js`, `cuenta.view.js` y `cuentas.routes.js`; `admin.routes.js` agrega la lectura de cuentas de otra persona.
- **Shared**: mensajes de cuenta y esquemas `esquemaActualizarCuenta` y `esquemaConsultaCuentas`; los mensajes obligatorios de nombre y moneda pasan a ser los de la spec.
- **Cliente**: nuevo dominio `cuentas/` (con un componente de solo lectura que `administracion/` reutiliza por su `index.js`); `router/` registra `/cuentas`; el detalle de usuario muestra sus cuentas.
- **Datos**: colección `cuentas` con índice único `(tenantId, nombre)` sin distinguir mayúsculas ni tildes; `saldoInicial` y `saldoActual` como `Decimal128`.
- **Trazabilidad**: rama `feature/implementar-cuentas`; HU-07 y HU-25 hechas al fusionar; HU-04, HU-05 y HU-22 siguen parciales y `docs/trazabilidad.md` registra qué recursos ya cumplen su obligación.
