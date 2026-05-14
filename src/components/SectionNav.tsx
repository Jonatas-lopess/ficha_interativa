import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "secao-identidade", label: "Identidade", icon: "👤" },
  { id: "secao-estresse-dados", label: "Estresse & Dados", icon: "🎲" },
  { id: "secao-lesoes", label: "Lesões", icon: "🩸" },
  { id: "secao-proficiencias", label: "Proficiências", icon: "📋" },
  { id: "secao-inventario", label: "Inventário", icon: "🎒" },
  { id: "secao-tracos", label: "Traços", icon: "🃏" },
  { id: "secao-divino", label: "Painel Divino", icon: "✦", conditional: true },
  { id: "secao-historia", label: "História", icon: "📖" },
];

interface Props {
  showDivine?: boolean;
  onBack?: () => void;
}

export default function SectionNav({ showDivine, onBack }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  const visibleSections = SECTIONS.filter((s) => !s.conditional || showDivine);

  // Track which section is in view via IntersectionObserver
  useEffect(() => {
    const ids = visibleSections.map((s) => s.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, [showDivine, visibleSections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {onBack && (
        <button
          onClick={onBack}
          className="fixed z-50 top-6 left-4 px-3 py-1.5 rounded-full border border-surface-light bg-surface/80 text-parchment-dim text-sm backdrop-blur-sm transition-all duration-300 hover:border-gold-dim hover:text-gold cursor-pointer"
        >
          ← Voltar
        </button>
      )}
      {/* Toggle button — always visible */}
      <button
        id="btn-toggle-nav"
        onClick={() => setOpen((v) => !v)}
        className={`fixed z-50 top-6 right-4 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300 cursor-pointer backdrop-blur-sm ${
          open
            ? "bg-gold/20 border-gold text-gold shadow-glow-gold"
            : "bg-surface/80 border-surface-light text-parchment-dim hover:border-gold-dim hover:text-gold"
        }`}
        aria-label={open ? "Fechar navegação" : "Abrir navegação"}
        title="Navegação por seções"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Floating nav panel */}
      <nav
        className={`fixed z-40 top-[4.5rem] right-4 w-52 bg-surface/95 backdrop-blur-md border border-surface-light rounded-xl shadow-xl transition-all duration-300 origin-top-right ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        inert={!open ? true : undefined}
      >
        <div className="p-1.5">
          <p className="px-3 py-2 text-[10px] text-parchment-dim/60 uppercase tracking-widest font-title">
            Seções
          </p>
          <ul className="space-y-0.5">
            {visibleSections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      scrollTo(section.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gold/10 text-gold border-l-2 border-gold"
                        : "text-parchment-dim hover:bg-surface-hover hover:text-parchment"
                    }`}
                  >
                    <span className="text-xs w-5 text-center">
                      {section.icon}
                    </span>
                    <span>{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Backdrop — closes nav on click outside */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
