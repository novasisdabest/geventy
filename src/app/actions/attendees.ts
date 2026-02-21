"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { from, rpc } from "@/lib/supabase/typed";

export async function inviteAttendeeAction(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const email = (formData.get("email") as string).trim();
  const displayName = (formData.get("display_name") as string).trim();

  if (!email || !displayName) return { error: "Email a jmeno jsou povinne" };

  // Verify caller owns the event
  const { data: event } = await from(supabase, "events")
    .select("id")
    .eq("id", eventId)
    .eq("creator_id", user.id)
    .single();

  if (!event) return { error: "Event nenalezen" };

  const { error } = await from(supabase, "event_attendees")
    .insert({
      event_id: eventId,
      email,
      display_name: displayName,
    });

  if (error) {
    if (error.code === "23505") return { error: "Tento email uz je pozvan" };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function removeAttendeeAction(eventId: string, attendeeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const { error } = await from(supabase, "event_attendees")
    .delete()
    .eq("id", attendeeId)
    .eq("event_id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  return { success: true };
}

export async function acceptInviteAction(token: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Musis byt prihlasen" };

  const { data, error } = await rpc(supabase, "accept_invite", { token });

  if (error) return { error: error.message };

  return { attendeeId: data };
}
