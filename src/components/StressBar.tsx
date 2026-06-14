import { memo } from "react";
import SectionHeader from "./SectionHeader";
import { SparklesIcon } from "./Icons";
import { EstresseEstado } from "../types";
import { useActiveSheetStore } from "../store/activeSheetStore";

const STATE_STYLES: Record<EstresseEstado, string> = {
  livre: "bg-stress-free border-stress-free/50 hover:border-parchment-dim",
  gasto:
    "bg-stress-spent border-stress-spent/50 shadow-glow-gold hover:brightness-110",
  corrompido:
    "bg-stress-corrupt border-stress-corrupt/50 shadow-glow-corrupt hover:brightness-110",
};

const STATE_LABELS: Record<EstresseEstado, string> = {
  livre: "Livre",
  gasto: "Gasto",
  corrompido: "Corrompido",
};


const StressBar = memo(function StressBar() {
  const estresse = useActiveSheetStore((s) => s.character?.estresse ?? []);
  const toggleEstresse = useActiveSheetStore((s) => s.toggleEstresse);
  const adjustEstresse = useActiveSheetStore((s) => s.adjustEstresse);

  const gastos = estresse.filter((s) => s === "gasto").length;
  const corrompidos = estresse.filter((s) => s === "corrompido").length;
  const livres = estresse.filter((s) => s === "livre").length;

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
      <SectionHeader
        title="Estresse"
        subtitle="Recurso para esforço e resistência mental"
        icon={<SparklesIcon />}
      />

      <div className="flex items-center justify-center gap-1 md:gap-2 py-2">
        {/* Seta Esquerda (Diminuir) */}
        <button
          onClick={() => adjustEstresse(-1)}
          className="text-parchment-dim hover:text-gold transition-colors cursor-pointer text-lg md:text-xl font-bold px-2 shrink-0"
          title="Diminuir Estresse"
        >
          &lt;
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
          {estresse.map((estado, i) => (
            <button
              key={i}
              id={`stress-${i}`}
              onClick={() => toggleEstresse(i)}
              className={`w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-full border-2 transition-all duration-200 cursor-pointer ${STATE_STYLES[estado]}`}
              title={`Bolha ${i + 1}: ${STATE_LABELS[estado]}${estado === "corrompido" ? " (Clique para limpar corrupção)" : ""}`}
              aria-label={`Estresse ${i + 1}: ${STATE_LABELS[estado]}`}
            />
          ))}
        </div>

        {/* Seta Direita (Aumentar) */}
        <button
          onClick={() => adjustEstresse(1)}
          className="text-parchment-dim hover:text-gold transition-colors cursor-pointer text-lg md:text-xl font-bold px-2 shrink-0"
          title="Aumentar Estresse"
        >
          &gt;
        </button>
      </div>

      <div className="flex justify-center mt-6">
        <div className="flex gap-4 text-[10px] md:text-xs text-parchment-dim bg-base/30 px-4 py-2 rounded-lg border border-surface-light/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stress-spent inline-block" />
            Gastos:{" "}
            <span className="text-stress-spent font-bold">{gastos}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stress-corrupt inline-block" />
            Corrompidos:{" "}
            <span className="text-stress-corrupt font-bold">{corrompidos}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stress-free inline-block" />
            Livres: <span className="text-parchment font-bold">{livres}</span>
          </span>
        </div>
      </div>
    </section>
  );
});

export default StressBar;
