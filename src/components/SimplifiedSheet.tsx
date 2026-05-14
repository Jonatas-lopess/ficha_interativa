import { RANQUES } from '../data/rankData'
import { Character, RanqueNome, Lesoes, LesaoDescricao } from '../types'

interface Props {
  character: Character;
  onUpdateEstresse?: (index: number) => void;
  onAdjustEstresse?: (delta: number) => void;
  onUpdateInjury?: (cat: keyof Lesoes, sev: 'leves' | 'graves' | 'criticas', valor: number | LesaoDescricao[]) => void;
}

/**
 * Ficha Simplificada para NPCs genéricos.
 * Recebe os mesmos dados de um character, mas exibe de forma condensada.
 */
export default function SimplifiedSheet({ character, onUpdateEstresse, onAdjustEstresse, onUpdateInjury }: Props) {
  const rankData = RANQUES[character.ranque as RanqueNome] || RANQUES.Humano

  const stateStyles: Record<string, string> = {
    livre: 'bg-stress-free border-stress-free/50',
    gasto: 'bg-stress-spent border-stress-spent/50',
    corrompido: 'bg-stress-corrupt border-stress-corrupt/50',
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-light p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-title text-gold">{character.nome || 'NPC Sem Nome'}</h3>
          <p className="text-xs text-parchment-dim">Ranque: <span className="text-gold">{character.ranque}</span></p>
        </div>
      </div>

      {/* Estresse inline */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-parchment-dim uppercase tracking-wider">Estresse:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjustEstresse?.(-1)}
            className="text-parchment-dim hover:text-gold transition-colors cursor-pointer text-sm font-bold px-1"
          >
            ←
          </button>
          <div className="flex gap-1">
            {character.estresse.map((estado, i) => (
              <button
                key={i}
                onClick={() => onUpdateEstresse?.(i)}
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${stateStyles[estado]}`}
                title={estado === 'corrompido' ? 'Corrompido (Clique para limpar)' : estado === 'gasto' ? 'Gasto' : 'Livre'}
              />
            ))}
          </div>
          <button
            onClick={() => onAdjustEstresse?.(1)}
            className="text-parchment-dim hover:text-gold transition-colors cursor-pointer text-sm font-bold px-1"
          >
            →
          </button>
        </div>
      </div>

      {/* Lesões compactas */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {(['fisicas', 'mentais', 'espirituais'] as const).map((cat) => {
          const l = character.lesoes[cat]
          const gravesCount = Array.isArray(l.graves) ? l.graves.length : l.graves as unknown as number
          const criticasCount = Array.isArray(l.criticas) ? l.criticas.length : l.criticas as unknown as number
          
          const handleInjuryClick = (e: React.MouseEvent, sev: 'leves' | 'graves' | 'criticas', currentCount: number, max: number) => {
            e.preventDefault()
            if (!onUpdateInjury) return
            const isArray = sev === 'graves' || sev === 'criticas'
            
            let next = 0
            if (e.type === 'click') {
              next = currentCount >= max ? 0 : currentCount + 1
            } else if (e.type === 'contextmenu') {
              next = currentCount <= 0 ? max : currentCount - 1
            }
            
            onUpdateInjury(cat, sev, isArray ? Array.from({ length: next }, () => ({ descricao: '' })) : next)
          }

          return (
            <div key={cat} className="bg-base/50 rounded-lg p-2 border border-surface-light/50">
              <span className="text-parchment-dim capitalize">{cat}</span>
              <div className="flex justify-center gap-2 mt-1">
                <button
                  onClick={(e) => handleInjuryClick(e, 'leves', l.leves, rankData.lesoesLeves)}
                  onContextMenu={(e) => handleInjuryClick(e, 'leves', l.leves, rankData.lesoesLeves)}
                  className="text-injury-light hover:bg-injury-light/20 px-1 rounded transition-colors cursor-pointer font-bold tabular-nums"
                  title="Leves (Clique Esquerdo: +, Direito: -)"
                >
                  {l.leves}L
                </button>
                <button
                  onClick={(e) => handleInjuryClick(e, 'graves', gravesCount, rankData.lesoesGraves)}
                  onContextMenu={(e) => handleInjuryClick(e, 'graves', gravesCount, rankData.lesoesGraves)}
                  className="text-injury-severe hover:bg-injury-severe/20 px-1 rounded transition-colors cursor-pointer font-bold tabular-nums"
                  title="Graves (Clique Esquerdo: +, Direito: -)"
                >
                  {gravesCount}G
                </button>
                <button
                  onClick={(e) => handleInjuryClick(e, 'criticas', criticasCount, rankData.lesoesCriticas)}
                  onContextMenu={(e) => handleInjuryClick(e, 'criticas', criticasCount, rankData.lesoesCriticas)}
                  className="text-injury-critical hover:bg-injury-critical/20 px-1 rounded transition-colors cursor-pointer font-bold tabular-nums"
                  title="Críticas (Clique Esquerdo: +, Direito: -)"
                >
                  {criticasCount}C
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Proficiências inline */}
      {character.proficiencias.length > 0 && (
        <div>
          <span className="text-xs text-parchment-dim uppercase tracking-wider">Proficiências:</span>
          <p className="text-sm text-parchment mt-1">{character.proficiencias.join(', ')}</p>
        </div>
      )}

      {/* Aspectos inline */}
      {character.aspectos?.length > 0 && (
        <div>
          <span className="text-xs text-parchment-dim uppercase tracking-wider">Aspectos:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {character.aspectos.map((a, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-arcane/5 border border-arcane/25 rounded-full text-arcane-dim">
                ✶ {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Traços resumidos */}
      {character.tracos.length > 0 && (
        <div>
          <span className="text-xs text-parchment-dim uppercase tracking-wider">Traços:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {character.tracos.map((t, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-base border border-surface-light rounded-full text-parchment">{t.nome}</span>
            ))}
          </div>
        </div>
      )}

      {/* Equipamentos */}
      {character.equipamentos.length > 0 && (
        <div>
          <span className="text-xs text-parchment-dim uppercase tracking-wider">Equipamentos:</span>
          <p className="text-sm text-parchment mt-1">
            {character.equipamentos.map(e => typeof e === 'string' ? e : e.nome).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
