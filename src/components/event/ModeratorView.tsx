"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Users, Gamepad2, Home, Play, Monitor, LayoutList, X, Flame, Trophy,
  Check, GripVertical, SkipForward, Square, Clock, Pause, Circle,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { startGameAction, activateBlockAction, advanceProgramAction, deactivateProgramAction } from "@/app/actions/program";
import { reorderTimelineBlocksBulkAction, updateBlockConfigAction } from "@/app/actions/timeline";
import { loadGameModule, type GameModuleComponents } from "@/lib/game-modules/registry";
import type { ModuleConfigField, ModerationStep } from "@/lib/game-modules/types";
import type { Tables } from "@/lib/database.types";
import type { ActiveBlock } from "@/stores/game-store";

interface ProgramBlock extends Tables<"event_program"> {
  gameSlug?: string;
  gameName?: string;
  gameAuthor?: string;
  gamePrice?: number | null;
  gameVersion?: string;
  configSchema?: ModuleConfigField[];
  moderationSteps?: ModerationStep[];
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
  eventDate?: string;
}

// -- Helpers --

function formatTime(date: Date): string {
  return date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getBlockTypeBadge(blockType: string): { label: string; className: string } {
  switch (blockType) {
    case "game":
      return { label: "Hra", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    case "slideshow":
      return { label: "Slideshow", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    case "message_wall":
      return { label: "Zpravy", className: "bg-green-500/20 text-green-400 border-green-500/30" };
    case "custom":
      return { label: "Vlastni", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    default:
      return { label: blockType, className: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  }
}

// -- Sortable block component --

function SortableBlock({
  block,
  status,
  startTime,
  endTime,
  isActive,
}: {
  block: ProgramBlock;
  status: "completed" | "active" | "pending";
  startTime: string;
  endTime: string;
  isActive: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: status !== "pending" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const badge = getBlockTypeBadge(block.block_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch gap-0 ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Grip handle */}
      <div
        className={`flex items-center px-1 shrink-0 ${
          status === "pending" ? "cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400" : "text-slate-800 cursor-default"
        }`}
        {...(status === "pending" ? { ...attributes, ...listeners } : {})}
      >
        <GripVertical size={14} />
      </div>

      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0 w-6">
        <div className="flex-1 w-px bg-slate-700" />
        <div className="shrink-0 my-1">
          {status === "completed" ? (
            <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
              <Check size={10} className="text-green-400" />
            </div>
          ) : status === "active" ? (
            <div className="w-5 h-5 rounded-full bg-purple-500/30 border-2 border-purple-400 flex items-center justify-center animate-pulse">
              <Play size={8} className="text-purple-300" />
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-600 mx-0.5" />
          )}
        </div>
        <div className="flex-1 w-px bg-slate-700" />
      </div>

      {/* Block content */}
      <div
        className={`flex-1 p-3 rounded-xl border transition-colors my-0.5 ${
          isActive
            ? "bg-purple-600/20 border-purple-500/50"
            : status === "completed"
            ? "bg-slate-800/20 border-slate-800/50 opacity-60"
            : "bg-slate-800/30 border-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-300 block truncate">
              {block.title || block.gameName || "Blok"}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.className}`}>
                {badge.label}
              </span>
              {block.duration_minutes && (
                <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                  <Clock size={9} /> {block.duration_minutes} min
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-500 tabular-nums whitespace-nowrap shrink-0">
            {startTime} — {endTime}
          </span>
        </div>
      </div>
    </div>
  );
}

// -- Main component --

export function ModeratorView({
  event,
  liveCode,
  attendees,
  gamesLibrary,
  blocks: initialBlocks,
  initialProgramId,
  initialAchievements,
  initialScore,
  eventDate,
}: ModeratorViewProps) {
  const [programId, setProgramId] = useState<string | null>(initialProgramId);
  const [activeGameSlug, setActiveGameSlug] = useState<string | null>(
    initialProgramId ? "who-am-i" : null
  );
  const [showLegend, setShowLegend] = useState(false);
  const [blocks, setBlocks] = useState<ProgramBlock[]>(initialBlocks);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancingRef = useRef(false);

  // Dynamic game module
  const [loadedModule, setLoadedModule] = useState<GameModuleComponents | null>(null);
  const [loadedModuleSlug, setLoadedModuleSlug] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [blockConfig, setBlockConfig] = useState<Record<string, unknown>>({});

  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const legendaryScore = useGameStore((s) => s.legendaryScore);
  const achievements = useGameStore((s) => s.achievements);
  const activeBlock = useGameStore((s) => s.activeBlock);

  // Derive program state from blocks
  const activeBlockData = blocks.find((b) => b.status === "active");
  const hasActiveBlock = !!activeBlockData;
  const hasPendingBlocks = blocks.some((b) => b.status === "pending");
  const programRunning = hasActiveBlock;
  const programFinished = blocks.length > 0 && blocks.every((b) => b.status === "completed");

  useEffect(() => {
    if (initialProgramId) {
      useGameStore.getState().setEventContext(event.id, initialProgramId);
    }
    if (initialAchievements && initialAchievements.length > 0) {
      useGameStore.getState().setAchievements(initialAchievements, initialScore ?? 0);
    }
  }, [event.id, initialProgramId, initialAchievements, initialScore]);

  // Load game module dynamically when slug changes
  useEffect(() => {
    if (!activeGameSlug || activeGameSlug === loadedModuleSlug) return;
    let cancelled = false;
    loadGameModule(activeGameSlug).then((mod) => {
      if (!cancelled && mod) {
        setLoadedModule(mod);
        setLoadedModuleSlug(activeGameSlug);
      }
    });
    return () => { cancelled = true; };
  }, [activeGameSlug, loadedModuleSlug]);

  // Sync config from active block
  useEffect(() => {
    const active = blocks.find((b) => b.status === "active");
    if (active) {
      const cfg = (active.config ?? {}) as Record<string, unknown>;
      setBlockConfig(cfg);
      const gs = (active.game_state ?? {}) as Record<string, unknown>;
      setCompletedSteps((gs.completedSteps as number[]) ?? []);
    }
  }, [blocks]);

  const { sendCommand } = useEventChannel({
    eventId: event.id,
    attendeeId: "moderator",
    displayName: "Moderator",
    isModerator: true,
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // -- Computed times --
  function computeBlockTimes(): { startTime: string; endTime: string }[] {
    let cursor: Date;

    // Use the first block's started_at if available, otherwise use eventDate, otherwise now
    const firstStarted = blocks.find((b) => b.started_at);
    if (firstStarted?.started_at) {
      cursor = new Date(firstStarted.started_at);
    } else if (eventDate) {
      cursor = new Date(eventDate);
    } else {
      cursor = new Date();
    }

    return blocks.map((block) => {
      const start = new Date(cursor);
      const duration = (block.duration_minutes ?? 10) * 60 * 1000;
      const end = new Date(cursor.getTime() + duration);
      cursor = end;
      return { startTime: formatTime(start), endTime: formatTime(end) };
    });
  }

  const blockTimes = computeBlockTimes();

  // -- Elapsed timer for active block --
  useEffect(() => {
    if (!activeBlockData?.started_at || isPaused) {
      return;
    }

    function tick() {
      const started = new Date(activeBlockData!.started_at!).getTime();
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeBlockData?.started_at, isPaused]);

  // -- Auto-advance timer --
  const handleAdvanceProgram = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    const result = await advanceProgramAction(event.id);

    if (result.error) {
      advancingRef.current = false;
      return;
    }

    if (result.finished) {
      // Program complete
      sendCommand("block_deactivate");
      useGameStore.getState().clearActiveBlock();
      useGameStore.getState().reset();
      setBlocks((prev) => prev.map((b) => b.status === "active" ? { ...b, status: "completed" as const, completed_at: new Date().toISOString() } : b));
      setElapsedSeconds(0);
      advancingRef.current = false;
      return;
    }

    if (result.block) {
      const newBlock = result.block;
      // Update local blocks state
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.status === "active") return { ...b, status: "completed" as const, completed_at: new Date().toISOString() };
          if (b.id === newBlock.id) return { ...b, status: "active" as const, started_at: newBlock.started_at };
          return b;
        })
      );

      // Find game slug for the new block
      const matchingBlock = blocks.find((b) => b.id === newBlock.id);
      const blockType = (newBlock.block_type || "custom") as ActiveBlock["type"];
      const payload: Record<string, unknown> = {
        id: newBlock.id,
        type: blockType,
        title: newBlock.title || "Blok",
        gameSlug: matchingBlock?.gameSlug,
        config: newBlock.config as Record<string, unknown> | undefined,
      };

      // For game blocks, also start the game in DB
      if (blockType === "game" && newBlock.game_id) {
        const game = gamesLibrary.find((g) => g.id === newBlock.game_id);
        if (game) {
          const gameResult = await startGameAction(event.id, game.id);
          if (!gameResult.error && gameResult.programId) {
            setProgramId(gameResult.programId);
            setActiveGameSlug(game.slug);
            useGameStore.getState().setEventContext(event.id, gameResult.programId);
          }
          payload.gameSlug = game.slug;
        }
      }

      sendCommand("block_activate", payload);
      useGameStore.getState().setActiveBlock({
        id: newBlock.id,
        type: blockType,
        title: newBlock.title || "Blok",
        gameSlug: matchingBlock?.gameSlug,
        config: newBlock.config as Record<string, unknown> | undefined,
      });
      setElapsedSeconds(0);
    }

    advancingRef.current = false;
  }, [event.id, blocks, gamesLibrary, sendCommand]);

  useEffect(() => {
    if (!activeBlockData?.started_at || !activeBlockData.duration_minutes || isPaused) {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
      return;
    }

    const durationMs = activeBlockData.duration_minutes * 60 * 1000;

    autoAdvanceRef.current = setInterval(() => {
      const started = new Date(activeBlockData.started_at!).getTime();
      const elapsed = Date.now() - started;
      if (elapsed >= durationMs) {
        handleAdvanceProgram();
      }
    }, 1000);

    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [activeBlockData?.id, activeBlockData?.started_at, activeBlockData?.duration_minutes, isPaused, handleAdvanceProgram]);

  // -- Auto-start if event_date is in the past --
  useEffect(() => {
    if (!eventDate) return;
    if (blocks.length === 0) return;

    const eventTime = new Date(eventDate).getTime();
    if (eventTime > Date.now()) return;

    // Check if any block is active or completed
    const hasStarted = blocks.some((b) => b.status === "active" || b.status === "completed");
    if (hasStarted) return;

    // Auto-start the first pending block
    handleStartProgram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Handlers --

  async function handleStartProgram() {
    const firstPending = blocks.find((b) => b.status === "pending");
    if (!firstPending) return;

    const result = await activateBlockAction(event.id, firstPending.id);
    if (result.error) return;

    setBlocks((prev) =>
      prev.map((b) =>
        b.id === firstPending.id
          ? { ...b, status: "active" as const, started_at: new Date().toISOString() }
          : b
      )
    );

    const blockType = (firstPending.block_type || "custom") as ActiveBlock["type"];
    const payload: Record<string, unknown> = {
      id: firstPending.id,
      type: blockType,
      title: firstPending.title || "Blok",
      gameSlug: firstPending.gameSlug,
      config: firstPending.config as Record<string, unknown> | undefined,
    };

    // For game blocks, also start the game in DB
    if (blockType === "game" && firstPending.game_id) {
      const game = gamesLibrary.find((g) => g.id === firstPending.game_id);
      if (game) {
        const gameResult = await startGameAction(event.id, game.id);
        if (!gameResult.error && gameResult.programId) {
          setProgramId(gameResult.programId);
          setActiveGameSlug(game.slug);
          useGameStore.getState().setEventContext(event.id, gameResult.programId);
        }
        payload.gameSlug = game.slug;
      }
    }

    sendCommand("block_activate", payload);
    useGameStore.getState().setActiveBlock({
      id: firstPending.id,
      type: blockType,
      title: firstPending.title || "Blok",
      gameSlug: firstPending.gameSlug,
      config: firstPending.config as Record<string, unknown> | undefined,
    });
    setElapsedSeconds(0);
  }

  async function handleStopProgram() {
    await deactivateProgramAction(event.id);
    sendCommand("block_deactivate");
    useGameStore.getState().clearActiveBlock();
    useGameStore.getState().reset();
    setBlocks((prev) =>
      prev.map((b) => b.status === "active" ? { ...b, status: "completed" as const, completed_at: new Date().toISOString() } : b)
    );
    setElapsedSeconds(0);
    setIsPaused(false);
  }

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

  function handleDeactivateBlock() {
    sendCommand("block_deactivate");
    useGameStore.getState().clearActiveBlock();
    useGameStore.getState().reset();
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

  async function handleDragEnd(dragEvent: DragEndEvent) {
    const { active, over } = dragEvent;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);

    await reorderTimelineBlocksBulkAction(
      event.id,
      reordered.map((b) => b.id)
    );
  }

  // Active block elapsed / remaining
  const activeDuration = activeBlockData?.duration_minutes
    ? activeBlockData.duration_minutes * 60
    : null;
  const remainingSeconds = activeDuration ? Math.max(0, activeDuration - elapsedSeconds) : null;
  const progressPercent = activeDuration
    ? Math.min(100, (elapsedSeconds / activeDuration) * 100)
    : 0;

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
          {/* Projector preview — uses loaded module or fallback */}
          {loadedModule && activeGameSlug ? (
            <loadedModule.ProjectorScreen eventSlug={event.slug} />
          ) : (
            <div className="aspect-video bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-50" />
              <div className="z-10 text-center">
                <Gamepad2 size={48} className="mx-auto mb-4 text-slate-700" />
                <p className="text-slate-600 text-sm">Zadna hra neni aktivni</p>
              </div>
            </div>
          )}

          {/* Dynamic game moderator controls */}
          {programId && activeGameSlug && loadedModule && (
            <loadedModule.ModeratorControls
              programId={programId}
              eventId={event.id}
              sendCommand={sendCommand}
              attendees={attendees}
              config={blockConfig}
            />
          )}

          {/* Active block metadata + config + checklist */}
          {activeBlockData && (() => {
            const activeBlockMeta = blocks.find((b) => b.id === activeBlockData.id);
            const schema = activeBlockMeta?.configSchema ?? [];
            const steps = activeBlockMeta?.moderationSteps ?? [];
            const author = activeBlockMeta?.gameAuthor;
            const price = activeBlockMeta?.gamePrice;
            const version = activeBlockMeta?.gameVersion;

            if (!author && schema.length === 0 && steps.length === 0) return null;

            return (
              <div className="space-y-3">
                {/* Marketplace metadata */}
                {author && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-800">
                    <span className="text-[10px] text-slate-500">{author}</span>
                    {version && (
                      <span className="text-[9px] text-slate-600 ml-auto">v{version}</span>
                    )}
                    {price != null && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </div>
                )}

                {/* Config editor */}
                {schema.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Nastaveni
                    </h4>
                    {schema.map((field) => {
                      const value = blockConfig[field.id] ?? field.defaultValue;
                      return (
                        <div key={field.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-800/30 border border-slate-800">
                          <label className="text-[11px] text-slate-400">{field.label}</label>
                          {field.type === "boolean" ? (
                            <button
                              onClick={async () => {
                                const next = { ...blockConfig, [field.id]: !value };
                                setBlockConfig(next);
                                await updateBlockConfigAction(event.id, activeBlockData.id, next);
                              }}
                              className={`w-8 h-4 rounded-full transition-colors relative ${
                                value ? "bg-purple-500" : "bg-slate-700"
                              }`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                                value ? "left-4.5 translate-x-0.5" : "left-0.5"
                              }`} />
                            </button>
                          ) : field.type === "select" ? (
                            <select
                              value={String(value)}
                              onChange={async (e) => {
                                const next = { ...blockConfig, [field.id]: e.target.value };
                                setBlockConfig(next);
                                await updateBlockConfigAction(event.id, activeBlockData.id, next);
                              }}
                              className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-[11px] text-white"
                            >
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              value={String(value)}
                              onChange={(e) => {
                                const val = field.type === "number" ? Number(e.target.value) : e.target.value;
                                setBlockConfig({ ...blockConfig, [field.id]: val });
                              }}
                              onBlur={async () => {
                                await updateBlockConfigAction(event.id, activeBlockData.id, blockConfig);
                              }}
                              className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-[11px] text-white text-right"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Moderation checklist */}
                {steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Postup moderatora
                    </h4>
                    {steps.map((step) => {
                      const done = completedSteps.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          onClick={async () => {
                            const next = done
                              ? completedSteps.filter((s) => s !== step.id)
                              : [...completedSteps, step.id];
                            setCompletedSteps(next);
                            const supabase = (await import("@/lib/supabase/client")).createClient();
                            const { from: fromTyped } = await import("@/lib/supabase/typed");
                            const currentState = (activeBlockData.game_state ?? {}) as Record<string, unknown>;
                            await fromTyped(supabase, "event_program")
                              .update({ game_state: { ...currentState, completedSteps: next } })
                              .eq("id", activeBlockData.id);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${
                            done
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-slate-800/30 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                            done ? "bg-green-500 border-green-500" : "border-slate-600"
                          }`}>
                            {done && <Check size={10} className="text-white" />}
                          </div>
                          <span className={`text-[11px] ${
                            done ? "text-green-400 line-through" : "text-slate-400"
                          }`}>
                            {step.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {!programId && !programRunning && (
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center text-sm text-slate-500">
              Spust program nebo vyber minihru z knihovny na pravo.
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
              <button
                onClick={() => setShowLegend(true)}
                className="text-2xl font-black italic text-purple-400 tabular-nums hover:text-purple-300 transition-colors"
                title="Jak ziskat body"
              >
                {legendaryScore}
              </button>
            </div>

            <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
              {achievements.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-3">Zatim zadne body.</p>
              ) : (
                [...achievements].reverse().map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-300 block truncate">
                        {a.title}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(a.awarded_at).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-xs font-black text-purple-400 tabular-nums shrink-0">
                      +{a.points}
                    </span>
                  </div>
                ))
              )}
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

          {/* Program timeline */}
          {blocks.length > 0 && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2 italic uppercase">
                  <LayoutList size={16} className="text-purple-400" /> Program
                </h3>
                {programFinished && (
                  <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                    <Check size={12} /> Dokonceno
                  </span>
                )}
              </div>

              {/* Program controls */}
              <div className="mb-4 space-y-2">
                {!programRunning && !programFinished && hasPendingBlocks && (
                  <button
                    onClick={handleStartProgram}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    <Play size={14} /> Spustit program
                  </button>
                )}

                {programRunning && (
                  <>
                    {/* Active block info bar */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                          <Circle size={8} className="fill-purple-400" /> Prave hraje
                        </span>
                        <span className="text-xs font-black tabular-nums text-white">
                          {formatElapsed(elapsedSeconds)}
                          {activeDuration && (
                            <span className="text-slate-500"> / {formatElapsed(activeDuration)}</span>
                          )}
                        </span>
                      </div>
                      {activeDuration && (
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              progressPercent >= 100 ? "bg-red-500" : progressPercent >= 80 ? "bg-amber-500" : "bg-purple-500"
                            }`}
                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                          />
                        </div>
                      )}
                      {remainingSeconds !== null && remainingSeconds <= 0 && (
                        <p className="text-[10px] text-red-400 font-bold mt-1.5">
                          Cas vyprsel — automaticky prechod
                        </p>
                      )}
                    </div>

                    {/* Control buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        {isPaused ? <Play size={12} /> : <Pause size={12} />}
                        {isPaused ? "Pokracovat" : "Pozastavit"}
                      </button>
                      {hasPendingBlocks && (
                        <button
                          onClick={handleAdvanceProgram}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          <SkipForward size={12} /> Dalsi blok
                        </button>
                      )}
                      <button
                        onClick={handleStopProgram}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        <Square size={10} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Sortable timeline blocks */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0">
                    {blocks.map((block, i) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        status={block.status as "completed" | "active" | "pending"}
                        startTime={blockTimes[i]?.startTime ?? "--:--"}
                        endTime={blockTimes[i]?.endTime ?? "--:--"}
                        isActive={activeBlock?.id === block.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                        {game.name}
                      </span>
                      {game.price != null && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          PRO
                        </span>
                      )}
                    </div>
                    {game.description && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{game.description}</p>
                    )}
                    <p className="text-[9px] text-slate-700 mt-0.5">{game.author}</p>
                  </div>
                  {programId && activeGameSlug === game.slug ? (
                    <Play size={14} className="text-green-400" />
                  ) : (
                    <Gamepad2
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

      {/* Scoring legend modal */}
      {showLegend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLegend(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-black italic uppercase text-sm flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" /> Jak ziskat body
              </h3>
              <button
                onClick={() => setShowLegend(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { action: "Pripojeni na event", points: 10, active: true },
                { action: "Odeslani zpravy", points: 5, active: true },
                { action: "Nahrani fotky", points: 15, active: true },
                { action: "Ucast v minihre", points: 20, active: true },
                { action: "Spravna odpoved v kvizu", points: 25, active: false },
                { action: "Vitezstvi v minihre", points: 50, active: false },
              ].map((item) => (
                <div
                  key={item.action}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                    item.active
                      ? "bg-slate-800/50 border-slate-800"
                      : "bg-slate-800/20 border-slate-800/50 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${item.active ? "text-slate-300" : "text-slate-500"}`}>
                      {item.action}
                    </span>
                    {!item.active && (
                      <span className="text-[9px] font-bold text-slate-600 uppercase">brzy</span>
                    )}
                  </div>
                  <span className={`text-sm font-black tabular-nums ${item.active ? "text-purple-400" : "text-slate-600"}`}>
                    +{item.points}
                  </span>
                </div>
              ))}
            </div>
            <p className="px-5 pb-4 text-[10px] text-slate-600">
              Body se pridavaji automaticky. Moderator nema moznost skore menit.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
