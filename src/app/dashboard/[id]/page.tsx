"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Monitor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { from } from "@/lib/supabase/typed";
import DashboardTabs, { type TabId } from "@/components/dashboard/DashboardTabs";
import EventConfigTab from "@/components/dashboard/EventConfigTab";
import TimelineTab from "@/components/dashboard/TimelineTab";
import AttendeesTab from "@/components/dashboard/AttendeesTab";
import type { Tables } from "@/lib/database.types";
import type { EventType } from "@/lib/timeline-templates";
import { TvGuideCard } from "@/components/dashboard/TvGuideCard";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Tables<"events"> | null>(null);
  const [attendees, setAttendees] = useState<Tables<"event_attendees">[]>([]);
  const [blocks, setBlocks] = useState<Tables<"event_program">[]>([]);
  const [gamesLibrary, setGamesLibrary] = useState<Tables<"games_library">[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("priprava");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [evRes, attRes, blocksRes, gamesRes] = await Promise.all([
        from(supabase, "events").select("*").eq("id", id),
        from(supabase, "event_attendees").select("*").eq("event_id", id).order("created_at"),
        from(supabase, "event_program").select("*").eq("event_id", id).order("sort_order"),
        from(supabase, "games_library").select("*").eq("is_published", true).order("name"),
      ]);

      if (evRes.data?.[0]) setEvent(evRes.data[0]);
      if (attRes.data) setAttendees(attRes.data);
      if (blocksRes.data) setBlocks(blocksRes.data);
      if (gamesRes.data) setGamesLibrary(gamesRes.data);

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400">Event nenalezen.</p>
        <Link href="/dashboard" className="text-purple-400 text-sm mt-4 inline-block">
          Zpet na prehled
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> Zpet na prehled
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/event/${event.slug}/live`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-colors border border-slate-700"
          >
            <Monitor size={14} />
            Projektor
          </a>
          <Link
            href={`/event/${event.slug}/moderator`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <ExternalLink size={14} />
            Moderovat
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <DashboardTabs
        active={activeTab}
        onChange={setActiveTab}
        attendeeCount={attendees.length}
        blockCount={blocks.length}
      />

      {/* TV Guide */}
      <TvGuideCard />

      {/* Tab content */}
      {activeTab === "priprava" && (
        <EventConfigTab
          event={event}
          onEventUpdate={(updates) => setEvent((prev) => prev ? { ...prev, ...updates } : prev)}
        />
      )}

      {activeTab === "program" && (
        <TimelineTab
          eventId={id}
          eventType={event.event_type as EventType}
          initialBlocks={blocks}
          gamesLibrary={gamesLibrary}
        />
      )}

      {activeTab === "hoste" && (
        <AttendeesTab
          eventId={id}
          eventSlug={event.slug}
          initialAttendees={attendees}
        />
      )}
    </div>
  );
}
