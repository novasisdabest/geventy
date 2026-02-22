"use server";

import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

async function verifyEventOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  userId: string
) {
  const { data } = await from(supabase, "events")
    .select("id")
    .eq("id", eventId)
    .eq("creator_id", userId)
    .single();
  return !!data;
}

export async function startGameAction(eventId: string, gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyEventOwnership(supabase, eventId, user.id))) {
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

export async function activateBlockAction(eventId: string, blockId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyEventOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  // Complete any currently active block
  const { data: activeBlocks } = await from(supabase, "event_program")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "active");

  if (activeBlocks && activeBlocks.length > 0) {
    await Promise.all(
      activeBlocks.map((b: { id: string }) =>
        from(supabase, "event_program")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", b.id)
      )
    );
  }

  // Activate the target block
  const { data, error } = await from(supabase, "event_program")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", blockId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) return { error: error.message };

  // For game blocks, also create a game program entry
  if (data.block_type === "game" && data.game_id) {
    return { success: true, block: data, programId: data.id };
  }

  return { success: true, block: data };
}

export async function advanceProgramAction(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyEventOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  // Get all blocks sorted
  const { data: blocks } = await from(supabase, "event_program")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (!blocks || blocks.length === 0) return { error: "Zadne bloky" };

  // Find the currently active block
  const activeIdx = blocks.findIndex((b: { status: string }) => b.status === "active");

  if (activeIdx !== -1) {
    // Complete the active block
    await from(supabase, "event_program")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", blocks[activeIdx].id);
  }

  // Find next pending block after the active one
  const searchStart = activeIdx === -1 ? 0 : activeIdx + 1;
  const nextBlock = blocks.slice(searchStart).find((b: { status: string }) => b.status === "pending");

  if (!nextBlock) {
    // Program finished — no more pending blocks
    return { success: true, finished: true };
  }

  // Activate next block
  const { data: activated, error } = await from(supabase, "event_program")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", nextBlock.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  return { success: true, block: activated };
}

export async function deactivateProgramAction(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  if (!(await verifyEventOwnership(supabase, eventId, user.id))) {
    return { error: "Event nenalezen" };
  }

  // Complete any active blocks
  const { error } = await from(supabase, "event_program")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("status", "active");

  if (error) return { error: error.message };

  return { success: true };
}
