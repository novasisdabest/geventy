"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, MessageSquare, Home, Users } from "lucide-react";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { FactCollection } from "@/components/games/who-am-i/FactCollection";
import { VotingScreen } from "@/components/games/who-am-i/VotingScreen";
import { ResultsScreen } from "@/components/games/who-am-i/ResultsScreen";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";

interface PlayerViewProps {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  attendee: {
    id: string;
    display_name: string;
  };
}

export function PlayerView({ event, attendee }: PlayerViewProps) {
  const [programId, setProgramId] = useState<string | null>(null);
  const phase = useGameStore((s) => s.phase);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  useEffect(() => {
    async function loadProgram() {
      const supabase = createClient();
      const { data: programs } = await from(supabase, "event_program")
        .select("id")
        .eq("event_id", event.id)
        .in("status", ["pending", "active"])
        .order("sort_order")
        .limit(1);

      const pid = programs?.[0]?.id;
      if (pid) {
        setProgramId(pid);
        useGameStore.getState().setEventContext(event.id, pid);
      }
    }
    loadProgram();
  }, [event.id]);

  const { sendVote } = useEventChannel({
    eventId: event.id,
    attendeeId: attendee.id,
    displayName: attendee.display_name,
  });

  function handleVote(votedForAttendeeId: string) {
    useGameStore.getState().castVote(votedForAttendeeId);
    sendVote(votedForAttendeeId);

    if (programId) {
      const supabase = createClient();
      from(supabase, "game_responses")
        .insert({
          program_id: programId,
          attendee_id: attendee.id,
          response_type: "vote",
          payload: { voted_for: votedForAttendeeId },
          round_number: useGameStore.getState().currentRound,
        })
        .then(() => {});
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <Home size={14} /> ZPET
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          {event.slug.toUpperCase()}
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6 py-4">
        {phase === "lobby" && (
          <div className="bg-slate-900 border-2 border-purple-600 rounded-2xl p-6 text-center shadow-xl shadow-purple-900/20">
            <h2 className="text-2xl font-black italic mb-2">PRIPOJEN!</h2>
            <p className="text-slate-400 text-sm">
              Cekej na moderatora, az spusti dalsi hru...
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Users size={14} />
              {onlinePlayers.length} online
            </div>
          </div>
        )}

        {phase === "collecting" && programId && (
          <FactCollection programId={programId} attendeeId={attendee.id} />
        )}

        {phase === "voting" && <VotingScreen onVote={handleVote} />}

        {phase === "results" && <ResultsScreen />}

        {phase === "finished" && (
          <div className="bg-slate-900 border-2 border-green-600/50 rounded-2xl p-8 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-black italic uppercase mb-2">
              Hra skoncila!
            </h3>
            <p className="text-slate-400 text-sm">Dekujeme za ucast.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <Trophy size={24} className="mx-auto mb-2 text-yellow-500" />
            <div className="text-xl font-black">0</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Body</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <MessageSquare size={24} className="mx-auto mb-2 text-blue-500" />
            <div className="text-xl font-black">{onlinePlayers.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Online</div>
          </div>
        </div>
      </div>
    </>
  );
}
