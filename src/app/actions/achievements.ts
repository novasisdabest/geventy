"use server";

import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

export async function awardAchievementAction(
  eventId: string,
  achievementType: string,
  title: string,
  points: number,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  // Verify caller owns the event
  const { data: event } = await from(supabase, "events")
    .select("id")
    .eq("id", eventId)
    .eq("creator_id", user.id)
    .single();

  if (!event) return { error: "Event nenalezen" };

  const { data, error } = await from(supabase, "event_achievements")
    .insert({
      event_id: eventId,
      achievement_type: achievementType,
      title,
      points,
      metadata: metadata ?? {},
    })
    .select("id, achievement_type, title, points, awarded_at")
    .single();

  if (error) return { error: error.message };

  return { achievement: data };
}

export async function getEventAchievementsAction(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const { data, error } = await from(supabase, "event_achievements")
    .select("id, achievement_type, title, points, metadata, awarded_at")
    .eq("event_id", eventId)
    .order("awarded_at", { ascending: true });

  if (error) return { error: error.message };

  const totalScore = (data ?? []).reduce((sum: number, a: { points: number }) => sum + a.points, 0);

  return { achievements: data ?? [], totalScore };
}
