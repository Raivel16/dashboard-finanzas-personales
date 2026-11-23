# Tasks

> Alcance: implementa HU-07 y HU-25 completas y las obligaciones de acceso de administrador de HU-04, HU-05 y HU-22 sobre cuentas (ver `proposal.md`) en la rama `feature/implementar-cuentas`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [ ] 1.1 Crear la rama `feature/implementar-cuentas` desde un `dev` actualizado y verificar con `git branch --show-current`
- [ ] 1.2 Corregir en `shared/` los mensajes de `esquemaCuenta` ("El nombre de la cuenta es obligatorio", "La moneda es obligatoria"), agregar `esquemaActualizarCuenta` (campos opcionales, al menos uno), `esquemaConsultaCuentas` (paginación, orden por nombre, filtros `tipo` y `moneda`) y los mensajes de cuenta ("Ya existe una cuenta con ese nombre", "No se puede eliminar una cuenta con movimientos asociados", "No se puede cambiar la moneda de una cuenta con movimientos asociados", avisos de creada, actualizada y eliminada); verificar con pruebas de `shared`

## 2. Servidor: cuentas propias [HU-07]

- [ ] 2.1 Crear `cuenta.model.js` (con el plugin de tenant, `Decimal128` y el índice único `(tenantId, nombre)` con intercalación `es` de fuerza 1), `cuenta.repository.js`, la vista (saldos como texto con dos decimales) y el servicio de creación y listado con `POST` y `GET /cuentas` (paginado, filtros `tipo` y `moneda`); verificar "Registro exitoso de una cuenta o medio de pago" (queda vinculada a su `tenantId` y `usuarioId`, con `saldoActual` igual al saldo inicial) y "Registro rechazado por nombre de cuenta vacío" (400 con "El nombre de la cuenta es obligatorio"), nombre repetido con otras mayúsculas o tildes (409 "Ya existe una cuenta con ese nombre") y dos creaciones simultáneas (una sola)
- [ ] 2.2 Implementar `GET /cuentas/:id` y `PATCH /cuentas/:id` (nombre y tipo); verificar "Edición exitosa de una cuenta existente" (el nombre nuevo no toca los movimientos asociados) y que renombrar a un nombre existente responde 409
- [ ] 2.3 Implementar `DELETE /cuentas/:id` con el puerto de conteo de movimientos (colección `movimientos`, campo `cuentaId`) y transacción; verificar "Eliminación impedida por movimientos asociados" (409 con el mensaje exacto y la cuenta se conserva), la eliminación de una cuenta sin movimientos y que los movimientos de otro inquilino no la bloquean
- [ ] 2.4 Verificar el aislamiento: una cuenta de otra persona, o un identificador inválido, responde 404 con "El recurso solicitado no existe o no tienes permiso para acceder a él" en lectura, edición y eliminación, y el cuerpo nunca puede fijar `tenantId` ni `usuarioId`

## 3. Servidor: moneda y saldo inicial [HU-25]

- [ ] 3.1 Validar moneda soportada y saldo inicial (negativo permitido, hasta dos decimales, con el máximo de un monto); verificar "Cuenta creada en otra moneda" (USD con saldo 200.00 se guarda como `"200.00"` en USD) y "Moneda no seleccionada" (400 con "La moneda es obligatoria"; una moneda no soportada dice "Selecciona una moneda válida")
- [ ] 3.2 Implementar la corrección del saldo inicial con `decimal.js` dentro de una transacción; verificar "Corrección del saldo inicial" (saldo inicial 100.00 y saldo actual 70.00, corregir a 120.00 deja el actual en 90.00 y los movimientos no cambian), con saldos negativos y decimales (sin errores de coma flotante) y que dos correcciones simultáneas dejan el saldo actual coherente
- [ ] 3.3 Implementar el cambio de moneda: con movimientos responde 409 "No se puede cambiar la moneda de una cuenta con movimientos asociados" y la cuenta no cambia ("Cambio de moneda impedido en una cuenta con movimientos"); sin movimientos se acepta y conserva el saldo; enviar la misma moneda siempre se acepta

## 4. Servidor: lectura de administrador [HU-04, HU-05, HU-22]

- [ ] 4.1 Agregar `GET /admin/usuarios/:id/cuentas` con `admin.repositorioLecturaDe` (solo lectura, paginado); verificar HU-04 (el administrador consulta las cuentas de cualquier usuario y un usuario estándar recibe 403), HU-22 (consulta, estado vacío para un usuario sin cuentas, y `PATCH`/`DELETE` sobre una cuenta ajena responde 404 sin cambiar nada) y HU-05 (un usuario no ve ni modifica las de otro conociendo su `id`)

## 5. Cliente [HU-07, HU-25, HU-22]

- [ ] 5.1 Crear el dominio `cuentas/` (servicio, `useCuentas`, `ListaCuentas`, página `/cuentas`) y registrar la ruta y el destino "Cuentas" en `router/`; verificar con pruebas el listado con saldo y símbolo de moneda ("$ 200.00"), el estado vacío con la acción de crear y el error de carga con reintento
- [ ] 5.2 Agregar el formulario de crear y editar (`useFormularioCuenta` con las reglas de `shared/`); verificar con pruebas "Registro exitoso", "Edición exitosa", "Registro rechazado por nombre de cuenta vacío" ("El nombre de la cuenta es obligatorio" y no llama a la API), "Moneda no seleccionada" ("La moneda es obligatoria"), "Cuenta creada en otra moneda", el nombre duplicado y "Cambio de moneda impedido" con el mensaje exacto junto al campo
- [ ] 5.3 Agregar la eliminación con confirmación (`confirmar`); verificar con pruebas la eliminación exitosa, "Eliminación impedida por movimientos asociados" (mensaje exacto y la cuenta se conserva) y que al cancelar no se llama a la API
- [ ] 5.4 Exportar `ListaCuentasSoloLectura` y `useCuentasDeUsuario` por `cuentas/index.js` y mostrarlas en el detalle de usuario de `administracion/` (estado vacío "Este usuario aún no tiene cuentas", sin botones de crear, editar ni eliminar); verificar con pruebas y que `npm run lint` no reporta fronteras rotas

## 6. Documentación e integración [RT-01, RT-06]

- [ ] 6.1 Verificar que el seed (`npm run seed -w server`) sigue creando cuentas coherentes con el modelo (índice único, saldos `Decimal128`) y que sus pruebas pasan
- [ ] 6.2 Documentar en el README las rutas de cuentas y la lectura de administrador; actualizar en `docs/trazabilidad.md` que las cuentas ya cumplen las obligaciones de administrador y que `implementar-movimientos` debe reemplazar el puerto de movimientos, recalcular el saldo y validar la cuenta dentro de su transacción; verificar que cada comando documentado se ejecuta
