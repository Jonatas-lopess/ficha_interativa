export interface RollResult {
  dados: number[]
  mantidos: number[]
  total: number
  faixa: string
  cor: string
  tipo: string
}

/**
 * Rola N dados de 10 faces.
 */
function rolarDados(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10) + 1)
}

function faixaDeSucesso(total: number) {
  if (total <= 10) return { faixa: 'Falha', cor: 'text-injury-critical' }
  if (total <= 16) return { faixa: 'Sucesso com Custo', cor: 'text-injury-light' }
  return { faixa: 'Sucesso Pleno', cor: 'text-green-400' }
}

export function rolarNormal(): RollResult {
  const dados = rolarDados(2)
  const total = dados[0] + dados[1]
  return { dados, mantidos: dados, total, ...faixaDeSucesso(total), tipo: 'Normal (2d10)' }
}

export function rolarVantagem(): RollResult {
  const dados = rolarDados(3)
  const sorted = [...dados].sort((a, b) => b - a)
  const mantidos = sorted.slice(0, 2)
  const total = mantidos[0] + mantidos[1]
  return { dados, mantidos, total, ...faixaDeSucesso(total), tipo: 'Vantagem (3d10↑)' }
}

export function rolarDesvantagem(): RollResult {
  const dados = rolarDados(3)
  const sorted = [...dados].sort((a, b) => a - b)
  const mantidos = sorted.slice(0, 2)
  const total = mantidos[0] + mantidos[1]
  return { dados, mantidos, total, ...faixaDeSucesso(total), tipo: 'Desvantagem (3d10↓)' }
}
