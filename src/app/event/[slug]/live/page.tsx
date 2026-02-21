import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { DisplayView } from "@/components/event/DisplayView";

interface LivePageProps {
  params: Promise<{ slug: string }>;
}

export default async function LivePage({ params }: LivePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: events } = await from(supabase, "events")
    .select("id, title, slug")
    .eq("slug", slug)
    .eq("is_active", true);

  const event = events?.[0];

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black italic uppercase">Event nenalezen</h1>
          <p className="text-slate-500 text-lg">Tento event neexistuje nebo neni aktivni.</p>
        </div>
      </div>
    );
  }

  return <DisplayView event={{ id: event.id, slug: event.slug, title: event.title }} />;
}
