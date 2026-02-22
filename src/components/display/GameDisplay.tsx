"use client";

import { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";
import { loadGameModule, type GameModuleComponents } from "@/lib/game-modules/registry";
import type { ActiveBlock } from "@/stores/game-store";

interface GameDisplayProps {
  block: ActiveBlock;
  eventSlug: string;
}

export function GameDisplay({ block, eventSlug }: GameDisplayProps) {
  const [mod, setMod] = useState<GameModuleComponents | null>(null);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!block.gameSlug || block.gameSlug === loadedSlug) return;
    let cancelled = false;
    loadGameModule(block.gameSlug).then((m) => {
      if (!cancelled && m) {
        setMod(m);
        setLoadedSlug(block.gameSlug!);
      }
    });
    return () => { cancelled = true; };
  }, [block.gameSlug, loadedSlug]);

  if (mod) {
    return <mod.ProjectorScreen eventSlug={eventSlug} isFullscreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20">
      <Gamepad2 size={80} className="text-purple-400 mb-8 opacity-60" />
      <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">
        {block.title}
      </h2>
      <p className="text-2xl text-slate-500 uppercase tracking-widest">
        Hra se pripravuje...
      </p>
    </div>
  );
}
