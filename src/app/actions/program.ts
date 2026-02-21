"use server";

import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

export async function startGameAction(eventId: string, gameId: string) {
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

  // Get next sort order
  const { data: existing } = await from(supabase, "event_program")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing?.[0] ? existing[0].sort_order + 1 : 0;

  const { data, error } = await from(supabase, "event_program")
    .insert({
      event_id: eventId,
      game_id: gameId,
      block_type: "game",
      sort_order: nextOrder,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  return { programId: data.id };
}
