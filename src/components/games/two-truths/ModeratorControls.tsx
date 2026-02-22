"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, SkipForward, StopCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import { useGameStore } from "@/stores/game-store";
import type { Tables } from "@/lib/database.types";
import type { StatementSubmission, TwoTruthsRoundData } from "./types";

interface ModeratorControlsProps {
  programId: string;
  eventId: string;
  sendCommand: (action: string, data?: Record<string, unknown>) => void;
  attendees: Tables<"event_attendees">[];
  config: Record<string, unknown>;
}

export function ModeratorControls({
  programId,
  eventId,
  sendCommand,
  attendees,
}: ModeratorControlsProps) {
  const [submissions, setSubmissions] = useState<StatementSubmission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const phase = useGameStore((s) => s.phase);
  const votes = useGameStore((s) => s.votes);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  const loadSubmissions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await from(supabase, "game_responses")
      .select("attendee_id, payload")
      .eq("program_id", programId)
      .eq("response_type", "statement_submission")
      .eq("round_number", 0);

    if (data) {
      const rows = data as {
        attendee_id: string;
        payload: { statements: string[]; lie_index: number };
      }[];
      const mapped: StatementSubmission[] = rows.map((r) => {
        const attendee = attendees.find((a) => a.id === r.attendee_id);
        return {
          attendee_id: r.attendee_id,
          display_name: attendee?.display_name ?? "Neznamy",
          statements: r.payload.statements,
          lie_index: r.payload.lie_index,
        };
      });
      // Shuffle submissions
      setSubmissions(mapped.sort(() => Math.random() - 0.5));
    }
  }, [programId, attendees]);

  useEffect(() => {
    if (phase === "collecting") {
      const interval = setInterval(loadSubmissions, 3000);
      return () => clearInterval(interval);
    }
  }, [phase, loadSubmissions]);

  function handleStartCollecting() {
    sendCommand("start_collecting");
    useGameStore.getState().setPhase("collecting");
  }

  function handleStartPlaying() {
    loadSubmissions().then(() => {
      if (submissions.length === 0) return;
      showRound(0);
    });
  }

  function showRound(idx: number) {
    const sub = submissions[idx];
    if (!sub) return;

    setCurrentIndex(idx);

    const roundData: TwoTruthsRoundData = {
      statements: sub.statements,
      correct_lie_index: sub.lie_index,
      player_name: sub.display_name,
      player_id: sub.attendee_id,
      round: idx + 1,
      total: submissions.length,
    };

    // Send round data to all players — hide correct_lie_index from broadcast
    sendCommand("game_round", {
      ...roundData,
      correct_lie_index: -1, // hidden from players
      phase: "voting",
    });

    useGameStore.getState().setGameRoundData(roundData as unknown as Record<string, unknown>);
    useGameStore.getState().setPhase("voting");
    useGameStore.getState().updateVotes({});
  }

  function handleShowResults() {
    const sub = submissions[currentIndex];
    if (!sub) return;

    const roundData: TwoTruthsRoundData = {
      statements: sub.statements,
      correct_lie_index: sub.lie_index,
      player_name: sub.display_name,
      player_id: sub.attendee_id,
      round: currentIndex + 1,
      total: submissions.length,
    };

    sendCommand("game_results", {
      ...roundData,
      votes,
    });

    useGameStore.getState().setGameRoundData(roundData as unknown as Record<string, unknown>);
    useGameStore.getState().showResults("", votes);
  }

  function handleNextRound() {
    const nextIdx = currentIndex + 1;
    if (nextIdx < submissions.length) {
      showRound(nextIdx);
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
        <Play size={14} /> Ovladani - Dve pravdy, jedna lez
      </h3>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Users size={14} className="text-purple-400" />
        <span>{onlinePlayers.length} online</span>
        <span className="text-slate-700">|</span>
        <span>{submissions.length} tvrzeni odesláno</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {phase === "lobby" && (
          <button
            onClick={handleStartCollecting}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            Spustit sber tvrzeni
          </button>
        )}

        {phase === "collecting" && (
          <button
            onClick={handleStartPlaying}
            disabled={submissions.length < 2}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-purple-600 text-white shadow-lg shadow-purple-500/40 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 transition-colors flex items-center gap-2"
          >
            <Play size={16} />
            Spustit hru ({submissions.length} hracu)
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
              {currentIndex + 1 < submissions.length
                ? `Dalsi kolo (${currentIndex + 2}/${submissions.length})`
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
