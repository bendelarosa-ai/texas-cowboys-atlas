/**
 * Sample data for local UI preview only (UI_PREVIEW=1 in development).
 * Every name, company and contact detail here is invented.
 */
import type { Cowboy } from "@/types/cowboy";
import type { DirectoryMember, LinkableRecord, ProfileAccess, ProfileRow, Viewer } from "./types";
import { latestProfileByCowboy, toDirectoryMember } from "./directory";

const FIRST = ["James", "Robert", "John", "Michael", "William", "David", "Richard", "Thomas", "Charles", "Daniel", "Matthew", "Andrew", "Ryan", "Tyler", "Travis", "Garrett", "Colton", "Hayden", "Parker", "Reid", "Wyatt", "Carson", "Graham", "Hunter", "Preston", "Sam", "Luke", "Cole"];
const LAST = ["Abbott", "Baker", "Caldwell", "Dawson", "Ellis", "Fletcher", "Garza", "Hale", "Irwin", "Jennings", "Keller", "Lowry", "Mercer", "Navarro", "Owens", "Pruitt", "Quinn", "Ramsey", "Sutton", "Thornton", "Vance", "Whitaker", "Yates", "Castillo", "McAllister", "Villarreal", "Holloway", "Kincaid"];
const PLACES: [string | null, string | null][] = [
  ["Austin", "TX"], ["Dallas", "TX"], ["Houston", "TX"], ["San Antonio", "TX"], ["Fort Worth", "TX"],
  ["New York", "NY"], ["Denver", "CO"], ["Nashville", "TN"], ["Chicago", "IL"], ["Midland", "TX"],
  ["Los Angeles", "CA"], [null, null],
];
const WORK: Record<string, [string, string][]> = {
  Finance: [["Managing Director", "Hilltop Securities"], ["Portfolio Manager", "Teacher Retirement System of Texas"], ["Vice President", "J.P. Morgan"]],
  Law: [["Partner", "Vinson & Elkins"], ["Associate", "Baker Botts"], ["General Counsel", "Haynes Boone"]],
  Energy: [["Landman", "Pioneer Natural Resources"], ["Petroleum Engineer", "Diamondback Energy"], ["VP of Operations", "ExxonMobil"]],
  "Real Estate": [["Principal", "Stream Realty Partners"], ["Developer", "Hines"]],
  Healthcare: [["Orthopedic Surgeon", "Texas Orthopedics"], ["Physician", "Baylor Scott & White"]],
  Technology: [["Product Manager", "Dell Technologies"], ["Founder & CEO", "Lonestar Labs"], ["Software Engineer", "Apple"]],
  Consulting: [["Engagement Manager", "McKinsey & Company"], ["Senior Consultant", "Deloitte"]],
  Government: [["Chief of Staff", "Texas State Senate"], ["Assistant District Attorney", "Travis County"]],
  "Ranching & Agriculture": [["Owner", "Kincaid Ranch"], ["Operations Manager", "King Ranch"]],
};
const INDUSTRIES = [...Object.keys(WORK), null];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function build() {
  const rand = rng(1922);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const cowboys: Cowboy[] = [];
  const profiles: ProfileRow[] = [];

  cowboys.push({
    id: 1, name: "Ben DeLaRosa", new_man_year: 2024, city: "Austin", state: "TX",
    industry: "Technology", industry_source: null, org: "McCombs School of Business", major: "Finance",
    grad_school: null, high_school: "Westlake High School", company: null, role: null,
    linkedin: null, deceased: false, obit: null,
  });
  profiles.push({
    id: "viewer", cowboy_id: 1, username: "bendelarosa", display_name: "Ben DeLaRosa", preferred_name: "Ben",
    bio: null, personal_statement: null, phone: null, email_contact: null, company: "Lonestar Labs",
    role: "Founder", address: null, website: null, avatar_url: null, profile_public: false,
    is_admin: false, updated_at: "2026-10-01T12:00:00Z",
  });

  for (let id = 2; id <= 64; id++) {
    const year = 1958 + Math.floor(rand() * 67);
    const industry = pick(INDUSTRIES);
    const job = industry && rand() > 0.15 ? pick(WORK[industry]) : null;
    const [city, state] = pick(PLACES);
    const deceased = year < 1972 && rand() > 0.55;
    cowboys.push({
      id,
      name: `${pick(FIRST)} ${pick(LAST)}${id === 7 ? "-Whitmore Jr." : ""}`,
      new_man_year: id === 30 ? null : year,
      city, state, industry, industry_source: null,
      org: rand() > 0.6 ? "Plan II Honors" : null,
      major: rand() > 0.5 ? pick(["Government", "Finance", "Petroleum Engineering", "History", "Economics"]) : null,
      grad_school: rand() > 0.75 ? "UT School of Law" : null,
      high_school: null,
      company: job ? job[1] : null,
      role: job ? job[0] : null,
      linkedin: deceased ? "https://www.legacy.com/obituaries/example" : rand() > 0.6 ? "https://www.linkedin.com/in/example" : null,
      deceased,
      obit: null,
    });
    if (!deceased && id % 3 === 0) {
      profiles.push({
        id: `p${id}`, cowboy_id: id, username: `member${id}`, display_name: null,
        preferred_name: id % 9 === 0 ? "Trey" : null,
        bio: "Proud Cowboy, father of three, and still a regular at Royal-Memorial on Saturdays.",
        personal_statement: id % 6 === 0 ? "Always happy to talk with younger Cowboys about careers in my field — reach out anytime.\n\nHook 'em." : null,
        phone: id % 2 === 0 ? "(512) 555-01" + String(id).padStart(2, "0") : null,
        email_contact: `member${id}@example.com`,
        company: null, role: null, address: null,
        website: id % 4 === 0 ? "https://example.com" : null,
        avatar_url: null,
        profile_public: id !== 12,
        updated_at: `2026-0${(id % 9) + 1}-15T12:00:00Z`,
      });
    }
  }
  return { cowboys, profiles };
}

const data = build();

export const viewer: Viewer = {
  userId: "viewer",
  email: "ben@example.com",
  isAdmin: false,
  profile: data.profiles[0],
  firstName: "Ben",
  displayName: "Ben DeLaRosa",
};

export function directory(): DirectoryMember[] {
  const visible = data.profiles.filter((p) => p.profile_public);
  const byCowboy = latestProfileByCowboy(visible);
  return [...data.cowboys]
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
    .map((c) => toDirectoryMember(c, byCowboy.get(c.id)));
}

export function member(id: number, v: Viewer): { cowboy: Cowboy; profile: ProfileRow | null; access: ProfileAccess } | null {
  const cowboy = data.cowboys.find((c) => c.id === id);
  if (!cowboy) return null;
  const isSelf = v.profile?.cowboy_id === id;
  const profile = data.profiles.find((p) => p.cowboy_id === id && (isSelf || v.isAdmin || p.profile_public)) ?? null;
  const access: ProfileAccess = !profile ? "none" : isSelf ? "self" : profile.profile_public ? "shared" : "admin";
  return { cowboy, profile, access };
}

export function roster(id: number | null): Cowboy | null {
  return data.cowboys.find((c) => c.id === id) ?? null;
}

export function linkable(v: Viewer): { records: LinkableRecord[]; claimedIds: number[] } {
  return {
    records: data.cowboys.map(({ id, name, new_man_year, company, city, state }) => ({ id, name: name ?? "", new_man_year, company, city, state })),
    claimedIds: data.profiles.filter((p) => p.id !== v.userId && p.cowboy_id).map((p) => p.cowboy_id as number),
  };
}
