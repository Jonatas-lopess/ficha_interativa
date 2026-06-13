import type { RxJsonSchema } from 'rxdb';

export const traitSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'trait schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                 { type: 'string', maxLength: 200 },
    nome:               { type: 'string' },
    conceito:           { type: 'string' },
    gatilho:            { type: 'string' },
    efeitos:            { type: 'array',  items: { type: 'object' } },
    limiteCusto:        { type: 'string' },
    origem:             { type: 'string' },
    // DivineTrait extensions
    caminho:            { type: 'string' },
    ranqueRequisito:    { type: 'string' },
    saturacaoRequisito: { type: 'string' },
    criadoEm:           { type: 'string' },
    atualizadoEm:       { type: 'string' },
    _modified:          { type: 'string', maxLength: 100 },
  },
  required: ['id', 'nome'],
  indexes: ['_modified'],
};
