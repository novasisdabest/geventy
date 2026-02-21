"use client";

import { useState, useRef } from "react";
import {
  Gamepad2,
  Pencil,
  Image,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addTimelineBlockAction,
  removeTimelineBlockAction,
  reorderTimelineBlockAction,
  updateTimelineBlockAction,
  applyTimelineTemplateAction,
} from "@/app/actions/timeline";
import {
  EVENT_TYPE_LABELS,
  type EventType,
  type BlockType,
} from "@/lib/timeline-templates";
import type { Tables } from "@/lib/database.types";

interface TimelineTabProps {
  eventId: string;
  eventType: EventType;
  initialBlocks: Tables<"event_program">[];
  gamesLibrary: Tables<"games_library">[];
}

const BLOCK_TYPE_META: Record<BlockType, { icon: React.ReactNode; label: string; color: string }> = {
  game: { icon: <Gamepad2 size={14} />, label: "Hra", color: "bg-purple-500/20 text-purple-400" },
  custom: { icon: <Pencil size={14} />, label: "Vlastni", color: "bg-blue-500/20 text-blue-400" },
  slideshow: { icon: <Image size={14} />, label: "Slideshow", color: "bg-amber-500/20 text-amber-400" },
  message_wall: { icon: <MessageSquare size={14} />, label: "Nastenka", color: "bg-green-500/20 text-green-400" },
};

export default function TimelineTab({
  eventId,
  eventType,
  initialBlocks,
  gamesLibrary,
}: TimelineTabProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [applying, setApplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const totalMinutes = blocks.reduce((sum, b) => sum + (b.duration_minutes ?? 0), 0);

  async function handleApplyTemplate() {
    setApplying(true);
    const result = await applyTimelineTemplateAction(eventId, eventType);
    if (!result.error) {
      // Refetch blocks from server
      window.location.reload();
    }
    setApplying(false);
  }

  async function handleAddBlock(blockType: BlockType, gameId?: string, title?: string, duration?: number) {
    const newTitle = title ?? BLOCK_TYPE_META[blockType].label;
    const newDuration = duration ?? 10;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimistic: Tables<"event_program"> = {
      id: tempId,
      event_id: eventId,
      block_type: blockType,
      game_id: gameId ?? null,
      title: newTitle,
      duration_minutes: newDuration,
      sort_order: blocks.length,
      status: "pending",
      config: {},
      game_state: {},
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBlocks((prev) => [...prev, optimistic]);
    setShowAddPanel(false);

    const result = await addTimelineBlockAction(eventId, {
      block_type: blockType,
      game_id: gameId,
      title: newTitle,
      duration_minutes: newDuration,
    });

    if (result.error) {
      // Rollback
      setBlocks((prev) => prev.filter((b) => b.id !== tempId));
    } else if (result.block) {
      setBlocks((prev) => prev.map((b) => (b.id === tempId ? result.block : b)));
    }
  }

  async function handleRemove(blockId: string) {
    const prev = blocks;
    setBlocks((b) => b.filter((bl) => bl.id !== blockId));

    const result = await removeTimelineBlockAction(eventId, blockId);
    if (result.error) setBlocks(prev);
  }

  async function handleReorder(blockId: string, direction: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id === blockId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;

    // Optimistic swap
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    setBlocks(newBlocks);

    const result = await reorderTimelineBlockAction(eventId, blockId, direction);
    if (result.error) setBlocks(blocks);
  }

  async function handleTitleSave(blockId: string, newTitle: string) {
    setEditingId(null);
    if (!newTitle.trim()) return;

    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title: newTitle.trim() } : b))
    );

    await updateTimelineBlockAction(eventId, blockId, { title: newTitle.trim() });
  }

  async function handleDurationChange(blockId: string, value: string) {
    const mins = parseInt(value, 10);
    if (isNaN(mins) || mins < 1) return;

    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, duration_minutes: mins } : b))
    );

    await updateTimelineBlockAction(eventId, blockId, { duration_minutes: mins });
  }

  // Empty state
  if (blocks.length === 0 && !showAddPanel) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <div className="text-4xl">📋</div>
        <h3 className="text-lg font-black italic uppercase">Zadny program</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Zacni sestavovat program sve akce. Muzes pouzit sablonu pro{" "}
          <span className="text-purple-400 font-bold">{EVENT_TYPE_LABELS[eventType]}</span>{" "}
          nebo pridat bloky rucne.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {eventType !== "custom" && (
            <button
              onClick={handleApplyTemplate}
              disabled={applying}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Sparkles size={14} />
              {applying ? "Nacitam..." : `Pouzit sablonu "${EVENT_TYPE_LABELS[eventType]}"`}
            </button>
          )}
          <button
            onClick={() => setShowAddPanel(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-colors"
          >
            <Plus size={14} />
            Pridat blok rucne
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline list */}
      <div className="space-y-0">
        {blocks.map((block, idx) => {
          const meta = BLOCK_TYPE_META[block.block_type as BlockType] ?? BLOCK_TYPE_META.custom;
          const isFirst = idx === 0;
          const isLast = idx === blocks.length - 1;

          return (
            <div key={block.id} className="flex gap-4">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center pt-5">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full shrink-0 border-2",
                    block.status === "completed"
                      ? "bg-green-500 border-green-500"
                      : block.status === "active"
                        ? "bg-purple-500 border-purple-500 animate-pulse"
                        : "bg-slate-700 border-slate-600"
                  )}
                />
                {!isLast && <div className="w-0.5 flex-1 bg-slate-800 mt-1" />}
              </div>

              {/* Block card */}
              <div className="flex-1 mb-3 bg-slate-900 border border-slate-800 rounded-xl p-4 group hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2", meta.color)}>
                      {meta.icon}
                      {meta.label}
                    </span>

                    {/* Title — click to edit */}
                    {editingId === block.id ? (
                      <input
                        ref={editInputRef}
                        autoFocus
                        defaultValue={block.title ?? ""}
                        onBlur={(e) => handleTitleSave(block.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleTitleSave(block.id, e.currentTarget.value);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="block w-full bg-slate-800 border border-purple-500 rounded-lg px-2 py-1 text-sm text-white font-bold focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(block.id)}
                        className="block text-sm font-bold text-white hover:text-purple-300 transition-colors text-left truncate max-w-full"
                        title="Klikni pro upravu nazvu"
                      >
                        {block.title || "Bez nazvu"}
                      </button>
                    )}

                    {/* Duration */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-slate-600" />
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={block.duration_minutes ?? 10}
                        onChange={(e) => handleDurationChange(block.id, e.target.value)}
                        className="w-12 bg-transparent text-xs text-slate-500 border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none text-center"
                      />
                      <span className="text-xs text-slate-600">min</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleReorder(block.id, "up")}
                      disabled={isFirst}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Posunout nahoru"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleReorder(block.id, "down")}
                      disabled={isLast}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Posunout dolu"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => handleRemove(block.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors"
                      title="Odebrat blok"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add block button / panel */}
      {showAddPanel ? (
        <AddBlockPanel
          gamesLibrary={gamesLibrary}
          onAdd={handleAddBlock}
          onClose={() => setShowAddPanel(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddPanel(true)}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:border-purple-500/50 hover:text-purple-400 transition-colors font-bold text-sm"
        >
          <Plus size={16} />
          Pridat blok
        </button>
      )}

      {/* Footer — total duration */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl">
        <span className="text-xs font-bold uppercase text-slate-500">Celkem</span>
        <span className="text-sm font-bold text-white">
          {totalMinutes} min
          {totalMinutes >= 60 && (
            <span className="text-slate-500 ml-1">
              ({Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

function AddBlockPanel({
  gamesLibrary,
  onAdd,
  onClose,
}: {
  gamesLibrary: Tables<"games_library">[];
  onAdd: (type: BlockType, gameId?: string, title?: string, duration?: number) => void;
  onClose: () => void;
}) {
  const NON_GAME_TYPES: { type: BlockType; label: string; icon: React.ReactNode }[] = [
    { type: "custom", label: "Vlastni blok", icon: <Pencil size={16} /> },
    { type: "slideshow", label: "Slideshow", icon: <Image size={16} /> },
    { type: "message_wall", label: "Nastenka zprav", icon: <MessageSquare size={16} /> },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase text-slate-400">Pridat blok</h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-600 hover:text-white transition-colors"
        >
          Zrusit
        </button>
      </div>

      {/* Non-game block types */}
      <div className="grid grid-cols-3 gap-2">
        {NON_GAME_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => onAdd(type, undefined, label, 10)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-800 bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-500/5 text-slate-400 hover:text-purple-300 transition-all text-xs font-bold"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Games from library */}
      {gamesLibrary.length > 0 && (
        <>
          <div className="text-xs font-bold uppercase text-slate-600 flex items-center gap-2">
            <Gamepad2 size={12} />
            Hry z knihovny
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {gamesLibrary.map((game) => (
              <button
                key={game.id}
                onClick={() => onAdd("game", game.id, game.name, game.estimated_duration_minutes)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-800/30 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
              >
                <div>
                  <div className="text-sm font-bold text-slate-300 group-hover:text-purple-300 transition-colors">
                    {game.name}
                  </div>
                  {game.description && (
                    <div className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">
                      {game.description}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-600 font-bold shrink-0 ml-3">
                  ~{game.estimated_duration_minutes} min
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
