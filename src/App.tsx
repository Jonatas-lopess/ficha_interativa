import { characterRepo } from './repository'
import { useSheetManager } from './hooks/useSheetManager'
import { useCharacter } from './hooks/useCharacter'
import HomePage from './components/HomePage'
import CompleteSheet from './components/CompleteSheet'
import SimplifiedSheet from './components/SimplifiedSheet'
import NPCSheet from './components/NPCSheet'
import CodiceAmeacas from './components/CodiceAmeacas'
import CatalogoTracos from './components/CatalogoTracos'
import { Character, Lesoes, LesaoDescricao, SheetTipo, Traco } from './types'
import { createDefaultCharacter } from './data/defaultCharacter'
import { Router, Switch, Route, useParams } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'

// Wrapper for the simplified sheet when viewed standalone
interface SimplifiedSheetViewProps {
  character: Character;
  updateField: <K extends keyof Character>(field: K, value: Character[K]) => void;
  toggleEstresse: (index: number) => void;
  adjustEstresse: (delta: number) => void;
  exportarFicha: () => void;
  onBack: () => void;
}

// Session key used to signal catalog → sheet navigation
const CATALOG_TARGET_KEY = '__catalog_target_sheet__';

function SimplifiedSheetView({ character, updateField, toggleEstresse, adjustEstresse, exportarFicha, onBack }: SimplifiedSheetViewProps) {
  const handleUpdateInjury = (categoria: keyof Lesoes, severidade: 'leves' | 'graves' | 'criticas', valor: number | LesaoDescricao[]) => {
    updateField('lesoes', {
      ...character.lesoes,
      [categoria]: {
        ...character.lesoes[categoria],
        [severidade]: valor,
      },
    })
  }

  return (
    <div className="min-h-screen bg-base py-10 px-4 relative">
      <button
        onClick={onBack}
        className="absolute top-6 left-4 px-3 py-1.5 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm backdrop-blur-sm transition-all duration-300 hover:border-gold-dim hover:text-gold cursor-pointer"
      >
        ← Voltar
      </button>

      <div className="max-w-md mx-auto mt-12 space-y-6">
        <SimplifiedSheet
          character={character}
          onUpdateEstresse={toggleEstresse}
          onAdjustEstresse={adjustEstresse}
          onUpdateInjury={handleUpdateInjury}
        />

        {/* Edit fields that are simplified */}
        <div className="bg-surface border border-surface-light rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-xs text-parchment-dim uppercase tracking-wider mb-1">Nome</label>
            <input
              type="text"
              value={character.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-gold outline-none"
              placeholder="Nome do NPC"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={exportarFicha}
              className="px-4 py-2 bg-surface-light border border-surface-light rounded-lg text-xs text-parchment hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
            >
              Exportar Ficha JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Separate component for the actual character view to utilize hooks
interface CharacterViewProps {
  sheetId: string;
  onBack: () => void;
  onSyncRegistry: (id: string, nome: string) => void;
  onOpenCatalog?: () => void;
}

function CharacterView({ sheetId, onBack, onSyncRegistry, onOpenCatalog }: CharacterViewProps) {
  const {
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
    loading
  } = useCharacter(sheetId, onSyncRegistry)

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-gold animate-pulse text-xl font-cinzel">Carregando Ficha...</div>
      </div>
    )
  }

  if (character.tipo === 'simplificada') {
    return (
      <SimplifiedSheetView
        character={character}
        updateField={updateField}
        toggleEstresse={toggleEstresse}
        adjustEstresse={adjustEstresse}
        exportarFicha={exportarFicha}
        onBack={onBack}
      />
    )
  }

  if (character.tipo === 'npc') {
    return (
      <NPCSheet
        character={character}
        rankData={rankData}
        updateField={updateField}
        toggleEstresse={toggleEstresse}
        adjustEstresse={adjustEstresse}
        exportarFicha={exportarFicha}
        onBack={onBack}
      />
    )
  }

  return (
    <CompleteSheet
      character={character}
      rankData={rankData}
      updateField={updateField}
      updateNestedField={updateNestedField}
      updateRanque={updateRanque}
      toggleEstresse={toggleEstresse}
      adjustEstresse={adjustEstresse}
      exportarFicha={exportarFicha}
      importarFicha={importarFicha as any}
      resetarFicha={resetarFicha}
      onBack={onBack}
      onOpenCatalog={onOpenCatalog}
    />
  )
}

function CharacterViewRoute({
  sincronizarRegistro
}: {
  sincronizarRegistro: (id: string, nome: string) => void;
}) {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useHashLocation()

  if (!id) return null

  const handleOpenCatalog = () => {
    sessionStorage.setItem(CATALOG_TARGET_KEY, id);
    navigate('/catalogo-tracos');
  };

  return (
    <CharacterView
      key={id}
      sheetId={id}
      onBack={() => navigate('/')}
      onSyncRegistry={sincronizarRegistro}
      onOpenCatalog={handleOpenCatalog}
    />
  )
}

function App() {
  const [, navigate] = useHashLocation()

  const {
    fichasCompletas,
    fichasNpc,
    fichasSimplificadas,
    criarFicha,
    importarFicha,
    removerFicha,
    duplicarFicha,
    sincronizarRegistro,
  } = useSheetManager()

  const handleCriar = async (tipo: SheetTipo) => {
    const id = await criarFicha(tipo)
    navigate(`/sheet/${id}`)
  }

  const handleImportar = async (data: any) => {
    const id = await importarFicha(data)
    navigate(`/sheet/${id}`)
  }

  const handleOpen = (id: string) => {
    navigate(`/sheet/${id}`)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ficha?')) {
      removerFicha(id)
    }
  }

  const handleDuplicate = (id: string) => {
    duplicarFicha(id)
  }

  const handleExport = async (id: string) => {
    try {
      const data = await characterRepo.findById(id);
      const { id: _id, ...exportData } = data; // strip persistence field
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.nome || 'personagem'}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Falha ao exportar:', e);
    }
  }

  const handleOpenCodexThreat = async (threat: any) => {
    const character: Character = {
      ...createDefaultCharacter(),
      nome: threat.nome,
      descricao: threat.descricao,
      ranque: threat.ranque,
      estresse: Array(threat.estresseMax || 6).fill('livre'),
      proficiencias: threat.proficiencias || [],
      tracos: threat.tracos || [],
      equipamentos: threat.equipamentos || [],
      taticas: Array.isArray(threat.taticas) ? threat.taticas.join('\n') : (threat.taticas || ''),
      tipo: 'npc',
      atualizadoEm: new Date().toISOString(),
    }
    
    const id = await importarFicha(character)
    navigate(`/sheet/${id}`)
  }

  const handleAddTraitFromCatalog = async (traco: Traco) => {
    const targetId = sessionStorage.getItem(CATALOG_TARGET_KEY);
    if (!targetId) return;
    try {
      const data = await characterRepo.findById(targetId);
      await characterRepo.save({ ...data, tracos: [...(data.tracos ?? []), traco] });
      sincronizarRegistro(targetId, data.nome);
      sessionStorage.removeItem(CATALOG_TARGET_KEY);
      navigate(`/sheet/${targetId}`);
    } catch (e) {
      console.error('Falha ao adicionar traço:', e);
    }
  };

  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/">
          <HomePage
            fichasCompletas={fichasCompletas}
            fichasNpc={fichasNpc}
            fichasSimplificadas={fichasSimplificadas}
            onCriar={handleCriar}
            onImportar={handleImportar}
            onOpen={handleOpen}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onExport={handleExport}
            onOpenCodex={() => navigate('/codex')}
            onOpenCatalogTracos={() => navigate('/catalogo-tracos')}
          />
        </Route>
        <Route path="/sheet/:id">
          <CharacterViewRoute
            sincronizarRegistro={sincronizarRegistro}
          />
        </Route>
        <Route path="/codex">
          <CodiceAmeacas onBack={() => navigate('/')} onOpenThreat={handleOpenCodexThreat} />
        </Route>
        <Route path="/catalogo-tracos">
          <CatalogoTracos
            onBack={() => {
              const targetId = sessionStorage.getItem(CATALOG_TARGET_KEY);
              if (targetId) {
                sessionStorage.removeItem(CATALOG_TARGET_KEY);
                navigate(`/sheet/${targetId}`);
              } else {
                navigate('/');
              }
            }}
            onAddTrait={sessionStorage.getItem(CATALOG_TARGET_KEY) ? handleAddTraitFromCatalog : undefined}
          />
        </Route>
      </Switch>
    </Router>
  )
}

export default App
