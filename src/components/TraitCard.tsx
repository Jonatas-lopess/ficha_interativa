import { useState, memo } from "react";
import { TIPOS_EFEITO, ORIGENS_TRACO } from "../data/rankData";
import SectionHeader from "./SectionHeader";
import { SparklesIcon } from "./Icons";
import { Traco, TipoEfeito, OrigemTraco, Efeito } from "../types";
import { MarkdownText } from "./MarkdownText";

const EFEITO_BADGES: Record<TipoEfeito, string> = {
  Passivo: "bg-gold/10 text-gold-dim",
  Ativável: "bg-arcane/10 text-arcane",
  Reativo: "bg-green-500/10 text-green-400",
};

const EFEITO_DOT: Record<TipoEfeito, string> = {
  Passivo: "bg-gold-dim",
  Ativável: "bg-arcane",
  Reativo: "bg-green-500",
};

const EMPTY_EFEITO: Efeito = { tipo: "Passivo", descricao: "" };

const EMPTY_FORM: Omit<Traco, "efeitos"> = {
  nome: "",
  conceito: "",
  gatilho: "",
  limiteCusto: "",
  origem: "Base",
};

interface Props {
  tracos: Traco[];
  onUpdate: (tracos: Traco[]) => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  onOpenCatalog?: () => void;
}

const TraitCard = memo(function TraitCard({
  tracos,
  onUpdate,
  title = "Traços",
  subtitle = "Características marcantes e mecânicas passivas",
  icon = <SparklesIcon />,
  color = "text-gold",
  onOpenCatalog,
}: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Traco>({
    ...EMPTY_FORM,
    efeitos: [{ ...EMPTY_EFEITO }],
  });

  const toggleExpand = (i: number) => {
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  // --- Form helpers ---
  const updateForm = <K extends keyof Traco>(field: K, value: Traco[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateEfeito = <K extends keyof Efeito>(
    idx: number,
    field: K,
    value: Efeito[K],
  ) => {
    setForm((f) => ({
      ...f,
      efeitos:
        f.efeitos?.map((ef, i) =>
          i === idx ? { ...ef, [field]: value } : ef,
        ) || [],
    }));
  };

  const addEfeito = () => {
    setForm((f) => ({
      ...f,
      efeitos: [...(f.efeitos || []), { ...EMPTY_EFEITO }],
    }));
  };

  const removeEfeito = (idx: number) => {
    if (!form.efeitos || form.efeitos.length <= 1) return;
    setForm((f) => ({ ...f, efeitos: f.efeitos!.filter((_, i) => i !== idx) }));
  };

  const handleAdd = () => {
    if (!form.nome.trim()) return;
    const traco: Traco = {
      nome: form.nome.trim(),
      conceito: form.conceito?.trim(),
      gatilho: form.gatilho?.trim(),
      efeitos: form.efeitos?.map((ef) => ({
        tipo: ef.tipo,
        descricao: ef.descricao.trim(),
      })),
      limiteCusto: form.limiteCusto?.trim(),
      origem: form.origem,
    };
    onUpdate([...tracos, traco]);
    setForm({ ...EMPTY_FORM, efeitos: [{ ...EMPTY_EFEITO }] });
    setAdding(false);
  };

  const handleRemove = (index: number) => {
    onUpdate(tracos.filter((_, i) => i !== index));
  };

  // Derive the "primary" effect types for badge display
  const getEffectTypes = (traco: Traco): TipoEfeito[] => {
    const tipos = [...new Set((traco.efeitos || []).map((e) => e.tipo))];
    return tipos.length > 0 ? tipos : ["Passivo"];
  };

  // Input class reusable
  const inputCls =
    "w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all";

  return (
    <section className="bg-surface rounded-xl border border-surface-light p-4 md:p-6">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        color={color}
      >
        <div className="flex items-center gap-2">
          {onOpenCatalog && (
            <button
              id="btn-abrir-catalogo"
              onClick={onOpenCatalog}
              className="px-3 py-1.5 text-xs bg-arcane/10 border border-arcane/30 text-arcane/80 hover:bg-arcane/20 hover:border-arcane hover:text-arcane rounded-lg transition-all cursor-pointer"
            >
              ✦ Catálogo
            </button>
          )}
          <button
            id="btn-add-traco"
            onClick={() => setAdding(!adding)}
            className={`px-3 py-1.5 text-xs bg-gold/10 border border-gold-dim ${color === "text-gold" ? "text-gold-dim hover:bg-gold/20 hover:border-gold" : "text-injury-severe hover:bg-injury-severe/20 hover:border-injury-severe"} rounded-lg transition-all cursor-pointer`}
          >
            {adding ? "✕ Cancelar" : "+ Novo Traço"}
          </button>
        </div>
      </SectionHeader>

      {/* ═══ Add Form ═══ */}
      {adding && (
        <div className="bg-base/50 rounded-lg border border-surface-light p-4 mb-4 space-y-3">
          {/* Nome + Origem */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <input
              id="input-traco-nome"
              type="text"
              value={form.nome}
              onChange={(e) => updateForm("nome", e.target.value)}
              placeholder="Nome do traço"
              className={inputCls}
            />
            <select
              id="select-traco-origem"
              value={form.origem}
              onChange={(e) =>
                updateForm("origem", e.target.value as OrigemTraco)
              }
              className="bg-base border border-surface-light rounded-lg px-3 py-2 text-sm text-parchment focus:border-gold outline-none transition-all cursor-pointer"
            >
              {ORIGENS_TRACO.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Conceito */}
          <div>
            <label className="block text-[10px] text-parchment-dim/60 uppercase tracking-wider mb-1">
              Conceito — porquê narrativo
            </label>
            <textarea
              value={form.conceito}
              onChange={(e) => updateForm("conceito", e.target.value)}
              placeholder="O que justifica este traço na narrativa do personagem?"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Gatilho */}
          <div>
            <label className="block text-[10px] text-parchment-dim/60 uppercase tracking-wider mb-1">
              Gatilho — quando é usado
            </label>
            <input
              type="text"
              value={form.gatilho}
              onChange={(e) => updateForm("gatilho", e.target.value)}
              placeholder='Ex: "Quando confrontado por uma ameaça sobrenatural"'
              className={inputCls}
            />
          </div>

          {/* Efeitos (múltiplos) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] text-parchment-dim/60 uppercase tracking-wider">
                Efeitos
              </label>
              <button
                type="button"
                onClick={addEfeito}
                className="text-[10px] text-gold-dim hover:text-gold transition-colors cursor-pointer"
              >
                + Adicionar efeito
              </button>
            </div>
            <div className="space-y-2">
              {form.efeitos?.map((ef, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <select
                    value={ef.tipo}
                    onChange={(e) =>
                      updateEfeito(idx, "tipo", e.target.value as TipoEfeito)
                    }
                    className="bg-base border border-surface-light rounded-lg px-2 py-2 text-xs text-parchment focus:border-gold outline-none transition-all cursor-pointer min-w-[90px]"
                  >
                    {TIPOS_EFEITO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ef.descricao}
                    onChange={(e) =>
                      updateEfeito(idx, "descricao", e.target.value)
                    }
                    placeholder="Manipulação de Escopo em Posição e Efeito"
                    className={`flex-1 ${inputCls}`}
                  />
                  {form.efeitos!.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEfeito(idx)}
                      className="text-parchment-dim/40 hover:text-injury-critical text-xs mt-2.5 cursor-pointer"
                      aria-label="Remover efeito"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Limite / Custo */}
          <div>
            <label className="block text-[10px] text-parchment-dim/60 uppercase tracking-wider mb-1">
              Limite / Custo
            </label>
            <input
              type="text"
              value={form.limiteCusto}
              onChange={(e) => updateForm("limiteCusto", e.target.value)}
              placeholder='Ex: "2 Estresse" ou "1x por cena"'
              className={inputCls}
            />
          </div>

          {/* Confirm */}
          <button
            id="btn-confirm-traco"
            onClick={handleAdd}
            disabled={!form.nome.trim()}
            className="w-full py-2 text-sm bg-gold/10 border border-gold-dim text-gold rounded-lg hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Confirmar Traço
          </button>
        </div>
      )}

      {/* ═══ Trait List ═══ */}
      {tracos.length === 0 && !adding ? (
        <p className="text-parchment-dim/50 text-sm text-center italic py-4">
          Nenhum traço adicionado.
        </p>
      ) : (
        <div className="space-y-2">
          {tracos.map((traco, i) => {
            const tipos = getEffectTypes(traco);
            const isExpanded = expanded[i];

            return (
              <div
                key={i}
                className="bg-base/50 rounded-lg border border-surface-light overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(i)}
                  className="w-full flex items-center justify-between p-3 text-left cursor-pointer hover:bg-surface-hover/30 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-parchment font-medium">
                      {traco.nome}
                    </span>
                    {tipos.map((tipo) => (
                      <span
                        key={tipo}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${EFEITO_BADGES[tipo] || EFEITO_BADGES.Passivo}`}
                      >
                        {tipo}
                      </span>
                    ))}
                    {traco.origem && traco.origem !== "Base" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-arcane/10 text-arcane-bright">
                        {traco.origem}
                      </span>
                    )}
                    {traco.gatilho && (
                      <span className="text-[10px] text-parchment-dim/40 italic border-l border-surface-light/30 pl-2 ml-1 truncate max-w-[500px]">
                        {traco.gatilho}
                      </span>
                    )}
                  </div>
                  <span className="text-parchment-dim text-xs ml-2 shrink-0">
                    {isExpanded ? "▾" : "▸"}
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-surface-light/50 space-y-2.5 pt-2.5">
                    {/* Conceito */}
                    {traco.conceito && (
                      <div>
                        <span className="text-[10px] text-parchment-dim/50 uppercase tracking-wider">
                          Conceito
                        </span>
                        <p className="text-sm text-parchment-dim mt-0.5">
                          {traco.conceito}
                        </p>
                      </div>
                    )}

                    {/* Gatilho */}
                    {traco.gatilho && (
                      <div>
                        <span className="text-[10px] text-parchment-dim/50 uppercase tracking-wider">
                          Gatilho
                        </span>
                        <p className="text-sm text-parchment mt-0.5 italic">
                          "{traco.gatilho}"
                        </p>
                      </div>
                    )}

                    {/* Efeitos */}
                    {traco.efeitos && traco.efeitos.length > 0 && (
                      <div>
                        <span className="text-[10px] text-parchment-dim/50 uppercase tracking-wider">
                          {traco.efeitos.length === 1 ? "Efeito" : "Efeitos"}
                        </span>
                        <div className="mt-1 space-y-1.5">
                          {traco.efeitos.map((ef, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span
                                className={`w-2 h-2 rounded-full mt-1 shrink-0 ${EFEITO_DOT[ef.tipo] || EFEITO_DOT.Passivo}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-[10px] font-medium ${EFEITO_BADGES[ef.tipo]?.split(" ")[1] || "text-parchment-dim"}`}
                                >
                                  {ef.tipo}
                                </div>
                                {ef.descricao && (
                                  <div className="text-sm text-parchment-dim mt-0.5">
                                    <MarkdownText>{ef.descricao}</MarkdownText>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Limite/Custo */}
                    {traco.limiteCusto && (
                      <div>
                        <span className="text-[10px] text-parchment-dim/50 uppercase tracking-wider">
                          Limite / Custo
                        </span>
                        <p className="text-sm text-injury-light mt-0.5">
                          {traco.limiteCusto}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemove(i)}
                      className="mt-1 text-xs text-injury-critical/60 hover:text-injury-critical transition-colors cursor-pointer"
                    >
                      Remover traço
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

export default TraitCard;
