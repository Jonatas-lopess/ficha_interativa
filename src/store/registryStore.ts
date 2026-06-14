import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { Character, SheetRegistryEntry, SheetTipo } from "../types";
import { characterRepo } from "../repository";
import { createDefaultCharacter } from "../data/defaultCharacter";

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

interface RegistryStore {
  registry: SheetRegistryEntry[];
  loadingRegistry: boolean;

  loadRegistry: () => Promise<void>;
  createSheet: (tipo?: SheetTipo) => Promise<string>;
  importSheet: (data: Partial<Character>) => Promise<string>;
  deleteSheet: (id: string) => Promise<void>;
  duplicateSheet: (id: string) => Promise<string | null>;
  syncRegistryEntry: (id: string, nome: string) => void;
}

export const useRegistryStore = create<RegistryStore>((set, get) => ({
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
      console.error("[registryStore] loadRegistry failed:", e);
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
      console.error("[registryStore] deleteSheet failed:", e);
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
      console.error("[registryStore] duplicateSheet failed:", e);
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
}));
