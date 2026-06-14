import { useState, memo } from "react";
import SectionHeader from "./SectionHeader";
import { BackpackIcon } from "./Icons";
import { Equipamento } from "../types";
import { useSheetStore } from "../store/sheetStore";

const InventoryList = memo(function InventoryList() {
  const equipamentos = useSheetStore((s) => s.character?.equipamentos ?? []);
  const updateField = useSheetStore((s) => s.updateField);

  const onUpdate = (next: Equipamento[]) => updateField("equipamentos", next);

  const [novoItem, setNovoItem] = useState("");
  // Local state for text inputs — saved on blur
  const [localNomes, setLocalNomes] = useState<Record<number, string>>({});
  const [localDescs, setLocalDescs] = useState<Record<number, string>>({});

  const handleAdd = () => {
    const trimmed = novoItem.trim();
    if (!trimmed) return;
    onUpdate([...equipamentos, { nome: trimmed, descricao: "" }]);
    setNovoItem("");
  };

  const handleRemove = (index: number) => {
    onUpdate(equipamentos.filter((_, i) => i !== index));
    setLocalNomes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setLocalDescs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleNomeBlur = (index: number) => {
    if (!(index in localNomes)) return;
    const novos = [...equipamentos];
    novos[index] = { ...novos[index], nome: localNomes[index] };
    onUpdate(novos);
    setLocalNomes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleDescBlur = (index: number) => {
    if (!(index in localDescs)) return;
    const novos = [...equipamentos];
    novos[index] = { ...novos[index], descricao: localDescs[index] };
    onUpdate(novos);
    setLocalDescs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
      <SectionHeader
        title="Inventário"
        subtitle="Equipamentos e itens notáveis"
        icon={<BackpackIcon />}
      />

      <div className="flex gap-2 mb-4">
        <input
          id="input-equipamento"
          type="text"
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nome do equipamento / item"
          className="flex-1 bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
        />
        <button
          id="btn-add-equipamento"
          onClick={handleAdd}
          disabled={!novoItem.trim()}
          className="px-4 py-2 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          +
        </button>
      </div>

      {equipamentos.length === 0 ? (
        <p className="text-parchment-dim/50 text-sm text-center italic py-4">
          Nenhum equipamento.
        </p>
      ) : (
        <ul className="space-y-3">
          {equipamentos.map((item, i) => (
            <li
              key={i}
              className="group bg-base/50 rounded-lg p-3 border border-surface-light/50 hover:border-surface-light/80 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <input
                  type="text"
                  value={i in localNomes ? localNomes[i] : item.nome}
                  onChange={(e) =>
                    setLocalNomes((prev) => ({ ...prev, [i]: e.target.value }))
                  }
                  onBlur={() => handleNomeBlur(i)}
                  className="bg-transparent text-sm font-bold text-gold outline-none w-full mr-2 focus:border-b border-gold/30"
                />
                <button
                  onClick={() => handleRemove(i)}
                  className="text-parchment-dim/30 hover:text-injury-critical text-xs transition-all cursor-pointer p-1"
                  aria-label={`Remover ${item.nome}`}
                >
                  ✕
                </button>
              </div>
              <textarea
                value={i in localDescs ? localDescs[i] : item.descricao}
                onChange={(e) =>
                  setLocalDescs((prev) => ({ ...prev, [i]: e.target.value }))
                }
                onBlur={() => handleDescBlur(i)}
                placeholder="Descrição do item..."
                className="w-full bg-transparent text-xs text-parchment-dim outline-none resize-y min-h-[2.5rem] max-h-[10rem] overflow-y-auto transition-all"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

export default InventoryList;
