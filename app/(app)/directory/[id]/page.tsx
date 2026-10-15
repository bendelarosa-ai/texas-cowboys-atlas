import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackToDirectory from "@/components/profile/BackToDirectory";
import ProfileView from "@/components/profile/ProfileView";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { getMember, requireViewer } from "@/lib/data";
import { clean } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return id;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = parseId((await params).id);
  const viewer = await requireViewer();
  const { cowboy, profile } = await getMember(id, viewer);
  return { title: clean(profile?.display_name) ?? clean(cowboy.name) ?? "Member" };
}

export default async function MemberPage({ params }: Params) {
  const id = parseId((await params).id);
  const viewer = await requireViewer();
  const { cowboy, profile, access } = await getMember(id, viewer);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ScrollToTop />
      <div className="mb-5">
        <BackToDirectory />
      </div>
      <ProfileView cowboy={cowboy} profile={profile} access={access} isSelf={viewer.profile?.cowboy_id === id} />
    </div>
  );
}
