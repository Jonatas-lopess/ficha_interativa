import { useState } from "react";
import SectionHeader from "./SectionHeader";

// Diamond/gem icon — evokes identity facets
const AspectIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0Z"/>
    <path d="m8 12 2 2 4-4"/>
  </svg>
);

interface Props {
  aspectos: string[];
  onUpdate: (aspectos: string[]) => void;
}

export default function AspectList({ aspectos, onUpdate }: Props) {
  const [novoAspecto, setNovoAspecto] = useState("");

  const handleAdd = () => {
    const trimmed = novoAspecto.trim();
    if (!trimmed) return;
    onUpdate([...aspectos, trimmed]);
    setNovoAspecto("");
  };

  const handleRemove = (index: number) => {
    onUpdate(aspectos.filter((_, i) => i !== index));
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
        title="Aspectos"
        subtitle="Palavras-chave que definem a identidade narrativa"
        icon={<AspectIcon />}
        color="text-arcane"
      />

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          id="input-aspecto"
          type="text"
          value={novoAspecto}
          onChange={(e) => setNovoAspecto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Nobre Exilado, Filho dos Deuses…"
          className="flex-1 bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane focus:ring-1 focus:ring-arcane/30 outline-none transition-all"
        />
        <button
          id="btn-add-aspecto"
          onClick={handleAdd}
          disabled={!novoAspecto.trim()}
          className="px-4 py-2 text-sm bg-arcane/10 border border-arcane/40 text-arcane rounded-lg hover:bg-arcane/20 hover:border-arcane disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          +
        </button>
      </div>

      {/* Tags */}
      {aspectos.length === 0 ? (
        <p className="text-parchment-dim/50 text-sm text-center italic py-4">
          Nenhum aspecto definido.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {aspectos.map((aspecto, i) => (
            <span
              key={i}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-arcane/5 border border-arcane/25 rounded-full text-sm text-arcane-dim hover:border-arcane/50 hover:text-arcane transition-all"
            >
              <span className="text-arcane/50 text-xs">✦</span>
              {aspecto}
              <button
                onClick={() => handleRemove(i)}
                className="text-arcane/30 hover:text-injury-critical text-xs ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Remover ${aspecto}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
