import { useState, memo } from "react";
import SectionHeader from "./SectionHeader";
import { BookOpenIcon } from "./Icons";
import { useActiveSheetStore } from "../store/activeSheetStore";

const StoryPanel = memo(function StoryPanel() {
  const character = useActiveSheetStore((s) => s.character);
  const updateField = useActiveSheetStore((s) => s.updateField);

  const [frase, setFrase] = useState("");
  const [objetivo, setObjetivo] = useState("");
  // Blur-save local state for long-form text
  const [localHistoria, setLocalHistoria] = useState<string | null>(null);
  const [localNotas, setLocalNotas] = useState<string | null>(null);

  if (!character) return null;

  const addFrase = () => {
    if (!frase.trim()) return;
    updateField("frasesExperiencia", [
      ...character.frasesExperiencia,
      frase.trim(),
    ]);
    setFrase("");
  };

  const removeFrase = (i: number) => {
    updateField(
      "frasesExperiencia",
      character.frasesExperiencia.filter((_, idx) => idx !== i),
    );
  };

  const addObjetivo = () => {
    if (!objetivo.trim()) return;
    updateField("objetivos", [...character.objetivos, objetivo.trim()]);
    setObjetivo("");
  };

  const removeObjetivo = (i: number) => {
    updateField(
      "objetivos",
      character.objetivos.filter((_, idx) => idx !== i),
    );
  };

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6 space-y-6">
      <SectionHeader
        title="História e Notas"
        subtitle="O passado, objetivos e aprendizados"
        icon={<BookOpenIcon />}
      />

      {/* Backstory */}
      <div>
        <label
          htmlFor="char-historia"
          className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
        >
          Backstory
        </label>
        <textarea
          id="char-historia"
          value={localHistoria ?? character.historia}
          onChange={(e) => setLocalHistoria(e.target.value)}
          onBlur={() => {
            if (localHistoria !== null) {
              updateField("historia", localHistoria);
              setLocalHistoria(null);
            }
          }}
          placeholder="A história do personagem..."
          rows={4}
          className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold outline-none transition-all resize-y min-h-[16rem]"
        />
      </div>

      {/* Frases de Experiência */}
      <div>
        <label className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">
          Frases de Experiência
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFrase()}
            placeholder="Ex: 'Sobrevivi à Queda de Aresh'"
            className="flex-1 bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold outline-none transition-all"
          />
          <button
            onClick={addFrase}
            disabled={!frase.trim()}
            className="px-3 py-2 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            +
          </button>
        </div>
        {character.frasesExperiencia.length > 0 && (
          <ul className="space-y-1">
            {character.frasesExperiencia.map((f, i) => (
              <li
                key={i}
                className="group flex items-center justify-between bg-base/50 rounded-lg px-3 py-1.5 border border-surface-light/50"
              >
                <span className="text-sm text-parchment italic">"{f}"</span>
                <button
                  onClick={() => removeFrase(i)}
                  className="text-parchment-dim/30 hover:text-injury-critical text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Objetivos */}
      <div>
        <label className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider">
          Objetivos
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addObjetivo()}
            placeholder="Ex: Encontrar o Oráculo"
            className="flex-1 bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold outline-none transition-all"
          />
          <button
            onClick={addObjetivo}
            disabled={!objetivo.trim()}
            className="px-3 py-2 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            +
          </button>
        </div>
        {character.objetivos.length > 0 && (
          <ul className="space-y-1">
            {character.objetivos.map((o, i) => (
              <li
                key={i}
                className="group flex items-center justify-between bg-base/50 rounded-lg px-3 py-1.5 border border-surface-light/50"
              >
                <span className="text-sm text-parchment">→ {o}</span>
                <button
                  onClick={() => removeObjetivo(i)}
                  className="text-parchment-dim/30 hover:text-injury-critical text-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notas Livres */}
      <div>
        <label
          htmlFor="char-notas"
          className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
        >
          Notas Livres
        </label>
        <textarea
          id="char-notas"
          value={localNotas ?? character.notas}
          onChange={(e) => setLocalNotas(e.target.value)}
          onBlur={() => {
            if (localNotas !== null) {
              updateField("notas", localNotas);
              setLocalNotas(null);
            }
          }}
          placeholder="Anotações gerais..."
          rows={3}
          className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold outline-none transition-all resize-y min-h-[4.5rem]"
        />
      </div>
    </section>
  );
});

export default StoryPanel;
