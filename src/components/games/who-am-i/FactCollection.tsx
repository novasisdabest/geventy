"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { useGameStore } from "@/stores/game-store";

interface FactCollectionProps {
  programId: string;
  attendeeId: string;
}

export function FactCollection({ programId, attendeeId }: FactCollectionProps) {
  const [fact, setFact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const myFactSubmitted = useGameStore((s) => s.myFactSubmitted);
  const setMyFactSubmitted = useGameStore((s) => s.setMyFactSubmitted);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fact.trim() || submitting) return;

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await from(supabase, "game_responses").insert({
      program_id: programId,
      attendee_id: attendeeId,
      response_type: "fact_submission",
      payload: { fact: fact.trim() },
      round_number: 0,
    });

    setSubmitting(false);

    if (!error) {
      setMyFactSubmitted(true);
    }
  }

  if (myFactSubmitted) {
    return (
      <div className="bg-slate-900 border-2 border-green-600/50 rounded-2xl p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-black italic uppercase mb-2">Odeslano!</h3>
        <p className="text-slate-400 text-sm">
          Tvuj fakt byl ulozeny. Cekej, az moderator spusti hru.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-2 border-purple-600/50 rounded-2xl p-6">
      <h3 className="text-lg font-black italic uppercase mb-2">
        Napis zajimavy fakt o sobe
      </h3>
      <p className="text-slate-400 text-sm mb-4">
        Neco, co o tobe ostatni nevi. Ostatni budou hadat, kdo to napsal.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder='Napr. "Uz jsem byl ve 30 zemich" ...'
          maxLength={200}
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
        />
        <button
          type="submit"
          disabled={!fact.trim() || submitting}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitting ? "Odesilam..." : "Odeslat fakt"}
        </button>
      </form>
    </div>
  );
}
