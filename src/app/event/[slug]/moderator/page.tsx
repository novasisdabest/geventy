"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { ProjectorScreen } from "@/components/games/who-am-i/ProjectorScreen";
import { ModeratorControls } from "@/components/games/who-am-i/ModeratorControls";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import {
  Users,
  Gamepad2,
  ChevronRight,
  Home,
} from "lucide-react";

export default function ModeratorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [eventId, setEventId] = useState<string | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Tables<"event_attendees">[]>([]);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  // Bootstrap: ensure event + program exist for the PoC demo
  useEffect(() => {
    async function bootstrap() {
      const supabase = createClient();

      // Check if event exists
      const { data: eventsData } = await supabase
        .from("events")
        .select("id")
        .eq("slug", slug);

      const eid = (eventsData as { id: string }[] | null)?.[0]?.id;

      // For PoC: use slug as channel ID when no real event exists
      if (!eid) {
        setEventId(slug);
        setProgramId(slug);
        return;
      }

      setEventId(eid);

      // Load attendees
      const { data: att } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eid);
      if (att) setAttendees(att);

      // Load active program
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
    bootstrap();
  }, [slug]);

  const { sendCommand } = useEventChannel({
    eventId: slug,
    attendeeId: "moderator",
    displayName: "Moderator",
    isModerator: true,
  });

  const games = [
    "Kdo jsem ted?",
    "Party Bingo",
    "Kviz",
    "Dve pravdy, jedna lez",
    "Hot Take",
    "Kreslici souboj",
  ];

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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main projection area */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectorScreen eventSlug={slug} />

          <ModeratorControls
            programId={programId ?? ""}
            eventId={eventId ?? ""}
            sendCommand={sendCommand}
            attendees={attendees}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Online guests */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Hoste (
                {onlinePlayers.length})
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

          {/* Game library */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2 italic uppercase">
              <Gamepad2 size={16} className="text-purple-400" /> Knihovna Miniher
            </h3>
            <div className="space-y-2">
              {games.map((game) => (
                <div
                  key={game}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-purple-500/50 transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-300">
                    {game}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-slate-600 group-hover:text-purple-400 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
