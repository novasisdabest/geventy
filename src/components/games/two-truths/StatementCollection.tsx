"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { useGameStore } from "@/stores/game-store";

interface StatementCollectionProps {
  programId: string;
  attendeeId: string;
}

export function StatementCollection({ programId, attendeeId }: StatementCollectionProps) {
  const [statements, setStatements] = useState(["", "", ""]);
  const [lieIndex, setLieIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const myFactSubmitted = useGameStore((s) => s.myFactSubmitted);
  const setMyFactSubmitted = useGameStore((s) => s.setMyFactSubmitted);

  function updateStatement(index: number, value: string) {
    setStatements((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const allFilled = statements.every((s) => s.trim().length > 0);
  const canSubmit = allFilled && lieIndex !== null && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await from(supabase, "game_responses").insert({
      program_id: programId,
      attendee_id: attendeeId,
      response_type: "statement_submission",
      payload: {
        statements: statements.map((s) => s.trim()),
        lie_index: lieIndex,
      },
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
          Tva tvrzeni byla ulozena. Cekej, az moderator spusti hlasovani.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-2 border-purple-600/50 rounded-2xl p-6">
      <h3 className="text-lg font-black italic uppercase mb-2">
        Dve pravdy, jedna lez
      </h3>
      <p className="text-slate-400 text-sm mb-4">
        Napis 3 tvrzeni o sobe — 2 pravdiva a 1 lez. Oznac, ktere je lez.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {statements.map((stmt, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLieIndex(i)}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  lieIndex === i
                    ? "border-red-500 bg-red-500/20"
                    : "border-slate-600 hover:border-slate-400"
                }`}
              >
                {lieIndex === i && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tvrzeni {i + 1}
                {lieIndex === i && (
                  <span className="text-red-400 ml-1">— LEZ</span>
                )}
              </span>
            </div>
            <textarea
              value={stmt}
              onChange={(e) => updateStatement(i, e.target.value)}
              placeholder={`Napis tvrzeni ${i + 1}...`}
              maxLength={200}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        ))}

        {lieIndex === null && allFilled && (
          <p className="text-xs text-amber-400 font-bold">
            Klikni na kolecko u tvrzeni, ktere je lez.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Send size={16} />
          {submitting ? "Odesilam..." : "Odeslat tvrzeni"}
        </button>
      </form>
    </div>
  );
}
