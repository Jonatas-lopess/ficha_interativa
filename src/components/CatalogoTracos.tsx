import { useState, useMemo, useEffect } from "react";
import { getDatabase } from "../db";
import { useCatalogSync } from "../db/replication/catalogReplication";
import { Traco, TipoEfeito, OrigemTraco } from "../types";
import { MarkdownText } from "./MarkdownText";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CatalogTraco extends Traco {
  id: string;
}

interface Props {
  onBack: () => void;
  /** If provided, shows "Adicionar à Ficha" button for each trait. */
  onAddTrait?: (traco: Traco) => void;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const EFEITO_BADGES: Record<TipoEfeito, string> = {
  Passivo: "bg-gold/10 text-gold-dim border-gold/20",
  Ativável: "bg-arcane/10 text-arcane border-arcane/20",
  Reativo: "bg-green-500/10 text-green-400 border-green-500/20",
};

const EFEITO_DOTS: Record<TipoEfeito, string> = {
  Passivo: "bg-gold-dim",
  Ativável: "bg-arcane",
  Reativo: "bg-green-500",
};

const ORIGEM_STYLES: Record<
  OrigemTraco,
  { badge: string; glow: string; label: string }
> = {
  Base: {
    badge: "text-parchment border-surface-light bg-surface-light/40",
    glow: "hover:border-gold/40",
    label: "Base",
  },
  Divino: {
    badge: "text-arcane border-arcane/30 bg-arcane/5",
    glow: "hover:border-arcane/40",
    label: "Divino",
  },
  Alienação: {
    badge: "text-injury-severe border-injury-severe/30 bg-injury-severe/5",
    glow: "hover:border-injury-severe/40",
    label: "Alienação",
  },
};

const ORIGENS: OrigemTraco[] = ["Base", "Divino", "Alienação"];

// ─── TracoCard sub-component ─────────────────────────────────────────────────

interface TracoCardProps {
  traco: CatalogTraco;
  onAdd?: (traco: Traco) => void;
}

function TracoCard({ traco, onAdd }: TracoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const origem = traco.origem as OrigemTraco;
  const style = ORIGEM_STYLES[origem] ?? ORIGEM_STYLES.Base;

  // Unique effect types for badge display
  const effectTypes = [
    ...new Set((traco.efeitos ?? []).map((e) => e.tipo as TipoEfeito)),
  ];

  const handleAdd = () => {
    if (!onAdd) return;
    // Strip catalog id before passing to sheet
    const { id: _id, ...traco_ } = traco as any;
    onAdd(traco_ as Traco);
  };

  return (
    <div
      className={`group bg-surface border border-surface-light/50 rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${style.glow}`}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-1 border-b border-surface-light/40 bg-surface-light/20">
        <div className="flex justify-between items-start gap-3">
          <h2 className="font-title text-base text-parchment leading-snug">
            {traco.nome}
          </h2>
          <span
            className={`shrink-0 text-[10px] uppercase tracking-tighter px-2 py-0.5 rounded border ${style.badge}`}
          >
            {style.label}
          </span>
        </div>

        {/* Effect type badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {effectTypes.map((tipo) => (
            <span
              key={tipo}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${EFEITO_BADGES[tipo] ?? EFEITO_BADGES.Passivo}`}
            >
              {tipo}
            </span>
          ))}
        </div>

        {/* Gatilho */}
        {traco.gatilho && (
          <p className="text-[11px] text-parchment-dim/60 italic mt-2 leading-relaxed">
            <span className="not-italic text-parchment-dim/40 uppercase text-[9px] tracking-widest mr-1">
              Gatilho:
            </span>
            {traco.gatilho}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pt-1 pb-5 flex-1 space-y-4">
        {/* Conceito */}
        {traco.conceito && (
          <p className="text-xs text-parchment-dim leading-relaxed italic">
            "{traco.conceito}"
          </p>
        )}

        {/* Efeitos — collapsed preview / full expand */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-gold mb-2 font-bold opacity-70">
            {traco.efeitos?.length === 1 ? "Efeito" : "Efeitos"}
          </h3>
          <div className="space-y-2">
            {(expanded ? traco.efeitos : traco.efeitos?.slice(0, 1))?.map(
              (ef, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span
                    className={`w-2 h-2 rounded-full mt-1 shrink-0 ${EFEITO_DOTS[ef.tipo as TipoEfeito] ?? "bg-parchment-dim"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[10px] font-semibold ${EFEITO_BADGES[ef.tipo as TipoEfeito]?.split(" ")[1] ?? "text-parchment-dim"}`}
                    >
                      {ef.tipo}
                    </div>
                    {ef.descricao && (
                      <div className="text-[11px] text-parchment-dim leading-snug mt-0.5">
                        <MarkdownText>{ef.descricao}</MarkdownText>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {!expanded && (traco.efeitos?.length ?? 0) > 1 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] text-gold-dim hover:text-gold transition-colors cursor-pointer"
              >
                + {traco.efeitos!.length - 1} efeito
                {traco.efeitos!.length - 1 > 1 ? "s" : ""} adicional
                {traco.efeitos!.length - 1 > 1 ? "is" : ""}…
              </button>
            )}
            {expanded && (traco.efeitos?.length ?? 0) > 1 && (
              <button
                onClick={() => setExpanded(false)}
                className="text-[10px] text-parchment-dim/50 hover:text-parchment-dim transition-colors cursor-pointer"
              >
                ▴ Recolher
              </button>
            )}
          </div>
        </div>

        {/* Limite / Custo */}
        {traco.limiteCusto && (
          <div>
            <h3 className="text-[10px] uppercase tracking-widest text-injury-light mb-1 font-bold opacity-70">
              Limite / Custo
            </h3>
            <p className="text-[11px] text-injury-light/80 leading-snug">
              {traco.limiteCusto}
            </p>
          </div>
        )}
      </div>

      {/* Footer action */}
      {onAdd && (
        <div className="px-5 pb-4 pt-0">
          <button
            onClick={handleAdd}
            className="w-full py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-gold/10 border border-gold/30 text-gold-dim hover:bg-gold/20 hover:text-gold hover:border-gold transition-all duration-200 cursor-pointer"
          >
            + Adicionar à Ficha
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CatalogoTracos({ onBack, onAddTrait }: Props) {
  const [tracosCatalog, setTracosCatalog] = useState<CatalogTraco[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterOrigem, setFilterOrigem] = useState<OrigemTraco | "Todos">(
    "Todos",
  );

  const syncStatus = useCatalogSync();

  // Carrega e assina atualizações do banco local (RxDB)
  useEffect(() => {
    let sub: any;
    getDatabase().then(db => {
      sub = db.traits.find().$.subscribe(docs => {
        const list = docs.map(doc => {
          const raw = doc.toJSON();
          return {
            id: raw.id,
            nome: raw.nome || "",
            conceito: raw.conceito || "",
            gatilho: raw.gatilho || "",
            efeitos: raw.efeitos || [],
            limiteCusto: raw.limiteCusto || "",
            origem: raw.origem || "Base",
            caminho: raw.caminho || "",
            ranqueRequisito: raw.ranqueRequisito || "",
            saturacaoRequisito: raw.saturacaoRequisito || "",
          } as CatalogTraco;
        });
        setTracosCatalog(list);
        setLoading(false);
      });
    });
    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    return tracosCatalog.filter((t) => {
      const matchOrigem = filterOrigem === "Todos" || t.origem === filterOrigem;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.nome.toLowerCase().includes(q) ||
        t.conceito?.toLowerCase().includes(q) ||
        t.gatilho?.toLowerCase().includes(q) ||
        (t.efeitos ?? []).some((e) => e.descricao.toLowerCase().includes(q));
      return matchOrigem && matchSearch;
    });
  }, [tracosCatalog, search, filterOrigem]);

  return (
    <div className="min-h-screen bg-base py-10 px-4 relative">
      {/* Barra de Status de Sincronização */}
      {syncStatus.isConfigured && (
        <div className="max-w-5xl mx-auto mb-4">
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
                <span>Sincronizando catálogo de traços com o servidor...</span>
              </div>
            </div>
          ) : syncStatus.error ? (
            <div className="bg-red-950/35 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300 flex items-center justify-between">
              <span><strong>Erro de Sincronização:</strong> {syncStatus.error}</span>
            </div>
          ) : null}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10 relative">
          <button
            onClick={onBack}
            className="absolute top-0 left-0 px-4 py-2 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm backdrop-blur-sm transition-all duration-300 hover:border-gold-dim hover:text-gold cursor-pointer z-10"
          >
            ← Voltar
          </button>

          <h1 className="font-title text-3xl md:text-4xl text-gold tracking-wide uppercase mb-2">
            Catálogo de Traços
          </h1>
          <p className="text-sm text-parchment-dim max-w-md mx-auto leading-relaxed">
            Traços narrativos disponíveis — Base, Divinos e de Alienação.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-6" />
        </header>

        {/* LOADING INICIAL OU BANCO VAZIO SEM CONEXÃO */}
        {loading || (tracosCatalog.length === 0 && !syncStatus.isInitialSyncComplete) ? (
          <div className="text-center py-20">
            <svg className="animate-spin h-8 w-8 text-gold mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-parchment-dim text-sm italic">Sincronizando e carregando catálogo pela primeira vez...</p>
          </div>
        ) : tracosCatalog.length === 0 ? (
          <div className="bg-surface/50 border border-surface-light/80 rounded-2xl p-8 text-center max-w-lg mx-auto py-12 shadow-xl">
            <span className="text-4xl block mb-4">📭</span>
            <h2 className="font-title text-lg text-gold mb-2 uppercase">Catálogo Vazio</h2>
            
            {!syncStatus.online ? (
              <div className="space-y-3">
                <p className="text-sm text-parchment-dim leading-relaxed">
                  Não há traços salvos localmente e você está sem conexão com a internet.
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
                Nenhum traço encontrado no banco de dados do Supabase. O mestre precisa cadastrar traços para povoar o catálogo.
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
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim/40 text-sm pointer-events-none">
                  ⌕
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, conceito ou efeito…"
                  className="w-full bg-surface border border-surface-light rounded-xl pl-8 pr-4 py-2.5 text-sm text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
                />
              </div>

              {/* Origin filter */}
              <div className="flex gap-2 flex-wrap">
                {(["Todos", ...ORIGENS] as const).map((o) => {
                  const active = filterOrigem === o;
                  const style =
                    o === "Todos"
                      ? active
                        ? "bg-gold text-base border-gold"
                        : "border-surface-light text-parchment-dim hover:border-gold/40 hover:text-parchment"
                      : active
                        ? o === "Divino"
                          ? "bg-arcane text-white border-arcane"
                          : o === "Alienação"
                            ? "bg-injury-severe text-white border-injury-severe"
                            : "bg-gold text-base border-gold"
                        : o === "Divino"
                          ? "border-arcane/30 text-arcane/70 hover:border-arcane hover:text-arcane"
                          : o === "Alienação"
                            ? "border-injury-severe/30 text-injury-severe/70 hover:border-injury-severe hover:text-injury-severe"
                            : "border-surface-light text-parchment-dim hover:border-gold/40 hover:text-parchment";

                  return (
                    <button
                      key={o}
                      onClick={() => setFilterOrigem(o as OrigemTraco | "Todos")}
                      className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all duration-200 cursor-pointer ${style}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count */}
            <p className="text-xs text-parchment-dim/50 mb-4">
              {filtered.length} traço{filtered.length !== 1 ? "s" : ""} encontrado
              {filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-parchment-dim text-sm italic">
                  Nenhum traço encontrado com esses filtros.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterOrigem("Todos");
                  }}
                  className="mt-3 text-xs text-gold-dim hover:text-gold transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((traco) => (
                  <TracoCard key={traco.id} traco={traco} onAdd={onAddTrait} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
