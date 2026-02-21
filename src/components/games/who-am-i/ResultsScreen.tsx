"use client";

import { useGameStore } from "@/stores/game-store";
import { Trophy } from "lucide-react";

export function ResultsScreen() {
  const currentFact = useGameStore((s) => s.currentFact);
  const votes = useGameStore((s) => s.votes);
  const phase = useGameStore((s) => s.phase);

  if (!currentFact) return null;

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0) || 1;

  const sortedOptions = [...currentFact.options].sort((a, b) => {
    return (votes[b.attendee_id] || 0) - (votes[a.attendee_id] || 0);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-center">
        <p className="text-lg italic text-purple-200 mb-3">
          &ldquo;{currentFact.fact}&rdquo;
        </p>
        <div className="text-xs font-bold uppercase tracking-wider text-green-400">
          Spravna odpoved
        </div>
        <div className="text-2xl font-black mt-1">
          {currentFact.options.find(
            (o) => o.attendee_id === currentFact.correct_attendee_id
          )?.name ?? "???"}
        </div>
      </div>

      <div className="space-y-3">
        {sortedOptions.map((option, i) => {
          const count = votes[option.attendee_id] || 0;
          const pct = Math.round((count / totalVotes) * 100);
          const isCorrect =
            option.attendee_id === currentFact.correct_attendee_id;

          return (
            <div
              key={option.attendee_id}
              className={`relative p-4 rounded-xl border overflow-hidden ${
                isCorrect
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${
                  isCorrect ? "bg-green-500/20" : "bg-slate-800/50"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {i === 0 && (
                    <Trophy size={16} className="text-yellow-500" />
                  )}
                  <span className="font-bold text-sm">{option.name}</span>
                  {isCorrect && (
                    <span className="text-[10px] bg-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-bold">
                      CORRECT
                    </span>
                  )}
                </div>
                <span className="font-black text-sm">
                  {count} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {phase === "results" && (
        <p className="text-center text-xs text-slate-500 animate-in fade-in">
          Moderator pokracuje na dalsi kolo...
        </p>
      )}
    </div>
  );
}
