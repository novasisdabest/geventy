import Link from "next/link";
import { Plus, Calendar, Users, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: events } = await from(supabase, "events")
    .select("id, title, slug, event_date, is_active, created_at")
    .eq("creator_id", user!.id)
    .order("created_at", { ascending: false });

  // Fetch attendee counts per event
  const eventIds = events?.map((e: { id: string }) => e.id) ?? [];
  const { data: attendeeCounts } = eventIds.length > 0
    ? await from(supabase, "event_attendees")
        .select("event_id")
        .in("event_id", eventIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  attendeeCounts?.forEach((a: { event_id: string }) => {
    countMap[a.event_id] = (countMap[a.event_id] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black italic uppercase tracking-tight">
          Moje Akce
        </h1>
        <Link
          href="/dashboard/new"
          className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          <Plus size={16} />
          Nova akce
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-slate-700" />
          <h2 className="text-xl font-bold mb-2 text-slate-400">Zatim zadne akce</h2>
          <p className="text-sm text-slate-600 mb-6">
            Vytvor svou prvni akci a pozvi hosty.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Plus size={16} />
            Vytvorit akci
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: { id: string; title: string; slug: string; event_date: string | null; is_active: boolean }) => (
            <Link
              key={event.id}
              href={`/dashboard/${event.id}`}
              className="group bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">
                  {event.title}
                </h3>
                <ChevronRight
                  size={18}
                  className="text-slate-600 group-hover:text-purple-400 transition-colors mt-1"
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {event.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(event.event_date).toLocaleDateString("cs-CZ")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {countMap[event.id] || 0} hostu
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    event.is_active
                      ? "bg-green-500/20 text-green-400"
                      : "bg-slate-800 text-slate-600"
                  }`}
                >
                  {event.is_active ? "Aktivni" : "Neaktivni"}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  /{event.slug}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
