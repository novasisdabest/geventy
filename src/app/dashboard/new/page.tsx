"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createEventAction } from "@/app/actions/events";

export default function NewEventPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createEventAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Zpet na prehled
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-black italic uppercase tracking-tight">
          Nova akce
        </h1>
        <p className="text-sm text-slate-400">
          Vytvor event a zacni zvat hosty.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nazev akce *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={100}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Napr. Narozeniny u Petra"
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
            maxLength={500}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            placeholder="Co se bude dit, dress code, co prinest..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="event_date" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Datum a cas
          </label>
          <input
            id="event_date"
            name="event_date"
            type="datetime-local"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors [color-scheme:dark]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {loading ? "Vytvarim..." : "Vytvorit akci"}
        </button>
      </form>
    </div>
  );
}
