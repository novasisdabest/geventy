"use client";

import { useGameStore } from "@/stores/game-store";
import { CheckCircle2 } from "lucide-react";
import type { TwoTruthsRoundData } from "./types";

interface LieVotingProps {
  onVote: (value: string) => void;
}

export function LieVoting({ onVote }: LieVotingProps) {
  const gameRoundData = useGameStore((s) => s.gameRoundData);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const myVote = useGameStore((s) => s.myVote);

  const roundData = gameRoundData as TwoTruthsRoundData | null;
  if (!roundData) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
          Kolo {currentRound} / {totalRounds}
        </span>
        <h3 className="text-lg font-black italic uppercase mt-1">
          {roundData.player_name}
        </h3>
      </div>

      <p className="text-center text-sm text-slate-400 font-bold uppercase tracking-wider">
        Ktere tvrzeni je lez?
      </p>

      <div className="space-y-3">
        {roundData.statements.map((statement, i) => {
          const isMyVote = myVote === String(i);
          const hasVoted = myVote !== null;

          return (
            <button
              key={i}
              onClick={() => {
                if (!hasVoted) {
                  onVote(String(i));
                }
              }}
              disabled={hasVoted}
              className={`
                w-full p-4 rounded-xl font-medium text-sm text-left transition-all
                ${
                  isMyVote
                    ? "bg-red-600/20 text-white border-2 border-red-400 shadow-lg shadow-red-500/20"
                    : hasVoted
                      ? "bg-slate-800/50 text-slate-600 border border-slate-800"
                      : "bg-slate-800 text-white border border-slate-700 hover:border-red-500/50 active:scale-[0.98]"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                  {i + 1}
                </span>
                <span className="flex-1">{statement}</span>
                {isMyVote && <CheckCircle2 size={20} className="shrink-0 text-red-400" />}
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
