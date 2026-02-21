"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  PartyPopper,
  Cake,
  Briefcase,
  GraduationCap,
  Settings,
  Copy,
  Check,
  Save,
  Trash2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateEventAction, deleteEventAction } from "@/app/actions/events";
import {
  EVENT_TYPE_LABELS,
  SERIOUSNESS_LABELS,
  type EventType,
} from "@/lib/timeline-templates";
import type { Tables } from "@/lib/database.types";

interface EventConfigTabProps {
  event: Tables<"events">;
  onEventUpdate: (updated: Partial<Tables<"events">>) => void;
}

const EVENT_TYPES: { type: EventType; icon: React.ReactNode }[] = [
  { type: "silvestr", icon: <PartyPopper size={20} /> },
  { type: "birthday", icon: <Cake size={20} /> },
  { type: "company", icon: <Briefcase size={20} /> },
  { type: "reunion", icon: <GraduationCap size={20} /> },
  { type: "custom", icon: <Settings size={20} /> },
];

const AI_TIPS: Record<number, string> = {
  1: "Priprav se na divoke odpovedi! AI bude tolerantni k humoru na hrane.",
  2: "Uvolnena atmosfera — AI necha projit vetsi humor, ale stale bude filtrovat extremy.",
  3: "Vybalancovany rezim — AI se postara o to, aby zabava byla pro vsechny.",
  4: "Slusna akce — AI bude moderovat ostrejsi humor a udrzovat profesionalni ton.",
  5: "Formalni rezim — AI bude striktne filtrovat nevhodny obsah a udrzovat seriozni atmosferu.",
};

export default function EventConfigTab({ event, onEventUpdate }: EventConfigTabProps) {
  const [eventType, setEventType] = useState<EventType>(event.event_type as EventType);
  const [seriousness, setSeriousness] = useState(event.seriousness_level);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}/event/${event.slug}`
    : "";

  const autoSave = useCallback(
    (fields: Record<string, string>) => {
      const formData = new FormData();
      formData.set("title", event.title);
      Object.entries(fields).forEach(([k, v]) => formData.set(k, v));
      updateEventAction(event.id, formData);
    },
    [event.id, event.title]
  );

  function handleTypeChange(type: EventType) {
    setEventType(type);
    onEventUpdate({ event_type: type });
    autoSave({ event_type: type });
  }

  function handleSeriousnessChange(value: number) {
    setSeriousness(value);
    onEventUpdate({ seriousness_level: value });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      autoSave({ seriousness_level: String(value) });
    }, 500);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set("event_type", eventType);
    formData.set("seriousness_level", String(seriousness));
    const result = await updateEventAction(event.id, formData);

    if (result?.error) setError(result.error);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Opravdu smazat tuto akci? Toto nelze vzit zpet.")) return;
    await deleteEventAction(event.id);
  }

  const level = SERIOUSNESS_LABELS[seriousness];

  return (
    <div className="space-y-6">
      {/* Section A: Event Type Picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-black italic uppercase">Typ akce</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EVENT_TYPES.map(({ type, icon }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-bold",
                eventType === type
                  ? "border-purple-500 bg-purple-500/10 text-purple-300"
                  : "border-slate-800 bg-slate-800/50 text-slate-500 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              {icon}
              {EVENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Section B: Seriousness Slider */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black italic uppercase">Serioznost</h2>
          <span className="text-slate-600 text-xs font-bold">LVL {seriousness}</span>
        </div>
        <div className="space-y-3">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={seriousness}
            onChange={(e) => handleSeriousnessChange(Number(e.target.value))}
            className="w-full accent-purple-500 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/30"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-bold uppercase px-1">
            <span>Chaos</span>
            <span>Seriozni</span>
          </div>
          <div className="text-center">
            <div className={cn("text-xl font-black", level.color)}>{level.label}</div>
            <div className="text-sm text-slate-500">{level.description}</div>
          </div>
        </div>
      </div>

      {/* Section D: AI Tip Card */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5 flex gap-4">
        <Sparkles size={20} className="text-purple-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">AI Tip</div>
          <p className="text-sm text-slate-300">{AI_TIPS[seriousness]}</p>
        </div>
      </div>

      {/* Section C: Basic Info Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-black italic uppercase">Zakladni informace</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nazev
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={event.title}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Popis
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={event.description ?? ""}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="event_date" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Datum
          </label>
          <input
            id="event_date"
            name="event_date"
            type="datetime-local"
            defaultValue={event.event_date?.slice(0, 16) ?? ""}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Share link */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Odkaz pro hrace
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={eventUrl}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(eventUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Save size={14} />
            {saving ? "Ukladam..." : "Ulozit"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={14} />
            Smazat
          </button>
        </div>
      </form>
    </div>
  );
}
