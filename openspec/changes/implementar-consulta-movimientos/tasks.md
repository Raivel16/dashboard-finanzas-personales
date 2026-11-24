# Tasks

> Alcance: implementa HU-10 y HU-11 completas (ver `proposal.md`) en la rama `feature/implementar-consulta-movimientos`. No cambia requisitos. Cada grupo incluye sus propias pruebas.

## 1. Preparación [RT-01]

- [x] 1.1 Crear la rama `feature/implementar-consulta-movimientos` desde un `dev` actualizado y verificar con `git branch --show-current`
- [x] 1.2 Cambiar en `shared/` el mensaje del rango inválido a "La fecha inicial no puede ser mayor a la fecha final" y agregar el mensaje del historial ("No se pudo cargar el historial. Intenta nuevamente"); verificar con pruebas de `shared`

## 2. Servidor: historial y filtros [HU-10, HU-11]

- [x] 2.1 Probar en la API "Consulta exitosa del historial de movimientos" (al menos 10 movimientos, paginado, fecha descendente, con tipo, categoría, cuenta, monto y descripción), "Visualización del detalle de un movimiento" (`GET /movimientos/:id`) y "Visualización del historial sin movimientos" (lista vacía)
- [x] 2.2 Probar "Filtrado exitoso por fecha y categoría", "Combinación exitosa de filtros" (tipo y cuenta), "Filtro rechazado por rango de fechas inválido" (400 con el mensaje exacto) y "Resultado vacío por filtros sin coincidencias" (`total: 0`), y que los filtros no cambian el saldo resultante ni muestran movimientos ajenos

## 3. Cliente: historial [HU-10]

- [x] 3.1 Ajustar el servicio y `useMovimientos` para aceptar los filtros aplicados (la página vuelve a 1 al cambiarlos) y mostrar la sección "Historial de movimientos"; verificar con pruebas "Consulta exitosa del historial" (tipo, categoría, cuenta, monto, descripción y saldo) y la paginación
- [x] 3.2 Mostrar el mensaje "No se pudo cargar el historial. Intenta nuevamente" con "Reintentar", y el estado vacío "Aún no tienes movimientos registrados" con el botón "Registrar el primer movimiento"; verificar con pruebas "Error controlado al cargar el historial" y "Visualización del historial sin movimientos"
- [x] 3.3 Agregar el detalle del movimiento en el panel (con editar y eliminar); verificar con una prueba "Visualización del detalle de un movimiento"

## 4. Cliente: filtros [HU-11]

- [x] 4.1 Crear `useFiltrosMovimientos` y la barra de filtros (desde, hasta, tipo, categoría y cuenta, con "Aplicar filtros" y "Limpiar filtros"); verificar con pruebas "Filtrado exitoso por fecha y categoría" y "Combinación exitosa de filtros" (la consulta lleva todos los criterios y vuelve a la página 1)
- [x] 4.2 Validar el rango: con la fecha inicial posterior a la final se muestra "La fecha inicial no puede ser mayor a la fecha final" y "Aplicar filtros" queda deshabilitado; verificar con una prueba "Filtro rechazado por rango de fechas inválido"
- [x] 4.3 Mostrar "No se encontraron movimientos con los filtros seleccionados" con "Limpiar filtros", que restablece la lista completa; verificar con una prueba "Resultado vacío por filtros sin coincidencias"

## 5. Documentación e integración [RT-01]

- [x] 5.1 Documentar en el README la pantalla de historial y sus filtros; verificar que `npm run lint`, `npm test` y `npm run build` pasan
