import type { Metadata } from "next";
import ProfileEditor from "@/components/profile/ProfileEditor";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { PREVIEW, getLinkableRecords, getRosterRecord, requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const viewer = await requireViewer();
  const [roster, { records, claimedIds }] = await Promise.all([
    getRosterRecord(viewer.profile?.cowboy_id),
    getLinkableRecords(viewer),
  ]);

  return (
    <>
      <ScrollToTop />
      <ProfileEditor
        userId={viewer.userId}
        email={viewer.email}
        profile={viewer.profile}
        roster={roster}
        records={records}
        claimedIds={claimedIds}
        preview={PREVIEW}
      />
    </>
  );
}
