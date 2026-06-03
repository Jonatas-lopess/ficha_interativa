import { useEffect, useState } from 'react'
import { RollResult } from '../utils/diceRoller'

interface Props {
  resultado: RollResult | null;
  onDismiss?: () => void;
  duration?: number;
}

/**
 * Toast flutuante para resultado de rolagem.
 * Auto-dismiss após `duration` ms. Animação de slide-in/slide-out.
 */
export default function DiceToast({ resultado, onDismiss, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!resultado) return

    // Trigger enter animation
    const enterTimer = requestAnimationFrame(() => setVisible(true))

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        setVisible(false)
        setExiting(false)
        onDismiss?.()
      }, 300)
    }, duration)

    return () => {
      cancelAnimationFrame(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [resultado, duration, onDismiss])

  if (!resultado) return null

  const handleClose = () => {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      setExiting(false)
      onDismiss?.()
    }, 300)
  }

  // Determine which dice were kept (for 3d10 rolls)
  const isKept = (diceValue: number, diceIndex: number) => {
    const kept = [...resultado.mantidos]
    const used: number[] = []
    for (let i = 0; i < resultado.dados.length; i++) {
      const idx = kept.findIndex((k, ki) => k === resultado.dados[i] && !used.includes(ki))
      if (idx !== -1) {
        used.push(idx)
        if (i === diceIndex) return true
      } else {
        if (i === diceIndex) return false
      }
    }
    return false
  }

  return (
    <div
      className={`fixed z-50 top-16 right-4 w-72 transition-all duration-300 ${
        visible && !exiting
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-surface/95 backdrop-blur-md border border-surface-light rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-base/50 border-b border-surface-light/50">
          <span className="text-[10px] text-parchment-dim uppercase tracking-wider">
            {resultado.tipo}
          </span>
          <button
            onClick={handleClose}
            className="text-parchment-dim/40 hover:text-parchment text-xs cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-3 text-center">
          {/* Dice */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {resultado.dados.map((d, i) => {
              const kept = isKept(d, i)
              return (
                <span
                  key={i}
                  className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-base font-bold ${
                    kept
                      ? 'border-gold text-gold bg-gold/10'
                      : 'border-surface-light text-parchment-dim/40 bg-base/30 line-through'
                  }`}
                >
                  {d}
                </span>
              )
            })}
          </div>

          {/* Total */}
          <p className="text-2xl font-title text-gold font-bold leading-none">
            {resultado.total}
          </p>

          {/* Faixa */}
          <p className={`text-xs font-medium mt-1 ${resultado.cor}`}>
            {resultado.faixa}
          </p>
        </div>

        {/* Timer bar */}
        <div className="h-0.5 bg-base/30">
          <div
            className="h-full bg-gold/40 transition-none"
            style={{
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
