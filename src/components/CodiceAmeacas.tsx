import { useState, useMemo } from "react";
import threats from "../data/threats.json";

interface ThreatData {
  id: string;
  nome: string;
  ranque: string;
  descricao: string;
  estresseMax: number;
  lesoes: {
    leves: number;
    graves: number;
    criticas: number;
  };
  proficiencias: string[];
  aspectos: string[];
  tracos: Array<{
    nome: string;
    efeitos: Array<{ tipo: string; descricao: string }>;
    limiteCusto?: string;
  }>;
  equipamentos: string[];
  taticas: string[];
}

interface Props {
  onBack: () => void;
  onOpenThreat: (threat: ThreatData) => void;
}

export default function CodiceAmeacas({ onBack, onOpenThreat }: Props) {
  const [search, setSearch] = useState("");
  const [filterRanque, setFilterRanque] = useState<string>("Todos");

  const ranques = ["Todos", ...Array.from(new Set((threats as ThreatData[]).map((t) => t.ranque)))];

  const filtered = useMemo(() => {
    return (threats as ThreatData[]).filter((t) => {
      const matchRanque = filterRanque === "Todos" || t.ranque === filterRanque;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.nome.toLowerCase().includes(q) ||
        t.descricao.toLowerCase().includes(q) ||
        t.proficiencias.some((p) => p.toLowerCase().includes(q)) ||
        t.tracos.some((tr) => tr.nome.toLowerCase().includes(q));
      return matchRanque && matchSearch;
    });
  }, [search, filterRanque]);

  return (
    <div className="min-h-screen bg-base py-10 px-4 relative">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <button
            onClick={onBack}
            className="absolute top-6 left-4 px-4 py-2 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm backdrop-blur-sm transition-all duration-300 hover:border-gold-dim hover:text-gold cursor-pointer z-10"
          >
            ← Voltar
          </button>

          <h1 className="font-title text-3xl md:text-4xl text-gold tracking-wide uppercase mb-2">
            Códice de Ameaças
          </h1>
          <p className="text-sm text-parchment-dim max-w-md mx-auto leading-relaxed">
            Catálogo de NPCs genéricos e ameaças comuns.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-6" />
        </header>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim/40 text-sm pointer-events-none">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, proficiência ou traço…"
              className="w-full bg-surface border border-surface-light rounded-xl pl-8 pr-4 py-2.5 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ranques.map((r) => {
              const active = filterRanque === r;
              return (
                <button
                  key={r}
                  onClick={() => setFilterRanque(r)}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-injury-severe text-white border-injury-severe"
                      : "border-surface-light text-parchment-dim hover:border-injury-severe/40 hover:text-injury-severe/80"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-parchment-dim/50 mb-4">
          {filtered.length} ameaça{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-parchment-dim text-sm italic">Nenhuma ameaça encontrada com esses filtros.</p>
            <button
              onClick={() => { setSearch(""); setFilterRanque("Todos"); }}
              className="mt-3 text-xs text-gold-dim hover:text-gold transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((threat) => (
            <div
              key={threat.id}
              className="group bg-surface border border-surface-light/50 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:border-injury-severe/30"
            >
              <div className="p-5 border-b border-surface-light/50 bg-surface-light/30">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="font-title text-xl text-parchment">
                    {threat.nome}
                  </h2>
                  <span className="text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded border border-gold/30 text-gold bg-gold/5">
                    {threat.ranque}
                  </span>
                </div>
                <p className="text-xs text-parchment-dim mt-2 leading-relaxed italic">
                  "{threat.descricao}"
                </p>
              </div>

              <div className="p-5 space-y-6 flex-1">
                {/* Stats Rápidas */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-base/50 p-2 rounded border border-surface-light/50 text-center">
                    <span className="block text-[9px] uppercase text-parchment-dim mb-0.5">
                      Estresse
                    </span>
                    <span className="text-sm font-bold text-parchment">
                      {threat.estresseMax}
                    </span>
                  </div>
                  <div className="bg-base/50 p-2 rounded border border-surface-light/50 text-center">
                    <span className="block text-[9px] uppercase text-parchment-dim mb-0.5">
                      L. Leves
                    </span>
                    <span className="text-sm font-bold text-gold">
                      {threat.lesoes.leves}
                    </span>
                  </div>
                  <div className="bg-base/50 p-2 rounded border border-surface-light/50 text-center">
                    <span className="block text-[9px] uppercase text-parchment-dim mb-0.5">
                      L. Graves
                    </span>
                    <span className="text-sm font-bold text-injury-severe">
                      {threat.lesoes.graves}
                    </span>
                  </div>
                </div>

                {/* Aspectos */}
                {threat.aspectos?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-arcane mb-2 font-bold">
                      Aspectos
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {threat.aspectos.map((a, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-arcane/15 border border-arcane/50 text-arcane"
                        >
                          ✦ {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proficiências */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-gold mb-2 font-bold opacity-70">
                    Proficiências
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {threat.proficiencias.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-surface-light px-2 py-1 rounded text-parchment border border-surface-light"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Traços */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-gold mb-2 font-bold opacity-70">
                    Traços Especiais
                  </h3>
                  <div className="space-y-3">
                    {threat.tracos.map((t, i) => (
                      <div
                        key={i}
                        className="bg-base/30 p-3 rounded-lg border border-surface-light/20"
                      >
                        <div className="font-title text-xs text-parchment mb-1">
                          {t.nome}
                        </div>
                        <div className="space-y-1">
                          {t.efeitos.map((eff, idx) => (
                            <p key={idx} className="text-[11px] text-parchment-dim leading-snug">
                              <span className="text-gold/60 font-bold">
                                {eff.tipo}:
                              </span>{" "}
                              {eff.descricao}
                            </p>
                          ))}
                        </div>
                        {t.limiteCusto && (
                          <p className="text-[10px] text-parchment-dim/60 italic mt-1.5 leading-tight">
                            <span className="opacity-50">Custo/Limite:</span> {t.limiteCusto}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Equipamentos */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-gold mb-2 font-bold opacity-70">
                    Equipamentos
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {threat.equipamentos.map((e, i) => (
                      <li
                        key={i}
                        className="text-[11px] text-parchment-dim leading-tight"
                      >
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Estratégia do Mestre */}
                <div className="flex-1">
                  <h3 className="text-[9px] uppercase tracking-widest text-injury-severe mb-1.5 font-bold">
                    Estratégia do Mestre
                  </h3>
                  <ul className="space-y-1">
                    {threat.taticas.map((t, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-parchment-dim/80 leading-tight flex gap-2"
                      >
                        <span className="text-injury-severe">▶</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-base/20 border-t border-surface-light/50 flex justify-end gap-4">
                <button
                  onClick={() => onOpenThreat(threat)}
                  className="px-3 py-2 rounded-lg bg-injury-severe/10 border border-injury-severe/30 text-[10px] uppercase font-bold text-injury-severe hover:bg-injury-severe hover:text-white transition-all cursor-pointer whitespace-nowrap shadow-sm"
                >
                  Abrir Ficha →
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
