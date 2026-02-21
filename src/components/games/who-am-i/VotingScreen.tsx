"use client";

import { useGameStore } from "@/stores/game-store";
import { CheckCircle2 } from "lucide-react";

interface VotingScreenProps {
  onVote: (attendeeId: string) => void;
}

export function VotingScreen({ onVote }: VotingScreenProps) {
  const currentFact = useGameStore((s) => s.currentFact);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const myVote = useGameStore((s) => s.myVote);

  if (!currentFact) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Kolo {currentRound} / {totalRounds}
        </span>
      </div>

      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
        <p className="text-xl italic text-purple-200 text-center">
          &ldquo;{currentFact.fact}&rdquo;
        </p>
      </div>

      <p className="text-center text-sm text-slate-400 font-bold uppercase tracking-wider">
        Kdo to napsal?
      </p>

      <div className="grid grid-cols-2 gap-3">
        {currentFact.options.map((option) => {
          const isMyVote = myVote === option.attendee_id;
          const hasVoted = myVote !== null;

          return (
            <button
              key={option.attendee_id}
              onClick={() => {
                if (!hasVoted) {
                  onVote(option.attendee_id);
                }
              }}
              disabled={hasVoted}
              className={`
                p-4 rounded-xl font-bold text-sm transition-all text-center
                ${
                  isMyVote
                    ? "bg-purple-600 text-white border-2 border-purple-400 shadow-lg shadow-purple-500/30"
                    : hasVoted
                      ? "bg-slate-800/50 text-slate-600 border border-slate-800"
                      : "bg-slate-800 text-white border border-slate-700 hover:border-purple-500 active:scale-95"
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                {isMyVote && <CheckCircle2 size={16} />}
                {option.name}
              </div>
            </button>
          );
        })}
      </div>

      {myVote && (
        <p className="text-center text-xs text-slate-500 animate-in fade-in">
          Hlas odeslan. Cekej na vysledky...
        </p>
      )}
    </div>
  );
}
