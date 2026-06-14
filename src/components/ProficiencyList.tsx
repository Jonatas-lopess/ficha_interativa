import { useState, memo } from "react";
import SectionHeader from "./SectionHeader";
import { BrainIcon } from "./Icons";
import { useSheetStore } from "../store/sheetStore";

const ProficiencyList = memo(function ProficiencyList() {
  const proficiencias = useSheetStore((s) => s.character?.proficiencias ?? []);
  const updateField = useSheetStore((s) => s.updateField);

  const onUpdate = (next: string[]) => updateField("proficiencias", next);
  const [novaProf, setNovaProf] = useState("");

  const handleAdd = () => {
    const trimmed = novaProf.trim();
    if (!trimmed) return;
    onUpdate([...proficiencias, trimmed]);
    setNovaProf("");
  };

  const handleRemove = (index: number) => {
    onUpdate(proficiencias.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
      <SectionHeader
        title="Proficiências"
        subtitle="Áreas de treino e conhecimento"
        icon={<BrainIcon />}
      />

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          id="input-proficiencia"
          type="text"
          value={novaProf}
          onChange={(e) => setNovaProf(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Combate (Espadas)"
          className="flex-1 bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
        />
        <button
          id="btn-add-proficiencia"
          onClick={handleAdd}
          disabled={!novaProf.trim()}
          className="px-4 py-2 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          +
        </button>
      </div>

      {/* List */}
      {proficiencias.length === 0 ? (
        <p className="text-parchment-dim/50 text-sm text-center italic py-4">
          Nenhuma proficiência adicionada.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {proficiencias.map((prof, i) => (
            <span
              key={i}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-base border border-surface-light rounded-lg text-sm text-parchment hover:border-gold-dim transition-all"
            >
              {prof}
              <button
                onClick={() => handleRemove(i)}
                className="text-parchment-dim/40 hover:text-injury-critical text-xs ml-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Remover ${prof}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
});

export default ProficiencyList;
