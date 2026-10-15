import type { Metadata } from "next";
import ChatClient from "@/components/ChatClient";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Ask AI" };

export default async function ChatPage() {
  const viewer = await requireViewer();
  return <ChatClient firstName={viewer.firstName} />;
}
