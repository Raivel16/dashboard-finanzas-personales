// Red de seguridad del aislamiento multiinquilino: toda consulta a un modelo de datos financieros
// debe incluir tenantId en el filtro; de lo contrario se lanza un error y no llega a la base de datos.
// Además, un documento nunca cambia de inquilino ni de creador. Se aplica solo a modelos de inquilino
// (no a `usuarios` ni `sesiones`).

const OPERACIONES = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'updateOne',
  'updateMany',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'countDocuments',
  'distinct',
];

export const CAMPOS_PROTEGIDOS = ['_id', 'tenantId', 'usuarioId'];

const tieneTenant = (filtro) => typeof filtro?.tenantId === 'string' && filtro.tenantId.length > 0;
const esOperador = (clave) => clave.startsWith('$');

export class TenantGuardError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'TenantGuardError';
  }
}

const sinTenant = (modelo, operacion) =>
  new TenantGuardError(`Consulta sin tenantId bloqueada: ${modelo}.${operacion}`);

/** Quita _id, tenantId y usuarioId de una actualización (nivel superior y dentro de $set, $inc, etc.). */
export function sinCamposProtegidos(cambios = {}) {
  const limpio = {};
  for (const [clave, valor] of Object.entries(cambios)) {
    if (CAMPOS_PROTEGIDOS.includes(clave)) continue;
    if (esOperador(clave) && valor && typeof valor === 'object') {
      const interior = Object.fromEntries(
        Object.entries(valor).filter(([campo]) => !CAMPOS_PROTEGIDOS.includes(campo)),
      );
      if (Object.keys(interior).length > 0) limpio[clave] = interior;
    } else {
      limpio[clave] = valor;
    }
  }
  return limpio;
}

const modificaCamposProtegidos = (actualizacion) => {
  if (Array.isArray(actualizacion)) return actualizacion.some(modificaCamposProtegidos); // pipeline
  if (!actualizacion || typeof actualizacion !== 'object') return false;
  return Object.entries(actualizacion).some(
    ([clave, valor]) =>
      CAMPOS_PROTEGIDOS.includes(clave) || (esOperador(clave) && modificaCamposProtegidos(valor)),
  );
};

export function tenantPlugin(schema) {
  // immutable: Mongoose ignora cualquier intento de cambiar el inquilino o el creador de un documento.
  schema.add({ tenantId: { type: String, required: true, index: true, immutable: true } });
  schema.add({
    usuarioId: { type: String, required: true, immutable: true },
  });

  for (const operacion of OPERACIONES) {
    schema.pre(operacion, function () {
      if (!tieneTenant(this.getFilter())) throw sinTenant(this.model.modelName, operacion);
    });
  }

  // Un documento nunca cambia de inquilino ni de creador, ni siquiera con actualizaciones directas al modelo.
  for (const operacion of ['findOneAndUpdate', 'updateOne', 'updateMany']) {
    schema.pre(operacion, function () {
      if (modificaCamposProtegidos(this.getUpdate())) {
        throw new TenantGuardError(
          `Actualización bloqueada: tenantId y usuarioId no se pueden modificar (${this.model.modelName}.${operacion})`,
        );
      }
    });
  }

  schema.pre('aggregate', function () {
    const primera = this.pipeline()[0];
    if (!tieneTenant(primera?.$match)) throw sinTenant(this.model().modelName, 'aggregate');
  });
}
