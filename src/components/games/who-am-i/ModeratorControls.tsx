"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, SkipForward, StopCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { useGameStore } from "@/stores/game-store";
import type { Tables } from "@/lib/database.types";

interface ModeratorControlsProps {
  programId: string;
  eventId: string;
  sendCommand: (action: string, data?: Record<string, unknown>) => void;
  attendees: Tables<"event_attendees">[];
}

interface FactSubmission {
  attendee_id: string;
  fact: string;
  display_name: string;
}

export function ModeratorControls({
  programId,
  eventId,
  sendCommand,
  attendees,
}: ModeratorControlsProps) {
  const [facts, setFacts] = useState<FactSubmission[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const phase = useGameStore((s) => s.phase);
  const votes = useGameStore((s) => s.votes);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  // Load submitted facts
  const loadFacts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await from(supabase, "game_responses")
      .select("attendee_id, payload")
      .eq("program_id", programId)
      .eq("response_type", "fact_submission")
      .eq("round_number", 0);

    if (data) {
      const rows = data as { attendee_id: string; payload: { fact: string } }[];
      const mapped: FactSubmission[] = rows.map((r) => {
        const attendee = attendees.find((a) => a.id === r.attendee_id);
        return {
          attendee_id: r.attendee_id,
          fact: r.payload.fact,
          display_name: attendee?.display_name ?? "Neznamy",
        };
      });
      // Shuffle facts
      setFacts(mapped.sort(() => Math.random() - 0.5));
    }
  }, [programId, attendees]);

  useEffect(() => {
    if (phase === "collecting") {
      const interval = setInterval(loadFacts, 3000);
      return () => clearInterval(interval);
    }
  }, [phase, loadFacts]);

  function pickRandomOptions(correctAttendeeId: string): { attendee_id: string; name: string }[] {
    const correct = attendees.find((a) => a.id === correctAttendeeId);
    const others = attendees
      .filter((a) => a.id !== correctAttendeeId)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const options = [
      { attendee_id: correctAttendeeId, name: correct?.display_name ?? "???" },
      ...others.map((a) => ({ attendee_id: a.id, name: a.display_name })),
    ].sort(() => Math.random() - 0.5);

    return options;
  }

  function handleStartCollecting() {
    sendCommand("start_collecting");
    useGameStore.getState().setPhase("collecting");
  }

  function handleStartPlaying() {
    loadFacts().then(() => {
      if (facts.length === 0) return;
      showFactAtIndex(0);
    });
  }

  function showFactAtIndex(idx: number) {
    const f = facts[idx];
    if (!f) return;

    const options = pickRandomOptions(f.attendee_id);
    setCurrentFactIndex(idx);

    sendCommand("show_fact", {
      round: idx + 1,
      total: facts.length,
      fact: f.fact,
      correct_attendee_id: f.attendee_id,
      options,
    });

    useGameStore.getState().showFact(idx + 1, facts.length, {
      fact: f.fact,
      correct_attendee_id: f.attendee_id,
      options,
    });
  }

  function handleShowResults() {
    const currentFact = facts[currentFactIndex];
    if (!currentFact) return;

    sendCommand("show_results", {
      correct_attendee_id: currentFact.attendee_id,
      votes,
    });

    useGameStore.getState().showResults(currentFact.attendee_id, votes);
  }

  function handleNextRound() {
    const nextIdx = currentFactIndex + 1;
    if (nextIdx < facts.length) {
      showFactAtIndex(nextIdx);
    } else {
      sendCommand("finish");
      useGameStore.getState().setPhase("finished");
    }
  }

  function handleFinish() {
    sendCommand("finish");
    useGameStore.getState().setPhase("finished");
  }

  return (
    <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
      <h3 className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs text-slate-500">
        <Play size={14} /> Ovladani - Kdo jsem ted?
      </h3>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Users size={14} className="text-purple-400" />
        <span>{onlinePlayers.length} online</span>
        <span className="text-slate-700">|</span>
        <span>{facts.length} faktu odesláno</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {phase === "lobby" && (
          <button
            onClick={handleStartCollecting}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            Spustit sber faktu
          </button>
        )}

        {phase === "collecting" && (
          <button
            onClick={handleStartPlaying}
            disabled={facts.length < 2}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            Spustit hru ({facts.length} faktu)
          </button>
        )}

        {phase === "voting" && (
          <button
            onClick={handleShowResults}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-green-600 text-white shadow-lg shadow-green-500/40 hover:bg-green-500 transition-colors flex items-center gap-2"
          >
            <StopCircle size={16} />
            Ukazat vysledky
          </button>
        )}

        {phase === "results" && (
          <>
            <button
              onClick={handleNextRound}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 transition-colors flex items-center gap-2"
            >
              <SkipForward size={16} />
              {currentFactIndex + 1 < facts.length
                ? `Dalsi kolo (${currentFactIndex + 2}/${facts.length})`
                : "Ukoncit hru"}
            </button>
            <button
              onClick={handleFinish}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              Ukoncit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
