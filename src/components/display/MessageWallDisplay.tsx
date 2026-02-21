"use client";

import { MessageSquare } from "lucide-react";
import type { ActiveBlock } from "@/stores/game-store";

interface MessageWallDisplayProps {
  block: ActiveBlock;
}

export function MessageWallDisplay({ block }: MessageWallDisplayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-900/20 via-slate-950 to-purple-900/20">
      <MessageSquare size={80} className="text-pink-400 mb-8 opacity-60" />
      <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">
        {block.title}
      </h2>
      <p className="text-2xl text-slate-500 uppercase tracking-widest">
        Zed vzkazu — pripravujeme
      </p>
    </div>
  );
}
