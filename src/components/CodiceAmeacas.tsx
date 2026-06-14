import { useState, useMemo, useEffect } from "react";
import { getDatabase } from "../db";
import { useCatalogSync } from "../db/replication/catalogReplication";

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
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRanque, setFilterRanque] = useState<string>("Todos");

  const syncStatus = useCatalogSync();

  // Carrega e assina atualizações do banco local (RxDB)
  useEffect(() => {
    let sub: any;
    getDatabase().then(db => {
      sub = db.threats.find().$.subscribe(docs => {
        const list = docs.map(doc => {
          const raw = doc.toJSON();
          return {
            id: raw.id,
            nome: raw.nome || "",
            ranque: raw.ranque || "Humano",
            descricao: raw.descricao || "",
            estresseMax: raw.estresseMax || 0,
            lesoes: raw.lesoes || { leves: 0, graves: 0, criticas: 0 },
            proficiencias: raw.proficiencias || [],
            aspectos: raw.aspectos || [],
            tracos: raw.tracos || [],
            equipamentos: raw.equipamentos || [],
            taticas: raw.taticas || [],
          } as ThreatData;
        });
        setThreats(list);
        setLoading(false);
      });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const ranques = useMemo(() => {
    return ["Todos", ...Array.from(new Set(threats.map((t) => t.ranque)))];
  }, [threats]);

  const filtered = useMemo(() => {
    return threats.filter((t) => {
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
  }, [threats, search, filterRanque]);

  return (
    <div className="min-h-screen bg-base py-10 px-4 relative">
      {/* Barra de Status de Sincronização */}
      {syncStatus.isConfigured && (
        <div className="max-w-4xl mx-auto mb-4">
          {!syncStatus.online ? (
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span><strong>Modo Offline:</strong> Sem conexão com a internet. Exibindo dados locais do catálogo.</span>
              </div>
            </div>
          ) : syncStatus.isSyncing ? (
            <div className="bg-gold/5 border border-gold/20 rounded-xl px-4 py-3 text-xs text-gold-dim flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5 text-gold-dim" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sincronizando códice de ameaças com o servidor...</span>
              </div>
            </div>
          ) : syncStatus.error ? (
            <div className="bg-red-950/35 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300 flex items-center justify-between">
              <span><strong>Erro de Sincronização:</strong> {syncStatus.error}</span>
            </div>
          ) : null}
        </div>
      )}

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

        {/* LOADING INICIAL OU BANCO VAZIO SEM CONEXÃO */}
        {loading || (threats.length === 0 && !syncStatus.isInitialSyncComplete) ? (
          <div className="text-center py-20">
            <svg className="animate-spin h-8 w-8 text-gold mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-parchment-dim text-sm italic">Sincronizando e carregando códice pela primeira vez...</p>
          </div>
        ) : threats.length === 0 ? (
          <div className="bg-surface/50 border border-surface-light/80 rounded-2xl p-8 text-center max-w-lg mx-auto py-12 shadow-xl">
            <span className="text-4xl block mb-4">📭</span>
            <h2 className="font-title text-lg text-gold mb-2 uppercase">Códice Vazio</h2>
            
            {!syncStatus.online ? (
              <div className="space-y-3">
                <p className="text-sm text-parchment-dim leading-relaxed">
                  Não há ameaças salvas localmente e você está sem conexão com a internet.
                </p>
                <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-3 text-xs text-red-300">
                  ⚠️ Conecte-se à internet para sincronizar o catálogo com o servidor Supabase pela primeira vez.
                </div>
              </div>
            ) : !syncStatus.isConfigured ? (
              <p className="text-sm text-parchment-dim leading-relaxed">
                Supabase não está configurado e nenhum dado local foi encontrado. Preencha as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
              </p>
            ) : (
              <p className="text-sm text-parchment-dim leading-relaxed">
                Nenhuma ameaça encontrada no banco de dados do Supabase. O mestre precisa cadastrar ameaças para povoar o catálogo.
              </p>
            )}
            
            <button
              onClick={onBack}
              className="mt-6 px-4 py-2 text-xs rounded-lg border border-surface-light text-parchment-dim hover:text-gold hover:border-gold transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <>
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
                      {threat.proficiencias?.length > 0 && (
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
                      )}

                      {/* Traços */}
                      {threat.tracos?.length > 0 && (
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
                      )}

                      {/* Equipamentos */}
                      {threat.equipamentos?.length > 0 && (
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
                      )}

                      {/* Estratégia do Mestre */}
                      {threat.taticas?.length > 0 && (
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
                      )}
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
          </>
        )}
      </div>
    </div>
  );
}
