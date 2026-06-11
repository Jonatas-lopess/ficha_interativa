import { useState } from "react";
import {
  rolarNormal,
  rolarVantagem,
  rolarDesvantagem,
  RollResult,
} from "../utils/diceRoller";
import DiceToast from "./DiceToast";

export default function FloatingDiceRoller() {
  const [result, setResult] = useState<RollResult | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  const handleRoll = (type: "normal" | "vantagem" | "desvantagem") => {
    let res: RollResult;
    if (type === "vantagem") res = rolarVantagem();
    else if (type === "desvantagem") res = rolarDesvantagem();
    else res = rolarNormal();

    setToastKey((k) => k + 1);
    setResult(res);
    setShowOptions(false);
  };

  return (
    <>
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end group select-none"
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Options Menu */}
        <div
          className={`flex flex-col gap-2 mb-3 transition-all duration-300 origin-bottom ${
            showOptions
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-4 pointer-events-none"
          }`}
        >
          {/* Desvantagem */}
          <button
            onClick={() => handleRoll("desvantagem")}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-injury-severe/40 text-injury-severe hover:bg-injury-severe/10 rounded-lg shadow-lg transition-all text-xs font-medium cursor-pointer select-none"
          >
            <span className="text-sm">▼</span>
            Desvantagem
          </button>

          {/* Vantagem */}
          <button
            onClick={() => handleRoll("vantagem")}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-lg shadow-lg transition-all text-xs font-medium cursor-pointer select-none"
          >
            <span className="text-sm">▲</span>
            Vantagem
          </button>
        </div>

        {/* Main Button */}
        <button
          onClick={() => handleRoll("normal")}
          className="w-14 h-14 bg-gold text-base-dark rounded-full shadow-glow-gold flex items-center justify-center text-2xl transition-transform active:scale-90 hover:scale-110 cursor-pointer select-none"
          title="Rolar 2d10 (Clique p/ Normal, Hover p/ Opções)"
        >
          🎲
        </button>
      </div>

      <DiceToast
        key={toastKey}
        resultado={result}
        onDismiss={() => setResult(null)}
      />
    </>
  );
}
