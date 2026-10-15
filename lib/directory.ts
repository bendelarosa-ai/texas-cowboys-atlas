import type { DirectoryMember, ProfileRow } from "./types";
import { clean, joinLocation, looksLikeStreetAddress, stateName } from "./format";
import { buildSearchText } from "./search";

export const COWBOY_LIST_COLS = "id, name, new_man_year, city, state, industry, org, major, company, role, deceased";
export const PROFILE_LIST_COLS = "cowboy_id, display_name, preferred_name, company, role, address, avatar_url, profile_public, updated_at";

export interface CowboyListRow {
  id: number;
  name: string | null;
  new_man_year: number | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  org: string | null;
  major: string | null;
  company: string | null;
  role: string | null;
  deceased: boolean | null;
}

export type ProfileListRow = Pick<
  ProfileRow,
  "cowboy_id" | "display_name" | "preferred_name" | "company" | "role" | "address" | "avatar_url" | "profile_public" | "updated_at"
>;

/** If several accounts point at one record, prefer the most recently updated. */
export function latestProfileByCowboy<T extends { cowboy_id: number | null; updated_at?: string | null }>(rows: T[]) {
  const map = new Map<number, T>();
  for (const row of rows) {
    if (!row.cowboy_id) continue;
    const existing = map.get(row.cowboy_id);
    if (!existing || (row.updated_at ?? "") > (existing.updated_at ?? "")) map.set(row.cowboy_id, row);
  }
  return map;
}

/** Merge a roster record with the member's own profile (profile values win). */
export function toDirectoryMember(c: CowboyListRow, p: ProfileListRow | undefined): DirectoryMember {
  const name = clean(c.name) ?? clean(p?.display_name) ?? "Unnamed member";
  const preferred = clean(p?.preferred_name);
  const title = clean(p?.role) ?? clean(c.role);
  const company = clean(p?.company) ?? clean(c.company);
  const profileLocation = clean(p?.address);
  // Never surface something that looks like a street address on a card.
  const location =
    profileLocation && !looksLikeStreetAddress(profileLocation)
      ? profileLocation
      : joinLocation(c.city, c.state);

  return {
    id: c.id,
    name,
    preferredName: preferred && preferred.toLowerCase() !== name.toLowerCase() ? preferred : null,
    newManYear: c.new_man_year,
    title,
    company,
    industry: clean(c.industry),
    city: clean(c.city),
    state: clean(c.state),
    location,
    avatarUrl: clean(p?.avatar_url),
    deceased: !!c.deceased,
    hasProfile: !!p,
    updatedAt: p?.updated_at ?? null,
    searchText: buildSearchText([
      name, p?.display_name, preferred, title, company, c.role, c.company,
      location, c.city, c.state, stateName(c.state), c.industry, c.org, c.major, c.new_man_year,
    ]),
  };
}
