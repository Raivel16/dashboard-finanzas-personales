// Red de seguridad del aislamiento multiinquilino: toda consulta a un modelo de datos financieros
// debe incluir tenantId en el filtro; de lo contrario se lanza un error y no llega a la base de datos.
// Se aplica solo a modelos de inquilino (no a `usuarios` ni `sesiones`).

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

const tieneTenant = (filtro) => typeof filtro?.tenantId === 'string' && filtro.tenantId.length > 0;

export class TenantGuardError extends Error {
  constructor(modelo, operacion) {
    super(`Consulta sin tenantId bloqueada: ${modelo}.${operacion}`);
    this.name = 'TenantGuardError';
  }
}

export function tenantPlugin(schema) {
  schema.add({ tenantId: { type: String, required: true, index: true } });
  schema.add({ usuarioId: { type: schema.constructor.Types.ObjectId, required: true } });

  for (const operacion of OPERACIONES) {
    schema.pre(operacion, function () {
      if (!tieneTenant(this.getFilter())) throw new TenantGuardError(this.model.modelName, operacion);
    });
  }

  schema.pre('aggregate', function () {
    const primera = this.pipeline()[0];
    if (!tieneTenant(primera?.$match)) throw new TenantGuardError(this.model().modelName, 'aggregate');
  });
}
