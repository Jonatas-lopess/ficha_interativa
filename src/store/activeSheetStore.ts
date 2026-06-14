import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import {
  Character,
  RanqueNome,
  Traco,
  EstresseEstado,
  DivineTrait,
  DivineSkill,
  RankData,
  Equipamento,
} from "../types";
import { characterRepo } from "../repository";
import { createDefaultCharacter } from "../data/defaultCharacter";
import { RANQUES } from "../data/rankData";
import { supabase, isSupabaseConfigured } from "../db/supabaseClient";
import { getOrGenerateUserId } from "../utils/userId";
import type { Persisted } from "../repository/persistenceTypes";
import { useRegistryStore } from "./registryStore";

export type OnlineSaveStatus = "idle" | "saving" | "success" | "error";

// Re-export useShallow for convenient use in components
export { useShallow };

interface ActiveSheetStore {
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
  addTraitFromCatalog: (traco: Traco, targetId?: string) => Promise<void>;
  salvarOnline: () => Promise<void>;

  // Atomic divine sync
  syncDivineAbilities: (dbTraits: DivineTrait[], dbSkills: DivineSkill[]) => void;
}

let _saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(char: Persisted<Character>) {
  if (_saveTimeoutId) clearTimeout(_saveTimeoutId);
  _saveTimeoutId = setTimeout(async () => {
    _saveTimeoutId = null;
    try {
      await characterRepo.save(char);
      useRegistryStore.getState().syncRegistryEntry(char.id, char.nome);
    } catch (e) {
      console.error("[activeSheetStore] Auto-save failed:", e);
    }
  }, 300); // short debounce only to batch rapid discrete actions
}

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

export const useActiveSheetStore = create<ActiveSheetStore>((set, get) => ({
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
      if (dirty) scheduleSave(migrated);
    } catch (e) {
      console.warn("[activeSheetStore] setActiveId — not found, using default", e);
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
    scheduleSave(next);
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
    scheduleSave(next);
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
    scheduleSave(next);
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
    scheduleSave(next);
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
    scheduleSave(next);
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
      scheduleSave(merged);
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
    scheduleSave(next);
  },

  addTraitFromCatalog: async (traco, targetId) => {
    let char = get().character;
    const activeId = get().activeId;
    const currentId = targetId || activeId;

    if (!char || (currentId && char.id !== currentId)) {
      if (currentId) {
        try {
          char = await characterRepo.findById(currentId);
        } catch (e) {
          console.error("[activeSheetStore] addTraitFromCatalog failed to find character:", e);
          return;
        }
      }
    }

    if (!char) return;
    const next: Persisted<Character> = {
      ...char,
      tracos: [...(char.tracos ?? []), traco],
      atualizadoEm: new Date().toISOString(),
    };

    if (get().activeId === next.id) {
      set({ character: next });
    }

    await characterRepo.save(next);
    useRegistryStore.getState().syncRegistryEntry(next.id, next.nome);
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
      console.error("[activeSheetStore] salvarOnline failed:", err);
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
    const expectedDirectTraits = dbTraits.filter(
      (t) =>
        t.caminho === activePathway &&
        t.ranqueRequisito === activeRank &&
        isActive(t),
    );

    const expectedSkillTraits: DivineTrait[] = [];
    dbSkills.forEach((s) => {
      if (
        s.tipo === "traco" &&
        s.caminho === activePathway &&
        s.ranqueRequisito === activeRank
      ) {
        if (isActive(s)) {
          const correspondingTrait = dbTraits.find((t) => t.nome === s.nome);
          if (correspondingTrait) {
            expectedSkillTraits.push({
              ...correspondingTrait,
              origem: "Divino",
              caminho: s.caminho || undefined,
              ranqueRequisito: s.ranqueRequisito || undefined,
              saturacaoRequisito: s.saturacaoRequisito || undefined,
            });
          }
        }
      }
    });

    const expectedDivineTraits = [...expectedDirectTraits];
    expectedSkillTraits.forEach((est) => {
      if (!expectedDivineTraits.some((t) => t.nome === est.nome)) {
        expectedDivineTraits.push(est);
      }
    });

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
    scheduleSave(next);
  },
}));
