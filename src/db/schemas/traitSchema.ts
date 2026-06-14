import type { RxJsonSchema } from 'rxdb';

export const traitSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'trait schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                 { type: 'string', maxLength: 200 },
    nome:               { type: 'string' },
    conceito:           { type: ['string', 'null'] },
    gatilho:            { type: ['string', 'null'] },
    efeitos:            { type: 'array',  items: { type: 'object' } },
    limiteCusto:        { type: ['string', 'null'] },
    origem:             { type: ['string', 'null'] },
    // DivineTrait extensions
    caminho:            { type: ['string', 'null'] },
    ranqueRequisito:    { type: ['string', 'null'] },
    saturacaoRequisito: { type: ['string', 'null'] },
    criadoEm:           { type: ['string', 'null'] },
    atualizadoEm:       { type: ['string', 'null'] },
  },
  required: ['id', 'nome'],
};
