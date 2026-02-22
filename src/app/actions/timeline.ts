"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { TIMELINE_TEMPLATES, type EventType, type BlockType } from "@/lib/timeline-templates";

async function verifyOwnership(supabase: Awaited<ReturnType<typeof createClient>>, eventId: string, userId: string) {
  const { data } = await from(supabase, "events")
    .select("id")
    .eq("id", eventId)
    .eq("creator_id", userId)
    .single();
  return !!data;
}

export async function addTimelineBlockAction(
  eventId: string,
  block: { block_type: BlockType; game_id?: string; title: string; duration_minutes: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

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
      block_type: block.block_type,
      game_id: block.game_id ?? null,
      title: block.title,
      duration_minutes: block.duration_minutes,
      sort_order: nextOrder,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true, block: data };
}

export async function removeTimelineBlockAction(eventId: string, blockId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  const { error } = await from(supabase, "event_program")
    .delete()
    .eq("id", blockId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function reorderTimelineBlockAction(
  eventId: string,
  blockId: string,
  direction: "up" | "down"
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  // Get all blocks sorted
  const { data: blocks } = await from(supabase, "event_program")
    .select("id, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (!blocks) return { error: "Nelze nacist bloky" };

  const idx = blocks.findIndex((b: { id: string }) => b.id === blockId);
  if (idx === -1) return { error: "Blok nenalezen" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return { error: "Nelze presunout" };

  // Swap sort_order values
  const current = blocks[idx];
  const neighbor = blocks[swapIdx];

  await from(supabase, "event_program")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", current.id);

  await from(supabase, "event_program")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbor.id);

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function updateTimelineBlockAction(
  eventId: string,
  blockId: string,
  updates: { title?: string; duration_minutes?: number }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  const { error } = await from(supabase, "event_program")
    .update(updates)
    .eq("id", blockId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function reorderTimelineBlocksBulkAction(
  eventId: string,
  orderedBlockIds: string[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  // Update all sort_order values in a single pass
  const updates = orderedBlockIds.map((id, index) =>
    from(supabase, "event_program")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("event_id", eventId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function applyTimelineTemplateAction(eventId: string, eventType: EventType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  const template = TIMELINE_TEMPLATES[eventType];
  if (!template || template.length === 0) return { error: "Sablona je prazdna" };

  // Resolve game slugs to IDs
  const gameSlugs = template
    .filter((b) => b.game_slug)
    .map((b) => b.game_slug!);

  let gameMap = new Map<string, string>();
  if (gameSlugs.length > 0) {
    const { data: games } = await from(supabase, "games_library")
      .select("id, slug")
      .in("slug", gameSlugs);

    if (games) {
      gameMap = new Map(games.map((g: { slug: string; id: string }) => [g.slug, g.id]));
    }
  }

  // Delete existing blocks
  await from(supabase, "event_program")
    .delete()
    .eq("event_id", eventId);

  // Bulk insert template blocks
  const rows = template.map((block, i) => ({
    event_id: eventId,
    block_type: block.block_type,
    game_id: block.game_slug ? gameMap.get(block.game_slug) ?? null : null,
    title: block.title,
    duration_minutes: block.duration_minutes,
    sort_order: i,
  }));

  const { error } = await from(supabase, "event_program").insert(rows);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}
