import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Cowboy } from "@/types/cowboy";
import DirectoryClient from "@/components/DirectoryClient";

export default async function DirectoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data, error }, { data: profileData }] = await Promise.all([
    supabase.from("cowboys").select("*").order("name", { ascending: true }),
    supabase.from("profiles").select("username, is_admin, display_name, preferred_name").eq("id", user.id).single(),
  ]);

  const isAdmin = profileData?.is_admin ?? false;

  const profilesQuery = supabase
    .from("profiles")
    .select("cowboy_id, username, display_name, preferred_name, bio, personal_statement, phone, email_contact, company, role, address, website, avatar_url, profile_public")
    .not("cowboy_id", "is", null);

  if (!isAdmin) profilesQuery.eq("profile_public", true);

  const { data: publicProfiles } = await profilesQuery;

  if (error) {
    return <div className="p-8 text-red-600">Failed to load directory: {error.message}</div>;
  }

  const members = (data ?? []) as Cowboy[];
  const industries = [...new Set(members.map((m) => m.industry).filter((v) => v && v.trim()))].sort() as string[];
  const years = [...new Set(members.map((m) => m.new_man_year).filter(Boolean))].sort((a, b) => (b as number) - (a as number)) as number[];
  const states = [...new Set(members.map((m) => m.state).filter((v) => v && v.trim()))].sort() as string[];

  const profilesByCowboyId: Record<number, (typeof publicProfiles)[0]> = {};
  for (const p of publicProfiles ?? []) {
    if (p.cowboy_id) profilesByCowboyId[p.cowboy_id] = p;
  }

  const firstName = (profileData?.preferred_name || profileData?.display_name || "")
    .trim()
    .split(" ")[0] || null;

  return (
    <DirectoryClient
      members={members}
      industries={industries}
      years={years}
      states={states}
      userEmail={user.email ?? ""}
      username={profileData?.username ?? null}
      publicProfiles={profilesByCowboyId}
      isAdmin={isAdmin}
      firstName={firstName}
    />
  );
}
