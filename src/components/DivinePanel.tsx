import { useState, useEffect, useMemo } from 'react'
import AnchorCard from './AnchorCard'
import { PESO_DIVINO, SATURACAO_ESTAGIOS, INTEGRACAO_ESTAGIOS } from '../data/rankData'
import SectionHeader from './SectionHeader'
import { SunIcon } from './Icons'
import { Divino, Ancora, SaturacaoEstagio, IntegracaoEstagio, RanqueNome, Traco, TipoEfeito, DivineTrait } from '../types'
import { getDatabase } from '../db'

const STAGE_ORDER: SaturacaoEstagio[] = ['Centelha', 'Crescente', 'Consolidado', 'Completo']

const STAGE_ICONS: Record<string, string> = {
  Centelha: '🔥',
  Crescente: '🌙',
  Consolidado: '⚡',
  Completo: '👁',
}

function getEffectTypes(traco: Traco): TipoEfeito[] {
  if (!traco.efeitos || traco.efeitos.length === 0) {
    return ['Passivo']
  }
  const tipos = traco.efeitos.map(e => e.tipo)
  return Array.from(new Set(tipos))
}

interface Props {
  divino: Divino;
  ranque: RanqueNome;
  onUpdateDivino: <K extends keyof Divino>(field: K, value: Divino[K]) => void;
  onUpdateAnchors: (ancoras: Ancora[]) => void;
  tracos: Traco[];
  onUpdateTraits: (tracos: Traco[]) => void;
  aspectos: string[];
  onUpdateAspects: (aspectos: string[]) => void;
  proficiencias: string[];
  onUpdateProficiencies: (proficiencias: string[]) => void;
}

interface DivineSkill {
  id: string;
  nome: string;
  tipo: string;
  caminho?: string;
  ranqueRequisito?: RanqueNome;
  saturacaoRequisito?: SaturacaoEstagio;
  conceito?: string;
}

export default function DivinePanel({
  divino,
  ranque,
  onUpdateDivino,
  onUpdateAnchors,
  tracos,
  onUpdateTraits,
  aspectos,
  onUpdateAspects,
  proficiencias,
  onUpdateProficiencies,
}: Props) {
  const [dbTraits, setDbTraits] = useState<DivineTrait[]>([])
  const [dbSkills, setDbSkills] = useState<DivineSkill[]>([])
  const [loadingTraits, setLoadingTraits] = useState(true)
  const [loadingSkills, setLoadingSkills] = useState(true)
  const loading = loadingTraits || loadingSkills
  const [expandedStage, setExpandedStage] = useState<SaturacaoEstagio | null>(null)

  useEffect(() => {
    let active = true
    let subTraits: any
    let subSkills: any

    getDatabase().then(db => {
      if (!active) return

      subTraits = db.traits
        .find({
          selector: {
            origem: 'Divino'
          }
        })
        .$.subscribe(docs => {
          if (!active) return
          const list = docs.map(doc => {
            const raw = doc.toJSON()
            return {
              id: raw.id,
              nome: raw.nome || "",
              conceito: raw.conceito || "",
              gatilho: raw.gatilho || "",
              efeitos: raw.efeitos || [],
              limiteCusto: raw.limiteCusto || "",
              origem: raw.origem || "Base",
              caminho: raw.caminho || "",
              ranqueRequisito: raw.ranqueRequisito || "",
              saturacaoRequisito: raw.saturacaoRequisito || "",
            } as DivineTrait
          })
          setDbTraits(list)
          setLoadingTraits(false)
        })

      subSkills = db.skills
        .find()
        .$.subscribe(docs => {
          if (!active) return
          const list = docs.map(doc => {
            const raw = doc.toJSON()
            return {
              id: raw.id,
              nome: raw.nome || "",
              tipo: raw.tipo || "",
              caminho: raw.caminho || "",
              ranqueRequisito: raw.ranqueRequisito || "",
              saturacaoRequisito: raw.saturacaoRequisito || "",
              conceito: raw.conceito || "",
            } as DivineSkill
          })
          setDbSkills(list)
          setLoadingSkills(false)
        })
    }).catch(err => {
      console.error("Erro ao carregar banco de dados no DivinePanel:", err)
      if (active) {
        setLoadingTraits(false)
        setLoadingSkills(false)
      }
    })

    return () => {
      active = false
      if (subTraits) subTraits.unsubscribe()
      if (subSkills) subSkills.unsubscribe()
    }
  }, [])

  // Keep character traits, aspects, and proficiencies in sync with unlocked/Centelha skills/traits
  useEffect(() => {
    if (loading || ranque === 'Humano') return

    const activePathway = divino.caminho
    const activeRank = ranque

    // 1. Sync traits
    const expectedDivineTraits = dbTraits.filter(t => {
      if (t.caminho !== activePathway || t.ranqueRequisito !== activeRank) {
        return false
      }
      return t.saturacaoRequisito === 'Centelha' || (divino.habilidadesNucleo || []).includes(t.nome)
    })

    const currentDivineTraits = tracos.filter(t => t.origem === 'Divino')

    const missingTraits = expectedDivineTraits.filter(
      et => !tracos.some(t => t.nome === et.nome)
    )

    const outdatedTraits = currentDivineTraits.filter(
      ct => !expectedDivineTraits.some(et => et.nome === ct.nome)
    )

    if (missingTraits.length > 0 || outdatedTraits.length > 0) {
      const nextTraits = [
        ...tracos.filter(t => t.origem !== 'Divino' || expectedDivineTraits.some(et => et.nome === t.nome)),
        ...missingTraits
      ]
      onUpdateTraits(nextTraits)
    }

    // 2. Sync aspects
    const dbAspects = dbSkills.filter(s => s.tipo === 'aspecto')
    const dbAspectNames = dbAspects.map(s => s.nome)
    const expectedAspects = dbAspects.filter(s => 
      s.caminho === activePathway &&
      s.ranqueRequisito === activeRank &&
      (s.saturacaoRequisito === 'Centelha' || (divino.habilidadesNucleo || []).includes(s.nome))
    )
    const expectedAspectNames = expectedAspects.map(s => s.nome)

    const missingAspects = expectedAspectNames.filter(name => !aspectos.includes(name))
    const outdatedAspects = aspectos.filter(name => dbAspectNames.includes(name) && !expectedAspectNames.includes(name))

    if (missingAspects.length > 0 || outdatedAspects.length > 0) {
      const nextAspects = [
        ...aspectos.filter(name => !dbAspectNames.includes(name) || expectedAspectNames.includes(name)),
        ...missingAspects
      ]
      onUpdateAspects(nextAspects)
    }

    // 3. Sync proficiencies
    const dbProficiencies = dbSkills.filter(s => s.tipo === 'proficiencia')
    const dbProficiencyNames = dbProficiencies.map(s => s.nome)
    const expectedProficiencies = dbProficiencies.filter(s => 
      s.caminho === activePathway &&
      s.ranqueRequisito === activeRank &&
      (s.saturacaoRequisito === 'Centelha' || (divino.habilidadesNucleo || []).includes(s.nome))
    )
    const expectedProficiencyNames = expectedProficiencies.map(s => s.nome)

    const missingProficiencies = expectedProficiencyNames.filter(name => !proficiencias.includes(name))
    const outdatedProficiencies = proficiencias.filter(name => dbProficiencyNames.includes(name) && !expectedProficiencyNames.includes(name))

    if (missingProficiencies.length > 0 || outdatedProficiencies.length > 0) {
      const nextProficiencies = [
        ...proficiencias.filter(name => !dbProficiencyNames.includes(name) || expectedProficiencyNames.includes(name)),
        ...missingProficiencies
      ]
      onUpdateProficiencies(nextProficiencies)
    }
  }, [
    dbTraits,
    dbSkills,
    divino.caminho,
    divino.habilidadesNucleo,
    ranque,
    tracos,
    aspectos,
    proficiencias,
    loading,
    onUpdateTraits,
    onUpdateAspects,
    onUpdateProficiencies
  ])

  const PATHWAYS = useMemo(() => {
    const base = ['Destruição', 'Morte']
    if (divino.caminho && !base.includes(divino.caminho)) {
      base.push(divino.caminho)
    }
    dbTraits.forEach(t => {
      if (t.caminho && !base.includes(t.caminho)) {
        base.push(t.caminho)
      }
    })
    dbSkills.forEach(s => {
      if (s.caminho && !base.includes(s.caminho)) {
        base.push(s.caminho)
      }
    })
    return base
  }, [divino.caminho, dbTraits, dbSkills])

  const pesoInfo = PESO_DIVINO.find((p) => p.nivel === divino.pesoDivino) || PESO_DIVINO[0]

  const currentSatIdx = STAGE_ORDER.indexOf(divino.saturacao)

  const getSkillsForStage = (stage: SaturacaoEstagio): (DivineTrait | DivineSkill)[] => {
    const traits = dbTraits.filter(t => 
      t.caminho === divino.caminho &&
      t.ranqueRequisito === ranque &&
      t.saturacaoRequisito === stage
    )
    const skills = dbSkills.filter(s => 
      s.caminho === divino.caminho &&
      s.ranqueRequisito === ranque &&
      s.saturacaoRequisito === stage
    )
    return [...traits, ...skills]
  }

  const unlocked = divino.habilidadesNucleo || []

  const toggleSkill = (skillName: string) => {
    const isUnlocked = unlocked.includes(skillName)
    const nextHabilidades = isUnlocked
      ? unlocked.filter(n => n !== skillName)
      : [...unlocked, skillName]
    onUpdateDivino('habilidadesNucleo', nextHabilidades)
  }

  const handlePathwayChange = (newCaminho: string) => {
    onUpdateDivino('habilidadesNucleo', [])
    onUpdateDivino('caminho', newCaminho)
  }

  const handleStageClick = (stage: SaturacaoEstagio) => {
    const stageIdx = STAGE_ORDER.indexOf(stage)
    if (stageIdx > currentSatIdx) return // locked
    setExpandedStage(prev => prev === stage ? null : stage)
  }

  const hasAnySkills = STAGE_ORDER.some(s => getSkillsForStage(s).length > 0)

  if (loading) {
    return (
      <section className="rounded-xl border border-arcane/30 p-4 md:p-6 bg-gradient-to-br from-arcane/10 to-transparent">
        <SectionHeader title="Painel Divino" subtitle="Integração e Máculas" icon={<SunIcon />} color="text-arcane-bright" />
        <div className="flex items-center justify-center py-8">
          <span className="text-sm text-parchment-dim animate-pulse">Carregando dados divinos...</span>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-arcane/30 p-4 md:p-6 bg-gradient-to-br from-arcane/10 to-transparent">
      <SectionHeader title="Painel Divino" subtitle="Integração e Máculas" icon={<SunIcon />} color="text-arcane-bright" />

      <div className="space-y-4">
        <div>
          <label htmlFor="divine-caminho" className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">Caminho Divino</label>
          <select
            id="divine-caminho"
            value={divino.caminho}
            onChange={(e) => handlePathwayChange(e.target.value)}
            className="w-full bg-base/50 border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-arcane outline-none transition-all cursor-pointer"
          >
            <option value="">Selecione um Caminho…</option>
            {PATHWAYS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
              <div className="grid grid-cols-4 gap-2">
                {STAGE_ORDER.map((stage, idx) => {
                  const isUnlocked = idx <= currentSatIdx
                  const isExpanded = expandedStage === stage
                  const stageSkills = getSkillsForStage(stage)
                  const isCentelhaStage = stage === 'Centelha'
                  const unlockedCount = isCentelhaStage
                    ? stageSkills.length
                    : stageSkills.filter(s => unlocked.includes(s.nome)).length

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
                      const isSkillUnlocked = unlocked.includes(skill.nome) || isCentelha

                      return (
                        <button
                          key={skill.nome}
                          onClick={() => {
                            if (isCentelha) return
                            toggleSkill(skill.nome)
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
                                  ✦ {skill.nome}
                                </span>
                                {((skill as any).tipo === 'aspecto' || (skill as any).tipo === 'proficiencia') ? (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-arcane/20 text-arcane-bright border border-arcane/30 rounded uppercase font-semibold tracking-wider">
                                    {(skill as any).tipo === 'aspecto' ? "Aspecto" : "Proficiência"}
                                  </span>
                                ) : (
                                  getEffectTypes(skill as Traco).map((effectType) => {
                                    const labelMap: Record<TipoEfeito, string> = {
                                      Passivo: "Traço Passivo",
                                      Ativável: "Traço Ativável",
                                      Reativo: "Traço Reativo",
                                    }
                                    return (
                                      <span key={effectType} className="text-[9px] px-1.5 py-0.5 bg-arcane/20 text-arcane-bright border border-arcane/30 rounded uppercase font-semibold tracking-wider">
                                        {labelMap[effectType] || effectType}
                                      </span>
                                    )
                                  })
                                )}
                              </div>
                              {skill.conceito && (
                                <p className="text-[11px] text-parchment-dim/70 mt-1 leading-relaxed">
                                  {skill.conceito}
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
