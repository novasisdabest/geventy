"use server";

import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

export async function sendMessageAction(
  eventId: string,
  attendeeId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 280) {
    return { error: "Zprava musi mit 1-280 znaku" };
  }

  // Verify attendee belongs to user
  const { data: att } = await from(supabase, "event_attendees")
    .select("id, display_name")
    .eq("id", attendeeId)
    .eq("user_id", user.id)
    .single();

  if (!att) return { error: "Neplatny ucastnik" };

  const { data, error } = await from(supabase, "event_messages")
    .insert({
      event_id: eventId,
      attendee_id: attendeeId,
      display_name: att.display_name,
      content: trimmed,
    })
    .select("id, display_name, content, created_at")
    .single();

  if (error) return { error: error.message };
  return { success: true, message: data };
}

export async function uploadPhotoAction(
  eventId: string,
  attendeeId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const file = formData.get("photo") as File | null;
  if (!file) return { error: "Zadny soubor" };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Povolene formaty: JPEG, PNG, WebP, GIF" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Maximalni velikost je 5 MB" };
  }

  // Verify attendee belongs to user
  const { data: att } = await from(supabase, "event_attendees")
    .select("id, display_name")
    .eq("id", attendeeId)
    .eq("user_id", user.id)
    .single();

  if (!att) return { error: "Neplatny ucastnik" };

  const ext = file.name.split(".").pop() || "jpg";
  const storagePath = `${eventId}/${attendeeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("event-photos")
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-photos").getPublicUrl(storagePath);

  const { data, error } = await from(supabase, "event_photos")
    .insert({
      event_id: eventId,
      attendee_id: attendeeId,
      display_name: att.display_name,
      storage_path: storagePath,
      url: publicUrl,
    })
    .select("id, display_name, url, created_at")
    .single();

  if (error) return { error: error.message };
  return { success: true, photo: data };
}
