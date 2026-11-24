# Tasks

> Alcance: implementa HU-08, HU-09, HU-26 y HU-27 completas y las obligaciones de acceso de administrador de HU-04, HU-05 y HU-22 sobre movimientos (ver `proposal.md`) en la rama `feature/implementar-movimientos`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [ ] 1.1 Crear la rama `feature/implementar-movimientos` desde un `dev` actualizado y verificar con `git branch --show-current`
- [ ] 1.2 Agregar en `shared/` los mensajes de movimiento (creado, actualizado, eliminado, "El monto excede el saldo disponible de la cuenta", "La cuenta seleccionada no existe", "La categoría seleccionada no existe", "Selecciona una categoría de ingreso" y "Selecciona una categoría de gasto") y `esquemaActualizarMovimiento` (campos opcionales, al menos uno); corregir el mensaje de fecha vacía para que diga "La fecha es obligatoria" (la regla genérica lo concordaría en masculino); verificar con pruebas de `shared`

## 2. Servidor: registrar movimientos [HU-08]

- [ ] 2.1 Crear `movimiento.model.js` (plugin de tenant, `monto` `Decimal128`, `fecha` a las 00:00 UTC y los tres índices del diseño base), `movimiento.repository.js`, la vista (monto como texto con dos decimales, fecha `YYYY-MM-DD`) y `POST /movimientos` en transacción que guarda el movimiento con la moneda de su cuenta y ajusta `saldoActual`; verificar "Registro exitoso de un movimiento financiero" (gasto de 150.00 asociado a su `usuarioId`, saldo de la cuenta descontado) y que un ingreso suma
- [ ] 2.2 Verificar "Registro rechazado por monto o fecha inválidos" (monto negativo, cero o con más de dos decimales y fecha vacía responden 400 con "El monto debe ser mayor a 0, con hasta 2 decimales" y "La fecha es obligatoria", sin tocar el saldo) y el monto máximo
- [ ] 2.3 Verificar "Registro permitido con saldo insuficiente y advertencia": el gasto se registra y la respuesta lleva `meta.advertencias` con "El monto excede el saldo disponible de la cuenta"; un gasto con saldo suficiente no lleva advertencia
- [ ] 2.4 Implementar `GET /movimientos/:id` y verificar el aislamiento en lectura (404 con el mensaje estándar para el de otra persona o un id inválido) y que el cuerpo nunca puede fijar `tenantId`, `usuarioId` ni `moneda`

## 3. Servidor: editar y eliminar [HU-09]

- [ ] 3.1 Implementar `PATCH /movimientos/:id` en transacción (efecto contrario del valor guardado y efecto del nuevo, validando el resultado completo con el esquema compartido); verificar "Edición exitosa de un movimiento propio" (cambia monto, categoría y descripción, el saldo se recalcula) y "Edición rechazada por datos inválidos" (400 sin alterar el registro ni el saldo, también sin ningún campo)
- [ ] 3.2 Implementar `DELETE /movimientos/:id` en transacción; verificar "Eliminación exitosa de un movimiento propio" (el movimiento desaparece y el saldo revierte su efecto)
- [ ] 3.3 Verificar "Operación rechazada sobre un movimiento de otro usuario": `PATCH` y `DELETE` responden 404 y el movimiento y los saldos ajenos no cambian

## 4. Servidor: saldo consistente [HU-26]

- [ ] 4.1 Verificar "Saldo coherente tras varias operaciones" (saldo inicial 100.00, ingreso 50.00, gasto 30.00 y eliminar el ingreso dejan 70.00), con decimales sin errores de coma flotante y que operaciones simultáneas sobre la misma cuenta dejan un saldo igual a la fórmula
- [ ] 4.2 Implementar la verificación del saldo esperado dentro de la transacción (corrige y registra un aviso si difiere) y verificar con un saldo alterado a mano que se corrige y se avisa
- [ ] 4.3 Implementar `GET /movimientos` con `$setWindowFields` y `saldoResultante` por cuenta, orden `fecha`, `createdAt`, filtros del esquema compartido aplicados después de la ventana, orden y paginación; verificar "Saldo resultante en el historial" (calculado por fecha y orden de registro, igual con y sin filtros) y los filtros, el orden y la paginación
- [ ] 4.4 Verificar "Registro interrumpido no altera el saldo" forzando un fallo después de guardar el movimiento (no queda movimiento y el saldo sigue igual) y "Movimiento registrado con fecha anterior" (los saldos resultantes posteriores se recalculan y el saldo final es correcto)
- [ ] 4.5 Agregar el script `npm run verificar-saldos -w server` (lista las cuentas que difieren y termina con código 1); verificar con una prueba que fuerza una diferencia y otra sin diferencias

## 5. Servidor: coherencia [HU-27]

- [ ] 5.1 Verificar "Movimiento registrado en la moneda de su cuenta" (gasto de 40.00 en "Ahorros USD" queda en USD y baja el saldo) y "Cambio de cuenta al editar un movimiento" (pasa a PEN, la cuenta anterior sube 40.00 y la nueva baja 40.00)
- [ ] 5.2 Verificar "Categoría incompatible con el tipo" en la API (categoría de gasto con tipo ingreso responde 400 con "Selecciona una categoría de ingreso"), cuentas y categorías de otra persona o inexistentes (400 con "La cuenta seleccionada no existe" y "La categoría seleccionada no existe") y "Fecha futura rechazada" ("La fecha no puede ser futura"; la de hoy se acepta, según el reloj y la zona `America/Lima`)

## 6. Servidor: reemplazo de puertos y administración [HU-04, HU-05, HU-22]

- [ ] 6.1 Reemplazar `contarMovimientos` de `cuenta.repository.js` y `categoria.repository.js` por `contarPorCuenta` y `contarPorCategoria` del repositorio de movimientos; actualizar las pruebas de categorías y cuentas para usar movimientos reales y verificar "Eliminación impedida por movimientos asociados" (categoría y cuenta, 409 con el mensaje exacto y se conservan) y "Cambio de moneda impedido"
- [ ] 6.2 Agregar `GET /admin/usuarios/:id/movimientos` con `admin.repositorioLecturaDe` (solo lectura, paginado, orden `-fecha`); verificar HU-04 (el administrador consulta los movimientos de cualquier usuario y un usuario estándar recibe 403), HU-22 (consulta, estado vacío y `PATCH`/`DELETE` sobre un movimiento ajeno responde 404 sin cambiar nada) y HU-05 (un usuario no ve ni modifica los de otro)

## 7. Cliente: lista y registro [HU-08, HU-26, HU-27]

- [ ] 7.1 Exportar las funciones de lista de `cuentas/index.js` y `categorias/index.js`; crear el dominio `movimientos/` (servicio, `useMovimientos`, `ListaMovimientos`, página `/movimientos`) y registrar la ruta y el destino "Movimientos" en `router/`; verificar con pruebas el listado con monto con signo, moneda, categoría, cuenta y saldo resultante, el estado vacío con la acción de crear y el error de carga con reintento
- [ ] 7.2 Agregar el formulario "Nuevo movimiento" (`useFormularioMovimiento` con las reglas de `shared/`, categorías filtradas por tipo, fecha de hoy por defecto y sin fechas futuras); verificar con pruebas "Registro exitoso", "Registro rechazado por monto o fecha inválidos" ("El monto debe ser mayor a 0, con hasta 2 decimales" y "La fecha es obligatoria", sin llamar a la API), "Categoría incompatible con el tipo" ("Selecciona una categoría de ingreso" al cambiar el tipo con una categoría elegida) y "Fecha futura rechazada"
- [ ] 7.3 Mostrar la advertencia de saldo insuficiente que devuelve la API; verificar con una prueba "Registro permitido con saldo insuficiente y advertencia" (el movimiento aparece en la lista y se muestra "El monto excede el saldo disponible de la cuenta")

## 8. Cliente: editar y eliminar [HU-09, HU-27]

- [ ] 8.1 Agregar la edición en el mismo panel (precarga los valores); verificar con pruebas "Edición exitosa" (la lista y el saldo resultante se actualizan con lo que devuelve el servidor), "Edición rechazada por datos inválidos" y "Cambio de cuenta al editar un movimiento"
- [ ] 8.2 Agregar la eliminación con confirmación (`confirmar`); verificar con pruebas la eliminación exitosa (se quita la fila y se notifica) y que al cancelar no se llama a la API

## 9. Cliente: administración, documentación e integración [HU-22, RT-01, RT-06]

- [ ] 9.1 Exportar `ListaMovimientosSoloLectura` y `useMovimientosDeUsuario` por `movimientos/index.js` y mostrarlas en el detalle de usuario de `administracion/` (estado vacío "Este usuario aún no tiene movimientos", sin botones de crear, editar ni eliminar); verificar con pruebas y que `npm run lint` no reporta fronteras rotas
- [ ] 9.2 Verificar que el seed (`npm run seed -w server`) sigue creando movimientos coherentes con el modelo (índices, `Decimal128`, saldos que cuadran) y que sus pruebas pasan
- [ ] 9.3 Documentar en el README las rutas de movimientos, la lectura de administrador y `npm run verificar-saldos`; actualizar `docs/trazabilidad.md` (movimientos cumple las obligaciones de administrador y los puertos provisionales ya no existen); verificar que cada comando documentado se ejecuta
