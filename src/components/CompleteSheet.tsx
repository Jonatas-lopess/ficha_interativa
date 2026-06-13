import { useState } from 'react'
import Header from './Header'
import StressBar from './StressBar'
import InjuryTracker from './InjuryTracker'
import ProficiencyList from './ProficiencyList'
import AspectList from './AspectList'
import TraitCard from './TraitCard'
import DivinePanel from './DivinePanel'
import InventoryList from './InventoryList'
import StoryPanel from './StoryPanel'
import FloatingDiceRoller from './FloatingDiceRoller'
import { Character, RankData, RanqueNome, Divino, Ancora, Lesoes, LesaoDescricao } from '../types'

type TabId = 'identidade' | 'combate' | 'tracos' | 'inventario' | 'divino'

interface TabDef {
  id: TabId
  label: string
  icon: string
  conditional?: boolean
}

const TABS: TabDef[] = [
  { id: 'identidade', label: 'Geral', icon: '👤' },
  { id: 'combate', label: 'Combate', icon: '⚔️' },
  { id: 'tracos', label: 'Traços', icon: '🃏' },
  { id: 'inventario', label: 'Inventário', icon: '🎒' },
  { id: 'divino', label: 'Divino', icon: '✦', conditional: true },
]

interface Props {
  character: Character;
  rankData: RankData;
  updateField: <K extends keyof Character>(field: K, value: Character[K]) => void;
  updateNestedField: <K extends keyof Character, NK extends keyof Character[K]>(parent: K, field: NK, value: Character[K][NK]) => void;
  updateRanque: (novoRanque: RanqueNome) => void;
  toggleEstresse: (index: number) => void;
  adjustEstresse: (delta: number) => void;
  exportarFicha: () => void;
  importarFicha: (jsonString: string) => { success: boolean; error?: string };
  resetarFicha: () => void;
  onBack?: () => void;
  onOpenCatalog?: () => void;
}

export default function CompleteSheet({
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
  onBack,
  onOpenCatalog
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('identidade')

  const handleInjuryUpdate = (categoria: keyof Lesoes, severidade: 'leves' | 'graves' | 'criticas', valor: number | LesaoDescricao[]) => {
    updateField('lesoes', {
      ...character.lesoes,
      [categoria]: {
        ...character.lesoes[categoria],
        [severidade]: valor,
      },
    })
  }

  const handleUpdateAnchors = (ancoras: Ancora[]) => {
    updateField('divino', { ...character.divino, ancoras })
  }

  const handleUpdateDivino = <K extends keyof Divino>(field: K, value: Divino[K]) => {
    updateNestedField('divino', field, value as any)
  }

  const canHaveDivine = character.ranque !== 'Humano'

  const visibleTabs = TABS.filter((t) => !t.conditional || canHaveDivine)

  // If current tab becomes hidden (e.g. rank changed to Humano while on divino tab), fall back
  if (!visibleTabs.some((t) => t.id === activeTab)) {
    // Can't call setState during render, but this is safe as a guard — it'll fire once
    queueMicrotask(() => setActiveTab('identidade'))
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Top bar: back + tabs */}
      <nav className="sticky top-0 z-40 bg-base/95 backdrop-blur-md border-b border-surface-light">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="shrink-0 px-3 py-1.5 rounded-lg text-parchment-dim text-sm hover:text-gold transition-colors cursor-pointer"
                title="Voltar"
              >
                ←
              </button>
            )}

            {/* Tab strip — scrollable on mobile */}
            <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-gold'
                        : 'text-parchment-dim hover:text-parchment'
                    }`}
                  >
                    <span className="text-xs">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <main>
          {/* — Geral — */}
          {activeTab === 'identidade' && (
            <div className="space-y-6 animate-fadeIn">
              <Header
                character={character}
                updateField={updateField}
                updateRanque={updateRanque}
                exportarFicha={exportarFicha}
                importarFicha={importarFicha as any}
                resetarFicha={resetarFicha}
              />
              <StoryPanel
                character={character}
                updateField={updateField}
              />
            </div>
          )}

          {/* — Combate — */}
          {activeTab === 'combate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              <InjuryTracker
                lesoes={character.lesoes}
                rankData={rankData}
                onUpdate={handleInjuryUpdate}
              />

              <div className="space-y-6">
                <StressBar
                  estresse={character.estresse}
                  maxEstresse={rankData.estresseMaximo}
                  onToggle={toggleEstresse}
                  onAdjust={adjustEstresse}
                />
                <ProficiencyList
                  proficiencias={character.proficiencias}
                  onUpdate={(val) => updateField("proficiencias", val)}
                />
                <AspectList
                  aspectos={character.aspectos}
                  onUpdate={(val) => updateField("aspectos", val)}
                />
              </div>
            </div>
          )}

          {/* — Traços — */}
          {activeTab === 'tracos' && (
            <div className="animate-fadeIn">
              <TraitCard
                tracos={character.tracos}
                onUpdate={(val) => updateField('tracos', val)}
                onOpenCatalog={onOpenCatalog}
              />
            </div>
          )}

          {/* — Inventário — */}
          {activeTab === 'inventario' && (
            <div className="animate-fadeIn">
              <InventoryList
                equipamentos={character.equipamentos}
                onUpdate={(val) => updateField("equipamentos", val)}
              />
            </div>
          )}

          {/* — Divino (conditional) — */}
          {activeTab === 'divino' && canHaveDivine && (
            <div className="animate-fadeIn">
              <DivinePanel
                divino={character.divino}
                ranque={character.ranque}
                onUpdateDivino={handleUpdateDivino}
                onUpdateAnchors={handleUpdateAnchors}
              />
            </div>
          )}


        </main>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-light to-transparent mb-4" />
          <p className="text-xs text-parchment-dim/40">
            Ficha Interativa — Sistema Narrativo 2d10
          </p>
        </footer>
      </div>

      {/* Floating Dice Roller */}
      <FloatingDiceRoller />
    </div>
  )
}
