import { useRef, useState } from "react";
import { importarDeArquivo } from "../utils/exportImport";
import { SheetRegistryEntry, SheetTipo } from "../types";
import { getOrGenerateUserId, setUserId } from "../utils/userId";
import { isSupabaseConfigured } from "../db/supabaseClient";

// ---------------------------------------------------------------------------
// ActionCard
// ---------------------------------------------------------------------------
interface ActionCardProps {
  id: string;
  icon: string | React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "gold" | "arcane" | "severe";
}

function ActionCard({
  id,
  icon,
  title,
  description,
  onClick,
  variant = "gold",
}: ActionCardProps) {
  const accents = {
    gold: "border-surface-light hover:border-gold/30 hover:shadow-glow-gold",
    arcane:
      "border-surface-light hover:border-arcane/30 hover:shadow-glow-arcane",
    severe:
      "border-surface-light hover:border-injury-severe/30 hover:shadow-glow-corrupt",
  };

  return (
    <button
      id={id}
      onClick={onClick}
      className={`group relative bg-surface rounded-xl border ${accents[variant]} p-5 text-left transition-all duration-300 cursor-pointer hover:bg-surface-light hover:-translate-y-0.5`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-title text-parchment text-sm mb-1">{title}</h3>
      <p className="text-xs text-parchment-dim leading-relaxed">
        {description}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SheetCard
// ---------------------------------------------------------------------------
interface SheetCardProps {
  entry: SheetRegistryEntry;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onExport: () => void;
}

function SheetCard({
  entry,
  onOpen,
  onDelete,
  onDuplicate,
  onExport,
}: SheetCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const tipoLabel =
    entry.tipo === "completa"
      ? "Completa"
      : entry.tipo === "npc"
        ? "Monstro/Inimigo"
        : "Simplificada";
  const tipoColor =
    entry.tipo === "completa"
      ? "text-gold"
      : entry.tipo === "npc"
        ? "text-injury-severe"
        : "text-arcane";
  const updated = new Date(entry.atualizadoEm);
  const dataFormatada = updated.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const horaFormatada = updated.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative bg-surface border border-surface-light/50 rounded-xl p-4 transition-all duration-200 hover:border-gold/20 hover:bg-surface-light">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onOpen}
          className="flex-1 text-left cursor-pointer min-w-0"
        >
          <h3 className="font-title text-parchment truncate text-base">
            {entry.nome || "Personagem Sem Nome"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium ${tipoColor}`}>
              {tipoLabel}
            </span>
            <span className="text-parchment-dim/30">·</span>
            <span className="text-xs text-parchment-dim">
              {dataFormatada} às {horaFormatada}
            </span>
          </div>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-parchment-dim hover:text-parchment rounded-lg hover:bg-base/50 transition-colors cursor-pointer"
            aria-label="Opções da ficha"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-surface-light border border-surface-light rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in">
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-parchment hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  ⧉ Duplicar
                </button>
                <button
                  onClick={() => {
                    onExport();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-parchment hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  ↓ Exportar JSON
                </button>
                <button
                  disabled
                  className="w-full text-left px-3 py-2 text-xs text-parchment-dim/30 cursor-not-allowed flex items-center gap-2"
                  title="Requer integração com PouchDB remoto"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                  Salvar Online
                </button>
                <hr className="border-surface-light my-1" />
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-stress-corrupt hover:bg-stress-corrupt/10 transition-colors cursor-pointer"
                >
                  ✕ Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SheetSection (generic, reused in both player and GM areas)
// ---------------------------------------------------------------------------
interface SheetSectionProps {
  title: string;
  icon: string;
  fichas: SheetRegistryEntry[];
  tipo: SheetTipo;
  onCriar: (tipo: SheetTipo) => void;
  onImportar: (data: any) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  extraAction?: React.ReactNode;
  variant?: "gold" | "arcane" | "severe";
}

function SheetSection({
  title,
  icon,
  fichas,
  tipo,
  onCriar,
  onImportar,
  onOpen,
  onDelete,
  onDuplicate,
  onExport,
  extraAction,
  variant = "gold",
}: SheetSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileImport = async (file: File) => {
    try {
      const data = await importarDeArquivo(file);
      data.tipo = tipo;
      onImportar(data);
    } catch {
      alert("Erro ao importar: arquivo JSON inválido.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileImport(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".json")) handleFileImport(file);
  };

  const borderAccent =
    variant === "gold"
      ? "border-gold/30"
      : variant === "severe"
        ? "border-injury-severe/30"
        : "border-arcane/30";
  const iconColor =
    variant === "gold"
      ? "text-gold"
      : variant === "severe"
        ? "text-injury-severe"
        : "text-arcane";

  return (
    <section
      className={`relative ${dragOver ? "ring-2 ring-gold/30 rounded-2xl" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xl ${iconColor}`}>{icon}</span>
        <h2 className="font-title text-lg text-parchment">{title}</h2>
        <span className="text-xs text-parchment-dim bg-surface px-2 py-0.5 rounded-full">
          {fichas.length}
        </span>
      </div>

      <div
        className={`grid ${extraAction ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"} gap-3 mb-4`}
      >
        <ActionCard
          id={`btn-criar-${tipo}`}
          icon={tipo === "completa" ? "📜" : tipo === "npc" ? "💀" : "📋"}
          title={`Nova Ficha ${tipo === "completa" ? "Completa" : tipo === "npc" ? "de Inimigo" : "Simplificada"}`}
          description={
            tipo === "completa"
              ? "Todas as seções: identidade, traços, divino, inventário e mais."
              : tipo === "npc"
                ? "Ficha detalhada para NPCs genéricos e ameaças com lore e táticas."
                : "Template super reduzido para encontros muito rápidos."
          }
          onClick={() => onCriar(tipo)}
          variant={variant}
        />
        <ActionCard
          id={`btn-importar-${tipo}`}
          icon="📁"
          title="Importar JSON"
          description="Carregue uma ficha salva anteriormente ou compartilhada."
          onClick={() => fileInputRef.current?.click()}
          variant={variant}
        />
        {extraAction}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleInputChange}
      />

      {fichas.length > 0 ? (
        <div className="space-y-2">
          {fichas.map((entry) => (
            <SheetCard
              key={entry.id}
              entry={entry}
              onOpen={() => onOpen(entry.id)}
              onDelete={() => onDelete(entry.id)}
              onDuplicate={() => onDuplicate(entry.id)}
              onExport={() => onExport(entry.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className={`border border-dashed ${borderAccent} rounded-xl p-6 text-center`}
        >
          <p className="text-sm text-parchment-dim">
            Nenhuma ficha{" "}
            {tipo === "completa"
              ? "completa"
              : tipo === "npc"
                ? "de ameaça/inimigo"
                : "simplificada"}{" "}
            ainda.
          </p>
          <p className="text-xs text-parchment-dim/50 mt-1">
            Crie uma nova ou arraste um arquivo .json aqui.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// GMSection — collapsible panel wrapping simplified + NPC + codex
// ---------------------------------------------------------------------------
interface GMSectionProps {
  fichasNpc: SheetRegistryEntry[];
  fichasSimplificadas: SheetRegistryEntry[];
  onCriar: (tipo: SheetTipo) => void;
  onImportar: (data: any) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onOpenCodex: () => void;
}

function GMSection({
  fichasNpc,
  fichasSimplificadas,
  onCriar,
  onImportar,
  onOpen,
  onDelete,
  onDuplicate,
  onExport,
  onOpenCodex,
}: GMSectionProps) {
  const [open, setOpen] = useState(false);
  const totalGM = fichasNpc.length + fichasSimplificadas.length;

  return (
    <div className="mt-10">
      {/* Divider + toggle */}
      <button
        id="btn-toggle-gm-section"
        onClick={() => setOpen((v) => !v)}
        className="w-full group flex items-center gap-3 cursor-pointer"
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-surface-light to-transparent" />
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-xs backdrop-blur-sm transition-all duration-300 group-hover:border-injury-severe/40 group-hover:text-injury-severe whitespace-nowrap select-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-3 h-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          ⚙ Área do Mestre
          {totalGM > 0 && (
            <span className="bg-injury-severe/20 text-injury-severe rounded-full px-1.5 py-0.5 text-[10px] font-medium">
              {totalGM}
            </span>
          )}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-surface-light via-surface-light to-transparent" />
      </button>

      {/* Collapsible body */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          open ? "max-h-[9999px] opacity-100 mt-8" : "max-h-0 opacity-0"
        }`}
      >
        {/* GM header label */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs uppercase tracking-widest text-injury-severe/70 font-title">
            Ferramentas do Mestre
          </span>
        </div>

        <div className="space-y-10">
          <SheetSection
            title="Monstros e Inimigos"
            icon="💀"
            fichas={fichasNpc}
            tipo="npc"
            variant="severe"
            onCriar={onCriar}
            onImportar={onImportar}
            onOpen={onOpen}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onExport={onExport}
            extraAction={
              <ActionCard
                id="btn-abrir-codice"
                icon="📖"
                title="Códice de Ameaças"
                description="Consulte o catálogo de ameaças genéricas e monstros."
                onClick={onOpenCodex}
                variant="severe"
              />
            }
          />

          <SheetSection
            title="Fichas Simplificadas"
            icon="🛡"
            fichas={fichasSimplificadas}
            tipo="simplificada"
            variant="arcane"
            onCriar={onCriar}
            onImportar={onImportar}
            onOpen={onOpen}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onExport={onExport}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------
interface HomePageProps {
  fichasCompletas: SheetRegistryEntry[];
  fichasNpc: SheetRegistryEntry[];
  fichasSimplificadas: SheetRegistryEntry[];
  onCriar: (tipo: SheetTipo) => void;
  onImportar: (data: any) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onOpenCodex: () => void;
  onOpenCatalogTracos: () => void;
}

export default function HomePage({
  fichasCompletas,
  fichasNpc,
  fichasSimplificadas,
  onCriar,
  onImportar,
  onOpen,
  onDelete,
  onDuplicate,
  onExport,
  onOpenCodex,
  onOpenCatalogTracos,
}: HomePageProps) {
  const [editingUserId, setEditingUserId] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [copied, setCopied] = useState(false);
  const currentUserId = getOrGenerateUserId();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUserId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUserId = () => {
    if (tempUserId.trim()) {
      setUserId(tempUserId.trim());
      setEditingUserId(false);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <header className="text-center mb-10">
          <h1 className="font-title text-3xl md:text-4xl text-gold mb-2 tracking-wide">
            ✦ Ficha Interativa
          </h1>
          <p className="text-sm text-parchment-dim max-w-md mx-auto leading-relaxed">
            Sistema Narrativo 2d10 — Gerencie sua ficha de personagem.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent mt-6" />
        </header>

        {/* Sincronização & Identidade */}
        <div className="bg-surface rounded-xl border border-surface-light p-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gold text-base">☁</span>
                <h2 className="font-title text-parchment text-sm tracking-wide">
                  Sincronização de Fichas
                </h2>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono leading-none ${
                  isSupabaseConfigured
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-parchment-dim/10 text-parchment-dim/60 border border-surface-light"
                }`}>
                  {isSupabaseConfigured ? "Online (Conectado)" : "Local-First Only"}
                </span>
              </div>
              <p className="text-xs text-parchment-dim leading-relaxed">
                Suas fichas são salvas no banco de dados com base na sua chave de jogador única abaixo.
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[280px]">
              {editingUserId ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempUserId}
                    onChange={(e) => setTempUserId(e.target.value)}
                    placeholder="Cole seu ID (UUID) aqui"
                    className="flex-1 bg-base border border-surface-light rounded-lg px-2.5 py-1.5 text-xs text-parchment placeholder-parchment-dim/40 focus:border-gold outline-none"
                  />
                  <button
                    onClick={handleSaveUserId}
                    className="px-3 py-1.5 bg-gold text-base text-xs font-semibold rounded-lg hover:bg-gold-dim transition-all cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingUserId(false)}
                    className="px-2 py-1.5 bg-surface-light border border-surface-light text-parchment rounded-lg text-xs hover:text-gold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-base border border-surface-light rounded-lg px-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-parchment-dim block select-none">Chave de Jogador (ID)</span>
                    <span className="font-mono text-xs text-gold truncate block" title={currentUserId}>
                      {currentUserId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded text-parchment-dim hover:text-gold hover:bg-surface-light transition-all cursor-pointer"
                      title={copied ? "Copiado!" : "Copiar Chave"}
                    >
                      {copied ? "✓" : "📋"}
                    </button>
                    <button
                      onClick={() => {
                        setTempUserId(currentUserId);
                        setEditingUserId(true);
                      }}
                      className="p-1 rounded text-parchment-dim hover:text-gold hover:bg-surface-light transition-all cursor-pointer"
                      title="Importar/Alterar Chave"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Player section */}
        <SheetSection
          title="Fichas de Personagem"
          icon="⚔"
          fichas={fichasCompletas}
          tipo="completa"
          variant="gold"
          onCriar={onCriar}
          onImportar={onImportar}
          onOpen={onOpen}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onExport={onExport}
          extraAction={
            <ActionCard
              id="btn-abrir-catalogo-tracos"
              icon="✦"
              title="Catálogo de Traços"
              description="Consulte e adicione traços diretamente na ficha do personagem."
              onClick={onOpenCatalogTracos}
              variant="gold"
            />
          }
        />

        {/* GM section — collapsed by default */}
        <GMSection
          fichasNpc={fichasNpc}
          fichasSimplificadas={fichasSimplificadas}
          onCriar={onCriar}
          onImportar={onImportar}
          onOpen={onOpen}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onOpenCodex={onOpenCodex}
        />

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-light to-transparent mb-4" />
          <p className="text-xs text-parchment-dim/40">
            Ficha Interativa — Sistema Narrativo 2d10
          </p>
        </footer>
      </div>
    </div>
  );
}
