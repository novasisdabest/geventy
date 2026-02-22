"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { ResultsScreen } from "./ResultsScreen";

interface ProjectorScreenProps {
  eventSlug: string;
  isFullscreen?: boolean;
}

export function ProjectorScreen({ eventSlug, isFullscreen = false }: ProjectorScreenProps) {
  const [copied, setCopied] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const currentFact = useGameStore((s) => s.currentFact);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const votes = useGameStore((s) => s.votes);

  return (
    <div className={
      isFullscreen
        ? "min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden"
        : "aspect-video bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden"
    }>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-50" />

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
            <h2 className="font-black mb-2 italic uppercase text-6xl">
              geventy.com/event/{eventSlug}
            </h2>
          ) : (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://geventy.com/event/${eventSlug}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-colors mb-2"
              title={`geventy.com/event/${eventSlug}`}
            >
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} className="text-purple-400" />
              )}
              <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">
                {copied ? "Skopirovano!" : "Kopirovat odkaz"}
              </span>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                geventy.com/event/{eventSlug}
              </span>
            </button>
          )}
          <p className={`text-slate-400 font-medium uppercase tracking-widest ${isFullscreen ? "text-2xl" : "text-xl"}`}>
            Naskenuj a pripoj se
          </p>
          <div className={`mt-4 text-slate-500 ${isFullscreen ? "text-lg" : "text-sm"}`}>
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* COLLECTING FACTS */}
      {phase === "collecting" && (
        <div className="text-center z-10 animate-in fade-in slide-in-from-bottom-4">
          <h2 className={`font-black mb-4 uppercase tracking-tighter italic ${isFullscreen ? "text-7xl" : "text-5xl"}`}>
            KDO JSEM TED?
          </h2>
          <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-xl ${isFullscreen ? "p-12" : "p-8"}`}>
            <p className={`text-purple-200 ${isFullscreen ? "text-3xl" : "text-2xl"}`}>
              Napiste na svuj telefon zajimavy fakt o sobe...
            </p>
          </div>
          <div className={`mt-6 text-slate-500 ${isFullscreen ? "text-lg" : "text-sm"}`}>
            {onlinePlayers.length} hracu online
          </div>
        </div>
      )}

      {/* VOTING - show the fact */}
      {phase === "voting" && currentFact && (
        <div className={`z-10 text-center animate-in fade-in slide-in-from-bottom-4 w-full ${isFullscreen ? "px-16" : "px-8"}`}>
          <div className={`font-bold tracking-widest text-slate-500 uppercase mb-4 ${isFullscreen ? "text-sm" : "text-xs"}`}>
            Kolo {currentRound} / {totalRounds}
          </div>
          <h2 className={`font-black mb-6 uppercase tracking-tighter italic ${isFullscreen ? "text-7xl" : "text-5xl"}`}>
            KDO JSEM TED?
          </h2>
          <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-3xl mx-auto ${isFullscreen ? "p-12" : "p-8"}`}>
            <p className={`italic text-purple-200 ${isFullscreen ? "text-5xl" : "text-3xl"}`}>
              &ldquo;{currentFact.fact}&rdquo;
            </p>
          </div>
          <div className={`mt-6 grid grid-cols-4 gap-3 max-w-3xl mx-auto ${isFullscreen ? "gap-4" : "gap-3"}`}>
            {currentFact.options.map((option) => (
              <div
                key={option.attendee_id}
                className={`rounded-xl bg-slate-800/50 border border-slate-700 text-center ${isFullscreen ? "p-5" : "p-3"}`}
              >
                <div className={`font-bold ${isFullscreen ? "text-lg" : "text-sm"}`}>{option.name}</div>
                <div className={`text-slate-500 mt-1 ${isFullscreen ? "text-sm" : "text-xs"}`}>
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
          <h2 className={`font-black mb-4 uppercase tracking-tighter italic ${isFullscreen ? "text-8xl" : "text-6xl"}`}>
            KONEC HRY!
          </h2>
          <p className={`text-slate-400 ${isFullscreen ? "text-3xl" : "text-xl"}`}>Dekujeme za ucast</p>
        </div>
      )}
    </div>
  );
}
