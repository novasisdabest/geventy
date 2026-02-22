import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { Shell } from "@/components/layout/Shell";
import { PlayerView } from "@/components/event/PlayerView";
import Link from "next/link";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch event by slug
  const { data: events } = await from(supabase, "events")
    .select("id, title, slug, creator_id, is_active")
    .eq("slug", slug);

  const event = events?.[0];

  if (!event || !event.is_active) {
    return (
      <Shell>
        <div className="text-center py-24 space-y-4">
          <h1 className="text-2xl font-black italic uppercase">Event nenalezen</h1>
          <p className="text-sm text-slate-400">Tento event neexistuje nebo neni aktivni.</p>
          <Link href="/" className="text-purple-400 text-sm inline-block mt-4">
            Zpet na uvod
          </Link>
        </div>
      </Shell>
    );
  }

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/event/${slug}`);
  }

  // Check if user is the event creator
  const isCreator = event.creator_id === user.id;

  // Find attendee record for this user
  const { data: attendeeRecords } = await from(supabase, "event_attendees")
    .select("id, display_name")
    .eq("event_id", event.id)
    .eq("user_id", user.id);

  const attendee = attendeeRecords?.[0];

  if (!attendee && !isCreator) {
    redirect(`/event/${slug}/join`);
  }

  // Fetch user profile for Shell
  const { data: profile } = await from(supabase, "profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // For creators without attendee record, use profile info
  const playerAttendee = attendee ?? {
    id: user.id,
    display_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Host",
  };

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
    <Shell
      user={{
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    >
      <PlayerView
        event={{ id: event.id, slug: event.slug, title: event.title }}
        attendee={{ id: playerAttendee.id, display_name: playerAttendee.display_name }}
        initialMessages={(messages ?? []) as { id: string; display_name: string; content: string; created_at: string }[]}
        initialPhotos={(photos ?? []) as { id: string; display_name: string; url: string; created_at: string }[]}
      />
    </Shell>
  );
}
