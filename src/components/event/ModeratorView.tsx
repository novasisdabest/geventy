"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Gamepad2, ChevronRight, Home, Play } from "lucide-react";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { ProjectorScreen } from "@/components/games/who-am-i/ProjectorScreen";
import { ModeratorControls } from "@/components/games/who-am-i/ModeratorControls";
import { startGameAction } from "@/app/actions/program";
import type { Tables } from "@/lib/database.types";

interface ModeratorViewProps {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  attendees: Tables<"event_attendees">[];
  gamesLibrary: Tables<"games_library">[];
  initialProgramId: string | null;
}

export function ModeratorView({ event, attendees, gamesLibrary, initialProgramId }: ModeratorViewProps) {
  const [programId, setProgramId] = useState<string | null>(initialProgramId);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(
    initialProgramId ? "who-am-i" : null
  );
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  if (initialProgramId) {
    useGameStore.getState().setEventContext(event.id, initialProgramId);
  }

  const { sendCommand } = useEventChannel({
    eventId: event.id,
    attendeeId: "moderator",
    displayName: "Moderator",
    isModerator: true,
  });

  async function handleStartGame(game: Tables<"games_library">) {
    const result = await startGameAction(event.id, game.id);
    if (result.error) return;

    setProgramId(result.programId!);
    setActiveGameSlug(game.slug);
    useGameStore.getState().setEventContext(event.id, result.programId!);
    useGameStore.getState().reset();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <Home size={14} /> ZPET NA DASHBOARD
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          {event.slug.toUpperCase()}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main projection area */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectorScreen eventSlug={event.slug} />

          {programId && activeGameSlug === "who-am-i" && (
            <ModeratorControls
              programId={programId}
              eventId={event.id}
              sendCommand={sendCommand}
              attendees={attendees}
            />
          )}

          {!programId && (
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center text-sm text-slate-500">
              Vyber minihru z knihovny na pravo pro zahajeni.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Online guests */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Hoste ({onlinePlayers.length})
              </h3>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {onlinePlayers.length > 0 ? (
                onlinePlayers.map((p) => (
                  <div
                    key={p.attendee_id}
                    className="aspect-square rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center overflow-hidden p-1"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${p.avatar_seed}`}
                      alt={p.display_name}
                      className="w-8 h-8"
                    />
                    <span className="text-[8px] text-slate-400 truncate w-full text-center mt-0.5">
                      {p.display_name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center text-xs text-slate-600 py-4">
                  Cekam na hrace...
                </div>
              )}
            </div>
          </div>

          {/* Game library */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 italic uppercase">
              <Gamepad2 size={16} className="text-purple-400" /> Knihovna Miniher
            </h3>
            <div className="space-y-2">
              {gamesLibrary.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleStartGame(game)}
                  disabled={!!programId}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
                >
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                      {game.name}
                    </span>
                    {game.description && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{game.description}</p>
                    )}
                  </div>
                  {programId && activeGameSlug === game.slug ? (
                    <Play size={14} className="text-green-400" />
                  ) : (
                    <ChevronRight
                      size={14}
                      className="text-slate-600 group-hover:text-purple-400 transition-colors"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
