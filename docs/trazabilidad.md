# Trazabilidad de Historias de Usuario

Cada historia de usuario y cada requisito técnico tiene un requisito en una spec y un único cambio de OpenSpec que lo implementa. Todo código debe pertenecer a una fila de estas tablas: si una implementación no encaja en ninguna, primero se crea o ajusta la historia o el requisito técnico.

## Orden de implementación

Las épicas se implementan una a la vez. Al completarse todas las historias de una épica, `dev` se fusiona en `main` mediante un pull request y se etiqueta la versión.

| Orden | Épica | Cambios de OpenSpec | Versión al fusionar en `main` |
|---|---|---|---|
| 1 | Base técnica (RT-01 a RT-07) | `definir-arquitectura-base` | `v0.1.0` |
| 2 | Épica 1: Autenticación y Gestión de Usuarios | `implementar-autenticacion`, `implementar-perfil` | `v0.2.0` |
| 3 | Épica 2: Seguridad y Control de Acceso (RBAC) | `implementar-control-acceso` | `v0.3.0` |
| 4 | Épica 3: Gestión de Categorías | `implementar-categorias` | `v0.4.0` |
| 5 | Épica 4: Gestión de Cuentas y Medios de Pago | `implementar-cuentas` | `v0.5.0` |
| 6 | Épica 5: Gestión de Transacciones (Movimientos) | `implementar-movimientos` | `v0.6.0` |
| 7 | Épica 6: Consulta y Filtrado de Movimientos | `implementar-consulta-movimientos` | `v0.7.0` |
| 8 | Épica 8: Presupuestos | `implementar-presupuestos` | `v0.8.0` |
| 9 | Épica 7: Dashboard e Indicadores Financieros | `implementar-dashboard` | `v0.9.0` |
| 10 | Épica 9: Reportes y Exportación | `implementar-reportes` | `v0.10.0` |

Presupuestos va antes que el Dashboard porque el indicador de presupuesto utilizado (HU-12) depende de esa épica.

## Obligaciones de las épicas de datos (acceso de administrador)

`implementar-control-acceso` entrega el mecanismo (rol vigente en cada solicitud, `requerirRol`, `RepositorioLectura` y las rutas de usuarios), probado con un recurso de prueba. HU-04, HU-05 y HU-22 mencionan categorías, cuentas, movimientos y presupuestos, así que **no se marcan como hechas** hasta que cada épica de datos (`implementar-categorias`, `implementar-cuentas`, `implementar-movimientos`, `implementar-presupuestos`) agregue:

- su ruta `GET /api/v1/admin/usuarios/:id/<recurso>` con `admin.repositorioLecturaDe`, sin rutas de escritura de administrador;
- sus secciones en el detalle de usuario de "Administración";
- las pruebas de los escenarios de HU-04 (administrador consulta datos de todos), HU-05 (aislamiento) y HU-22 (consulta, estado vacío y modificación ajena rechazada) sobre sus datos reales.

## Matriz

| Historia | Título | Épica | Spec | Cambio de OpenSpec | Rama |
|---|---|---|---|---|---|
| HU-01 | Registro de nuevo usuario | 1 | `autenticacion-usuarios` | `implementar-autenticacion` | `feature/implementar-autenticacion` |
| HU-02 | Inicio de sesión | 1 | `autenticacion-usuarios` | `implementar-autenticacion` | `feature/implementar-autenticacion` |
| HU-03 | Recuperación de contraseña | 1 | `autenticacion-usuarios` | `implementar-autenticacion` | `feature/implementar-autenticacion` |
| HU-04 | Control de acceso basado en roles | 2 | `control-acceso` | `implementar-control-acceso` | `feature/implementar-control-acceso` |
| HU-05 | Privacidad de mis datos financieros | 2 | `control-acceso` | `implementar-control-acceso` | `feature/implementar-control-acceso` |
| HU-06 | Administrar categorías de ingresos y gastos | 3 | `gestion-categorias` | `implementar-categorias` | `feature/implementar-categorias` |
| HU-07 | Administrar cuentas o medios de pago | 4 | `gestion-cuentas` | `implementar-cuentas` | `feature/implementar-cuentas` |
| HU-08 | Registrar movimiento financiero (ingreso o gasto) | 5 | `gestion-movimientos` | `implementar-movimientos` | `feature/implementar-movimientos` |
| HU-09 | Editar/Eliminar movimiento (HU adicional) | 5 | `gestion-movimientos` | `implementar-movimientos` | `feature/implementar-movimientos` |
| HU-10 | Consultar historial de movimientos financieros | 6 | `consulta-movimientos` | `implementar-consulta-movimientos` | `feature/implementar-consulta-movimientos` |
| HU-11 | Filtrar movimientos por fecha, categoría y tipo | 6 | `consulta-movimientos` | `implementar-consulta-movimientos` | `feature/implementar-consulta-movimientos` |
| HU-12 | Visualizar indicadores financieros en el dashboard | 7 | `dashboard-indicadores` | `implementar-dashboard` | `feature/implementar-dashboard` |
| HU-13 | Visualizar gráficos financieros interactivos | 7 | `dashboard-indicadores` | `implementar-dashboard` | `feature/implementar-dashboard` |
| HU-14 | Definir presupuesto mensual | 8 | `presupuestos` | `implementar-presupuestos` | `feature/implementar-presupuestos` |
| HU-15 | Seguimiento del cumplimiento del presupuesto | 8 | `presupuestos` | `implementar-presupuestos` | `feature/implementar-presupuestos` |
| HU-16 | Exportar reporte financiero en PDF | 9 | `reportes-exportacion` | `implementar-reportes` | `feature/implementar-reportes` |
| HU-17 | Exportar reporte financiero en Excel | 9 | `reportes-exportacion` | `implementar-reportes` | `feature/implementar-reportes` |
| HU-18 | Cerrar sesión | 1 | `autenticacion-usuarios` | `implementar-autenticacion` | `feature/implementar-autenticacion` |
| HU-19 | Mantener la sesión activa durante el uso | 1 | `autenticacion-usuarios` | `implementar-autenticacion` | `feature/implementar-autenticacion` |
| HU-20 | Gestionar mi perfil | 1 | `autenticacion-usuarios` | `implementar-perfil` | `feature/implementar-perfil` |
| HU-21 | Cambiar mi contraseña | 1 | `autenticacion-usuarios` | `implementar-perfil` | `feature/implementar-perfil` |
| HU-22 | Consultar datos de usuarios en modo de solo lectura | 2 | `control-acceso` | `implementar-control-acceso` | `feature/implementar-control-acceso` |
| HU-23 | Gestionar roles de usuarios | 2 | `control-acceso` | `implementar-control-acceso` | `feature/implementar-control-acceso` |
| HU-24 | Recibir categorías predeterminadas | 3 | `gestion-categorias` | `implementar-categorias` | `feature/implementar-categorias` |
| HU-25 | Definir moneda y saldo inicial de la cuenta | 4 | `gestion-cuentas` | `implementar-cuentas` | `feature/implementar-cuentas` |
| HU-26 | Mantener el saldo de la cuenta consistente | 5 | `gestion-movimientos` | `implementar-movimientos` | `feature/implementar-movimientos` |
| HU-27 | Validar la coherencia del movimiento | 5 | `gestion-movimientos` | `implementar-movimientos` | `feature/implementar-movimientos` |
| HU-28 | Ver el dashboard por moneda | 7 | `dashboard-indicadores` | `implementar-dashboard` | `feature/implementar-dashboard` |
| HU-29 | Definir presupuestos por moneda y período | 8 | `presupuestos` | `implementar-presupuestos` | `feature/implementar-presupuestos` |
| HU-30 | Mantener los presupuestos por categoría dentro del general | 8 | `presupuestos` | `implementar-presupuestos` | `feature/implementar-presupuestos` |
| HU-31 | Exportar reportes separados por moneda | 9 | `reportes-exportacion` | `implementar-reportes` | `feature/implementar-reportes` |

## Requisitos técnicos

Son la base técnica del sistema. No son historias de usuario, pero cada uno habilita historias concretas y tiene su propio requisito en una spec.

| Requisito | Título | Tipo | Habilita | Spec | Cambio de OpenSpec | Rama |
|---|---|---|---|---|---|---|
| RT-01 | Disponer de una base ejecutable del proyecto | Técnico | todas las historias | `plataforma-proyecto` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-02 | Recibir respuestas y errores uniformes de la API | Técnico | todas las historias | `contrato-api` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-03 | Paginar y filtrar listados de forma uniforme | Técnico | HU-10, HU-11, HU-22 | `contrato-api` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-04 | Verificar cada cambio con integración continua | Técnico | todas las historias | `plataforma-proyecto` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-05 | Usar una interfaz consistente y responsiva | No funcional (usabilidad y accesibilidad) | todas las historias con pantalla | `interfaz-usuario` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-06 | Poblar la base con datos de demostración | Técnico | demostración de HU-12, HU-13, HU-15, HU-28 y HU-30 | `plataforma-proyecto` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |
| RT-07 | Crear el primer administrador | Técnico | HU-22, HU-23 | `plataforma-proyecto` | `definir-arquitectura-base` | `chore/configurar-proyecto-base` |

## Regla de cierre

Una historia o requisito técnico está terminado cuando sus 4 escenarios tienen pruebas automatizadas que pasan, el lint y la integración continua están en verde y su cambio fue fusionado en `dev` por pull request. No se exige un porcentaje mínimo de cobertura.
