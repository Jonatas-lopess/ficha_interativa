import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import {
  Character,
  SheetRegistryEntry,
  SheetTipo,
  RanqueNome,
  Traco,
  Ancora,
  EstresseEstado,
  DivineTrait,
  DivineSkill,
  RankData,
  Lesoes,
  LesaoDescricao,
  Equipamento,
} from "../types";
import { characterRepo } from "../repository";
import { createDefaultCharacter } from "../data/defaultCharacter";
import { RANQUES } from "../data/rankData";
import { supabase, isSupabaseConfigured } from "../db/supabaseClient";
import { getOrGenerateUserId } from "../utils/userId";
import type { Persisted } from "../repository/persistenceTypes";

export type OnlineSaveStatus = "idle" | "saving" | "success" | "error";

// Re-export useShallow for convenient use in components
export { useShallow };

// ─── ID helpers ─────────────────────────────────────────────────────────────

function generateId(): string {
  return (
    "character_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

// ─── Store interface ─────────────────────────────────────────────────────────

interface SheetStore {
  // ── Registry ──────────────────────────────────────────────────────────────
  registry: SheetRegistryEntry[];
  loadingRegistry: boolean;

  loadRegistry: () => Promise<void>;
  createSheet: (tipo?: SheetTipo) => Promise<string>;
  importSheet: (data: Partial<Character>) => Promise<string>;
  deleteSheet: (id: string) => Promise<void>;
  duplicateSheet: (id: string) => Promise<string | null>;
  syncRegistryEntry: (id: string, nome: string) => void;

  // ── Active Character ───────────────────────────────────────────────────────
  activeId: string | null;
  character: Persisted<Character> | null;
  rankData: RankData;
  loadingCharacter: boolean;
  onlineSaveStatus: OnlineSaveStatus;

  setActiveId: (id: string | null) => Promise<void>;
  updateField: <K extends keyof Character>(field: K, value: Character[K]) => void;
  updateNestedField: <K extends keyof Character, NK extends keyof Character[K]>(
    parent: K,
    field: NK,
    value: Character[K][NK],
  ) => void;
  updateRanque: (novoRanque: RanqueNome) => void;
  toggleEstresse: (index: number) => void;
  adjustEstresse: (delta: number) => void;
  exportCharacter: () => void;
  importCharacter: (jsonString: string) => { success: boolean; error?: string };
  resetCharacter: () => void;
  addTraitFromCatalog: (traco: Traco) => void;
  salvarOnline: () => Promise<void>;

  // Atomic divine sync — replaces 3-callback cascade in DivinePanel
  syncDivineAbilities: (dbTraits: DivineTrait[], dbSkills: DivineSkill[]) => void;
}

// ─── Module-level save queue (avoids storing timeout in state) ───────────────

let _saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(char: Persisted<Character>, syncEntry: (id: string, nome: string) => void) {
  if (_saveTimeoutId) clearTimeout(_saveTimeoutId);
  _saveTimeoutId = setTimeout(async () => {
    _saveTimeoutId = null;
    try {
      await characterRepo.save(char);
      syncEntry(char.id, char.nome);
    } catch (e) {
      console.error("[sheetStore] Auto-save failed:", e);
    }
  }, 300); // short debounce only to batch rapid discrete actions
}

// ─── Migrations ──────────────────────────────────────────────────────────────

function applyMigrations(loaded: Persisted<Character>): [Persisted<Character>, boolean] {
  let char = loaded;
  let dirty = false;

  // v1 → v2: estresse was boolean/object, now string literal
  if (char.estresse?.some((s) => typeof s !== "string")) {
    char = {
      ...char,
      estresse: char.estresse.map((s) => {
        if (typeof s === "string") return s as EstresseEstado;
        if ((s as any).corrupted) return "corrompido";
        if ((s as any).spent) return "gasto";
        return "livre";
      }),
    };
    dirty = true;
  }

  // v1 → v2: equipamentos were strings, now objects
  if (char.equipamentos?.some((e) => typeof e === "string")) {
    char = {
      ...char,
      equipamentos: char.equipamentos.map((e) =>
        typeof e === "object"
          ? (e as Equipamento)
          : { nome: e as unknown as string, descricao: "" },
      ),
    };
    dirty = true;
  }

  // v2 → v3: aspectos added
  if (!char.aspectos) {
    char = { ...char, aspectos: [] };
    dirty = true;
  }

  return [char, dirty];
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useSheetStore = create<SheetStore>((set, get) => ({
  // ── Registry ────────────────────────────────────────────────────────────────
  registry: [],
  loadingRegistry: true,

  loadRegistry: async () => {
    set({ loadingRegistry: true });
    try {
      const allChars = await characterRepo.findAll();
      const registry: SheetRegistryEntry[] = allChars.map((c) => ({
        id: c.id,
        nome: c.nome || "",
        tipo: c.tipo || "completa",
        criadoEm: c.criadoEm || new Date().toISOString(),
        atualizadoEm: c.atualizadoEm || new Date().toISOString(),
      }));
      registry.sort(
        (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime(),
      );
      set({ registry, loadingRegistry: false });
    } catch (e) {
      console.error("[sheetStore] loadRegistry failed:", e);
      set({ loadingRegistry: false });
    }
  },

  createSheet: async (tipo = "completa") => {
    const id = generateId();
    const character: Character = { ...createDefaultCharacter(), tipo };
    const entry: SheetRegistryEntry = {
      id,
      nome: "",
      tipo,
      criadoEm: character.criadoEm,
      atualizadoEm: character.atualizadoEm,
    };
    set((s) => ({ registry: [entry, ...s.registry] }));
    await characterRepo.save({ ...character, id });
    await get().loadRegistry();
    return id;
  },

  importSheet: async (data) => {
    const id = generateId();
    const character: Character = { ...createDefaultCharacter(), ...data };
    const entry: SheetRegistryEntry = {
      id,
      nome: character.nome || "",
      tipo: character.tipo || "completa",
      criadoEm: character.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    set((s) => ({ registry: [entry, ...s.registry] }));
    await characterRepo.save({ ...character, id });
    await get().loadRegistry();
    return id;
  },

  deleteSheet: async (id) => {
    set((s) => ({ registry: s.registry.filter((e) => e.id !== id) }));
    try {
      await characterRepo.remove(id);
    } catch (e) {
      console.error("[sheetStore] deleteSheet failed:", e);
      await get().loadRegistry();
    }
  },

  duplicateSheet: async (id) => {
    const entry = get().registry.find((r) => r.id === id);
    if (!entry) return null;
    const novoId = generateId();
    try {
      const original = await characterRepo.findById(id);
      const duplicada: Character = {
        ...original,
        nome: original.nome ? `${original.nome} (cópia)` : "",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      const newEntry: SheetRegistryEntry = {
        id: novoId,
        nome: duplicada.nome,
        tipo: entry.tipo,
        criadoEm: duplicada.criadoEm,
        atualizadoEm: duplicada.atualizadoEm,
      };
      set((s) => ({ registry: [newEntry, ...s.registry] }));
      await characterRepo.save({ ...duplicada, id: novoId });
      await get().loadRegistry();
      return novoId;
    } catch (e) {
      console.error("[sheetStore] duplicateSheet failed:", e);
      return null;
    }
  },

  syncRegistryEntry: (id, nome) => {
    set((s) => ({
      registry: s.registry.map((e) =>
        e.id === id ? { ...e, nome, atualizadoEm: new Date().toISOString() } : e,
      ),
    }));
  },

  // ── Active Character ────────────────────────────────────────────────────────
  activeId: null,
  character: null,
  rankData: RANQUES.Humano,
  loadingCharacter: false,
  onlineSaveStatus: "idle",

  setActiveId: async (id) => {
    if (!id) {
      set({ activeId: null, character: null, loadingCharacter: false });
      return;
    }
    set({ activeId: id, loadingCharacter: true });
    try {
      let loaded = await characterRepo.findById(id);
      const [migrated, dirty] = applyMigrations(loaded);
      const rankData = RANQUES[migrated.ranque as RanqueNome] || RANQUES.Humano;
      set({ character: migrated, rankData, loadingCharacter: false });
      if (dirty) scheduleSave(migrated, get().syncRegistryEntry);
    } catch (e) {
      console.warn("[sheetStore] setActiveId — not found, using default", e);
      const def: Persisted<Character> = { ...createDefaultCharacter(), id };
      set({ character: def, rankData: RANQUES.Humano, loadingCharacter: false });
    }
  },

  updateField: (field, value) => {
    const { character } = get();
    if (!character) return;
    const next: Persisted<Character> = {
      ...character,
      [field]: value,
      atualizadoEm: new Date().toISOString(),
    };
    const rankData =
      field === "ranque"
        ? RANQUES[value as RanqueNome] || RANQUES.Humano
        : get().rankData;
    set({ character: next, rankData });
    scheduleSave(next, get().syncRegistryEntry);
  },

  updateNestedField: (parent, field, value) => {
    const { character } = get();
    if (!character) return;
    const next: Persisted<Character> = {
      ...character,
      [parent]: { ...(character[parent] as any), [field]: value },
      atualizadoEm: new Date().toISOString(),
    };
    set({ character: next });
    scheduleSave(next, get().syncRegistryEntry);
  },

  updateRanque: (novoRanque) => {
    const { character } = get();
    if (!character) return;
    const novoRankData = RANQUES[novoRanque];
    if (!novoRankData) return;

    const novoTamanho = novoRankData.estresseMaximo;
    const estresseAtual = character.estresse || [];
    const novoEstresse: EstresseEstado[] =
      novoTamanho > estresseAtual.length
        ? [...estresseAtual, ...Array(novoTamanho - estresseAtual.length).fill("livre")]
        : estresseAtual.slice(0, novoTamanho);

    const next: Persisted<Character> = {
      ...character,
      ranque: novoRanque,
      estresse: novoEstresse,
      divino: {
        ...character.divino,
        ativo: novoRanque !== "Humano" ? character.divino.ativo : false,
      },
      atualizadoEm: new Date().toISOString(),
    };
    set({ character: next, rankData: novoRankData });
    scheduleSave(next, get().syncRegistryEntry);
  },

  toggleEstresse: (index) => {
    const { character } = get();
    if (!character) return;
    const novoEstresse = [...character.estresse];
    novoEstresse[index] =
      novoEstresse[index] === "corrompido" ? "gasto" : "corrompido";
    const next: Persisted<Character> = {
      ...character,
      estresse: novoEstresse,
      atualizadoEm: new Date().toISOString(),
    };
    set({ character: next });
    scheduleSave(next, get().syncRegistryEntry);
  },

  adjustEstresse: (delta) => {
    const { character } = get();
    if (!character) return;
    const novoEstresse = [...character.estresse];
    if (delta > 0) {
      const firstLivre = novoEstresse.indexOf("livre");
      if (firstLivre !== -1) {
        novoEstresse[firstLivre] = "gasto";
      } else {
        for (let i = novoEstresse.length - 1; i >= 0; i--) {
          if (novoEstresse[i] === "gasto") {
            novoEstresse[i] = "corrompido";
            break;
          }
        }
      }
    } else {
      for (let i = novoEstresse.length - 1; i >= 0; i--) {
        if (novoEstresse[i] === "gasto") {
          novoEstresse[i] = "livre";
          break;
        }
      }
    }
    const next: Persisted<Character> = {
      ...character,
      estresse: novoEstresse,
      atualizadoEm: new Date().toISOString(),
    };
    set({ character: next });
    scheduleSave(next, get().syncRegistryEntry);
  },

  exportCharacter: () => {
    const { character } = get();
    if (!character) return;
    const { id, ...exportData } = character;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.nome || "personagem"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importCharacter: (jsonString) => {
    const { character } = get();
    if (!character) return { success: false, error: "Nenhuma ficha ativa." };
    try {
      const data = JSON.parse(jsonString);
      const merged: Persisted<Character> = {
        ...createDefaultCharacter(),
        ...data,
        id: character.id,
        atualizadoEm: new Date().toISOString(),
      };
      const rankData = RANQUES[merged.ranque as RanqueNome] || RANQUES.Humano;
      set({ character: merged, rankData });
      scheduleSave(merged, get().syncRegistryEntry);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  resetCharacter: () => {
    const { character } = get();
    if (!character) return;
    const next: Persisted<Character> = {
      ...createDefaultCharacter(),
      id: character.id,
    };
    set({ character: next, rankData: RANQUES.Humano });
    scheduleSave(next, get().syncRegistryEntry);
  },

  addTraitFromCatalog: (traco) => {
    const { character } = get();
    if (!character) return;
    const next: Persisted<Character> = {
      ...character,
      tracos: [...(character.tracos ?? []), traco],
      atualizadoEm: new Date().toISOString(),
    };
    set({ character: next });
    // Immediate save — no debounce to avoid race with stale DB read
    characterRepo.save(next).then(() => {
      get().syncRegistryEntry(next.id, next.nome);
    });
  },

  salvarOnline: async () => {
    const { character } = get();
    if (!character) return;
    if (!isSupabaseConfigured || !supabase) {
      alert("Supabase não configurado. Verifique as variáveis de ambiente.");
      return;
    }
    set({ onlineSaveStatus: "saving" });
    try {
      const userId = getOrGenerateUserId();
      const payload = {
        ...character,
        user_id: userId,
        _deleted: false,
        _modified: new Date().toISOString(),
      };
      const { error } = await supabase.from("characters").upsert(payload, {
        onConflict: "id",
      });
      if (error) throw error;
      set({ onlineSaveStatus: "success" });
      setTimeout(() => set({ onlineSaveStatus: "idle" }), 2500);
    } catch (err) {
      console.error("[sheetStore] salvarOnline failed:", err);
      set({ onlineSaveStatus: "error" });
      setTimeout(() => set({ onlineSaveStatus: "idle" }), 3000);
    }
  },

  syncDivineAbilities: (dbTraits, dbSkills) => {
    const { character } = get();
    if (!character || character.ranque === "Humano") return;

    const activePathway = character.divino.caminho;
    const activeRank = character.ranque;
    const nucleoAbilities = character.divino.habilidadesNucleo || [];

    const isActive = (s: { saturacaoRequisito?: string; nome: string }) =>
      s.saturacaoRequisito === "Centelha" || nucleoAbilities.includes(s.nome);

    // 1. Expected divine traits
    const expectedDivineTraits = dbTraits.filter(
      (t) =>
        t.caminho === activePathway &&
        t.ranqueRequisito === activeRank &&
        isActive(t),
    );

    const currentDivineTraits = character.tracos.filter((t) => t.origem === "Divino");
    const missingTraits = expectedDivineTraits.filter(
      (et) => !character.tracos.some((t) => t.nome === et.nome),
    );
    const outdatedTraits = currentDivineTraits.filter(
      (ct) => !expectedDivineTraits.some((et) => et.nome === ct.nome),
    );

    // 2. Expected aspects
    const dbAspects = dbSkills.filter((s) => s.tipo === "aspecto");
    const dbAspectNames = dbAspects.map((s) => s.nome);
    const expectedAspectNames = dbAspects
      .filter((s) => s.caminho === activePathway && s.ranqueRequisito === activeRank && isActive(s))
      .map((s) => s.nome);

    const missingAspects = expectedAspectNames.filter((n) => !character.aspectos.includes(n));
    const outdatedAspects = character.aspectos.filter(
      (n) => dbAspectNames.includes(n) && !expectedAspectNames.includes(n),
    );

    // 3. Expected proficiencies
    const dbProfs = dbSkills.filter((s) => s.tipo === "proficiencia");
    const dbProfNames = dbProfs.map((s) => s.nome);
    const expectedProfNames = dbProfs
      .filter((s) => s.caminho === activePathway && s.ranqueRequisito === activeRank && isActive(s))
      .map((s) => s.nome);

    const missingProfs = expectedProfNames.filter((n) => !character.proficiencias.includes(n));
    const outdatedProfs = character.proficiencias.filter(
      (n) => dbProfNames.includes(n) && !expectedProfNames.includes(n),
    );

    const needsTraits = missingTraits.length > 0 || outdatedTraits.length > 0;
    const needsAspects = missingAspects.length > 0 || outdatedAspects.length > 0;
    const needsProfs = missingProfs.length > 0 || outdatedProfs.length > 0;

    if (!needsTraits && !needsAspects && !needsProfs) return;

    const next: Persisted<Character> = {
      ...character,
      tracos: needsTraits
        ? [
            ...character.tracos.filter(
              (t) => t.origem !== "Divino" || expectedDivineTraits.some((et) => et.nome === t.nome),
            ),
            ...missingTraits,
          ]
        : character.tracos,
      aspectos: needsAspects
        ? [
            ...character.aspectos.filter(
              (n) => !dbAspectNames.includes(n) || expectedAspectNames.includes(n),
            ),
            ...missingAspects,
          ]
        : character.aspectos,
      proficiencias: needsProfs
        ? [
            ...character.proficiencias.filter(
              (n) => !dbProfNames.includes(n) || expectedProfNames.includes(n),
            ),
            ...missingProfs,
          ]
        : character.proficiencias,
      atualizadoEm: new Date().toISOString(),
    };

    set({ character: next });
    scheduleSave(next, get().syncRegistryEntry);
  },
}));
