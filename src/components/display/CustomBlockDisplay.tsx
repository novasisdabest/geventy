"use client";

import type { ActiveBlock } from "@/stores/game-store";

interface CustomBlockDisplayProps {
  block: ActiveBlock;
}

export function CustomBlockDisplay({ block }: CustomBlockDisplayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 via-slate-950 to-pink-900/20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/5 via-transparent to-transparent" />
      <h2 className="text-8xl font-black italic uppercase tracking-tighter z-10 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent text-center px-8">
        {block.title}
      </h2>
    </div>
  );
}
