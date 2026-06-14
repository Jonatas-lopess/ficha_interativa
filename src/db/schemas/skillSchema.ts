import type { RxJsonSchema } from 'rxdb';

export const skillSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'skill schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                 { type: 'string', maxLength: 200 },
    nome:               { type: 'string' },
    tipo:               { type: ['string', 'null'] },
    caminho:            { type: ['string', 'null'] },
    ranqueRequisito:    { type: ['string', 'null'] },
    saturacaoRequisito: { type: ['string', 'null'] },
    conceito:           { type: ['string', 'null'] },
    criadoEm:           { type: ['string', 'null'] },
    atualizadoEm:       { type: ['string', 'null'] },
  },
  required: ['id', 'nome'],
};
