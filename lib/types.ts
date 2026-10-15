/** A row in `profiles` — owned and edited by the member. */
export interface ProfileRow {
  id: string;
  cowboy_id: number | null;
  username: string | null;
  display_name: string | null;
  preferred_name: string | null;
  bio: string | null;
  personal_statement: string | null;
  phone: string | null;
  email_contact: string | null;
  company: string | null;
  role: string | null;
  address: string | null;
  website: string | null;
  avatar_url: string | null;
  profile_public: boolean | null;
  is_admin?: boolean | null;
  updated_at?: string | null;
}

/**
 * The slim shape the directory sends to the browser. Deliberately excludes
 * contact details (email, phone, website, bio) — those load only on a
 * member's profile page, after a server-side visibility check.
 */
export interface DirectoryMember {
  id: number;
  name: string;
  preferredName: string | null;
  newManYear: number | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  avatarUrl: string | null;
  deceased: boolean;
  hasProfile: boolean;
  updatedAt: string | null;
  searchText: string;
}

export interface Viewer {
  userId: string;
  email: string;
  isAdmin: boolean;
  profile: ProfileRow | null;
  firstName: string | null;
  displayName: string;
}

/** How much of a member's profile the current viewer is allowed to see. */
export type ProfileAccess =
  | "shared" // member shared their profile with fellow Cowboys
  | "self" // the viewer is looking at their own record
  | "admin" // admin viewing a profile the member has not shared
  | "none"; // no profile, or not shared — roster information only

export interface LinkableRecord {
  id: number;
  name: string;
  new_man_year: number | null;
  company: string | null;
  city: string | null;
  state: string | null;
}
