"use client";

import { QrCode } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { ResultsScreen } from "./ResultsScreen";

interface ProjectorScreenProps {
  eventSlug: string;
}

export function ProjectorScreen({ eventSlug }: ProjectorScreenProps) {
  const phase = useGameStore((s) => s.phase);
  const currentFact = useGameStore((s) => s.currentFact);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const votes = useGameStore((s) => s.votes);

  return (
    <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-50" />

      {/* LOBBY */}
      {phase === "lobby" && (
        <div className="text-center z-10">
          <QrCode size={120} className="mx-auto mb-6 text-white opacity-90" />
          <h2 className="text-4xl font-black mb-2 italic uppercase">
            geventy.com/{eventSlug}
          </h2>
          <p className="text-slate-400 text-xl font-medium uppercase tracking-widest">
            Naskenuj a pripoj se
          </p>
          <div className="mt-4 text-sm text-slate-500">
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* COLLECTING FACTS */}
      {phase === "collecting" && (
        <div className="text-center z-10 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter italic">
            KDO JSEM TED?
          </h2>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 max-w-xl">
            <p className="text-2xl text-purple-200">
              Napiste na svuj telefon zajimavy fakt o sobe...
            </p>
          </div>
          <div className="mt-6 text-sm text-slate-500">
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* VOTING - show the fact */}
      {phase === "voting" && currentFact && (
        <div className="z-10 text-center animate-in fade-in slide-in-from-bottom-4 w-full px-8">
          <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">
            Kolo {currentRound} / {totalRounds}
          </div>
          <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter italic">
            KDO JSEM TED?
          </h2>
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 max-w-2xl mx-auto">
            <p className="text-3xl italic text-purple-200">
              &ldquo;{currentFact.fact}&rdquo;
            </p>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {currentFact.options.map((option) => (
              <div
                key={option.attendee_id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-center"
              >
                <div className="font-bold text-sm">{option.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {votes[option.attendee_id] || 0} hlasu
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="z-10 w-full px-8 max-w-2xl animate-in fade-in zoom-in">
          <ResultsScreen />
        </div>
      )}

      {/* FINISHED */}
      {phase === "finished" && (
        <div className="z-10 text-center animate-in fade-in zoom-in">
          <h2 className="text-6xl font-black mb-4 uppercase tracking-tighter italic">
            KONEC HRY!
          </h2>
          <p className="text-xl text-slate-400">Dekujeme za ucast</p>
        </div>
      )}
    </div>
  );
}
