import { useCallback, useEffect, useState, useRef } from 'react'
import { createDefaultCharacter } from '../data/defaultCharacter'
import { RANQUES } from '../data/rankData'
import { Character, RanqueNome, EstresseEstado, Equipamento, RankData } from '../types'
import { Persisted } from '../repository/persistenceTypes'
import { characterRepo } from '../repository'

interface UseCharacterResult {
  character: Persisted<Character>
  rankData: RankData
  updateField: <K extends keyof Character>(field: K, value: Character[K]) => void
  updateNestedField: <K extends keyof Character, NK extends keyof Character[K]>(parent: K, field: NK, value: Character[K][NK]) => void
  updateRanque: (novoRanque: RanqueNome) => void
  toggleEstresse: (index: number) => void
  adjustEstresse: (delta: number) => void
  exportarFicha: () => void
  importarFicha: (jsonString: string) => { success: boolean; error?: string }
  resetarFicha: () => void
  loading: boolean
}

export function useCharacter(sheetId: string | null, onSyncRegistry?: (id: string, nome: string) => void): UseCharacterResult {
  const defaultChar = (): Persisted<Character> => ({ ...createDefaultCharacter(), id: sheetId ?? '' })
  const [character, setCharacter] = useState<Persisted<Character>>(defaultChar)
  const [loading, setLoading] = useState<boolean>(true)

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!sheetId) {
      setLoading(false)
      return
    }

    setLoading(true)
    characterRepo.findById(sheetId).then(loaded => {
      let needsUpdate = false

      // Migration: legacy boolean estresse slots → string literals
      if (loaded.estresse?.some(s => typeof s !== 'string')) {
        loaded = {
          ...loaded,
          estresse: loaded.estresse.map(s => {
            if (typeof s === 'string') return s as EstresseEstado
            if ((s as any).corrupted) return 'corrompido'
            if ((s as any).spent)     return 'gasto'
            return 'livre'
          }),
        }
        needsUpdate = true
      }

      // Migration: legacy string equipamentos → objects
      if (loaded.equipamentos?.some(e => typeof e === 'string')) {
        loaded = {
          ...loaded,
          equipamentos: loaded.equipamentos.map(e =>
            typeof e === 'object' ? (e as Equipamento) : { nome: e as unknown as string, descricao: '' }
          ),
        }
        needsUpdate = true
      }

      // Migration: aspectos added in v2
      if (!loaded.aspectos) {
        loaded = { ...loaded, aspectos: [] }
        needsUpdate = true
      }

      setCharacter(loaded)
      if (needsUpdate) queueSave(loaded)
      setLoading(false)
    }).catch(e => {
      console.warn('Ficha ainda não propagada ou não existe, usando default.', e.message)
      setCharacter({ ...createDefaultCharacter(), id: sheetId })
      setLoading(false)
    })
  }, [sheetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (onSyncRegistry && sheetId && character.nome !== undefined) {
      onSyncRegistry(sheetId, character.nome)
    }
  }, [character.nome, sheetId, onSyncRegistry])

  const queueSave = useCallback((newChar: Persisted<Character>) => {
    if (!sheetId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await characterRepo.save(newChar)
      } catch (e) {
        console.error('Failed to save character:', e)
      }
    }, 500)
  }, [sheetId])

  const handleUpdate = useCallback((newChar: Persisted<Character>) => {
    newChar.atualizadoEm = new Date().toISOString()
    setCharacter(newChar)
    queueSave(newChar)
  }, [queueSave])

  const updateField = useCallback(<K extends keyof Character>(field: K, value: Character[K]) => {
    setCharacter(prev => {
      const next = { ...prev, [field]: value }
      handleUpdate(next)
      return next
    })
  }, [handleUpdate])

  const updateNestedField = useCallback(<K extends keyof Character, NK extends keyof Character[K]>(parent: K, field: NK, value: Character[K][NK]) => {
    setCharacter(prev => {
      const next = { ...prev, [parent]: { ...(prev[parent] as any), [field]: value } }
      handleUpdate(next)
      return next
    })
  }, [handleUpdate])

  const updateRanque = useCallback((novoRanque: RanqueNome) => {
    const novoRankData = RANQUES[novoRanque]
    if (!novoRankData) return

    setCharacter(prev => {
      const novoTamanho = novoRankData.estresseMaximo
      const estresseAtual = prev.estresse || []

      const novoEstresse: EstresseEstado[] =
        novoTamanho > estresseAtual.length
          ? [...estresseAtual, ...Array(novoTamanho - estresseAtual.length).fill('livre')]
          : estresseAtual.slice(0, novoTamanho)

      const next = {
        ...prev,
        ranque: novoRanque,
        estresse: novoEstresse,
        divino: { ...prev.divino, ativo: novoRanque !== 'Humano' ? prev.divino.ativo : false },
      }
      handleUpdate(next)
      return next
    })
  }, [handleUpdate])

  const toggleEstresse = useCallback((index: number) => {
    setCharacter(prev => {
      const novoEstresse = [...prev.estresse]
      if (novoEstresse[index] === 'corrompido') novoEstresse[index] = 'gasto'
      const next = { ...prev, estresse: novoEstresse }
      handleUpdate(next)
      return next
    })
  }, [handleUpdate])

  const adjustEstresse = useCallback((delta: number) => {
    setCharacter(prev => {
      const novoEstresse = [...prev.estresse]
      if (delta > 0) {
        const firstLivre = novoEstresse.indexOf('livre')
        if (firstLivre !== -1) {
          novoEstresse[firstLivre] = 'gasto'
        } else {
          for (let i = novoEstresse.length - 1; i >= 0; i--) {
            if (novoEstresse[i] === 'gasto') { novoEstresse[i] = 'corrompido'; break }
          }
        }
      } else {
        for (let i = novoEstresse.length - 1; i >= 0; i--) {
          if (novoEstresse[i] === 'gasto') { novoEstresse[i] = 'livre'; break }
        }
      }
      const next = { ...prev, estresse: novoEstresse }
      handleUpdate(next)
      return next
    })
  }, [handleUpdate])

  const exportarFicha = useCallback(() => {
    if (!character) return
    // Strip persistence field before exporting
    const { id, ...exportData } = character
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character.nome || 'personagem'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [character])

  const importarFicha = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      // Keep the current sheet's ID when importing over an existing record
      const merged: Persisted<Character> = {
        ...createDefaultCharacter(),
        ...data,
        id: character.id,
        atualizadoEm: new Date().toISOString(),
      }
      setCharacter(merged)
      queueSave(merged)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }, [character.id, queueSave])

  const resetarFicha = useCallback(() => {
    const next: Persisted<Character> = { ...createDefaultCharacter(), id: character.id }
    setCharacter(next)
    queueSave(next)
  }, [character.id, queueSave])

  const rankData: RankData = RANQUES[character?.ranque as RanqueNome] || RANQUES.Humano

  return {
    character,
    rankData,
    updateField,
    updateNestedField,
    updateRanque,
    toggleEstresse,
    adjustEstresse,
    exportarFicha,
    importarFicha,
    resetarFicha,
    loading,
  }
}
