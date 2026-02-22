import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { Shell } from "@/components/layout/Shell";
import { ModeratorView } from "@/components/event/ModeratorView";
import Link from "next/link";
import type { Tables } from "@/lib/database.types";

interface ModeratorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ModeratorPage({ params }: ModeratorPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/event/${slug}/moderator`);

  // Fetch event
  const { data: events } = await from(supabase, "events")
    .select("id, title, slug, creator_id, live_code, event_date")
    .eq("slug", slug);

  const event = events?.[0];

  if (!event) {
    return (
      <Shell>
        <div className="text-center py-24 space-y-4">
          <h1 className="text-2xl font-black italic uppercase">Event nenalezen</h1>
          <Link href="/dashboard" className="text-purple-400 text-sm inline-block mt-4">
            Zpet na dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  // Only creator or moderator attendees can access
  const isCreator = event.creator_id === user.id;

  if (!isCreator) {
    const { data: modRecord } = await from(supabase, "event_attendees")
      .select("id, is_moderator")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .eq("is_moderator", true);

    if (!modRecord || modRecord.length === 0) {
      redirect(`/event/${slug}`);
    }
  }

  // Fetch attendees
  const { data: attendees } = await from(supabase, "event_attendees")
    .select("*")
    .eq("event_id", event.id);

  // Fetch games library
  const { data: games } = await from(supabase, "games_library")
    .select("*")
    .eq("is_published", true)
    .order("name");

  // Fetch all program blocks
  const { data: programBlocks } = await from(supabase, "event_program")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order");

  // Map game_id → slug for blocks
  const gamesList = (games ?? []) as Tables<"games_library">[];
  const gamesById = Object.fromEntries(
    gamesList.map((g) => [g.id, g])
  );
  const blocksList = (programBlocks ?? []) as Tables<"event_program">[];
  const blocksWithGameSlug = blocksList.map((block) => {
    const game = block.game_id ? gamesById[block.game_id] : undefined;
    return {
      ...block,
      gameSlug: game?.slug,
      gameName: game?.name,
      gameAuthor: game?.author,
      gamePrice: game?.price ?? null,
      gameVersion: game?.version,
      configSchema: game?.config_schema as { id: string; label: string; type: "number" | "text" | "select" | "boolean"; defaultValue: string | number | boolean; options?: string[] }[] ?? [],
      moderationSteps: game?.moderation_steps as { id: number; label: string }[] ?? [],
    };
  });

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
  const initialScore = achievementsList.reduce((sum, a) => sum + a.points, 0);

  // Fetch active program
  const activeProgramId = blocksList.find(
    (b) => b.status === "pending" || b.status === "active"
  )?.id ?? null;

  // Fetch profile for Shell
  const { data: profile } = await from(supabase, "profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <Shell
      user={{
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    >
      <ModeratorView
        event={{ id: event.id, slug: event.slug, title: event.title }}
        liveCode={event.live_code}
        attendees={attendees ?? []}
        gamesLibrary={games ?? []}
        blocks={blocksWithGameSlug}
        initialProgramId={activeProgramId}
        initialAchievements={achievementsList}
        initialScore={initialScore}
        eventDate={event.event_date ?? undefined}
      />
    </Shell>
  );
}
