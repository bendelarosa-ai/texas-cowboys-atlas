import type { DirectoryMember } from "./types";

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildSearchText(parts: (string | number | null | undefined)[]): string {
  return ` ${normalize(parts.filter((p) => p !== null && p !== undefined && p !== "").join(" "))} `;
}

export function tokenize(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean);
}

/** Every token must appear somewhere in the member's searchable text. */
export function matchesTokens(searchText: string, tokens: string[]): boolean {
  for (const t of tokens) {
    if (!searchText.includes(t)) return false;
  }
  return true;
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * "Did you mean…" for names: when a search finds nothing, return members whose
 * name words are within a small edit distance of every query word.
 */
export function suggestByName(members: DirectoryMember[], tokens: string[], limit = 5): DirectoryMember[] {
  const words = tokens.filter((t) => t.length >= 3 && !/^\d+$/.test(t));
  if (words.length === 0) return [];
  const scored: { m: DirectoryMember; score: number }[] = [];
  for (const m of members) {
    const nameWords = normalize(`${m.name} ${m.preferredName ?? ""}`).split(" ");
    let total = 0;
    let ok = true;
    for (const w of words) {
      // Short words allow one typo; longer ones two (e.g. "abot" → "abbott").
      const max = w.length <= 3 ? 1 : 2;
      let best = max + 1;
      for (const nw of nameWords) {
        best = Math.min(best, editDistance(w, nw, max));
        if (best === 0) break;
      }
      if (best > max) { ok = false; break; }
      total += best;
    }
    if (ok) scored.push({ m, score: total });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.m.name.localeCompare(b.m.name))
    .slice(0, limit)
    .map((s) => s.m);
}
