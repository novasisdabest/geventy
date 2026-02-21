"use client";

import { Gamepad2 } from "lucide-react";
import { ProjectorScreen } from "@/components/games/who-am-i/ProjectorScreen";
import type { ActiveBlock } from "@/stores/game-store";

interface GameDisplayProps {
  block: ActiveBlock;
  eventSlug: string;
}

export function GameDisplay({ block, eventSlug }: GameDisplayProps) {
  switch (block.gameSlug) {
    case "who-am-i":
      return <ProjectorScreen eventSlug={eventSlug} isFullscreen />;

    default:
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
}
