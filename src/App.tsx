import { useEffect, useCallback, useState } from "react";
import { characterRepo } from "./repository";
import { useSheetStore, useShallow } from "./store/sheetStore";
import HomePage from "./components/HomePage";
import CompleteSheet from "./components/CompleteSheet";
import SimplifiedSheet from "./components/SimplifiedSheet";
import NPCSheet from "./components/NPCSheet";
import CodiceAmeacas from "./components/CodiceAmeacas";
import CatalogoTracos from "./components/CatalogoTracos";
import { Character, Lesoes, LesaoDescricao, SheetTipo, Traco } from "./types";
import { createDefaultCharacter } from "./data/defaultCharacter";
import { Router, Switch, Route, useParams } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

// Session key used to signal catalog → sheet navigation
const CATALOG_TARGET_KEY = "__catalog_target_sheet__";

// ─── SimplifiedSheetView ─────────────────────────────────────────────────────

function SimplifiedSheetView({ onBack }: { onBack: () => void }) {
  const character = useSheetStore((s) => s.character);
  const toggleEstresse = useSheetStore((s) => s.toggleEstresse);
  const adjustEstresse = useSheetStore((s) => s.adjustEstresse);
  const updateField = useSheetStore((s) => s.updateField);
  const exportCharacter = useSheetStore((s) => s.exportCharacter);

  const [localNome, setLocalNome] = useState<string | null>(null);

  if (!character) return null;

  const handleUpdateInjury = (
    categoria: keyof Lesoes,
    severidade: "leves" | "graves" | "criticas",
    valor: number | LesaoDescricao[],
  ) => {
    updateField("lesoes", {
      ...character.lesoes,
      [categoria]: { ...character.lesoes[categoria], [severidade]: valor },
    });
  };

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

        {/* Edit fields */}
        <div className="bg-surface border border-surface-light rounded-xl p-4 space-y-4">
          <div>
            <label className="block text-xs text-parchment-dim uppercase tracking-wider mb-1">
              Nome
            </label>
            <input
              type="text"
              value={localNome ?? character.nome}
              onChange={(e) => setLocalNome(e.target.value)}
              onBlur={() => {
                if (localNome !== null) {
                  updateField("nome", localNome);
                  setLocalNome(null);
                }
              }}
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-gold outline-none"
              placeholder="Nome do NPC"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              onClick={exportCharacter}
              className="px-4 py-2 bg-surface-light border border-surface-light rounded-lg text-xs text-parchment hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
            >
              Exportar Ficha JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CharacterView ────────────────────────────────────────────────────────────

function CharacterView({
  sheetId,
  onBack,
  onOpenCatalog,
}: {
  sheetId: string;
  onBack: () => void;
  onOpenCatalog?: () => void;
}) {
  const setActiveId = useSheetStore((s) => s.setActiveId);
  const { character, loadingCharacter } = useSheetStore(
    useShallow((s) => ({
      character: s.character,
      loadingCharacter: s.loadingCharacter,
    })),
  );

  useEffect(() => {
    setActiveId(sheetId);
    return () => {
      // Clear active character on unmount so stale data doesn't show on back
      setActiveId(null);
    };
  }, [sheetId]);

  if (loadingCharacter || !character) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-gold animate-pulse text-xl font-cinzel">
          Carregando Ficha...
        </div>
      </div>
    );
  }

  if (character.tipo === "simplificada") {
    return <SimplifiedSheetView onBack={onBack} />;
  }

  if (character.tipo === "npc") {
    return <NPCSheet onBack={onBack} />;
  }

  return <CompleteSheet onBack={onBack} onOpenCatalog={onOpenCatalog} />;
}

// ─── CharacterViewRoute ───────────────────────────────────────────────────────

function CharacterViewRoute() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useHashLocation();

  if (!id) return null;

  const handleOpenCatalog = useCallback(() => {
    sessionStorage.setItem(CATALOG_TARGET_KEY, id);
    navigate("/catalogo-tracos");
  }, [id, navigate]);

  return (
    <CharacterView
      key={id}
      sheetId={id}
      onBack={() => navigate("/")}
      onOpenCatalog={handleOpenCatalog}
    />
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [, navigate] = useHashLocation();

  const { registry, loadingRegistry } = useSheetStore(
    useShallow((s) => ({
      registry: s.registry,
      loadingRegistry: s.loadingRegistry,
    })),
  );
  const loadRegistry = useSheetStore((s) => s.loadRegistry);
  const createSheet = useSheetStore((s) => s.createSheet);
  const importSheet = useSheetStore((s) => s.importSheet);
  const deleteSheet = useSheetStore((s) => s.deleteSheet);
  const duplicateSheet = useSheetStore((s) => s.duplicateSheet);
  const addTraitFromCatalog = useSheetStore((s) => s.addTraitFromCatalog);

  // Load registry on mount
  useEffect(() => {
    loadRegistry();
  }, []);

  const fichasCompletas = registry.filter((r) => r.tipo === "completa");
  const fichasNpc = registry.filter((r) => r.tipo === "npc");
  const fichasSimplificadas = registry.filter((r) => r.tipo === "simplificada");

  const handleCriar = useCallback(
    async (tipo: SheetTipo) => {
      const id = await createSheet(tipo);
      navigate(`/sheet/${id}`);
    },
    [createSheet, navigate],
  );

  const handleImportar = useCallback(
    async (data: any) => {
      const id = await importSheet(data);
      navigate(`/sheet/${id}`);
    },
    [importSheet, navigate],
  );

  const handleOpen = useCallback(
    (id: string) => {
      navigate(`/sheet/${id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Tem certeza que deseja excluir esta ficha?")) {
        deleteSheet(id);
      }
    },
    [deleteSheet],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateSheet(id);
    },
    [duplicateSheet],
  );

  const handleExport = useCallback(async (id: string) => {
    try {
      const data = await characterRepo.findById(id);
      const { id: _id, ...exportData } = data;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.nome || "personagem"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Falha ao exportar:", e);
    }
  }, []);

  const handleOpenCodexThreat = useCallback(
    async (threat: any) => {
      const character: Character = {
        ...createDefaultCharacter(),
        nome: threat.nome,
        descricao: threat.descricao,
        ranque: threat.ranque,
        estresse: Array(threat.estresseMax || 6).fill("livre"),
        proficiencias: threat.proficiencias || [],
        tracos: threat.tracos || [],
        equipamentos: threat.equipamentos || [],
        taticas: Array.isArray(threat.taticas)
          ? threat.taticas.join("\n")
          : threat.taticas || "",
        tipo: "npc",
        atualizadoEm: new Date().toISOString(),
      };
      const id = await importSheet(character);
      navigate(`/sheet/${id}`);
    },
    [importSheet, navigate],
  );

  const handleAddTraitFromCatalog = useCallback(
    async (traco: Traco) => {
      const targetId = sessionStorage.getItem(CATALOG_TARGET_KEY);
      if (!targetId) return;
      // addTraitFromCatalog reads from in-memory store state — no DB race
      addTraitFromCatalog(traco);
      sessionStorage.removeItem(CATALOG_TARGET_KEY);
      navigate(`/sheet/${targetId}`);
    },
    [addTraitFromCatalog, navigate],
  );

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
            onOpenCodex={() => navigate("/codex")}
            onOpenCatalogTracos={() => navigate("/catalogo-tracos")}
          />
        </Route>
        <Route path="/sheet/:id">
          <CharacterViewRoute />
        </Route>
        <Route path="/codex">
          <CodiceAmeacas
            onBack={() => navigate("/")}
            onOpenThreat={handleOpenCodexThreat}
          />
        </Route>
        <Route path="/catalogo-tracos">
          <CatalogoTracos
            onBack={() => {
              const targetId = sessionStorage.getItem(CATALOG_TARGET_KEY);
              if (targetId) {
                sessionStorage.removeItem(CATALOG_TARGET_KEY);
                navigate(`/sheet/${targetId}`);
              } else {
                navigate("/");
              }
            }}
            onAddTrait={
              sessionStorage.getItem(CATALOG_TARGET_KEY)
                ? handleAddTraitFromCatalog
                : undefined
            }
          />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
