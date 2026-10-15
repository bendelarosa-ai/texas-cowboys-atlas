import type { Cowboy } from "@/types/cowboy";
import type { ProfileRow } from "./types";
import { clean, joinLocation } from "./format";

export interface CompletionItem {
  key: string;
  label: string;
  done: boolean;
  /** Section anchor on the edit page. */
  section: string;
}

/**
 * Profile completeness, based on what actually helps a fellow Cowboy find and
 * reach you. Directory (roster) values count, so members aren't asked to
 * re-enter information the directory already has.
 */
export function profileCompletion(profile: ProfileRow | null, roster: Cowboy | null) {
  const items: CompletionItem[] = [
    { key: "record", label: "Link your Texas Cowboys directory record", section: "record", done: !!profile?.cowboy_id },
    { key: "photo", label: "Add a profile photo", section: "basic", done: !!clean(profile?.avatar_url) },
    { key: "title", label: "Add your job title", section: "professional", done: !!(clean(profile?.role) || clean(roster?.role)) },
    { key: "company", label: "Add your company", section: "professional", done: !!(clean(profile?.company) || clean(roster?.company)) },
    { key: "location", label: "Add where you live", section: "basic", done: !!(clean(profile?.address) || joinLocation(roster?.city, roster?.state)) },
    { key: "contact", label: "Add a way to reach you", section: "contact", done: !!(clean(profile?.email_contact) || clean(profile?.phone)) },
    { key: "bio", label: "Write a short bio", section: "about", done: !!(clean(profile?.bio) || clean(profile?.personal_statement)) },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items };
}
