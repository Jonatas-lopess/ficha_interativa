import { useState } from "react";
import StressBar from "./StressBar";
import InjuryTracker from "./InjuryTracker";
import ProficiencyList from "./ProficiencyList";
import TraitCard from "./TraitCard";
import InventoryList from "./InventoryList";
import { RanqueNome } from "../types";
import { useActiveSheetStore } from "../store/activeSheetStore";

interface Props {
  onBack?: () => void;
}

export default function NPCSheet({ onBack }: Props) {
  const character = useActiveSheetStore((s) => s.character);
  const updateField = useActiveSheetStore((s) => s.updateField);
  const exportCharacter = useActiveSheetStore((s) => s.exportCharacter);

  // Blur-save for text fields
  const [localNome, setLocalNome] = useState<string | null>(null);
  const [localDescricao, setLocalDescricao] = useState<string | null>(null);
  const [localTaticas, setLocalTaticas] = useState<string | null>(null);

  if (!character) return null;

  return (
    <div className="min-h-screen bg-base pb-12">
      {/* Navbar simplificada */}
      <nav className="sticky top-0 z-40 bg-base/90 backdrop-blur-md border-b border-surface-light px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm hover:border-injury-severe hover:text-injury-severe transition-all cursor-pointer"
        >
          ← Voltar
        </button>
        <div className="flex gap-2">
          <button
            onClick={exportCharacter}
            className="px-3 py-1.5 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm hover:border-gold hover:text-gold transition-all cursor-pointer"
          >
            ↓ Exportar
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header da Ameaça */}
        <section className="bg-surface rounded-xl border border-injury-severe/30 p-6 shadow-glow-corrupt">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
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
                placeholder="Nome da Ameaça ou Genérico"
                className="w-full bg-transparent font-title text-2xl text-injury-severe border-b border-transparent focus:border-injury-severe/50 outline-none placeholder:text-injury-severe/30"
              />
            </div>
            <div className="w-48">
              <label className="block text-xs text-parchment-dim uppercase tracking-wider mb-1">
                Ranque
              </label>
              <select
                value={character.ranque}
                onChange={(e) => updateField("ranque", e.target.value as RanqueNome)}
                className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-injury-severe outline-none cursor-pointer"
              >
                <option value="Humano">Humano</option>
                <option value="Desperto">Desperto</option>
                <option value="Ascendido">Ascendido</option>
                <option value="Transcendente">Transcendente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-parchment-dim uppercase tracking-wider mb-2">
              Descrição / Lore
            </label>
            <textarea
              value={localDescricao ?? (character.descricao || "")}
              onChange={(e) => setLocalDescricao(e.target.value)}
              onBlur={() => {
                if (localDescricao !== null) {
                  updateField("descricao", localDescricao);
                  setLocalDescricao(null);
                }
              }}
              placeholder="Descreva o que é esta ameaça, como age e qual seu contexto..."
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-injury-severe outline-none min-h-[80px] resize-y"
            />
          </div>
        </section>

        {/* Vitalidade */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <StressBar />
            <InjuryTracker />
          </div>

          <div className="space-y-4">
            <ProficiencyList />
            <div className="pt-2">
              <InventoryList />
            </div>
          </div>
        </section>

        {/* Traços - Detalhados para NPCs */}
        <section>
          <TraitCard />
        </section>

        {/* Táticas em Combate */}
        <section className="bg-surface rounded-xl border border-surface-light p-6">
          <textarea
            value={localTaticas ?? (character.taticas || "")}
            onChange={(e) => setLocalTaticas(e.target.value)}
            onBlur={() => {
              if (localTaticas !== null) {
                updateField("taticas", localTaticas);
                setLocalTaticas(null);
              }
            }}
            placeholder="Como o inimigo se porta em combate? Quais os alvos preferenciais? Quando eles fogem?"
            className="w-full bg-base border border-surface-light rounded-lg px-4 py-3 text-sm text-parchment focus:border-injury-severe outline-none min-h-[150px] resize-y leading-relaxed"
          />
        </section>
      </div>
    </div>
  );
}
