import { useState, useCallback } from 'react'
import { rolarNormal, rolarVantagem, rolarDesvantagem, RollResult } from '../utils/diceRoller'
import DiceToast from './DiceToast'

export default function DiceRoller() {
  const [toastResult, setToastResult] = useState<RollResult | null>(null)
  const [toastKey, setToastKey] = useState(0)
  const [historico, setHistorico] = useState<RollResult[]>([])

  const rolar = (fn: () => RollResult) => {
    const res = fn()
    // Increment key to force re-mount of toast on each roll
    setToastKey((k) => k + 1)
    setToastResult(res)
    setHistorico((prev) => [res, ...prev].slice(0, 10))
  }

  const handleDismiss = useCallback(() => {
    setToastResult(null)
  }, [])

  return (
    <>
      <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
        <h2 className="text-lg font-title text-gold tracking-wider mb-4">Rolador de Dados</h2>

        <div className="flex flex-col gap-2">
          <button id="btn-rolar-normal" onClick={() => rolar(rolarNormal)} className="w-full px-4 py-2.5 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 hover:border-gold hover:shadow-glow-gold transition-all cursor-pointer">
            🎲 Normal (2d10)
          </button>
          
          <div className="flex gap-2">
            <button id="btn-rolar-vantagem" onClick={() => rolar(rolarVantagem)} className="flex-1 px-4 py-2.5 text-sm bg-green-500/10 border border-green-600/30 text-green-400 rounded-lg hover:bg-green-500/20 hover:border-green-500/50 transition-all cursor-pointer">
              ↑ Vantagem (3d10)
            </button>
            <button id="btn-rolar-desvantagem" onClick={() => rolar(rolarDesvantagem)} className="flex-1 px-4 py-2.5 text-sm bg-injury-critical/10 border border-injury-critical/30 text-injury-critical rounded-lg hover:bg-injury-critical/20 hover:border-injury-critical/50 transition-all cursor-pointer">
              ↓ Desvantagem (3d10)
            </button>
          </div>
        </div>

        {historico.length > 0 && (
          <details className="text-xs mt-4">
            <summary className="text-parchment-dim cursor-pointer hover:text-parchment transition-colors">
              Histórico ({historico.length} rolagem{historico.length > 1 ? 'ns' : ''})
            </summary>
            <div className="mt-2 space-y-1">
              {historico.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-base/30 rounded px-3 py-1.5 border border-surface-light/30">
                  <span className="text-parchment-dim">{r.tipo}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-parchment tabular-nums font-medium">{r.total}</span>
                    <span className={`text-xs ${r.cor}`}>{r.faixa}</span>
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      {/* Toast rendered via portal-like placement (fixed position in DiceToast) */}
      <DiceToast
        key={toastKey}
        resultado={toastResult}
        onDismiss={handleDismiss}
        duration={5000}
      />
    </>
  )
}
