import type { RxJsonSchema } from 'rxdb';

export const threatSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'threat schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:            { type: 'string', maxLength: 200 },
    rxRev:         { type: 'string' },
    nome:          { type: 'string' },
    descricao:     { type: 'string' },
    ranque:        { type: 'string' },
    estresseMax:   { type: 'number' },
    lesoes:        { type: 'object' },
    proficiencias: { type: 'array', items: { type: 'string' } },
    tracos:        { type: 'array', items: { type: 'object' } },
    equipamentos:  { type: 'array', items: { type: 'string' } },
    taticas:       { type: 'array', items: { type: 'string' } },
    criadoEm:      { type: 'string' },
    atualizadoEm:  { type: 'string' },
  },
  required: ['id', 'nome'],
};
