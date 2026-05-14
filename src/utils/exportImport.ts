import { Character } from '../types'

/**
 * Exporta o personagem como arquivo JSON para download.
 */
export function exportarParaJSON(character: Character) {
  const blob = new Blob([JSON.stringify(character, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${character.nome || 'personagem'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Importa ficha a partir de um File (input[type=file]).
 * Retorna uma Promise que resolve com o objeto parsed.
 */
export function importarDeArquivo(file: File): Promise<Character> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        resolve(data as Character)
      } catch (err) {
        reject(new Error('Arquivo JSON inválido.'))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsText(file)
  })
}
