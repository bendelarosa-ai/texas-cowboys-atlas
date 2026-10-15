import { Suspense } from "react";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import DirectoryView from "@/components/directory/DirectoryView";
import { getDirectory, getRosterRecord, requireViewer } from "@/lib/data";
import { profileCompletion } from "@/lib/completion";

export const metadata: Metadata = { title: "Directory" };

export default async function DirectoryPage() {
  const viewer = await requireViewer();
  const [members, roster, cookieStore] = await Promise.all([
    getDirectory(viewer),
    getRosterRecord(viewer.profile?.cowboy_id),
    cookies(),
  ]);

  // Gentle nudge for members whose profiles would help others reach them.
  const completion = profileCompletion(viewer.profile, roster);
  const needsNudge = !viewer.profile?.cowboy_id || completion.percent < 80;
  const dismissed = cookieStore.get("tc_prompt_dismissed")?.value === "1";
  const prompt =
    needsNudge && !dismissed
      ? { percent: completion.percent, next: completion.items.find((i) => !i.done) ?? null }
      : null;

  return (
    <Suspense>
      <DirectoryView
        members={members}
        viewer={{ firstName: viewer.firstName, email: viewer.email, ownMemberId: viewer.profile?.cowboy_id ?? null }}
        prompt={prompt}
      />
    </Suspense>
  );
}
