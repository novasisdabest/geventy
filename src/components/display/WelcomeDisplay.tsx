"use client";

import { QrCode } from "lucide-react";

interface WelcomeDisplayProps {
  eventTitle: string;
  eventSlug: string;
  onlineCount: number;
}

export function WelcomeDisplay({ eventTitle, eventSlug, onlineCount }: WelcomeDisplayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/5 via-transparent to-transparent" />

      <div className="text-center z-10 space-y-8">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
          {eventTitle}
        </h1>

        <div className="flex flex-col items-center gap-6">
          <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
            <QrCode size={180} className="text-white opacity-90" />
          </div>
          <p className="text-3xl font-black italic uppercase tracking-wider text-purple-300">
            geventy.com/{eventSlug}
          </p>
        </div>

        <p className="text-2xl text-slate-400 font-medium uppercase tracking-widest">
          Naskenuj a pripoj se
        </p>

        <div className="flex items-center justify-center gap-3 text-xl text-slate-500">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          {onlineCount} hracu online
        </div>
      </div>
    </div>
  );
}
