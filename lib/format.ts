/** Trim a nullable string; empty strings become null. */
export function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}

const OBITUARY_HINTS = [
  "legacy.com", "findagrave.com", "tributearchive.com", "tributes.com",
  "dignitymemorial.com", "obituaries.com", "obits.com", "everhere.com",
  "forevermissed.com", "funeral", "mortuary", "chapel", "obituary",
];

/** The roster's `linkedin` column sometimes holds obituary or other links. */
export function classifyLink(url: string): "linkedin" | "obituary" | "link" {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin";
  if (OBITUARY_HINTS.some((h) => lower.includes(h))) return "obituary";
  return "link";
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function firstWord(name: string | null | undefined): string | null {
  return clean(name)?.split(/\s+/)[0] ?? null;
}

export function joinLocation(city: string | null | undefined, state: string | null | undefined): string | null {
  return clean([clean(city), clean(state)].filter(Boolean).join(", "));
}

/** A free-text location that looks like a street address (has a house number). */
export function looksLikeStreetAddress(value: string): boolean {
  return /\d/.test(value);
}

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export function stateName(abbr: string | null | undefined): string | null {
  const key = clean(abbr)?.toUpperCase();
  return key ? US_STATES[key] ?? null : null;
}
