"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";

export async function lookupLiveCode(code: string) {
  if (!/^[0-9]{6}$/.test(code)) {
    return { error: "Neplatny kod" };
  }

  const supabase = await createClient();

  const { data: events } = await from(supabase, "events")
    .select("slug")
    .eq("live_code", code)
    .eq("is_active", true);

  const event = events?.[0];

  if (!event) {
    return { error: "Kod nenalezen" };
  }

  redirect(`/event/${event.slug}/live`);
}
