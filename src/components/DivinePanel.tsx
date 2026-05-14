import AnchorCard from './AnchorCard'
import { PESO_DIVINO, SATURACAO_ESTAGIOS, INTEGRACAO_ESTAGIOS } from '../data/rankData'
import SectionHeader from './SectionHeader'
import { SunIcon } from './Icons'
import { Divino, Ancora, SaturacaoEstagio, IntegracaoEstagio } from '../types'

interface Props {
  divino: Divino;
  onUpdateDivino: <K extends keyof Divino>(field: K, value: Divino[K]) => void;
  onUpdateAnchors: (ancoras: Ancora[]) => void;
}

export default function DivinePanel({ divino, onUpdateDivino, onUpdateAnchors }: Props) {
  if (!divino.ativo) return null

  const pesoInfo = PESO_DIVINO.find((p) => p.nivel === divino.pesoDivino) || PESO_DIVINO[0]

  return (
    <section className="rounded-xl border border-arcane/30 p-4 md:p-6 bg-gradient-to-br from-arcane/10 to-transparent">
      <SectionHeader title="Painel Divino" subtitle="Integração e Máculas" icon={<SunIcon />} color="text-arcane-bright" />

      <div className="space-y-4">
        <div>
          <label htmlFor="divine-caminho" className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">Caminho Divino</label>
          <input id="divine-caminho" type="text" value={divino.caminho} onChange={(e) => onUpdateDivino('caminho', e.target.value)} placeholder="Ex: Caminho da Tempestade" className="w-full bg-base/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane outline-none transition-all" />
        </div>

        <div>
          <label htmlFor="divine-persona" className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">Persona</label>
          <input id="divine-persona" type="text" value={divino.persona} onChange={(e) => onUpdateDivino('persona', e.target.value)} placeholder="Nome da Persona divina" className="w-full bg-base/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane outline-none transition-all" />
        </div>

        <div>
          <label className="block text-xs text-parchment-dim mb-2 uppercase tracking-wider">Peso Divino — {pesoInfo.nome}</label>
          <div className="flex gap-1 mb-1">
            {PESO_DIVINO.map((p) => (
              <button key={p.nivel} id={`peso-divino-${p.nivel}`} onClick={() => onUpdateDivino('pesoDivino', p.nivel)} className={`flex-1 h-8 rounded-md border text-xs font-medium transition-all cursor-pointer ${p.nivel <= divino.pesoDivino ? 'bg-arcane border-arcane text-parchment' : 'bg-base/30 border-surface-light text-parchment-dim/50 hover:border-arcane-dim'}`}>
                {p.nivel}
              </button>
            ))}
          </div>
          <p className="text-xs text-parchment-dim/60 italic">{pesoInfo.descricao}</p>
        </div>

        <div>
          <label className="block text-xs text-parchment-dim mb-2 uppercase tracking-wider">Saturação</label>
          <div className="flex gap-1">
            {SATURACAO_ESTAGIOS.map((s, idx) => {
              const currentIdx = SATURACAO_ESTAGIOS.indexOf(divino.saturacao)
              const isActive = idx <= currentIdx
              return (
                <button 
                  key={s} 
                  onClick={() => onUpdateDivino('saturacao', s)} 
                  className={`flex-1 h-8 rounded-md border text-[10px] md:text-xs font-medium transition-all cursor-pointer ${isActive ? 'bg-arcane border-arcane text-parchment' : 'bg-base/30 border-surface-light text-parchment-dim/50 hover:border-arcane-dim'}`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs text-parchment-dim mb-2 uppercase tracking-wider">Integração</label>
          <div className="flex gap-1">
            {INTEGRACAO_ESTAGIOS.map((s, idx) => {
              const currentIdx = INTEGRACAO_ESTAGIOS.indexOf(divino.integracao)
              const isActive = idx <= currentIdx
              return (
                <button 
                  key={s} 
                  onClick={() => onUpdateDivino('integracao', s)} 
                  className={`flex-1 h-8 rounded-md border text-[10px] md:text-xs font-medium transition-all cursor-pointer ${isActive ? 'bg-arcane border-arcane text-parchment' : 'bg-base/30 border-surface-light text-parchment-dim/50 hover:border-arcane-dim'}`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-arcane/30 to-transparent" />

        <AnchorCard ancoras={divino.ancoras} onUpdate={onUpdateAnchors} />
      </div>
    </section>
  )
}
