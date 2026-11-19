/**
 * Carga inicial de datos.
 *
 *   npm run seed -w server         Datos de demostración (RT-06)
 *   npm run seed:admin -w server   Primer administrador desde ADMIN_EMAIL y ADMIN_PASSWORD (RT-07)
 *
 * Opciones: --solo-admin, --permitir-remoto (autoriza los datos demo en una base no local).
 * Los datos demo son sintéticos. Solo se reemplazan los usuarios del dominio DOMINIO_DEMO.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const { Decimal128, ObjectId } = mongoose.mongo;

const DOMINIO_DEMO = 'demo.finanzas.test';
const URI_LOCAL = 'mongodb://127.0.0.1:27017/finanzas?directConnection=true';
const ZONA_HORARIA = process.env.APP_TIMEZONE || 'America/Lima';
const COSTO_BCRYPT = 12;
const MESES_DE_HISTORIA = 8;

const CATEGORIAS = [
  ['gasto', 'Alimentación', 'utensils'],
  ['gasto', 'Transporte', 'bus'],
  ['gasto', 'Vivienda', 'house'],
  ['gasto', 'Salud', 'heart-pulse'],
  ['gasto', 'Entretenimiento', 'ticket'],
  ['gasto', 'Educación', 'book-open'],
  ['gasto', 'Otros gastos', 'circle-ellipsis'],
  ['ingreso', 'Sueldo', 'wallet'],
  ['ingreso', 'Ventas', 'store'],
  ['ingreso', 'Otros ingresos', 'circle-plus'],
];

const PERFILES = [
  {
    nombre: 'Administración Demo',
    usuario: 'admin',
    rol: 'admin',
    cuentas: [],
  },
  {
    nombre: 'Ana Torres',
    usuario: 'ana.torres',
    semilla: 11,
    cuentas: [
      { clave: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', inicial: 30000 },
      { clave: 'banco', nombre: 'Cuenta sueldo', tipo: 'banco', moneda: 'PEN', inicial: 250000 },
      { clave: 'tarjeta', nombre: 'Tarjeta de crédito', tipo: 'tarjeta_credito', moneda: 'PEN', inicial: 0 },
      { clave: 'billetera', nombre: 'Billetera digital', tipo: 'billetera_digital', moneda: 'PEN', inicial: 8000 },
      { clave: 'dolares', nombre: 'Ahorros en dólares', tipo: 'banco', moneda: 'USD', inicial: 120000 },
    ],
    sueldo: 520000,
    alquiler: 145000,
    secundaria: { cuenta: 'dolares', ingreso: 12000, gastos: [['Entretenimiento', 1599, 'Suscripción de música'], ['Educación', 3000, 'Curso en línea']] },
    presupuesto: { general: 0.74, categorias: [['Alimentación', 0.95], ['Transporte', 0.6], ['Entretenimiento', 1.15]], secundario: 0.45 },
  },
  {
    nombre: 'Luis Quispe',
    usuario: 'luis.quispe',
    semilla: 29,
    cuentas: [
      { clave: 'efectivo', nombre: 'Efectivo', tipo: 'efectivo', moneda: 'PEN', inicial: 15000 },
      { clave: 'banco', nombre: 'Cuenta corriente', tipo: 'banco', moneda: 'PEN', inicial: 90000 },
      { clave: 'billetera', nombre: 'Billetera digital', tipo: 'billetera_digital', moneda: 'PEN', inicial: 5000 },
      { clave: 'euros', nombre: 'Ahorros en euros', tipo: 'banco', moneda: 'EUR', inicial: 40000 },
    ],
    sueldo: 310000,
    alquiler: 90000,
    secundaria: { cuenta: 'euros', ingreso: 5000, gastos: [['Otros gastos', 1200, 'Servicio en el extranjero']] },
    presupuesto: { general: 0.92, categorias: [], secundario: 0.7 },
  },
  { nombre: 'Sofía Nueva', usuario: 'sofia.nueva', cuentas: [] },
];

const GASTOS_VARIABLES = [
  ['Alimentación', 6, 1800, 12000, ['efectivo', 'billetera', 'tarjeta'], ['Mercado', 'Almuerzo', 'Panadería', 'Supermercado']],
  ['Transporte', 5, 350, 3500, ['efectivo', 'billetera'], ['Bus', 'Taxi', 'Combustible']],
  ['Salud', 1, 3000, 18000, ['banco', 'tarjeta'], ['Farmacia', 'Consulta médica']],
  ['Entretenimiento', 2, 2500, 11000, ['tarjeta', 'billetera'], ['Cine', 'Salida con amigos', 'Concierto']],
  ['Educación', 1, 4000, 15000, ['banco'], ['Libros', 'Taller']],
  ['Otros gastos', 2, 1000, 8000, ['efectivo', 'tarjeta'], ['Regalo', 'Ferretería', 'Lavandería']],
];

const aDecimal = (centimos) => {
  const signo = centimos < 0 ? '-' : '';
  const valor = Math.abs(centimos);
  return Decimal128.fromString(`${signo}${Math.trunc(valor / 100)}.${String(valor % 100).padStart(2, '0')}`);
};
const aCentimos = (decimal) => Math.round(Number(decimal.toString()) * 100);

function generador(semilla) {
  let estado = semilla;
  const azar = () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { entero: (min, max) => min + Math.floor(azar() * (max - min + 1)), elegir: (lista) => lista[Math.floor(azar() * lista.length)] };
}

function hoyEnZona() {
  const [anio, mes, dia] = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date()).split('-').map(Number);
  return { anio, mes, dia };
}
const periodo = (anio, mes) => `${anio}-${String(mes).padStart(2, '0')}`;
function mesRelativo({ anio, mes }, delta) {
  const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
  return { anio: fecha.getUTCFullYear(), mes: fecha.getUTCMonth() + 1 };
}
const diasDelMes = ({ anio, mes }) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

const coleccion = (nombre) => mongoose.connection.collection(nombre);
const conTiempos = (doc, fecha = new Date()) => ({ ...doc, createdAt: fecha, updatedAt: fecha, __v: 0 });

export function validarEntorno({ uri, entorno, soloAdmin, permitirRemoto }) {
  if (soloAdmin) return;
  if (entorno === 'production') throw new Error('Los datos de demostración no se pueden cargar en producción.');
  const hosts = uri.replace(/^mongodb(\+srv)?:\/\//, '').split('/')[0].split('@').pop().split(',');
  const local = !uri.startsWith('mongodb+srv:') && hosts.every((h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h));
  if (!local && !permitirRemoto) throw new Error('La base de datos no es local. Usa --permitir-remoto solo si estás seguro.');
}

function crearUsuario({ nombre, email, passwordHash, rol = 'usuario' }) {
  return conTiempos({
    _id: new ObjectId(), tenantId: uuid(), nombre, email, passwordHash, rol, monedaPrincipal: 'PEN',
    intentosFallidos: 0, bloqueadoHasta: null, activo: true,
  });
}

function crearCategorias(usuario) {
  return CATEGORIAS.map(([tipo, nombre, icono]) => conTiempos({
    _id: new ObjectId(), tenantId: usuario.tenantId, usuarioId: usuario._id, nombre, tipo, icono,
  }));
}

async function eliminarDemo() {
  const usuarios = await coleccion('usuarios').find({ email: { $regex: `@${DOMINIO_DEMO.replaceAll('.', '\\.')}$` } }).toArray();
  const tenantIds = usuarios.map((u) => u.tenantId);
  const ids = usuarios.map((u) => u._id);
  await Promise.all(['categorias', 'cuentas', 'movimientos', 'presupuestos'].map((c) => coleccion(c).deleteMany({ tenantId: { $in: tenantIds } })));
  await Promise.all(['sesiones', 'tokensrecuperacion'].map((c) => coleccion(c).deleteMany({ usuarioId: { $in: ids } })));
  await coleccion('usuarios').deleteMany({ _id: { $in: ids } });
}

function generarMovimientos(perfil, usuario, cuentas, categorias, hoy) {
  const rnd = generador(perfil.semilla);
  const movimientos = [];
  const cuentaPorClave = Object.fromEntries(cuentas.map((c) => [c.clave, c]));
  const categoria = (nombre) => categorias.find((c) => c.nombre === nombre);
  let orden = 0;

  const agregar = (mes, dia, tipo, centimos, nombreCategoria, claveCuenta, descripcion) => {
    const cuenta = cuentaPorClave[claveCuenta] ?? cuentaPorClave.efectivo;
    const fecha = new Date(Date.UTC(mes.anio, mes.mes - 1, dia));
    orden += 1;
    const creado = new Date(Math.min(fecha.getTime() + 12 * 3600000 + orden * 1000, Date.now()));
    movimientos.push(conTiempos({
      _id: new ObjectId(), tenantId: usuario.tenantId, usuarioId: usuario._id, tipo, monto: aDecimal(centimos),
      moneda: cuenta.moneda, fecha, categoriaId: categoria(nombreCategoria)._id, cuentaId: cuenta._id, descripcion,
    }, creado));
  };

  for (let delta = 1 - MESES_DE_HISTORIA; delta <= 0; delta += 1) {
    const mes = mesRelativo(hoy, delta);
    const actual = delta === 0;
    const ultimoDia = actual ? hoy.dia : diasDelMes(mes);
    const dia = () => rnd.entero(1, ultimoDia);
    agregar(mes, 1, 'ingreso', perfil.sueldo, 'Sueldo', 'banco', 'Sueldo mensual');
    agregar(mes, Math.min(3, ultimoDia), 'gasto', perfil.alquiler, 'Vivienda', 'banco', 'Alquiler');
    if (rnd.entero(0, 2) === 0) agregar(mes, dia(), 'ingreso', rnd.entero(15000, 60000), 'Ventas', 'billetera', 'Venta ocasional');

    for (const [nombre, veces, minimo, maximo, cuentasPosibles, descripciones] of GASTOS_VARIABLES) {
      const repeticiones = actual ? Math.max(1, Math.ceil((veces * ultimoDia) / diasDelMes(mes))) : rnd.entero(Math.max(1, veces - 1), veces + 1);
      for (let i = 0; i < repeticiones; i += 1) {
        agregar(mes, dia(), 'gasto', rnd.entero(minimo, maximo), nombre, rnd.elegir(cuentasPosibles), rnd.elegir(descripciones));
      }
    }
    const { cuenta, ingreso, gastos } = perfil.secundaria;
    agregar(mes, 1, 'ingreso', ingreso, 'Otros ingresos', cuenta, 'Trabajo independiente');
    for (const [nombre, monto, descripcion] of gastos) agregar(mes, Math.min(5, ultimoDia), 'gasto', monto, nombre, cuenta, descripcion);
  }
  return movimientos;
}

function aplicarSaldos(cuentas, movimientos) {
  for (const cuenta of cuentas) {
    const neto = movimientos.filter((m) => m.cuentaId.equals(cuenta._id))
      .reduce((total, m) => total + (m.tipo === 'ingreso' ? 1 : -1) * aCentimos(m.monto), 0);
    cuenta.saldoActual = aDecimal(cuenta.centimosIniciales + neto);
    delete cuenta.centimosIniciales;
    delete cuenta.clave;
  }
}

function generarPresupuestos(perfil, usuario, cuentas, categorias, movimientos, hoy) {
  const actual = periodo(hoy.anio, hoy.mes);
  const siguiente = mesRelativo(hoy, 1);
  const delMes = movimientos.filter((m) => m.tipo === 'gasto' && m.fecha.toISOString().startsWith(actual));
  const gastado = (moneda, categoriaId) => delMes
    .filter((m) => m.moneda === moneda && (!categoriaId || m.categoriaId.equals(categoriaId)))
    .reduce((total, m) => total + aCentimos(m.monto), 0);
  const crear = (per, moneda, categoriaId, centimos) => conTiempos({
    _id: new ObjectId(), tenantId: usuario.tenantId, usuarioId: usuario._id, periodo: per, moneda, categoriaId, monto: aDecimal(centimos),
  });

  const porCategoria = perfil.presupuesto.categorias.map(([nombre, avance]) => {
    const categoria = categorias.find((c) => c.nombre === nombre);
    return crear(actual, 'PEN', categoria._id, Math.max(100, Math.round(gastado('PEN', categoria._id) / avance)));
  });
  const asignado = porCategoria.reduce((total, p) => total + aCentimos(p.monto), 0);
  const general = Math.max(Math.ceil(gastado('PEN') / perfil.presupuesto.general), asignado);
  const monedaSecundaria = cuentas.find((c) => c.moneda !== 'PEN').moneda;
  return [
    crear(actual, 'PEN', null, general),
    ...porCategoria,
    crear(actual, monedaSecundaria, null, Math.max(100, Math.ceil(gastado(monedaSecundaria) / perfil.presupuesto.secundario))),
    crear(periodo(siguiente.anio, siguiente.mes), 'PEN', null, general),
  ];
}

async function verificarSaldos(tenantIds) {
  const cuentas = await coleccion('cuentas').find({ tenantId: { $in: tenantIds } }).toArray();
  for (const cuenta of cuentas) {
    const [{ neto } = { neto: Decimal128.fromString('0') }] = await coleccion('movimientos').aggregate([
      { $match: { cuentaId: cuenta._id } },
      { $group: { _id: null, neto: { $sum: { $cond: [{ $eq: ['$tipo', 'ingreso'] }, '$monto', { $multiply: ['$monto', -1] }] } } } },
    ]).toArray();
    if (aCentimos(cuenta.saldoInicial) + aCentimos(neto) !== aCentimos(cuenta.saldoActual)) {
      throw new Error(`El saldo de la cuenta ${cuenta.nombre} no coincide con sus movimientos.`);
    }
  }
  return cuentas.length;
}

export async function cargarDemo({ password }) {
  await eliminarDemo();
  const hoy = hoyEnZona();
  const passwordHash = await bcrypt.hash(password, COSTO_BCRYPT);
  const total = { usuarios: 0, cuentas: 0, categorias: 0, movimientos: 0, presupuestos: 0 };
  const tenantIds = [];

  for (const perfil of PERFILES) {
    const usuario = crearUsuario({ nombre: perfil.nombre, email: `${perfil.usuario}@${DOMINIO_DEMO}`, passwordHash, rol: perfil.rol });
    const categorias = crearCategorias(usuario);
    const cuentas = perfil.cuentas.map(({ inicial, ...cuenta }) => conTiempos({
      _id: new ObjectId(), tenantId: usuario.tenantId, usuarioId: usuario._id, ...cuenta,
      saldoInicial: aDecimal(inicial), saldoActual: aDecimal(inicial), centimosIniciales: inicial,
    }));
    const movimientos = perfil.semilla ? generarMovimientos(perfil, usuario, cuentas, categorias, hoy) : [];
    const presupuestos = perfil.presupuesto ? generarPresupuestos(perfil, usuario, cuentas, categorias, movimientos, hoy) : [];
    aplicarSaldos(cuentas, movimientos);

    await coleccion('usuarios').insertOne(usuario);
    await coleccion('categorias').insertMany(categorias);
    if (cuentas.length) await coleccion('cuentas').insertMany(cuentas);
    if (movimientos.length) await coleccion('movimientos').insertMany(movimientos);
    if (presupuestos.length) await coleccion('presupuestos').insertMany(presupuestos);

    tenantIds.push(usuario.tenantId);
    total.usuarios += 1;
    total.categorias += categorias.length;
    total.cuentas += cuentas.length;
    total.movimientos += movimientos.length;
    total.presupuestos += presupuestos.length;
  }
  await verificarSaldos(tenantIds);
  return total;
}

export async function crearAdministrador({ email, password }) {
  const correo = email?.trim().toLowerCase();
  if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new Error('Define un ADMIN_EMAIL válido.');
  if (!password || password.length < 8 || password.length > 72 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('ADMIN_PASSWORD debe tener de 8 a 72 caracteres, una mayúscula y un número.');
  }
  const existente = await coleccion('usuarios').findOne({ email: correo });
  if (existente?.rol === 'admin') return 'sin cambios';
  if (existente) {
    // No se promueve una cuenta existente: quien la registró conservaría el acceso como administrador.
    // Los siguientes administradores se promueven desde la gestión de roles (HU-23).
    throw new Error(`Ya existe un usuario estándar con ${correo}. Usa otro ADMIN_EMAIL o promuévelo desde la gestión de roles.`);
  }
  const usuario = crearUsuario({ nombre: 'Administrador', email: correo, passwordHash: await bcrypt.hash(password, COSTO_BCRYPT), rol: 'admin' });
  await coleccion('usuarios').insertOne(usuario);
  await coleccion('categorias').insertMany(crearCategorias(usuario));
  return 'creado';
}

async function main() {
  const dirServidor = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    process.loadEnvFile(path.join(dirServidor, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const soloAdmin = process.argv.includes('--solo-admin');
  const uri = process.env.MONGODB_URI || URI_LOCAL;
  validarEntorno({ uri, entorno: process.env.NODE_ENV, soloAdmin, permitirRemoto: process.argv.includes('--permitir-remoto') });
  if (soloAdmin && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD.');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    if (soloAdmin) {
      const resultado = await crearAdministrador({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
      console.log(`Administrador: ${resultado}.`);
    } else {
      const password = process.env.SEED_PASSWORD || 'Demo1234';
      const total = await cargarDemo({ password });
      console.log('Datos de demostración cargados:', total);
      console.log(`Usuarios: ${PERFILES.map((p) => `${p.usuario}@${DOMINIO_DEMO}`).join(', ')}`);
      console.log(process.env.SEED_PASSWORD ? 'Contraseña: la definida en SEED_PASSWORD.' : 'Contraseña: Demo1234');
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`No se pudo completar la carga: ${error.message}`);
    process.exitCode = 1;
  });
}
