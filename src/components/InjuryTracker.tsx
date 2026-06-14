import { useState, memo } from "react";
import SectionHeader from "./SectionHeader";
import { HeartPulseIcon } from "./Icons";
import { Lesoes, RankData, LesaoDescricao } from "../types";

const CATEGORIAS: Array<{ key: keyof Lesoes; label: string; icon: string }> = [
  { key: "fisicas", label: "Físicas", icon: "⚔" },
  { key: "mentais", label: "Mentais", icon: "🧠" },
  { key: "espirituais", label: "Espirituais", icon: "✦" },
];

interface Props {
  lesoes: Lesoes;
  rankData: RankData;
  onUpdate: (
    cat: keyof Lesoes,
    sev: "leves" | "graves" | "criticas",
    valor: number | LesaoDescricao[],
  ) => void;
}

const InjuryTracker = memo(function InjuryTracker({
  lesoes,
  rankData,
  onUpdate,
}: Props) {
  // Track which injury description is being edited
  const [editing, setEditing] = useState<{
    cat: keyof Lesoes;
    sev: "graves" | "criticas";
    idx: number;
  } | null>(null);

  // --- Leves (simple counter) ---
  const handleLevesChange = (cat: keyof Lesoes, delta: number) => {
    const max = rankData.lesoesLeves;
    const atual = lesoes[cat].leves;
    const novo = Math.max(0, Math.min(max, atual + delta));
    onUpdate(cat, "leves", novo);
  };

  // --- Graves / Críticas (array with descriptions) ---
  const getArray = (
    cat: keyof Lesoes,
    sev: "graves" | "criticas",
  ): LesaoDescricao[] => {
    const val = lesoes[cat][sev];
    // Backwards compatibility: if it's a number, convert to array
    if (typeof val === "number")
      return Array.from({ length: val as number }, () => ({ descricao: "" }));
    return val || [];
  };

  const getMax = (sev: "graves" | "criticas") => {
    return sev === "graves" ? rankData.lesoesGraves : rankData.lesoesCriticas;
  };

  const handleAddInjury = (cat: keyof Lesoes, sev: "graves" | "criticas") => {
    const arr = getArray(cat, sev);
    if (arr.length >= getMax(sev)) return;
    const newArr = [...arr, { descricao: "" }];
    onUpdate(cat, sev, newArr);
    // Auto-focus the new entry
    setEditing({ cat, sev, idx: newArr.length - 1 });
  };

  const handleRemoveInjury = (
    cat: keyof Lesoes,
    sev: "graves" | "criticas",
  ) => {
    const arr = getArray(cat, sev);
    if (arr.length === 0) return;
    onUpdate(cat, sev, arr.slice(0, -1));
    setEditing(null);
  };

  const handleDescChange = (
    cat: keyof Lesoes,
    sev: "graves" | "criticas",
    idx: number,
    value: string,
  ) => {
    const arr = getArray(cat, sev);
    const updated = arr.map((item, i) =>
      i === idx ? { ...item, descricao: value } : item,
    );
    onUpdate(cat, sev, updated);
  };

  const sevConfig: Array<{
    key: "graves" | "criticas";
    label: string;
    maxKey: keyof RankData;
    color: string;
    border: string;
    dot: string;
  }> = [
    {
      key: "graves",
      label: "Graves",
      maxKey: "lesoesGraves",
      color: "text-injury-severe",
      border: "border-injury-severe/30",
      dot: "bg-injury-severe",
    },
    {
      key: "criticas",
      label: "Críticas",
      maxKey: "lesoesCriticas",
      color: "text-injury-critical",
      border: "border-injury-critical/30",
      dot: "bg-injury-critical",
    },
  ];

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
      <SectionHeader
        title="Lesões"
        subtitle="Físicas, mentais e espirituais"
        icon={<HeartPulseIcon />}
      />

      <div className="space-y-4">
        {CATEGORIAS.map((cat) => {
          const levesAtual = lesoes[cat.key].leves;
          const levesMax = rankData.lesoesLeves;

          return (
            <div key={cat.key} className="bg-base/50 rounded-lg p-3">
              <h3 className="text-sm font-title text-parchment tracking-wider mb-2">
                <span className="mr-1.5">{cat.icon}</span>
                {cat.label}
              </h3>

              {/* Leves — simple counter */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <span className="text-xs text-injury-light font-medium min-w-[3.5rem]">
                  Leves
                </span>
                <button
                  id={`injury-${cat.key}-leves-dec`}
                  onClick={() => handleLevesChange(cat.key, -1)}
                  disabled={levesAtual <= 0}
                  className="w-6 h-6 rounded-md bg-base border border-surface-light text-parchment-dim text-sm flex items-center justify-center hover:border-parchment-dim disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span className="text-lg font-bold tabular-nums min-w-[2ch] text-center text-injury-light">
                  {levesAtual}
                </span>
                <button
                  id={`injury-${cat.key}-leves-inc`}
                  onClick={() => handleLevesChange(cat.key, 1)}
                  disabled={levesAtual >= levesMax}
                  className="w-6 h-6 rounded-md bg-base border border-surface-light text-parchment-dim text-sm flex items-center justify-center hover:border-parchment-dim disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  +
                </button>
                <span className="text-[10px] text-parchment-dim/60 ml-1">
                  máx {levesMax}
                </span>
              </div>

              {/* Graves & Críticas — arrays with descriptions */}
              {sevConfig.map((sev) => {
                const arr = getArray(cat.key, sev.key);
                const max = rankData[sev.maxKey] as number;

                return (
                  <div key={sev.key} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-3 px-1">
                      <span
                        className={`text-xs font-medium min-w-[3.5rem] ${sev.color}`}
                      >
                        {sev.label}
                      </span>
                      <button
                        id={`injury-${cat.key}-${sev.key}-dec`}
                        onClick={() => handleRemoveInjury(cat.key, sev.key)}
                        disabled={arr.length <= 0}
                        className="w-6 h-6 rounded-md bg-base border border-surface-light text-parchment-dim text-sm flex items-center justify-center hover:border-parchment-dim disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span
                        className={`text-lg font-bold tabular-nums min-w-[2ch] text-center ${sev.color}`}
                      >
                        {arr.length}
                      </span>
                      <button
                        id={`injury-${cat.key}-${sev.key}-inc`}
                        onClick={() => handleAddInjury(cat.key, sev.key)}
                        disabled={arr.length >= max}
                        className="w-6 h-6 rounded-md bg-base border border-surface-light text-parchment-dim text-sm flex items-center justify-center hover:border-parchment-dim disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-parchment-dim/60 ml-1">
                        máx {max}
                      </span>
                    </div>

                    {/* Description entries */}
                    {arr.length > 0 && (
                      <div className="mt-1.5 ml-[4.25rem] space-y-1">
                        {arr.map((injury, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`}
                            />
                            <input
                              type="text"
                              value={injury.descricao}
                              onChange={(e) =>
                                handleDescChange(
                                  cat.key,
                                  sev.key,
                                  idx,
                                  e.target.value,
                                )
                              }
                              placeholder={`Descreva a lesão ${sev.label.toLowerCase().slice(0, -1)}...`}
                              className="flex-1 bg-base/50 border border-surface-light/50 rounded px-2 py-1 text-xs text-parchment placeholder-parchment-dim/30 focus:border-gold-dim outline-none transition-all"
                              autoFocus={
                                editing?.cat === cat.key &&
                                editing?.sev === sev.key &&
                                editing?.idx === idx
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default InjuryTracker;
