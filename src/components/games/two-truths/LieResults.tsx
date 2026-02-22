"use client";

import { useGameStore } from "@/stores/game-store";
import type { TwoTruthsRoundData } from "./types";

export function LieResults() {
  const gameRoundData = useGameStore((s) => s.gameRoundData);
  const votes = useGameStore((s) => s.votes);

  const roundData = gameRoundData as TwoTruthsRoundData | null;
  if (!roundData) return null;

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0) || 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center">
        <h3 className="text-lg font-black italic uppercase">
          {roundData.player_name}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Kolo {roundData.round} / {roundData.total}
        </p>
      </div>

      <div className="space-y-3">
        {roundData.statements.map((statement, i) => {
          const isLie = i === roundData.correct_lie_index;
          const voteCount = votes[String(i)] || 0;
          const pct = Math.round((voteCount / totalVotes) * 100);

          return (
            <div
              key={i}
              className={`relative p-4 rounded-xl border overflow-hidden ${
                isLie
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-green-500/30 bg-green-500/5"
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${
                  isLie ? "bg-red-500/15" : "bg-green-500/10"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-start gap-3">
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    isLie
                      ? "bg-red-500/30 text-red-300"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isLie ? "line-through text-red-300" : "text-white"
                    }`}
                  >
                    {statement}
                  </p>
                  {isLie && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 block">
                      LEZ
                    </span>
                  )}
                </div>
                <span className="font-black text-sm shrink-0">
                  {voteCount} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-500 animate-in fade-in">
        Moderator pokracuje na dalsi kolo...
      </p>
    </div>
  );
}
