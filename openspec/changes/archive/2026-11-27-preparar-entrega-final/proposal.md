# Proposal

## Why

Todas las historias (HU-01 a HU-33) están implementadas y la aplicación va a su entrega final, que se evalúa con la rúbrica del curso. Quedan dos brechas frente al enunciado y la rúbrica:

- La rúbrica pide "identificadores UUID públicos" y el enunciado recomienda UUID para generar identificadores, pero la API expone los `ObjectId` de MongoDB.
- La regla de cierre exige que los 4 escenarios de cada historia tengan una prueba automática. Hoy eso se comprueba a mano con `docs/cobertura-escenarios.md`, y nada impide que una prueba renombrada o eliminada deje un escenario sin cubrir.

Además, el enunciado pide almacenar la información en MongoDB Atlas. RT-01 ya lo permite cambiando solo la URI (escenario "Cambio a MongoDB Atlas"); falta documentar el paso a paso y cargar los datos en el clúster. La versión resultante se publica como `v1.0.0`.

## What Changes

- **Identificadores UUID públicos (RT-08)**: todo recurso (usuarios, cuentas, categorías, movimientos, presupuestos) se identifica con un UUID v4 generado por el servidor. Las rutas y las referencias entre recursos (`cuentaId`, `categoriaId`) usan ese UUID; un identificador mal formado se rechaza igual que hoy (404 en la ruta, 400 en el cuerpo).
- **Cobertura de escenarios en CI (RT-09)**: un comando genera `docs/cobertura-escenarios.md` a partir de un mapa escenario → prueba y la integración continua falla si un escenario no tiene prueba, si una prueba citada ya no existe o si la matriz publicada está desactualizada.
- **MongoDB Atlas**: guía para crear el clúster y conectar la aplicación, y carga del primer administrador y de los datos demo con la autorización explícita que ya exige RT-06.
- **Documentación**: README reescrito con las secciones habituales de un proyecto de software y guion de la exposición final alineado con la rúbrica.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `contrato-api`: agrega el requisito de identificadores UUID públicos (RT-08).
- `plataforma-proyecto`: agrega el requisito de verificar en CI que cada escenario tenga su prueba (RT-09).

## Impact

- **Servidor**: modelos (identificador y referencias como UUID), repositorios (validación del identificador y agregaciones), script de datos demo y pruebas que usaban identificadores fijos.
- **Shared**: la regla de identificador valida UUID v4.
- **Cliente**: solo cambian los datos de prueba; el cliente ya trata los identificadores como texto.
- **Datos existentes**: una base local creada con `ObjectId` se vuelve a poblar con `npm run seed -w server`; Atlas se puebla desde cero.
- **CI**: nuevo paso que verifica la matriz de cobertura.
- **Fuera de alcance**: desplegar el servidor o el cliente en un proveedor de hosting.
- **Trazabilidad**: rama `chore/preparar-entrega-final`; RT-08 y RT-09 hechos al fusionar.
