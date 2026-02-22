import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { DisplayView } from "@/components/event/DisplayView";

interface LivePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: events } = await from(supabase, "events")
    .select("id, title, slug, event_date")
    .eq("slug", slug)
    .eq("is_active", true);

  const event = events?.[0];

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black italic uppercase">Event nenalezen</h1>
          <p className="text-slate-500 text-lg">Tento event neexistuje nebo neni aktivni.</p>
        </div>
      </div>
    );
  }

  const { data: attendees } = await from(supabase, "event_attendees")
    .select("id, display_name, status, user_id")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  // Fetch achievements for legendaryness index
  const { data: achievements } = await from(supabase, "event_achievements")
    .select("id, achievement_type, title, points, awarded_at")
    .eq("event_id", event.id)
    .order("awarded_at", { ascending: true });

  const achievementsList = (achievements ?? []) as {
    id: string;
    achievement_type: string;
    title: string;
    points: number;
    awarded_at: string;
  }[];
  const totalScore = achievementsList.reduce((sum, a) => sum + a.points, 0);

  // Fetch social wall data
  const { data: messages } = await from(supabase, "event_messages")
    .select("id, display_name, content, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: photos } = await from(supabase, "event_photos")
    .select("id, display_name, url, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  return (
    <DisplayView
      event={{ id: event.id, slug: event.slug, title: event.title }}
      attendees={attendees ?? []}
      initialAchievements={achievementsList}
      initialScore={totalScore}
      initialMessages={(messages ?? []) as { id: string; display_name: string; content: string; created_at: string }[]}
      initialPhotos={(photos ?? []) as { id: string; display_name: string; url: string; created_at: string }[]}
      eventDate={event.event_date ?? undefined}
    />
  );
}
