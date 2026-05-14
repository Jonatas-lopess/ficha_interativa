import { RankData, RanqueNome } from '../types'

export const RANQUES: Record<RanqueNome, RankData> = {
  Humano: {
    label: 'Humano',
    estresseMaximo: 6,
    lesoesLeves: 6,
    lesoesGraves: 3,
    lesoesCriticas: 1,
  },
  Desperto: {
    label: 'Desperto',
    estresseMaximo: 8,
    lesoesLeves: 7,
    lesoesGraves: 4,
    lesoesCriticas: 1,
  },
  Ascendido: {
    label: 'Ascendido',
    estresseMaximo: 12,
    lesoesLeves: 8,
    lesoesGraves: 5,
    lesoesCriticas: 2,
  },
  Transcendente: {
    label: 'Transcendente',
    estresseMaximo: 18,
    lesoesLeves: 10,
    lesoesGraves: 6,
    lesoesCriticas: 3,
  },
}

export const PESO_DIVINO = [
  { nivel: 1, nome: 'Sussurro', descricao: 'A divindade é uma presença distante.' },
  { nivel: 2, nome: 'Pressão', descricao: 'Impulsos são mais frequentes.' },
  { nivel: 3, nome: 'Tensão', descricao: 'A balança oscila visivelmente.' },
  { nivel: 4, nome: 'Clamor', descricao: 'A Vontade Divina grita constantemente.' },
  { nivel: 5, nome: 'Consumo', descricao: 'A Vontade Divina domina.' },
] as const

export const SATURACAO_ESTAGIOS = ['Centelha', 'Crescente', 'Consolidado', 'Completo'] as const

export const INTEGRACAO_ESTAGIOS = ['Adaptação', 'Ressonância', 'Assimilação'] as const

export const TIPOS_EFEITO = ['Passivo', 'Ativável', 'Reativo'] as const

export const ORIGENS_TRACO = ['Base', 'Divino', 'Alienação'] as const
