import type { Cowboy } from "@/types/cowboy";

const OBIT_DOMAINS = [
  "legacy.com", "findagrave.com", "tributearchive.com", "tributes.com",
  "dignitymemorial.com", "obituaries.com", "obits.com", "everhere.com",
  "forevermissed.com", "funeral", "mortuary", "chapel", "obituary",
];

function classifyUrl(url: string): "linkedin" | "obituary" | "link" {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return "linkedin";
  if (OBIT_DOMAINS.some((d) => lower.includes(d))) return "obituary";
  return "link";
}

function normalizeUrl(url: string) {
  return url.startsWith("http") ? url : `https://${url}`;
}

interface Props {
  member: Cowboy;
  hasPublicProfile?: boolean;
  onClick?: () => void;
}

export default function MemberCard({ member: m, hasPublicProfile, onClick }: Props) {
  const location = [m.city, m.state].filter(Boolean).join(", ");
  const education = [m.major, m.grad_school].filter((v) => v && v.trim()).join(" · ");

  const linkedinField = m.linkedin?.trim() || null;
  const kind = linkedinField ? classifyUrl(linkedinField) : null;

  const obituaryUrl = m.obit?.trim() || (kind === "obituary" ? linkedinField : null);
  const linkedinUrl = kind === "linkedin" ? linkedinField : null;
  const externalUrl = kind === "link" ? linkedinField : null;

  return (
    <div
      className={`relative bg-white rounded-xl border p-5 flex flex-col gap-2 shadow-sm transition-shadow ${m.deceased ? "border-stone-300 opacity-80" : "border-stone-200"} ${hasPublicProfile ? "cursor-pointer hover:shadow-md hover:border-burnt/30" : "hover:shadow-md"}`}
      onClick={hasPublicProfile ? onClick : undefined}
    >
      {m.deceased && (
        <span className="absolute top-4 right-4 text-xs font-semibold bg-stone-100 text-stone-500 border border-stone-300 rounded-full px-2 py-0.5">
          In Memoriam
        </span>
      )}

      {hasPublicProfile && !m.deceased && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-burnt" title="Profile available" />
      )}

      <div className="pr-6">
        <h3 className="font-semibold text-stone-900 leading-snug">{m.name ?? "—"}</h3>
        {m.new_man_year && (
          <p className="text-xs text-burnt font-medium mt-0.5">New Man {m.new_man_year}</p>
        )}
      </div>

      {(m.role || m.company) && (
        <p className="text-sm text-stone-700">{[m.role, m.company].filter(Boolean).join(" · ")}</p>
      )}

      {location && <p className="text-sm text-stone-500">{location}</p>}

      {m.industry && (
        <span className="self-start text-xs bg-burnt/10 text-burnt font-medium rounded-full px-2 py-0.5">
          {m.industry}
        </span>
      )}

      {m.org && <p className="text-xs text-stone-400">{m.org}</p>}
      {education && <p className="text-xs text-stone-400 italic">{education}</p>}

      <div className="mt-auto pt-2 border-t border-stone-100 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
        {linkedinUrl && (
          <a href={normalizeUrl(linkedinUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-burnt hover:text-burnt-dark transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        )}
        {obituaryUrl && (
          <a href={normalizeUrl(obituaryUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Obituary
          </a>
        )}
        {externalUrl && (
          <a href={normalizeUrl(externalUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Link
          </a>
        )}
        {hasPublicProfile && (
          <span className="text-xs text-burnt/70 font-medium">View profile →</span>
        )}
      </div>
    </div>
  );
}
