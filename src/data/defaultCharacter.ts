import { Character } from '../types'

export const createDefaultCharacter = (): Character => ({
  // Identidade
  nome: '',
  idade: '',
  alinhamento: '',
  ranque: 'Humano',

  // Estresse — array de estados: 'livre' | 'gasto' | 'corrompido'
  estresse: Array(6).fill('livre'),

  // Lesões — leves é contador; graves e críticas são arrays com descrição
  lesoes: {
    fisicas:    { leves: 0, graves: [], criticas: [] },
    mentais:    { leves: 0, graves: [], criticas: [] },
    espirituais:{ leves: 0, graves: [], criticas: [] },
  },

  // Proficiências — lista de strings no formato "Área (Especialização)"
  proficiencias: [],

  // Traços — lista de objetos estruturados
  tracos: [],

  // Aspectos — palavras-chave ou frases curtas que definem identidade narrativa
  aspectos: [],

  // Divino (condicional — só para Marcados)
  divino: {
    ativo: false,
    caminho: '',
    pesoDivino: 1,
    saturacao: 'Centelha',
    integracao: 'Adaptação',
    persona: '',
    ancoras: [],
    habilidadesNucleo: [],
  },

  // Equipamentos
  equipamentos: [],

  // Objetivos
  objetivos: [],

  // História / Notas
  descricao: '',
  historia: '',
  frasesExperiencia: [],
  notas: '',
  taticas: '',

  // Metadados
  tipo: 'completa', // 'completa' | 'simplificada'
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
})
