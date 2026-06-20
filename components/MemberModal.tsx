"use client";

import type { Cowboy } from "@/types/cowboy";

interface PublicProfile {
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
  profile_public?: boolean | null;
}

interface Props {
  member: Cowboy;
  profile: PublicProfile;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function MemberModal({ member: m, profile: p, onClose, isAdmin }: Props) {
  const name = p.display_name || p.preferred_name || m.name || "—";
  const location = p.address || [m.city, m.state].filter(Boolean).join(", ");
  const company = p.company || m.company;
  const role = p.role || m.role;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-burnt/5 border-b border-stone-100 p-6 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-stone-200 overflow-hidden shrink-0">
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl font-bold bg-burnt/10">
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-900">{name}</h2>
            {p.preferred_name && p.display_name && p.preferred_name !== p.display_name && (
              <p className="text-sm text-stone-400">"{p.preferred_name}"</p>
            )}
            {m.new_man_year && (
              <p className="text-xs text-burnt font-semibold mt-0.5">New Man {m.new_man_year}</p>
            )}
            {(role || company) && (
              <p className="text-sm text-stone-600 mt-1">{[role, company].filter(Boolean).join(" · ")}</p>
            )}
            {location && <p className="text-sm text-stone-400 mt-0.5">{location}</p>}
          </div>
          {isAdmin && !p.profile_public && (
            <span className="absolute top-3 left-3 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5">
              Private — admin view
            </span>
          )}
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Bio */}
          {p.bio && (
            <p className="text-sm text-stone-600 italic">{p.bio}</p>
          )}

          {/* Personal statement */}
          {p.personal_statement && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Personal Statement</h3>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{p.personal_statement}</p>
            </div>
          )}

          {/* Contact info */}
          {(p.email_contact || p.phone || p.website) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Contact</h3>
              <div className="space-y-1.5">
                {p.email_contact && (
                  <a href={`mailto:${p.email_contact}`} className="flex items-center gap-2 text-sm text-burnt hover:underline">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    {p.email_contact}
                  </a>
                )}
                {p.phone && (
                  <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-sm text-stone-700 hover:text-burnt">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    {p.phone}
                  </a>
                )}
                {p.website && (
                  <a href={p.website.startsWith("http") ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-burnt hover:underline">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
                    </svg>
                    {p.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Directory info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Directory Info</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {([
                ["Industry", m.industry],
                ["Org", m.org],
                ["Major", m.major],
                ["Grad School", m.grad_school],
                ["High School", m.high_school],
              ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-stone-400">{label}</dt>
                  <dd className="text-stone-700">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Links */}
          {m.linkedin && (
            <div className="pt-2 border-t border-stone-100">
              <a
                href={m.linkedin.startsWith("http") ? m.linkedin : `https://${m.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-burnt hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
