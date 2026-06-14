import type { RxJsonSchema } from 'rxdb';

/**
 * RxDB schema for Character documents.
 * Primary key is `id` (string). The `RxDbDriver` maps `_id` ↔ `id` so all
 * existing repositories remain unchanged.
 * `rxRev` is our lightweight revision token (not CouchDB's `_rev`).
 */
export const characterSchema: RxJsonSchema<Record<string, unknown>> = {
  title: 'character schema',
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:                 { type: 'string', maxLength: 200 },
    nome:               { type: 'string' },
    idade:              { type: 'string' },
    alinhamento:        { type: 'string' },
    ranque:             { type: 'string' },
    tipo:               { type: 'string' },
    estresse:           { type: 'array',  items: { type: 'string' } },
    lesoes:             { type: 'object' },
    proficiencias:      { type: 'array',  items: { type: 'string' } },
    aspectos:           { type: 'array',  items: { type: 'string' } },
    tracos:             { type: 'array',  items: { type: 'object' } },
    divino:             { type: 'object' },
    equipamentos:       { type: 'array',  items: { type: 'object' } },
    objetivos:          { type: 'array',  items: { type: 'string' } },
    descricao:          { type: 'string' },
    historia:           { type: 'string' },
    frasesExperiencia:  { type: 'array',  items: { type: 'string' } },
    notas:              { type: 'string' },
    taticas:            { type: 'string' },
    criadoEm:           { type: 'string' },
    atualizadoEm:       { type: 'string' },
    _modified:          { type: 'string', maxLength: 100 },
    user_id:            { type: 'string', maxLength: 100 },
  },
  required: ['id', 'nome', 'ranque'],
  indexes: ['atualizadoEm', '_modified'],
};
