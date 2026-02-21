import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { from } from "@/lib/supabase/typed";
import { Shell } from "@/components/layout/Shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await from(supabase, "profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <Shell
      user={{
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }}
    >
      {children}
    </Shell>
  );
}
