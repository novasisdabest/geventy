"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Gamepad2, ChevronRight, Home, Play, Monitor, LayoutList, X, Camera, Zap, Sparkles, Flame, Trophy } from "lucide-react";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { ProjectorScreen } from "@/components/games/who-am-i/ProjectorScreen";
import { ModeratorControls } from "@/components/games/who-am-i/ModeratorControls";
import { startGameAction } from "@/app/actions/program";
import { awardAchievementAction } from "@/app/actions/achievements";
import type { Tables } from "@/lib/database.types";
import type { ActiveBlock, Achievement } from "@/stores/game-store";

interface ProgramBlock extends Tables<"event_program"> {
  gameSlug?: string;
  gameName?: string;
}

interface AchievementInit {
  id: string;
  achievement_type: string;
  title: string;
  points: number;
  awarded_at: string;
}

interface ModeratorViewProps {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  liveCode: string;
  attendees: Tables<"event_attendees">[];
  gamesLibrary: Tables<"games_library">[];
  blocks: ProgramBlock[];
  initialProgramId: string | null;
  initialAchievements?: AchievementInit[];
  initialScore?: number;
}

export function ModeratorView({ event, liveCode, attendees, gamesLibrary, blocks, initialProgramId, initialAchievements, initialScore }: ModeratorViewProps) {
  const [programId, setProgramId] = useState<string | null>(initialProgramId);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(
    initialProgramId ? "who-am-i" : null
  );
  const [awarding, setAwarding] = useState(false);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const legendaryScore = useGameStore((s) => s.legendaryScore);
  const activeBlock = useGameStore((s) => s.activeBlock);

  useEffect(() => {
    if (initialProgramId) {
      useGameStore.getState().setEventContext(event.id, initialProgramId);
    }
    if (initialAchievements && initialAchievements.length > 0) {
      useGameStore.getState().setAchievements(initialAchievements, initialScore ?? 0);
    }
  }, [event.id, initialProgramId, initialAchievements, initialScore]);

  const { sendCommand } = useEventChannel({
    eventId: event.id,
    attendeeId: "moderator",
    displayName: "Moderator",
    isModerator: true,
  });

  async function handleStartGame(game: Tables<"games_library">, broadcastToDisplay = false) {
    const result = await startGameAction(event.id, game.id);
    if (result.error) return;

    setProgramId(result.programId!);
    setActiveGameSlug(game.slug);
    useGameStore.getState().setEventContext(event.id, result.programId!);
    useGameStore.getState().reset();

    if (broadcastToDisplay) {
      const blockData = {
        id: result.programId!,
        type: "game",
        title: game.name,
        gameSlug: game.slug,
      };
      sendCommand("block_activate", blockData);
      useGameStore.getState().setActiveBlock({
        id: result.programId!,
        type: "game",
        title: game.name,
        gameSlug: game.slug,
      });
    }
  }

  function handleActivateBlock(block: ProgramBlock) {
    const blockType = (block.block_type || "custom") as ActiveBlock["type"];
    const payload: Record<string, unknown> = {
      id: block.id,
      type: blockType,
      title: block.title || "Blok",
      gameSlug: block.gameSlug,
      config: block.config as Record<string, unknown> | undefined,
    };

    // For game blocks, also start the game in DB
    if (blockType === "game" && block.game_id) {
      const game = gamesLibrary.find((g) => g.id === block.game_id);
      if (game) {
        handleStartGame(game);
        payload.gameSlug = game.slug;
      }
    }

    sendCommand("block_activate", payload);
    useGameStore.getState().setActiveBlock({
      id: block.id,
      type: blockType,
      title: block.title || "Blok",
      gameSlug: block.gameSlug,
      config: block.config as Record<string, unknown> | undefined,
    });
  }

  function handleDeactivateBlock() {
    sendCommand("block_deactivate");
    useGameStore.getState().clearActiveBlock();
    useGameStore.getState().reset();
  }

  async function handleAwardAchievement(type: string, title: string, points: number) {
    if (awarding) return;
    setAwarding(true);
    const result = await awardAchievementAction(event.id, type, title, points);
    setAwarding(false);
    if ("error" in result) return;

    const achievement = result.achievement as Achievement;
    useGameStore.getState().addAchievement(achievement);
    sendCommand("achievement_awarded", achievement as unknown as Record<string, unknown>);
  }

  function handleToggleLegendary() {
    if (activeBlock?.type === "legendary") {
      handleDeactivateBlock();
    } else {
      const blockData = {
        id: "legendary",
        type: "legendary",
        title: "Legendaryness Index",
      };
      sendCommand("block_activate", blockData);
      useGameStore.getState().setActiveBlock({
        id: "legendary",
        type: "legendary",
        title: "Legendaryness Index",
      });
    }
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900 border border-purple-500/30 rounded-2xl px-4 py-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-tight">
              Kod pro<br />projektor
            </div>
            <div className="flex gap-0.5">
              {liveCode.trim().split("").map((char, i) => (
                <span
                  key={i}
                  className="w-7 h-9 flex items-center justify-center bg-purple-600/20 border border-purple-500/40 rounded-lg text-base font-black text-purple-300 font-mono tabular-nums"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
          <a
            href={`/event/${event.slug}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Monitor size={12} /> Projektor
          </a>
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

          {/* Legendaryness Index */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2 italic uppercase">
                <Flame size={16} className="text-amber-400" /> Legendaryness
              </h3>
              <span className="text-2xl font-black italic text-purple-400 tabular-nums">
                {legendaryScore}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleAwardAchievement("group_photo", "Skupinove foto", 50)}
                disabled={awarding}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 disabled:opacity-50 transition-colors text-left"
              >
                <Camera size={14} className="text-purple-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block">Foto</span>
                  <span className="text-[10px] text-purple-400 font-bold">+50</span>
                </div>
              </button>
              <button
                onClick={() => handleAwardAchievement("icebreaker_complete", "Icebreaker hotov", 50)}
                disabled={awarding}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 disabled:opacity-50 transition-colors text-left"
              >
                <Zap size={14} className="text-purple-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block">Icebreaker</span>
                  <span className="text-[10px] text-purple-400 font-bold">+50</span>
                </div>
              </button>
              <button
                onClick={() => handleAwardAchievement("midnight_surprise", "Pulnocni prekvapeni", 75)}
                disabled={awarding}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 disabled:opacity-50 transition-colors text-left"
              >
                <Sparkles size={14} className="text-purple-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-300 block">Midnight</span>
                  <span className="text-[10px] text-purple-400 font-bold">+75</span>
                </div>
              </button>
              <button
                onClick={() => handleAwardAchievement("table_dance", "Table dance!", 200)}
                disabled={awarding}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-pink-500/30 hover:border-pink-500/60 disabled:opacity-50 transition-colors text-left"
              >
                <Flame size={14} className="text-pink-400 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-pink-300 block">Table Dance</span>
                  <span className="text-[10px] text-pink-400 font-bold">+200</span>
                </div>
              </button>
            </div>

            <button
              onClick={handleToggleLegendary}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                activeBlock?.type === "legendary"
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                  : "bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
              }`}
            >
              <Monitor size={14} />
              {activeBlock?.type === "legendary" ? "Skryt z platna" : "Zobrazit na platne"}
            </button>
          </div>

          {/* Program blocks */}
          {blocks.length > 0 && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 italic uppercase">
                  <LayoutList size={16} className="text-purple-400" /> Program
                </h3>
                {activeBlock && (
                  <button
                    onClick={handleDeactivateBlock}
                    className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={12} /> Deaktivovat
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const isActive = activeBlock?.id === block.id;
                  return (
                    <button
                      key={block.id}
                      onClick={() => !isActive && handleActivateBlock(block)}
                      disabled={isActive}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors group ${
                        isActive
                          ? "bg-purple-600/20 border-purple-500/50"
                          : "bg-slate-800/30 border-slate-800 hover:border-purple-500/50"
                      }`}
                    >
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                          {block.title || block.gameName || "Blok"}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-0.5 capitalize">
                          {block.block_type === "game" ? block.gameName || "Hra" : block.block_type}
                        </p>
                      </div>
                      {isActive ? (
                        <Play size={14} className="text-green-400" />
                      ) : (
                        <ChevronRight
                          size={14}
                          className="text-slate-600 group-hover:text-purple-400 transition-colors"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Game library */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 italic uppercase">
              <Gamepad2 size={16} className="text-purple-400" /> Knihovna Miniher
            </h3>
            <div className="space-y-2">
              {gamesLibrary.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleStartGame(game, true)}
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
