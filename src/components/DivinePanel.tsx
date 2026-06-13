import { useState } from 'react'
import AnchorCard from './AnchorCard'
import { PESO_DIVINO, SATURACAO_ESTAGIOS, INTEGRACAO_ESTAGIOS } from '../data/rankData'
import SectionHeader from './SectionHeader'
import { SunIcon } from './Icons'
import { Divino, Ancora, SaturacaoEstagio, IntegracaoEstagio, RanqueNome } from '../types'
import coreSkillsData from '../data/coreSkills.json'

// --- Core Skills types ---
interface CoreSkill {
  name: string;
  description: string;
  type: string;
}

interface PathwayData {
  pathway: string;
  ranks: Record<string, Record<string, CoreSkill[]>>;
}

const STAGE_ORDER: SaturacaoEstagio[] = ['Centelha', 'Crescente', 'Consolidado', 'Completo']

const STAGE_ICONS: Record<string, string> = {
  Centelha: '🔥',
  Crescente: '🌙',
  Consolidado: '⚡',
  Completo: '👁',
}

// Extract unique pathway names from the JSON
const PATHWAYS = (coreSkillsData as PathwayData[]).map(p => p.pathway)

interface Props {
  divino: Divino;
  ranque: RanqueNome;
  onUpdateDivino: <K extends keyof Divino>(field: K, value: Divino[K]) => void;
  onUpdateAnchors: (ancoras: Ancora[]) => void;
}

export default function DivinePanel({ divino, ranque, onUpdateDivino, onUpdateAnchors }: Props) {
  const [expandedStage, setExpandedStage] = useState<SaturacaoEstagio | null>(null)

  const pesoInfo = PESO_DIVINO.find((p) => p.nivel === divino.pesoDivino) || PESO_DIVINO[0]

  const currentSatIdx = STAGE_ORDER.indexOf(divino.saturacao)

  // Find the skills for the current pathway + rank
  const pathwayData = (coreSkillsData as PathwayData[]).find(
    p => p.pathway === divino.caminho
  )

  const rankKey = ranque === 'Humano' ? '' : ranque
  const rankPool = rankKey && pathwayData?.ranks?.[rankKey]

  const getSkillsForStage = (stage: SaturacaoEstagio): CoreSkill[] => {
    if (!rankPool) return []
    return (rankPool[stage] as CoreSkill[]) || []
  }

  const unlocked = divino.habilidadesNucleo || []

  const toggleSkill = (skillName: string) => {
    const next = unlocked.includes(skillName)
      ? unlocked.filter(n => n !== skillName)
      : [...unlocked, skillName]
    onUpdateDivino('habilidadesNucleo', next)
  }

  const handleStageClick = (stage: SaturacaoEstagio) => {
    const stageIdx = STAGE_ORDER.indexOf(stage)
    if (stageIdx > currentSatIdx) return // locked
    setExpandedStage(prev => prev === stage ? null : stage)
  }

  // Check if there are any skills at all for the current pathway+rank
  const hasAnySkills = STAGE_ORDER.some(s => getSkillsForStage(s).length > 0)

  return (
    <section className="rounded-xl border border-arcane/30 p-4 md:p-6 bg-gradient-to-br from-arcane/10 to-transparent">
      <SectionHeader title="Painel Divino" subtitle="Integração e Máculas" icon={<SunIcon />} color="text-arcane-bright" />

      <div className="space-y-4">
        {/* Caminho Divino — select */}
        <div>
          <label htmlFor="divine-caminho" className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">Caminho Divino</label>
          <select
            id="divine-caminho"
            value={divino.caminho}
            onChange={(e) => onUpdateDivino('caminho', e.target.value)}
            className="w-full bg-base/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-arcane outline-none transition-all cursor-pointer"
          >
            <option value="">Selecione um Caminho…</option>
            {PATHWAYS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Persona */}
        <div>
          <label htmlFor="divine-persona" className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">Persona</label>
          <input id="divine-persona" type="text" value={divino.persona} onChange={(e) => onUpdateDivino('persona', e.target.value)} placeholder="Nome da Persona divina" className="w-full bg-base/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane outline-none transition-all" />
        </div>

        {/* Peso Divino */}
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

        {/* Saturação */}
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

        {/* Integração */}
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

        {/* ═══ HABILIDADES DO NÚCLEO ═══ */}
        <div className="h-px bg-gradient-to-r from-transparent via-arcane/30 to-transparent" />

        <div>
          <h3 className="font-title text-sm text-arcane-bright uppercase tracking-widest mb-3">
            ✦ Habilidades do Núcleo
          </h3>

          {!divino.caminho ? (
            <p className="text-xs text-parchment-dim/50 italic text-center py-4">
              Selecione um Caminho Divino para visualizar as habilidades.
            </p>
          ) : !hasAnySkills ? (
            <p className="text-xs text-parchment-dim/50 italic text-center py-4">
              Nenhuma habilidade cadastrada para este Ranque.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Stage cards row */}
              <div className="grid grid-cols-4 gap-2">
                {STAGE_ORDER.map((stage, idx) => {
                  const isUnlocked = idx <= currentSatIdx
                  const isExpanded = expandedStage === stage
                  const stageSkills = getSkillsForStage(stage)
                  const isCentelhaStage = stage === 'Centelha'
                  const unlockedCount = isCentelhaStage
                    ? stageSkills.length
                    : stageSkills.filter(s => unlocked.includes(s.name)).length

                  return (
                    <button
                      key={stage}
                      onClick={() => handleStageClick(stage)}
                      disabled={!isUnlocked}
                      className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-lg border text-xs font-medium transition-all duration-300
                        ${isUnlocked
                          ? isExpanded
                            ? 'bg-arcane/20 border-arcane text-parchment ring-1 ring-arcane/40'
                            : 'bg-base/40 border-arcane/40 text-parchment hover:bg-arcane/10 hover:border-arcane cursor-pointer'
                          : 'bg-base/20 border-surface-light/30 text-parchment-dim/30 cursor-not-allowed'
                        }`}
                    >
                      <span className="text-base">{isUnlocked ? STAGE_ICONS[stage] : '🔒'}</span>
                      <span className="text-[10px] md:text-xs leading-tight">{stage}</span>
                      {stageSkills.length > 0 && isUnlocked && (
                        <span className="text-[9px] text-parchment-dim/50">
                          {unlockedCount}/{stageSkills.length}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Expanded skill list */}
              {expandedStage && (
                <div className="mt-2 space-y-1.5 animate-fadeIn">
                  {(() => {
                    const skills = getSkillsForStage(expandedStage)
                    if (skills.length === 0) {
                      return (
                        <p className="text-xs text-parchment-dim/50 italic text-center py-3">
                          Nenhuma habilidade neste estágio.
                        </p>
                      )
                    }

                    const isCentelha = expandedStage === 'Centelha'

                    return skills.map((skill) => {
                      const isSkillUnlocked = unlocked.includes(skill.name) || isCentelha

                      return (
                        <button
                          key={skill.name}
                          onClick={() => {
                            if (isCentelha) return // auto-unlocked, no toggle
                            toggleSkill(skill.name)
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                            ${isCentelha
                              ? 'bg-arcane/15 border-arcane/30 cursor-default'
                              : isSkillUnlocked
                                ? 'bg-arcane/15 border-arcane/50 hover:bg-arcane/20 cursor-pointer'
                                : 'bg-base/30 border-surface-light/40 hover:border-arcane/40 hover:bg-base/50 cursor-pointer'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-parchment">
                                  ✦ {skill.name}
                                </span>
                                {skill.type && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-arcane/20 text-arcane-bright border border-arcane/30 rounded uppercase font-semibold tracking-wider">
                                    {skill.type}
                                  </span>
                                )}
                              </div>
                              {skill.description && (
                                <p className="text-[11px] text-parchment-dim/70 mt-1 leading-relaxed">
                                  {skill.description}
                                </p>
                              )}
                            </div>
                            <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all
                              ${isSkillUnlocked
                                ? 'bg-arcane border-arcane text-white text-[10px]'
                                : 'border-surface-light/50'
                              }`}
                            >
                              {isSkillUnlocked && '✓'}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-arcane/30 to-transparent" />

        <AnchorCard ancoras={divino.ancoras} onUpdate={onUpdateAnchors} />
      </div>
    </section>
  )
}
