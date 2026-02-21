"use client";

import { useEffect, useState, use } from "react";
import { Shell } from "@/components/layout/Shell";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { FactCollection } from "@/components/games/who-am-i/FactCollection";
import { VotingScreen } from "@/components/games/who-am-i/VotingScreen";
import { ResultsScreen } from "@/components/games/who-am-i/ResultsScreen";
import { createClient } from "@/lib/supabase/client";
import {
  Trophy,
  MessageSquare,
  Home,
  Users,
} from "lucide-react";
import Link from "next/link";

// For the PoC, generate a temporary attendee identity
function getOrCreateAttendeeId(): { id: string; name: string } {
  if (typeof window === "undefined") return { id: "ssr", name: "SSR" };

  const stored = localStorage.getItem("geventy_attendee");
  if (stored) return JSON.parse(stored);

  const names = ["Jana", "Petr", "Lukas", "Marie", "Tomas", "Eva", "Jakub", "Anna", "Filip", "Tereza"];
  const name = names[Math.floor(Math.random() * names.length)];
  const id = crypto.randomUUID();
  const attendee = { id, name: `${name}-${id.slice(0, 4)}` };
  localStorage.setItem("geventy_attendee", JSON.stringify(attendee));
  return attendee;
}

export default function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [attendee, setAttendee] = useState<{ id: string; name: string } | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const phase = useGameStore((s) => s.phase);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  useEffect(() => {
    setAttendee(getOrCreateAttendeeId());
  }, []);

  // Load active program for this event
  useEffect(() => {
    async function loadProgram() {
      const supabase = createClient();
      const { data: eventsData } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug);

      const eid = (eventsData as { id: string }[] | null)?.[0]?.id;
      if (!eid) return;

      const { data: programs } = await supabase
        .from("event_program")
        .select("id")
        .eq("event_id", eid)
        .in("status", ["pending", "active"])
        .order("sort_order")
        .limit(1);

      const pid = (programs as { id: string }[] | null)?.[0]?.id;
      if (pid) {
        setProgramId(pid);
        useGameStore.getState().setEventContext(eid, pid);
      }
    }
    loadProgram();
  }, [slug]);

  const { sendVote } = useEventChannel({
    eventId: slug, // For PoC we use slug as channel ID
    attendeeId: attendee?.id ?? "loading",
    displayName: attendee?.name ?? "...",
  });

  function handleVote(attendeeId: string) {
    useGameStore.getState().castVote(attendeeId);
    sendVote(attendeeId);

    // Persist to DB (type cast for PoC - will be properly typed with auth)
    if (programId && attendee) {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("game_responses") as any)
        .insert({
          program_id: programId,
          attendee_id: attendee.id,
          response_type: "vote",
          payload: { voted_for: attendeeId },
          round_number: useGameStore.getState().currentRound,
        })
        .then(() => {});
    }
  }

  if (!attendee) return null;

  return (
    <Shell>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <Home size={14} /> ZPET NA UVOD
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          ID: {slug.toUpperCase()}
        </div>
      </div>

      <div className="max-w-md mx-auto space-y-6 py-4">
        {/* LOBBY / WAITING */}
        {(phase === "lobby") && (
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

        {/* COLLECTING FACTS */}
        {phase === "collecting" && programId && (
          <FactCollection programId={programId} attendeeId={attendee.id} />
        )}

        {/* VOTING */}
        {phase === "voting" && <VotingScreen onVote={handleVote} />}

        {/* RESULTS */}
        {phase === "results" && <ResultsScreen />}

        {/* FINISHED */}
        {phase === "finished" && (
          <div className="bg-slate-900 border-2 border-green-600/50 rounded-2xl p-8 text-center">
            <Trophy size={48} className="mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-black italic uppercase mb-2">
              Hra skoncila!
            </h3>
            <p className="text-slate-400 text-sm">Dekujeme za ucast.</p>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <Trophy size={24} className="mx-auto mb-2 text-yellow-500" />
            <div className="text-xl font-black">0</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">
              Body
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <MessageSquare size={24} className="mx-auto mb-2 text-blue-500" />
            <div className="text-xl font-black">{onlinePlayers.length}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">
              Online
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
