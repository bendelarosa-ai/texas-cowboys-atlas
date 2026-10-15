"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DirectoryMember } from "@/lib/types";
import type { CompletionItem } from "@/lib/completion";
import { matchesTokens, normalize, suggestByName, tokenize } from "@/lib/search";
import FilterMenu, { type FilterOption } from "./FilterMenu";
import { MemberCard, MemberRow } from "./MemberCard";

const FILTERS = [
  { key: "year", label: "New Man year" },
  { key: "industry", label: "Industry" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "company", label: "Company" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];
type Filters = Record<FilterKey, string>;
const FILTER_KEYS = FILTERS.map((f) => f.key) as FilterKey[];

const SORTS = {
  name: "Last name (A–Z)",
  "year-desc": "New Man year (newest)",
  "year-asc": "New Man year (oldest)",
  updated: "Recently updated profiles",
} as const;
type SortKey = keyof typeof SORTS;
type ViewMode = "grid" | "list";

const PAGE = 90;
const SCROLL_KEY = "tc_dir_position";
const NAME_SUFFIX = /^(jr|sr|ii|iii|iv|v)\.?$/i;

function sortName(name: string): string {
  const parts = name.replace(/,/g, "").split(/\s+/);
  while (parts.length > 1 && NAME_SUFFIX.test(parts[parts.length - 1])) parts.pop();
  const last = parts.pop() ?? "";
  return `${last} ${parts.join(" ")}`.toLowerCase();
}

function facetValue(m: DirectoryMember, key: FilterKey): string | null {
  switch (key) {
    case "year":
      return m.newManYear ? String(m.newManYear) : null;
    case "industry":
      return m.industry;
    case "state":
      return m.state;
    case "city":
      return m.city ? (m.state ? `${m.city}, ${m.state}` : m.city) : null;
    case "company":
      return m.company;
  }
}

interface Props {
  members: DirectoryMember[];
  viewer: { firstName: string | null; email: string; ownMemberId: number | null };
  prompt: { percent: number; next: CompletionItem | null } | null;
}

export default function DirectoryView({ members, viewer, prompt }: Props) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>(() => {
    const f = {} as Filters;
    for (const k of FILTER_KEYS) f[k] = params.get(k) ?? "";
    return f;
  });
  const [sort, setSort] = useState<SortKey>(() => {
    const s = params.get("sort");
    return s && s in SORTS ? (s as SortKey) : "name";
  });
  const [view, setView] = useState<ViewMode>(() => (params.get("view") === "list" ? "list" : "grid"));
  const [limit, setLimit] = useState(PAGE);
  const [showPrompt, setShowPrompt] = useState(!!prompt);

  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const restoring = useRef(false);

  const deferredQuery = useDeferredValue(query);
  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);

  // Normalized facet values and sort keys, computed once per member.
  const prepared = useMemo(
    () =>
      members.map((m) => {
        const facets = {} as Record<FilterKey, { key: string; label: string } | null>;
        for (const k of FILTER_KEYS) {
          const v = facetValue(m, k);
          facets[k] = v ? { key: normalize(v), label: v } : null;
        }
        return { m, facets, sortName: sortName(m.name) };
      }),
    [members]
  );

  // One pass: results + faceted counts (each filter's counts respect the others).
  const { results, facetCounts } = useMemo(() => {
    const wanted = {} as Partial<Record<FilterKey, string>>;
    for (const k of FILTER_KEYS) if (filters[k]) wanted[k] = normalize(filters[k]);

    const facetCounts = {} as Record<FilterKey, Map<string, FilterOption>>;
    for (const k of FILTER_KEYS) facetCounts[k] = new Map();
    const results: typeof prepared = [];

    for (const row of prepared) {
      if (tokens.length && !matchesTokens(row.m.searchText, tokens)) continue;
      let failures = 0;
      let failedKey: FilterKey | null = null;
      for (const k of FILTER_KEYS) {
        const want = wanted[k];
        if (want !== undefined && row.facets[k]?.key !== want) {
          failures++;
          failedKey = k;
        }
      }
      if (failures === 0) results.push(row);
      if (failures > 1) continue;
      for (const k of FILTER_KEYS) {
        if (failures === 1 && k !== failedKey) continue;
        const f = row.facets[k];
        if (!f) continue;
        const existing = facetCounts[k].get(f.key);
        if (existing) existing.count++;
        else facetCounts[k].set(f.key, { label: f.label, count: 1 });
      }
    }

    results.sort((a, b) => {
      if (sort === "year-desc" || sort === "year-asc") {
        const ay = a.m.newManYear ?? (sort === "year-desc" ? -Infinity : Infinity);
        const by = b.m.newManYear ?? (sort === "year-desc" ? -Infinity : Infinity);
        if (ay !== by) return sort === "year-desc" ? by - ay : ay - by;
      } else if (sort === "updated") {
        const au = a.m.updatedAt ?? "";
        const bu = b.m.updatedAt ?? "";
        if (au !== bu) return bu.localeCompare(au);
      }
      return a.sortName.localeCompare(b.sortName);
    });

    return { results: results.map((r) => r.m), facetCounts };
  }, [prepared, tokens, filters, sort]);

  const options = useMemo(() => {
    const out = {} as Record<FilterKey, FilterOption[]>;
    for (const k of FILTER_KEYS) {
      const list = [...facetCounts[k].values()];
      if (filters[k] && !list.some((o) => normalize(o.label) === normalize(filters[k]))) {
        list.push({ label: filters[k], count: 0 });
      }
      if (k === "year") list.sort((a, b) => Number(b.label) - Number(a.label));
      else if (k === "company") list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
      else list.sort((a, b) => a.label.localeCompare(b.label));
      out[k] = list;
    }
    return out;
  }, [facetCounts, filters]);

  const activeFilters = FILTERS.filter((f) => filters[f.key]);
  const isFiltered = tokens.length > 0 || activeFilters.length > 0;
  const suggestions = useMemo(
    () => (results.length === 0 && tokens.length > 0 ? suggestByName(members, tokens) : []),
    [results.length, tokens, members]
  );

  // ---- URL state (no server round-trip: native history API) ----
  const urlFor = useCallback(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    for (const k of FILTER_KEYS) if (filters[k]) p.set(k, filters[k]);
    if (sort !== "name") p.set("sort", sort);
    if (view !== "grid") p.set("view", view);
    const qs = p.toString();
    return qs ? `/directory?${qs}` : "/directory";
  }, [query, filters, sort, view]);

  const syncUrl = useCallback(() => {
    const next = urlFor();
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", next);
    }
  }, [urlFor]);

  useEffect(() => {
    const t = setTimeout(syncUrl, 250);
    return () => clearTimeout(t);
  }, [syncUrl]);

  // New search or filters start back at the top of the list.
  useEffect(() => {
    if (!restoring.current) setLimit(PAGE);
  }, [tokens, filters, sort]);

  // Restore list length and scroll position when coming back from a profile.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) ?? "null");
      sessionStorage.removeItem(SCROLL_KEY);
      if (saved && saved.url === window.location.pathname + window.location.search) {
        restoring.current = true;
        setLimit(saved.limit ?? PAGE);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            window.scrollTo(0, saved.y ?? 0);
            restoring.current = false;
          })
        );
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  const rememberPosition = useCallback(() => {
    syncUrl();
    try {
      sessionStorage.setItem(
        SCROLL_KEY,
        JSON.stringify({ url: window.location.pathname + window.location.search, y: window.scrollY, limit })
      );
      sessionStorage.setItem("tc_from_directory", "1");
    } catch {
      /* ignore */
    }
  }, [syncUrl, limit]);

  // Progressive rendering: add the next page as the end of the list nears.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || limit >= results.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [limit, results.length]);

  // "/" focuses search from anywhere on the page.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function setFilter(key: FilterKey, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function clearAll() {
    setQuery("");
    setFilters(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])) as Filters);
  }

  function dismissPrompt() {
    setShowPrompt(false);
    document.cookie = `tc_prompt_dismissed=1; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
  }

  const greeting =
    viewer.email.toLowerCase() === "mitchellgreenberg9@gmail.com"
      ? "Welcome Mitchell, you suck at golf!"
      : viewer.firstName
        ? `Welcome back, ${viewer.firstName}.`
        : "Welcome back.";

  const shown = results.slice(0, limit);

  return (
    <>
      {/* Intro + search */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container-app pb-5 pt-8 sm:pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-stone-600">{greeting}</p>
              <h1 className="mt-1 font-serif text-[34px] font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl">
                The Texas Cowboys Network
              </h1>
              <p className="mt-2.5 max-w-2xl font-serif text-[15px] font-semibold uppercase leading-snug tracking-[0.06em] text-stone-900 sm:text-base">
                &ldquo;Give the best you have to Texas, and the best will come back to you.&rdquo;
              </p>
            </div>
            <p className="shrink-0 text-sm text-stone-600 sm:text-right">
              <span className="font-serif text-3xl font-semibold tabular-nums text-stone-900">
                {members.length.toLocaleString()}
              </span>{" "}
              Cowboys since 1922
            </p>
          </div>

          <div className="relative mt-6">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (query) setQuery("");
                  else searchRef.current?.blur();
                }
              }}
              aria-label="Search the directory"
              placeholder="Name, company, title, or city"
              autoComplete="off"
              spellCheck={false}
              className="input h-12 rounded-xl pl-11 pr-12 text-base shadow-[0_1px_2px_rgba(28,25,23,0.04)] [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                aria-label="Clear search"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-stone-300 px-1.5 text-xs text-stone-500 sm:block">
                /
              </kbd>
            )}
          </div>

          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <FilterMenu
                key={f.key}
                label={f.label}
                value={filters[f.key]}
                options={options[f.key]}
                onChange={(v) => setFilter(f.key, v)}
              />
            ))}
          </div>

          {(activeFilters.length > 0 || tokens.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tokens.length > 0 && (
                <span className="chip">
                  <span className="text-stone-500">Search:</span> {query.trim()}
                  <ChipX label="Remove search" onClick={() => setQuery("")} />
                </span>
              )}
              {activeFilters.map((f) => (
                <span key={f.key} className="chip">
                  <span className="text-stone-500">{f.label}:</span> {filters[f.key]}
                  <ChipX label={`Remove ${f.label} filter`} onClick={() => setFilter(f.key, "")} />
                </span>
              ))}
              <button type="button" onClick={clearAll} className="px-1 text-[13px] font-medium text-burnt-dark hover:underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="container-app py-6">
        {showPrompt && prompt && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <ProgressRing percent={prompt.percent} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">Help fellow Cowboys connect with you.</p>
                <p className="text-sm text-stone-600">
                  Your profile is {prompt.percent}% complete{prompt.next ? ` — next: ${prompt.next.label.toLowerCase()}.` : "."}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 pl-[3.75rem] sm:pl-0">
              <Link href={`/profile/edit${prompt.next ? `#${prompt.next.section}` : ""}`} className="btn-primary btn-sm">
                Complete profile
              </Link>
              <button type="button" onClick={dismissPrompt} className="btn-ghost btn-sm">
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-600" aria-live="polite">
            {isFiltered ? (
              <>
                <span className="font-semibold text-stone-900">{results.length.toLocaleString()}</span> of{" "}
                {members.length.toLocaleString()} Cowboys
              </>
            ) : (
              <>
                <span className="font-semibold text-stone-900">{members.length.toLocaleString()}</span> Cowboys
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="sort">Sort</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-stone-300 bg-white pl-3 pr-8 text-sm text-stone-800 focus:border-burnt focus:outline-none focus:ring-2 focus:ring-burnt/20"
            >
              {Object.entries(SORTS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-stone-300 bg-white p-0.5" role="group" aria-label="Layout">
              <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Grid view">
                <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
              </ViewButton>
              <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
                <path d="M3 4h14v2H3V4zm0 5h14v2H3V9zm0 5h14v2H3v-2z" />
              </ViewButton>
            </div>
          </div>
        </div>

        {/* Results */}
        <h2 className="sr-only">Members</h2>
        {members.length === 0 ? (
          <Empty title="The directory is empty" body="No member records have been loaded yet." />
        ) : results.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <p className="font-serif text-2xl font-semibold text-stone-900">
              {tokens.length ? <>No Cowboys match &ldquo;{query.trim()}&rdquo;</> : "No Cowboys match these filters"}
            </p>
            {suggestions.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm text-stone-600">Did you mean</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button key={s.id} type="button" className="chip hover:border-burnt/50" onClick={() => setQuery(s.name)}>
                      {s.name}
                      {s.newManYear ? <span className="text-stone-500">’{String(s.newManYear).slice(2)}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
                Try a shorter search, a different spelling, or fewer filters. Not every member has listed a company or city yet.
              </p>
            )}
            <div className="mt-6 flex justify-center gap-2">
              {activeFilters.length > 0 && tokens.length > 0 && (
                <button type="button" className="btn-secondary" onClick={() => setFilters(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])) as Filters)}>
                  Keep search, clear filters
                </button>
              )}
              <button type="button" className="btn-primary" onClick={clearAll}>Clear search and filters</button>
            </div>
          </div>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((m) => (
              <li key={m.id}>
                <MemberCard member={m} isSelf={m.id === viewer.ownMemberId} onNavigate={rememberPosition} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[2.5rem,minmax(0,2fr),minmax(0,2.2fr),minmax(0,1.4fr)] gap-x-3.5 border-b border-stone-200 bg-stone-50 px-4 py-2 md:grid lg:grid-cols-[2.5rem,minmax(0,2fr),minmax(0,2.2fr),minmax(0,1.4fr),minmax(0,1.3fr)]">
              <span />
              <span className="section-label">Name</span>
              <span className="section-label">Work</span>
              <span className="section-label">Location</span>
              <span className="section-label hidden lg:block">Industry</span>
            </div>
            <ul className="divide-y divide-stone-100">
              {shown.map((m) => (
                <li key={m.id}>
                  <MemberRow member={m} isSelf={m.id === viewer.ownMemberId} onNavigate={rememberPosition} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {limit < results.length && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            <button type="button" className="btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({(results.length - limit).toLocaleString()} remaining)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function ChipX({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="-mr-1 rounded-full p-0.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900">
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    </button>
  );
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`rounded-md p-1.5 transition-colors ${active ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">{children}</svg>
    </button>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-11 w-11 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 40 40" className="h-11 w-11 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-stone-200" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-burnt" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-stone-800">{percent}%</span>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-serif text-2xl font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}
