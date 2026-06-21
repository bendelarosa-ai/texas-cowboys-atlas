import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "@/components/ChatClient";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, preferred_name, username")
    .eq("id", user.id)
    .single();

  const firstName = (profile?.preferred_name || profile?.display_name || "")
    .trim().split(" ")[0] || null;

  return <ChatClient firstName={firstName} />;
}
