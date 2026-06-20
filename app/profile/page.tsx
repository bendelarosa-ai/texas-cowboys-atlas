import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";
import type { Cowboy } from "@/types/cowboy";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: cowboys }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("cowboys").select("*").order("name", { ascending: true }),
  ]);

  // If linked, fetch the full cowboy record
  let linkedCowboy: Cowboy | null = null;
  if (profile?.cowboy_id) {
    const { data } = await supabase
      .from("cowboys")
      .select("*")
      .eq("id", profile.cowboy_id)
      .single();
    linkedCowboy = data ?? null;
  }

  return (
    <ProfileClient
      userId={user.id}
      email={user.email ?? ""}
      profile={profile ?? null}
      cowboys={(cowboys ?? []) as Cowboy[]}
      linkedCowboy={linkedCowboy}
    />
  );
}
