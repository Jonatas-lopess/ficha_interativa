import { useState, useEffect, useRef } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Inicializa o estado buscando do localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Erro ao ler localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Ref para rastrear a chave atual e evitar salvar dados obsoletos em chaves novas
  const lastKey = useRef(key)

  // Sincroniza o estado quando a chave muda externamente
  useEffect(() => {
    if (lastKey.current !== key) {
      try {
        const item = window.localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
        lastKey.current = key
      } catch (error) {
        setStoredValue(initialValue)
      }
    }
  }, [key, initialValue])

  // Salva no localStorage quando o valor muda, mas apenas se a chave for a correta
  useEffect(() => {
    if (lastKey.current === key) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.warn(`Erro ao salvar localStorage key "${key}":`, error)
      }
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
