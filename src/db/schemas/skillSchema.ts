import type { RxJsonSchema } from 'rxdb';

export const skillSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'skill schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                 { type: 'string', maxLength: 200 },
    nome:               { type: 'string' },
    tipo:               { type: 'string' },
    caminho:            { type: 'string' },
    ranqueRequisito:    { type: 'string' },
    saturacaoRequisito: { type: 'string' },
    conceito:           { type: 'string' },
    criadoEm:           { type: 'string' },
    atualizadoEm:       { type: 'string' },
  },
  required: ['id', 'nome'],
};
