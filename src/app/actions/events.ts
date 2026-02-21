"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export async function createEventAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const eventDate = (formData.get("event_date") as string | null) || null;

  if (!title) return { error: "Nazev je povinny" };

  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { data, error } = await from(supabase, "events")
    .insert({
      title,
      description,
      event_date: eventDate,
      slug,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  redirect(`/dashboard/${data.id}`);
}

export async function updateEventAction(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const eventDate = (formData.get("event_date") as string | null) || null;

  if (!title) return { error: "Nazev je povinny" };

  const { error } = await from(supabase, "events")
    .update({ title, description, event_date: eventDate })
    .eq("id", eventId)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${eventId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEventAction(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Neautorizovany pristup" };

  const { error } = await from(supabase, "events")
    .delete()
    .eq("id", eventId)
    .eq("creator_id", user.id);

  if (error) return { error: error.message };

  redirect("/dashboard");
}
