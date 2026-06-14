/**
 * @deprecated Superseded by `useSheetStore` (Zustand). Safe to delete once
 * all call sites are confirmed removed. No active usages remain in App.tsx.
 */
import { useCallback, useEffect, useState, useMemo } from "react";
import { createDefaultCharacter } from "../data/defaultCharacter";
import { SheetRegistryEntry, SheetTipo, Character } from "../types";
import { characterRepo } from "../repository";

function generateId(): string {
  return (
    "character_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7)
  );
}

export function useSheetManager() {
  const [registry, setRegistry] = useState<SheetRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarRegistro = useCallback(async () => {
    setLoading(true);
    try {
      const allChars = await characterRepo.findAll();
      const newRegistry = allChars.map((char) => ({
        id: char.id,
        nome: char.nome || "",
        tipo: char.tipo || "completa",
        criadoEm: char.criadoEm || new Date().toISOString(),
        atualizadoEm: char.atualizadoEm || new Date().toISOString(),
      }));
      newRegistry.sort(
        (a, b) =>
          new Date(b.atualizadoEm).getTime() -
          new Date(a.atualizadoEm).getTime(),
      );
      setRegistry(newRegistry);
    } catch (e) {
      console.error("Erro ao carregar fichas:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRegistro();
  }, [carregarRegistro]);

  const criarFicha = useCallback(
    async (tipo: SheetTipo = "completa"): Promise<string> => {
      const id = generateId();
      const character: Character = { ...createDefaultCharacter(), tipo };

      const entry: SheetRegistryEntry = {
        id,
        nome: "",
        tipo,
        criadoEm: character.criadoEm,
        atualizadoEm: character.atualizadoEm,
      };
      setRegistry((prev) => [entry, ...prev]);

      await characterRepo.save({ ...character, id });
      carregarRegistro();

      return id;
    },
    [carregarRegistro],
  );

  const importarFicha = useCallback(
    async (data: Partial<Character>): Promise<string> => {
      const id = generateId();
      const character: Character = { ...createDefaultCharacter(), ...data };

      const entry: SheetRegistryEntry = {
        id,
        nome: character.nome || "",
        tipo: character.tipo || "completa",
        criadoEm: character.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      setRegistry((prev) => [entry, ...prev]);

      await characterRepo.save({ ...character, id });
      carregarRegistro();

      return id;
    },
    [carregarRegistro],
  );

  const removerFicha = useCallback(
    async (id: string) => {
      setRegistry((prev) => prev.filter((entry) => entry.id !== id));
      try {
        await characterRepo.remove(id);
      } catch (e) {
        console.error("Erro ao remover ficha:", e);
        carregarRegistro();
      }
    },
    [carregarRegistro],
  );

  const duplicarFicha = useCallback(
    (id: string): string | null => {
      const entry = registry.find((r) => r.id === id);
      if (!entry) return null;

      const novoId = generateId();

      characterRepo
        .findById(id)
        .then((original) => {
          const duplicada: Character = {
            ...original,
            nome: original.nome ? `${original.nome} (cópia)` : "",
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          };
          return characterRepo.save({ ...duplicada, id: novoId });
        })
        .then(() => {
          carregarRegistro();
        })
        .catch((e) => {
          console.error("Erro ao duplicar ficha:", e);
        });

      const newEntry: SheetRegistryEntry = {
        id: novoId,
        nome: entry.nome ? `${entry.nome} (cópia)` : "",
        tipo: entry.tipo,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      setRegistry((prev) => [newEntry, ...prev]);

      return novoId;
    },
    [registry, carregarRegistro],
  );

  const sincronizarRegistro = useCallback((id: string, nome: string) => {
    setRegistry((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, nome, atualizadoEm: new Date().toISOString() }
          : entry,
      ),
    );
  }, []);

  const fichasCompletas = useMemo(
    () => registry.filter((f) => f.tipo === "completa"),
    [registry],
  );
  const fichasNpc = useMemo(
    () => registry.filter((f) => f.tipo === "npc"),
    [registry],
  );
  const fichasSimplificadas = useMemo(
    () => registry.filter((f) => f.tipo === "simplificada"),
    [registry],
  );

  return {
    registry,
    fichasCompletas,
    fichasNpc,
    fichasSimplificadas,
    criarFicha,
    importarFicha,
    removerFicha,
    duplicarFicha,
    sincronizarRegistro,
    loading,
  };
}
