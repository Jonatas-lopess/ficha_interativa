import { useState } from "react";
import { Ancora } from "../types";
import { useActiveSheetStore } from "../store/activeSheetStore";

export default function AnchorCard() {
  const ancoras = useActiveSheetStore((s) => s.character?.divino?.ancoras ?? []);
  const updateNestedField = useActiveSheetStore((s) => s.updateNestedField);

  const onUpdate = (next: Ancora[]) => updateNestedField("divino", "ancoras", next);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Ancora>({ nome: "", descricao: "", erosao: 0 });

  const maxErosao = 3;

  const handleAdd = () => {
    if (!form.nome.trim()) return;
    onUpdate([
      ...ancoras,
      { ...form, nome: form.nome.trim(), descricao: form.descricao.trim() },
    ]);
    setForm({ nome: "", descricao: "", erosao: 0 });
    setAdding(false);
  };

  const handleRemove = (index: number) => {
    onUpdate(ancoras.filter((_, i) => i !== index));
  };

  const handleErosao = (index: number, delta: number) => {
    const updated = ancoras.map((a, i) => {
      if (i !== index) return a;
      const novaErosao = Math.max(0, Math.min(maxErosao, a.erosao + delta));
      return { ...a, erosao: novaErosao };
    });
    onUpdate(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-title text-arcane-bright tracking-wider">
          ⚓ Âncoras
        </h3>
        <button
          id="btn-add-ancora"
          onClick={() => setAdding(!adding)}
          className="px-2 py-1 text-xs bg-arcane/10 border border-arcane-dim text-arcane rounded-lg hover:bg-arcane/20 transition-all cursor-pointer"
        >
          {adding ? "✕" : "+"}
        </button>
      </div>

      {adding && (
        <div className="bg-base/50 rounded-lg border border-surface-light p-3 mb-3 space-y-2">
          <input
            id="input-ancora-nome"
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome da âncora (pessoa, lugar, ideal...)"
            className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane focus:ring-1 focus:ring-arcane/30 outline-none transition-all"
          />
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição..."
            rows={2}
            className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-arcane outline-none transition-all resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!form.nome.trim()}
            className="w-full py-1.5 text-xs bg-arcane/10 border border-arcane-dim text-arcane rounded-lg hover:bg-arcane/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Adicionar Âncora
          </button>
        </div>
      )}

      {ancoras.length === 0 && !adding ? (
        <p className="text-parchment-dim/50 text-xs text-center italic py-2">
          Nenhuma âncora definida.
        </p>
      ) : (
        <div className="space-y-2">
          {ancoras.map((ancora, i) => (
            <div
              key={i}
              className="bg-base/50 rounded-lg border border-surface-light p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm text-parchment font-medium">
                    {ancora.nome}
                  </span>
                  {ancora.descricao && (
                    <p className="text-xs text-parchment-dim mt-1">
                      {ancora.descricao}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(i)}
                  className="text-parchment-dim/30 hover:text-injury-critical text-xs transition-colors cursor-pointer ml-2"
                  aria-label={`Remover ${ancora.nome}`}
                >
                  ✕
                </button>
              </div>
              {/* Erosion tracker */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-parchment-dim">Erosão:</span>
                <div className="flex gap-1">
                  {Array.from({ length: maxErosao }).map((_, dot) => (
                    <button
                      key={dot}
                      onClick={() =>
                        handleErosao(i, dot < ancora.erosao ? -1 : 1)
                      }
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        dot < ancora.erosao
                          ? "bg-injury-critical border-injury-critical/60"
                          : "bg-surface-light/30 border-surface-light hover:border-injury-critical/40"
                      }`}
                      aria-label={`Erosão ${dot + 1}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-injury-critical/60 ml-1">
                  {ancora.erosao}/{maxErosao}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
