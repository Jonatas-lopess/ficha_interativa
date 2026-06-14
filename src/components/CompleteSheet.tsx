import { useState } from "react";
import Header from "./Header";
import StressBar from "./StressBar";
import InjuryTracker from "./InjuryTracker";
import ProficiencyList from "./ProficiencyList";
import AspectList from "./AspectList";
import TraitCard from "./TraitCard";
import DivinePanel from "./DivinePanel";
import InventoryList from "./InventoryList";
import StoryPanel from "./StoryPanel";
import FloatingDiceRoller from "./FloatingDiceRoller";
import { useSheetStore } from "../store/sheetStore";

type TabId = "identidade" | "combate" | "tracos" | "inventario" | "divino";

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  conditional?: boolean;
}

const TABS: TabDef[] = [
  { id: "identidade", label: "Geral", icon: "👤" },
  { id: "combate", label: "Combate", icon: "⚔️" },
  { id: "tracos", label: "Traços", icon: "🃏" },
  { id: "inventario", label: "Inventário", icon: "🎒" },
  { id: "divino", label: "Divino", icon: "✦", conditional: true },
];

interface Props {
  onBack?: () => void;
  onOpenCatalog?: () => void;
}

export default function CompleteSheet({ onBack, onOpenCatalog }: Props) {
  const ranque = useSheetStore((s) => s.character?.ranque);
  const [activeTab, setActiveTab] = useState<TabId>("identidade");

  const canHaveDivine = ranque !== "Humano" && ranque !== undefined;
  const visibleTabs = TABS.filter((t) => !t.conditional || canHaveDivine);

  // If current tab becomes hidden (rank changed to Humano while on divino), fall back
  if (!visibleTabs.some((t) => t.id === activeTab)) {
    queueMicrotask(() => setActiveTab("identidade"));
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Top bar: back + tabs */}
      <nav className="sticky top-0 z-40 bg-base/95 backdrop-blur-md border-b border-surface-light">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="shrink-0 px-3 py-1.5 rounded-lg text-parchment-dim text-sm hover:text-gold transition-colors cursor-pointer"
                title="Voltar"
              >
                ←
              </button>
            )}

            {/* Tab strip — scrollable on mobile */}
            <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "text-gold"
                        : "text-parchment-dim hover:text-parchment"
                    }`}
                  >
                    <span className="text-xs">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <main>
          {/* — Geral — */}
          {activeTab === "identidade" && (
            <div className="space-y-6 animate-fadeIn">
              <Header />
              <StoryPanel />
            </div>
          )}

          {/* — Combate — */}
          {activeTab === "combate" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
              <InjuryTracker />

              <div className="space-y-6">
                <StressBar />
                <ProficiencyList />
                <AspectList />
              </div>
            </div>
          )}

          {/* — Traços — */}
          {activeTab === "tracos" && (
            <div className="animate-fadeIn">
              <TraitCard onOpenCatalog={onOpenCatalog} />
            </div>
          )}

          {/* — Inventário — */}
          {activeTab === "inventario" && (
            <div className="animate-fadeIn">
              <InventoryList />
            </div>
          )}

          {/* — Divino (conditional) — */}
          {activeTab === "divino" && canHaveDivine && (
            <div className="animate-fadeIn">
              <DivinePanel />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <div className="h-px bg-gradient-to-r from-transparent via-surface-light to-transparent mb-4" />
          <p className="text-xs text-parchment-dim/40">
            Ficha Interativa — Sistema Narrativo 2d10
          </p>
        </footer>
      </div>

      {/* Floating Dice Roller */}
      <FloatingDiceRoller />
    </div>
  );
}
