import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { acceptInviteAction, selfJoinAction } from "@/app/actions/attendees";
import Link from "next/link";

interface JoinPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = `/login?next=/event/${slug}/join${token ? `?token=${token}` : ""}`;
    redirect(loginUrl);
  }

  // Fetch event
  const { data: events } = await from(supabase, "events")
    .select("id, title, slug, creator_id")
    .eq("slug", slug);

  const event = events?.[0];
  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black italic uppercase text-white">Event nenalezen</h1>
          <Link href="/" className="text-purple-400 text-sm">Zpet na uvod</Link>
        </div>
      </div>
    );
  }

  // Check if already an attendee
  const { data: existingAttendee } = await from(supabase, "event_attendees")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", user.id);

  if (existingAttendee && existingAttendee.length > 0) {
    redirect(`/event/${slug}`);
  }

  // Accept invite token if provided
  if (token) {
    const result = await acceptInviteAction(token);
    if (!result.error) {
      redirect(`/event/${slug}`);
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-black italic uppercase text-white">
            Chyba pozvanky
          </h1>
          <p className="text-sm text-red-400">{result.error}</p>
          <Link href="/" className="text-purple-400 text-sm inline-block mt-4">
            Zpet na uvod
          </Link>
        </div>
      </div>
    );
  }

  // Creator auto-redirect
  if (event.creator_id === user.id) {
    redirect(`/event/${slug}`);
  }

  // Self-join: auto-create attendee record for any authenticated user
  const result = await selfJoinAction(event.id);
  if (!result.error) {
    redirect(`/event/${slug}`);
  }

  // Fallback if self-join fails
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <span className="font-bold text-white text-2xl">G</span>
        </div>
        <h1 className="text-2xl font-black italic uppercase text-white">
          {event.title}
        </h1>
        <p className="text-sm text-red-400">
          Pripojeni se nezdarilo. Zkus to prosim znovu.
        </p>
        <Link
          href={`/event/${slug}/join`}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          Zkusit znovu
        </Link>
      </div>
    </div>
  );
}
