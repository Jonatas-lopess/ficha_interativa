import { useRef } from "react";
import { RANQUES } from "../data/rankData";
import { importarDeArquivo } from "../utils/exportImport";
import SectionHeader from "./SectionHeader";
import { UserIcon } from "./Icons";
import { Character, RanqueNome } from "../types";

interface Props {
  character: Character;
  updateField: <K extends keyof Character>(
    field: K,
    value: Character[K],
  ) => void;
  updateRanque: (novoRanque: RanqueNome) => void;
  exportarFicha: () => void;
  importarFicha: (jsonString: string) => void;
  resetarFicha: () => void;
}

export default function Header({
  character,
  updateField,
  updateRanque,
  exportarFicha,
  importarFicha,
  resetarFicha,
}: Props) {
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importarDeArquivo(file);
      importarFicha(JSON.stringify(data));
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
              value={character.nome}
              onChange={(e) => updateField("nome", e.target.value)}
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
              value={character.idade}
              onChange={(e) => updateField("idade", e.target.value)}
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
            value={character.alinhamento}
            onChange={(e) => updateField("alinhamento", e.target.value)}
            placeholder="Ex: Ordem Pragmática"
            className="w-full bg-base border border-surface-light rounded-lg px-3 py-2 text-parchment placeholder-parchment-dim/40 focus:border-gold focus:ring-1 focus:ring-gold/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-4 justify-end items-center">
        {/* Export split group */}
        <div className="flex rounded-lg overflow-hidden border border-gold-dim">
          <button
            id="btn-exportar"
            onClick={exportarFicha}
            className="px-4 py-2 text-xs uppercase tracking-wider bg-surface text-gold-dim hover:bg-gold/10 hover:text-gold transition-all"
          >
            ⬇ Exportar JSON
          </button>
          <div className="w-px bg-gold-dim/30" />
          <div className="relative group/online">
            <button
              id="btn-salvar-online"
              disabled
              title="Salvar Online — disponível em breve"
              className="flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider bg-surface text-parchment-dim/40 cursor-not-allowed select-none"
            >
              {/* Cloud icon */}
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
              <span className="text-[9px] px-1 py-0.5 rounded bg-arcane/10 text-arcane/60 border border-arcane/20 normal-case tracking-normal leading-none">
                Em breve
              </span>
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 rounded-lg bg-surface-light border border-surface-light text-[11px] text-parchment-dim leading-relaxed shadow-xl opacity-0 pointer-events-none group-hover/online:opacity-100 transition-opacity duration-200 z-20">
              <p className="font-semibold text-arcane/80 mb-1">
                ☁ Sincronização Online
              </p>
              <p>
                Requer integração com PouchDB remoto. Disponível em uma versão
                futura.
              </p>
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
              resetarFicha();
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
}
