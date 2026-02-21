"use client";

import { cn } from "@/lib/utils";

export type TabId = "priprava" | "program" | "hoste";

interface DashboardTabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  attendeeCount: number;
  blockCount: number;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "priprava", label: "Priprava" },
  { id: "program", label: "Program" },
  { id: "hoste", label: "Hoste" },
];

export default function DashboardTabs({ active, onChange, attendeeCount, blockCount }: DashboardTabsProps) {
  function getBadge(id: TabId) {
    if (id === "hoste" && attendeeCount > 0) return attendeeCount;
    if (id === "program" && blockCount > 0) return blockCount;
    return null;
  }

  return (
    <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
      {TABS.map((tab) => {
        const badge = getBadge(tab.id);
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
              active === tab.id
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
            )}
          >
            {tab.label}
            {badge !== null && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                  active === tab.id ? "bg-white/20 text-white" : "bg-slate-800 text-slate-500"
                )}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
