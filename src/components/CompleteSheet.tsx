import Header from './Header'
import StressBar from './StressBar'
import InjuryTracker from './InjuryTracker'
import ProficiencyList from './ProficiencyList'
import AspectList from './AspectList'
import TraitCard from './TraitCard'
import DivinePanel from './DivinePanel'
import InventoryList from './InventoryList'
import DiceRoller from './DiceRoller'
import StoryPanel from './StoryPanel'
import SectionNav from './SectionNav'
import { Character, RankData, RanqueNome, Divino, Ancora, Lesoes, LesaoDescricao } from '../types'

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

  // Toggle divine panel visibility when rank allows it
  const canHaveDivine = character.ranque !== 'Humano'

  return (
    <div className="min-h-screen bg-base">
      <SectionNav showDivine={canHaveDivine && character.divino.ativo} onBack={onBack} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div id="secao-identidade">
          <Header
            character={character}
            updateField={updateField}
            updateRanque={updateRanque}
            exportarFicha={exportarFicha}
            importarFicha={importarFicha as any}
            resetarFicha={resetarFicha}
          />
        </div>

        <main className="space-y-6">
          {/* Estresse + Rolador de Dados — compactos lado a lado */}
          <section id="secao-estresse-dados">
            <h2 className="sr-only">Estresse e Dados</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StressBar
                estresse={character.estresse}
                maxEstresse={rankData.estresseMaximo}
                onToggle={toggleEstresse}
                onAdjust={adjustEstresse}
              />
              <DiceRoller />
            </div>
          </section>

          {/* Proficiências + Aspectos — lado a lado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="secao-proficiencias">
              <ProficiencyList
                proficiencias={character.proficiencias}
                onUpdate={(val) => updateField("proficiencias", val)}
              />
            </div>
            <div id="secao-aspectos">
              <AspectList
                aspectos={character.aspectos}
                onUpdate={(val) => updateField("aspectos", val)}
              />
            </div>
          </section>

          {/* Lesões + Inventário — lado a lado */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div id="secao-lesoes">
              <InjuryTracker
                lesoes={character.lesoes}
                rankData={rankData}
                onUpdate={handleInjuryUpdate}
              />
            </div>
            <div id="secao-inventario">
              <InventoryList
                equipamentos={character.equipamentos}
                onUpdate={(val) => updateField("equipamentos", val)}
              />
            </div>
          </section>

          <div id="secao-tracos">
            <TraitCard
              tracos={character.tracos}
              onUpdate={(val) => updateField('tracos', val)}
              onOpenCatalog={onOpenCatalog}
            />
          </div>

          {/* Painel Divino — condicional */}
          {canHaveDivine && (
            <div id="secao-divino">
              {!character.divino.ativo && (
                <button
                  id="btn-ativar-divino"
                  onClick={() => updateNestedField('divino', 'ativo', true)}
                  className="w-full py-3 text-sm bg-arcane/5 border border-arcane/20 text-arcane-dim rounded-xl hover:bg-arcane/10 hover:border-arcane/40 hover:text-arcane transition-all cursor-pointer"
                >
                  ✦ Ativar Painel Divino
                </button>
              )}
              <DivinePanel
                divino={character.divino}
                onUpdateDivino={handleUpdateDivino}
                onUpdateAnchors={handleUpdateAnchors}
              />
            </div>
          )}

          {/* História & Notas */}
          <div id="secao-historia">
            <StoryPanel
              character={character}
              updateField={updateField}
            />
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-light to-transparent mb-4" />
          <p className="text-xs text-parchment-dim/40">
            Ficha Interativa — Sistema Narrativo 2d10
          </p>
        </footer>
      </div>
    </div>
  )
}
