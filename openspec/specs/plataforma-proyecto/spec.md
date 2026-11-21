# plataforma-proyecto Specification

## Purpose
Garantizar que el proyecto se pueda instalar, ejecutar, verificar y poblar con datos de demostración de forma repetible por todo el equipo.

## Requirements

### Requirement: Disponer de una base ejecutable del proyecto
El sistema SHALL poder instalarse y ejecutarse desde la raíz del repositorio con pasos documentados, usando configuración por variables de entorno y validándola al arrancar.

Origen: RT-01, requisito técnico que habilita todas las historias (ver `docs/trazabilidad.md`).

#### Scenario: Proyecto levantado desde un clon limpio
- **GIVEN** un integrante tiene Node.js 22 y MongoDB como replica set
- **WHEN** sigue los pasos del README y ejecuta el proyecto
- **THEN** el cliente carga y muestra que la API y la base de datos están disponibles

#### Scenario: Cambio a MongoDB Atlas
- **GIVEN** el proyecto funciona con MongoDB local
- **WHEN** se reemplaza únicamente la URI de conexión por una de Atlas
- **THEN** la aplicación funciona sin cambios de código

#### Scenario: Configuración incompleta
- **GIVEN** falta una variable de entorno obligatoria
- **WHEN** se inicia el servidor
- **THEN** el servidor no arranca e indica qué variable falta, sin mostrar valores secretos

#### Scenario: Base de datos sin replica set
- **GIVEN** MongoDB se ejecuta sin replica set
- **WHEN** se inicia el servidor
- **THEN** el servidor no arranca y explica cómo habilitarlo

### Requirement: Verificar cada cambio con integración continua
El sistema SHALL ejecutar lint, pruebas y compilación en cada pull request hacia dev o main, y MUST impedir su fusión si alguna verificación falla.

Origen: RT-04, requisito técnico que habilita todas las historias (ver `docs/trazabilidad.md`).

#### Scenario: Pull request verificado
- **GIVEN** un integrante abre un pull request hacia dev
- **WHEN** se ejecuta la integración continua
- **THEN** lint, pruebas y compilación terminan correctamente y la fusión queda permitida

#### Scenario: Pull request de dev hacia main
- **GIVEN** una épica está completa
- **WHEN** se abre el pull request de dev hacia main
- **THEN** se ejecutan las mismas verificaciones antes de permitir la fusión

#### Scenario: Verificación fallida
- **GIVEN** una prueba falla en un pull request
- **WHEN** termina la integración continua
- **THEN** GitHub marca la verificación como fallida y bloquea la fusión

#### Scenario: Ejecución sin secretos
- **GIVEN** la integración continua no dispone de archivos .env ni servicios externos
- **WHEN** se ejecutan las pruebas
- **THEN** estas usan una base de datos en memoria y un correo simulado

### Requirement: Poblar la base con datos de demostración
El sistema SHALL ofrecer un comando repetible que cree usuarios y datos sintéticos coherentes, sin modificar otros datos, y MUST negarse a ejecutarse en producción o contra una base remota sin autorización explícita.

Origen: RT-06, requisito técnico que habilita demostración de HU-12, HU-13, HU-15, HU-28 y HU-30 (ver `docs/trazabilidad.md`).

#### Scenario: Carga de datos de demostración
- **GIVEN** la base de datos local está disponible
- **WHEN** se ejecuta el comando de carga
- **THEN** se crean un administrador y usuarios demo con cuentas, categorías, movimientos y presupuestos cuyos saldos cuadran

#### Scenario: Ejecución repetida
- **GIVEN** los datos de demostración ya existen
- **WHEN** se ejecuta nuevamente el comando
- **THEN** se reemplazan solo los datos demo y los demás usuarios no cambian

#### Scenario: Entorno protegido
- **GIVEN** la configuración apunta a producción o a una base remota
- **WHEN** se ejecuta el comando sin autorización explícita
- **THEN** el comando termina con un error y no escribe datos

#### Scenario: Todos los estados disponibles
- **GIVEN** terminó la carga
- **WHEN** se revisa la aplicación con las cuentas demo
- **THEN** existen casos con varias monedas, presupuesto normal, en alerta y excedido, y un usuario sin movimientos

### Requirement: Crear el primer administrador
El sistema SHALL ofrecer un comando que cree el administrador indicado en la configuración, sin duplicar cuentas, sin promover cuentas existentes y sin exponer su contraseña.

Origen: RT-07, requisito técnico que habilita HU-22, HU-23 (ver `docs/trazabilidad.md`).

#### Scenario: Creación del primer administrador
- **GIVEN** la configuración define el correo y la contraseña del administrador y ese correo no existe
- **WHEN** se ejecuta el comando de creación
- **THEN** el sistema crea la cuenta con rol "administrador" y su propio espacio de datos

#### Scenario: Correo ya registrado por un usuario estándar
- **GIVEN** el correo configurado ya pertenece a un usuario estándar
- **WHEN** se ejecuta el comando
- **THEN** el comando termina con un error que indica usar otro correo o promover al usuario desde la gestión de roles, y no modifica la cuenta

#### Scenario: Configuración incompleta
- **GIVEN** falta el correo o la contraseña del administrador
- **WHEN** se ejecuta el comando
- **THEN** el comando termina con un error claro y no modifica la base de datos

#### Scenario: Ejecución repetida
- **GIVEN** el administrador configurado ya existe
- **WHEN** se ejecuta nuevamente el comando
- **THEN** el comando informa que no hay cambios y no crea una cuenta duplicada
