"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { LieResults } from "./LieResults";
import type { TwoTruthsRoundData } from "./types";

interface ProjectorScreenProps {
  eventSlug: string;
  isFullscreen?: boolean;
}

export function ProjectorScreen({ eventSlug, isFullscreen = false }: ProjectorScreenProps) {
  const [copied, setCopied] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const gameRoundData = useGameStore((s) => s.gameRoundData);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const votes = useGameStore((s) => s.votes);
  const scores = useGameStore((s) => s.scores);

  const roundData = gameRoundData as TwoTruthsRoundData | null;

  return (
    <div
      className={
        isFullscreen
          ? "min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden"
          : "aspect-video bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
      }
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent opacity-50" />

      {/* LOBBY */}
      {phase === "lobby" && (
        <div className="text-center z-10">
          <div className={`mx-auto mb-6 bg-white rounded-2xl inline-block ${isFullscreen ? "p-5" : "p-3"}`}>
            <QRCodeSVG
              value={`https://geventy.vercel.app/event/${eventSlug}`}
              size={isFullscreen ? 180 : 120}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>
          {isFullscreen ? (
            <h2 className="font-black mb-4 italic uppercase text-5xl">
              Dve pravdy, jedna lez
            </h2>
          ) : (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://geventy.com/event/${eventSlug}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors mb-2"
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-purple-400" />
              )}
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">
                {copied ? "Skopirovano!" : "Kopirovat odkaz"}
              </span>
            </button>
          )}
          <p className={`text-slate-400 font-medium uppercase tracking-widest ${isFullscreen ? "text-2xl" : "text-lg"}`}>
            Napiste 3 tvrzeni — 2 pravdiva a 1 lez
          </p>
          <div className={`mt-4 text-slate-500 ${isFullscreen ? "text-lg" : "text-sm"}`}>
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* COLLECTING */}
      {phase === "collecting" && (
        <div className="text-center z-10 animate-in fade-in slide-in-from-bottom-4">
          <h2 className={`font-black mb-4 uppercase tracking-tighter italic ${isFullscreen ? "text-7xl" : "text-5xl"}`}>
            DVE PRAVDY, JEDNA LEZ
          </h2>
          <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-xl ${isFullscreen ? "p-12" : "p-8"}`}>
            <p className={`text-pink-200 ${isFullscreen ? "text-3xl" : "text-2xl"}`}>
              Hraci piši sva tvrzeni...
            </p>
          </div>
          <div className={`mt-6 text-slate-500 ${isFullscreen ? "text-lg" : "text-sm"}`}>
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* VOTING */}
      {phase === "voting" && roundData && (
        <div className={`z-10 text-center animate-in fade-in slide-in-from-bottom-4 w-full ${isFullscreen ? "px-16" : "px-8"}`}>
          <div className={`font-bold tracking-widest text-slate-500 uppercase mb-2 ${isFullscreen ? "text-sm" : "text-xs"}`}>
            Kolo {roundData.round} / {roundData.total}
          </div>
          <h2 className={`font-black mb-6 uppercase tracking-tighter italic ${isFullscreen ? "text-6xl" : "text-4xl"}`}>
            {roundData.player_name}
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {roundData.statements.map((statement, i) => {
              const voteCount = votes[String(i)] || 0;
              return (
                <div
                  key={i}
                  className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-left ${isFullscreen ? "p-8" : "p-5"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className={`shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-black ${isFullscreen ? "text-lg" : "text-sm"}`}>
                        {i + 1}
                      </span>
                      <p className={`italic ${isFullscreen ? "text-2xl" : "text-lg"}`}>
                        {statement}
                      </p>
                    </div>
                    <span className={`shrink-0 font-black text-slate-500 ${isFullscreen ? "text-xl" : "text-sm"}`}>
                      {voteCount} hlasu
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="z-10 w-full px-8 max-w-2xl animate-in fade-in zoom-in">
          <LieResults />
        </div>
      )}

      {/* FINISHED */}
      {phase === "finished" && (
        <div className="z-10 text-center animate-in fade-in zoom-in">
          <h2 className={`font-black mb-4 uppercase tracking-tighter italic ${isFullscreen ? "text-8xl" : "text-6xl"}`}>
            KONEC HRY!
          </h2>
          <p className={`text-slate-400 ${isFullscreen ? "text-3xl" : "text-xl"}`}>
            Dekujeme za ucast
          </p>
          {Object.keys(scores).length > 0 && (
            <div className="mt-8 max-w-md mx-auto space-y-2">
              {Object.entries(scores)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, score], i) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700"
                  >
                    <span className="font-bold text-sm">
                      {i + 1}. {name}
                    </span>
                    <span className="font-black text-purple-400">{score}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
