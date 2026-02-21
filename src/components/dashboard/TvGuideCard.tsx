"use client";

import { useState } from "react";
import { Monitor, Cable, Smartphone, ChevronDown, ChevronUp } from "lucide-react";

export function TvGuideCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-bold italic uppercase flex items-center gap-2">
          <Monitor size={16} className="text-purple-400" />
          Nastaveni projektoru
        </span>
        {open ? (
          <ChevronUp size={16} className="text-slate-500" />
        ) : (
          <ChevronDown size={16} className="text-slate-500" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 grid sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <Monitor size={28} className="text-blue-400" />
            <h4 className="font-bold text-sm text-blue-300">Moderni TV</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pripoj notebook HDMI kabelem a otevri odkaz <span className="text-white font-mono">/live</span> v prohlizeci.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-2">
            <Cable size={28} className="text-orange-400" />
            <h4 className="font-bold text-sm text-orange-300">Starsi TV</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pouzij HDMI-to-AV prevodnik pro pripojeni starsiho televizoru.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
            <Smartphone size={28} className="text-green-400" />
            <h4 className="font-bold text-sm text-green-300">Bez obrazovky</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vse bezi na telefonech hracu. Projektor neni potreba.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
