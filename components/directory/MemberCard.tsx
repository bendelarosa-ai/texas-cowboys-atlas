import Link from "next/link";
import type { DirectoryMember } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

interface Props {
  member: DirectoryMember;
  isSelf: boolean;
  onNavigate: () => void;
}

function YearLine({ m, isSelf }: { m: DirectoryMember; isSelf: boolean }) {
  return (
    <p className="flex items-center gap-2 text-[13px]">
      {m.newManYear ? <span className="font-medium text-burnt-dark">New Man {m.newManYear}</span> : null}
      {m.deceased && <span className="text-stone-500">In Memoriam</span>}
      {isSelf && <span className="badge-neutral">You</span>}
    </p>
  );
}

/** Grid card: photo, name, New Man year, title · company, location. */
export function MemberCard({ member: m, isSelf, onNavigate }: Props) {
  const work = [m.title, m.company].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/directory/${m.id}`}
      prefetch={false}
      onClick={onNavigate}
      className="group flex h-full items-start gap-3.5 rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-[0_2px_8px_rgba(28,25,23,0.06)]"
    >
      <Avatar name={m.name} src={m.avatarUrl} size="md" muted={m.deceased} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold leading-snug text-stone-900 group-hover:text-burnt-dark">
          {m.name}
        </h3>
        <YearLine m={m} isSelf={isSelf} />
        {work && <p className="mt-1.5 truncate text-sm text-stone-700">{work}</p>}
        {m.location && <p className="truncate text-[13px] text-stone-500">{m.location}</p>}
      </div>
    </Link>
  );
}

/** Dense list row for scanning many members quickly. */
export function MemberRow({ member: m, isSelf, onNavigate }: Props) {
  const work = [m.title, m.company].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/directory/${m.id}`}
      prefetch={false}
      onClick={onNavigate}
      className="group grid grid-cols-[auto,minmax(0,1fr)] items-center gap-x-3.5 px-4 py-3 transition-colors hover:bg-stone-50 md:grid-cols-[auto,minmax(0,2fr),minmax(0,2.2fr),minmax(0,1.4fr)] lg:grid-cols-[auto,minmax(0,2fr),minmax(0,2.2fr),minmax(0,1.4fr),minmax(0,1.3fr)]"
    >
      <Avatar name={m.name} src={m.avatarUrl} size="sm" muted={m.deceased} />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold text-stone-900 group-hover:text-burnt-dark">{m.name}</p>
        <YearLine m={m} isSelf={isSelf} />
        {/* On small screens, work and location fold under the name. */}
        {(work || m.location) && (
          <p className="truncate text-[13px] text-stone-600 md:hidden">{[work, m.location].filter(Boolean).join(" — ")}</p>
        )}
      </div>
      <p className="hidden truncate text-sm text-stone-700 md:block">{work || <Dash />}</p>
      <p className="hidden truncate text-sm text-stone-600 md:block">{m.location || <Dash />}</p>
      <p className="hidden truncate text-sm text-stone-600 lg:block">{m.industry || <Dash />}</p>
    </Link>
  );
}

function Dash() {
  return <span className="text-stone-300" aria-label="Not listed">—</span>;
}
