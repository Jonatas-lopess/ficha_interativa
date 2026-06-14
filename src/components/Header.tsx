import { useRef, useState, memo } from "react";
import { RANQUES } from "../data/rankData";
import { importarDeArquivo } from "../utils/exportImport";
import SectionHeader from "./SectionHeader";
import { UserIcon } from "./Icons";
import { RanqueNome } from "../types";
import { isSupabaseConfigured } from "../db/supabaseClient";
import { useSheetStore, useShallow } from "../store/sheetStore";

const Header = memo(function Header() {
  const { character, onlineSaveStatus } = useSheetStore(
    useShallow((s) => ({
      character: s.character,
      onlineSaveStatus: s.onlineSaveStatus,
    })),
  );
  const updateField = useSheetStore((s) => s.updateField);
  const updateRanque = useSheetStore((s) => s.updateRanque);
  const exportCharacter = useSheetStore((s) => s.exportCharacter);
  const importCharacter = useSheetStore((s) => s.importCharacter);
  const resetCharacter = useSheetStore((s) => s.resetCharacter);
  const salvarOnline = useSheetStore((s) => s.salvarOnline);

  // Local state for text inputs — persisted on blur
  const [localNome, setLocalNome] = useState<string | null>(null);
  const [localIdade, setLocalIdade] = useState<string | null>(null);
  const [localAlinhamento, setLocalAlinhamento] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!character) return null;

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importarDeArquivo(file);
      const result = importCharacter(JSON.stringify(data));
      if (!result.success) alert(result.error);
    } catch (err: any) {
      alert(err.message);
    }
    e.target.value = "";
  };

  return (
    <header className="relative mb-8">
      {/* Decorative top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Identity bar */}
      <div className="bg-surface rounded-xl border border-surface-light p-4 md:p-6 mt-4">
        <SectionHeader
          title="Identidade"
          subtitle="Quem é este personagem?"
          icon={<UserIcon />}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Nome */}
          <div className="md:col-span-2">
            <label
              htmlFor="char-nome"
              className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
            >
              Nome
            </label>
            <input
              id="char-nome"
              type="text"
              value={localNome ?? character.nome}
              onChange={(e) => setLocalNome(e.target.value)}
              onBlur={() => {
                if (localNome !== null) {
                  updateField("nome", localNome);
                  setLocalNome(null);
                }
              }}
              placeholder="Nome do personagem"
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
            />
          </div>

          {/* Idade */}
          <div>
            <label
              htmlFor="char-idade"
              className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
            >
              Idade
            </label>
            <input
              id="char-idade"
              type="text"
              value={localIdade ?? character.idade}
              onChange={(e) => setLocalIdade(e.target.value)}
              onBlur={() => {
                if (localIdade !== null) {
                  updateField("idade", localIdade);
                  setLocalIdade(null);
                }
              }}
              placeholder="—"
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
            />
          </div>

          {/* Ranque */}
          <div>
            <label
              htmlFor="char-ranque"
              className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
            >
              Ranque
            </label>
            <select
              id="char-ranque"
              value={character.ranque}
              onChange={(e) => updateRanque(e.target.value as RanqueNome)}
              className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-gold focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all cursor-pointer"
            >
              {Object.keys(RANQUES).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alinhamento */}
        <div className="mt-4">
          <label
            htmlFor="char-alinhamento"
            className="block text-xs text-parchment-dim mb-1 uppercase tracking-wider"
          >
            Alinhamento
          </label>
          <input
            id="char-alinhamento"
            type="text"
            value={localAlinhamento ?? character.alinhamento}
            onChange={(e) => setLocalAlinhamento(e.target.value)}
            onBlur={() => {
              if (localAlinhamento !== null) {
                updateField("alinhamento", localAlinhamento);
                setLocalAlinhamento(null);
              }
            }}
            placeholder="Ex: Ordem Pragmática"
            className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-4 justify-end items-center">
        {/* Import (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <button
          id="btn-importar"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 text-xs uppercase tracking-wider bg-surface border border-surface-light text-parchment-dim rounded-lg hover:border-gold-dim hover:text-gold transition-all"
        >
          ⬆ Importar JSON
        </button>

        {/* Export split group */}
        <div className="flex rounded-lg overflow-hidden border border-gold-dim">
          <button
            id="btn-exportar"
            onClick={exportCharacter}
            className="px-4 py-2 text-xs uppercase tracking-wider bg-surface text-gold-dim hover:bg-gold/10 hover:text-gold transition-all"
          >
            ⬇ Exportar JSON
          </button>
          <div className="w-px bg-gold-dim/30" />
          <div className="relative group/online">
            {isSupabaseConfigured ? (
              <button
                id="btn-salvar-online"
                onClick={() => salvarOnline()}
                disabled={onlineSaveStatus === "saving"}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider bg-surface border-l border-gold-dim transition-all cursor-pointer select-none
                  ${onlineSaveStatus === "success" ? "text-green-500 hover:text-green-400" : ""}
                  ${onlineSaveStatus === "error" ? "text-red-500 hover:text-red-400" : ""}
                  ${onlineSaveStatus === "saving" ? "text-gold-dim/70" : "text-gold-dim hover:bg-gold/10 hover:text-gold"}
                `}
              >
                {onlineSaveStatus === "saving" && (
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-gold-dim"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {onlineSaveStatus === "success" && (
                  <svg
                    className="w-3.5 h-3.5 text-green-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {onlineSaveStatus === "error" && (
                  <svg
                    className="w-3.5 h-3.5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                {onlineSaveStatus === "idle" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                )}
                {onlineSaveStatus === "saving" && "Salvando..."}
                {onlineSaveStatus === "success" && "Salvo!"}
                {onlineSaveStatus === "error" && "Erro ao Salvar"}
                {onlineSaveStatus === "idle" && "Salvar Online"}
              </button>
            ) : (
              <button
                id="btn-salvar-online"
                disabled
                title="Sincronização Online não configurada"
                className="flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider bg-surface text-parchment-dim/40 cursor-not-allowed select-none border-l border-surface-light"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
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
                <span className="text-[9px] px-1 py-0.5 rounded bg-surface-light text-parchment-dim/50 border border-surface-light normal-case tracking-normal leading-none">
                  Off
                </span>
              </button>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-64 p-2.5 rounded-lg bg-surface-light border border-surface-light text-[11px] text-parchment-dim leading-relaxed shadow-xl opacity-0 pointer-events-none group-hover/online:opacity-100 transition-opacity duration-200 z-20">
              <p className="font-semibold text-gold mb-1">
                ☁ Sincronização Online
              </p>
              {isSupabaseConfigured ? (
                <p>
                  Salva esta ficha manualmente na nuvem do Supabase. Outros
                  dispositivos/mestres verão as alterações.
                </p>
              ) : (
                <p>
                  Não configurado. Adicione{" "}
                  <code className="text-gold">VITE_SUPABASE_URL</code> e{" "}
                  <code className="text-gold">VITE_SUPABASE_ANON_KEY</code> no
                  arquivo <code className="text-gold">.env.local</code>.
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          id="btn-resetar"
          onClick={() => {
            if (
              window.confirm(
                "Tem certeza que deseja resetar a ficha? Todos os dados serão perdidos.",
              )
            ) {
              resetCharacter();
            }
          }}
          className="px-4 py-2 text-xs uppercase tracking-wider bg-surface border border-injury-critical/30 text-injury-critical/70 rounded-lg hover:border-injury-critical hover:text-injury-critical transition-all"
        >
          ↺ Resetar
        </button>
      </div>

      {/* Decorative bottom line */}
      <div className="mt-6 w-full h-px bg-gradient-to-r from-transparent via-surface-light to-transparent" />
    </header>
  );
});

export default Header;
