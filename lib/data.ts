/**
 * Server-side data access. Every read the app makes goes through here, so
 * visibility rules (shared / self / admin) live in exactly one place.
 */
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Cowboy } from "@/types/cowboy";
import type { DirectoryMember, LinkableRecord, ProfileAccess, ProfileRow, Viewer } from "./types";
import { clean, firstWord } from "./format";
import {
  COWBOY_LIST_COLS,
  PROFILE_LIST_COLS,
  latestProfileByCowboy,
  toDirectoryMember,
  type CowboyListRow,
  type ProfileListRow,
} from "./directory";
import * as fixtures from "./fixtures";

/** Dev-only: render the app with invented sample data — no login, no database. */
export const PREVIEW = process.env.NODE_ENV === "development" && process.env.UI_PREVIEW === "1";

const PROFILE_DETAIL_COLS =
  "id, cowboy_id, username, display_name, preferred_name, bio, personal_statement, phone, email_contact, company, role, address, website, avatar_url, profile_public, updated_at";

type QueryResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** PostgREST caps responses (1,000 rows by default) — page through everything. */
async function fetchAll<T>(build: (from: number, to: number) => QueryResult<T>): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (PREVIEW) return fixtures.viewer;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(`${PROFILE_DETAIL_COLS}, is_admin`)
    .eq("id", user.id)
    .maybeSingle();
  const profile = (data as ProfileRow | null) ?? null;
  const email = user.email ?? "";

  return {
    userId: user.id,
    email,
    isAdmin: !!profile?.is_admin,
    profile,
    firstName: firstWord(profile?.preferred_name) ?? firstWord(profile?.display_name),
    displayName: clean(profile?.display_name) ?? clean(profile?.preferred_name) ?? email,
  };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

/** Every member, merged with shared profiles. Admins also see unshared ones. */
export async function getDirectory(viewer: Viewer): Promise<DirectoryMember[]> {
  if (PREVIEW) return fixtures.directory();
  const supabase = await createClient();

  const [cowboys, profiles] = await Promise.all([
    fetchAll<CowboyListRow>((from, to) =>
      supabase.from("cowboys").select(COWBOY_LIST_COLS).order("name", { ascending: true }).order("id").range(from, to)
    ),
    fetchAll<ProfileListRow>((from, to) => {
      let q = supabase.from("profiles").select(PROFILE_LIST_COLS).not("cowboy_id", "is", null);
      if (!viewer.isAdmin) q = q.eq("profile_public", true);
      return q.order("cowboy_id").range(from, to);
    }),
  ]);

  const byCowboy = latestProfileByCowboy(profiles);
  return cowboys.map((c) => toDirectoryMember(c, byCowboy.get(c.id)));
}

/** One member's full record, filtered by what this viewer may see. */
export const getMember = cache(async function getMember(
  id: number,
  viewer: Viewer
): Promise<{ cowboy: Cowboy; profile: ProfileRow | null; access: ProfileAccess }> {
  if (PREVIEW) {
    const found = fixtures.member(id, viewer);
    if (!found) notFound();
    return found;
  }
  const supabase = await createClient();
  const { data: cowboy } = await supabase.from("cowboys").select("*").eq("id", id).maybeSingle();
  if (!cowboy) notFound();

  const isSelf = viewer.profile?.cowboy_id === id;
  let q = supabase.from("profiles").select(PROFILE_DETAIL_COLS).eq("cowboy_id", id);
  if (isSelf) q = q.eq("id", viewer.userId);
  else if (!viewer.isAdmin) q = q.eq("profile_public", true);
  const { data: rows } = await q.order("updated_at", { ascending: false, nullsFirst: false }).limit(1);

  const profile = ((rows ?? [])[0] as ProfileRow | undefined) ?? null;
  const access: ProfileAccess = !profile ? "none" : isSelf ? "self" : profile.profile_public ? "shared" : "admin";
  return { cowboy: cowboy as Cowboy, profile, access };
});

/** The roster record a member has linked to their account. */
export async function getRosterRecord(id: number | null | undefined): Promise<Cowboy | null> {
  if (!id) return null;
  if (PREVIEW) return fixtures.roster(id);
  const supabase = await createClient();
  const { data } = await supabase.from("cowboys").select("*").eq("id", id).maybeSingle();
  return (data as Cowboy | null) ?? null;
}

/** Records a member can link to, plus which ones another account already claimed. */
export async function getLinkableRecords(viewer: Viewer): Promise<{ records: LinkableRecord[]; claimedIds: number[] }> {
  if (PREVIEW) return fixtures.linkable(viewer);
  const supabase = await createClient();
  const [records, claims] = await Promise.all([
    fetchAll<LinkableRecord>((from, to) =>
      supabase.from("cowboys").select("id, name, new_man_year, company, city, state").order("name").order("id").range(from, to)
    ),
    // Only the link itself is read here — no profile details.
    fetchAll<{ id: string; cowboy_id: number | null }>((from, to) =>
      supabase.from("profiles").select("id, cowboy_id").not("cowboy_id", "is", null).order("cowboy_id").range(from, to)
    ),
  ]);
  return {
    records,
    claimedIds: claims.filter((c) => c.id !== viewer.userId && c.cowboy_id).map((c) => c.cowboy_id as number),
  };
}
