# Texas Cowboys Network — redesign notes

## Structure

| Route | Purpose |
|---|---|
| `/login` | Sign in (unchanged design) |
| `/directory` | Search, filter, sort and browse every member |
| `/directory/[id]` | A member's profile (roster record + their shared profile) |
| `/profile` | My Profile: completion, sharing status, preview of what others see |
| `/profile/edit` | Edit profile, privacy and account settings |
| `/chat` | Ask AI |

All signed-in pages live in the `app/(app)` route group and share one header
(`components/shell`). Every database read goes through `lib/data.ts`, so the
visibility rules live in one place:

- **Directory list** gets a slim record per member — never email, phone, bio or website.
- **Member page** shows the full profile only when the member shared it, it's the
  viewer's own, or the viewer is an admin (shown with an "admin view" notice).
- Large tables are paged through in 1,000-row chunks (PostgREST's default cap),
  so the directory keeps working past 1,000 members.

## Design system

Defined in `app/globals.css` and `tailwind.config.ts`: Inter for UI text,
Cormorant Garamond only for display headings and the motto, burnt orange
(`#BF5700`) as an accent for primary actions and active states. Text colours
are limited to stone-900/700/600/500 to meet WCAG AA; stone-400 is decorative only.
Shared classes: `btn-primary`, `btn-secondary`, `btn-ghost`, `input`, `field-label`,
`field-hint`, `field-error`, `card`, `chip`, `badge-*`, `section-label`, `skeleton`.

## Directory behaviour

- Search matches every word you type across name, preferred name, title, company,
  city, state (abbreviation or full name), industry, organization, major and
  New Man year. No results → "Did you mean…" by name, with typo tolerance.
- Filters (New Man year, industry, state, city, company) are searchable and show
  counts that respect the other active filters.
- Search, filters, sort and grid/list view are kept in the URL. Opening a profile
  and pressing "Back to results" restores the list and scroll position.
- Results render progressively (90 at a time) to stay fast as membership grows.

## Previewing without a database

For UI work only: create `.env.development.local` containing `UI_PREVIEW=1` and run
`npm run dev`. The app then uses invented sample members (`lib/fixtures.ts`), skips
login, and shows a "Sample data" badge. This mode is impossible in production
builds (it requires `NODE_ENV=development`). Delete the file to return to real data.

## Proposed database changes (not applied)

See `supabase/proposed/001_integrity_and_visibility.sql`:
one account per directory record, per-field contact visibility,
member-editable industry/LinkedIn, and an avatar delete policy.

## Feature opportunities (evaluated, not built)

| Feature | Benefit | Complexity | Recommendation |
|---|---|---|---|
| Discovery by location / industry | High — the core "who's in Dallas / in energy" questions | Low — filters already support it; landing pages are a thin layer | **Now-ish**: add "Browse by city/industry" shortcuts |
| Admin tools for incomplete records | High — data quality drives everything else | Medium — admin-only views + editing roster rows | **Next** |
| Member-reported corrections | High — roster data ages; members know their own facts | Low–medium — a "Suggest a correction" form emailing admins | **Next** |
| Profile update reminders | Medium — keeps data fresh | Medium — needs scheduled email + unsubscribe | Later, after email setup |
| Recently viewed profiles | Medium — speeds re-finding people | Low — local to the browser | Later |
| Saved / bookmarked alumni | Medium | Medium — new table + RLS | Later |
| Profile verification | Medium — trust for claimed records | Medium — admin approval flow; pairs with the unique-link constraint | Later (do the constraint first) |
| Sharing a profile link with a member | Low–medium | Low — `/directory/[id]` URLs already work for signed-in members | Already possible |
| Featured alumni / spotlight | Low–medium — engagement | Low technically, ongoing editorial effort | Only with an owner |
| More detailed career history | Medium | High — new tables, editing UI | Later |
| Introduction / connection requests | Medium | High — messaging, notifications, moderation | Not now — risks becoming a social network |
