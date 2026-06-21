"use client";

import { useMemo, useState } from "react";
import type { Cowboy } from "@/types/cowboy";
import MemberCard from "./MemberCard";
import MemberModal from "./MemberModal";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PublicProfile {
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
}

interface Props {
  members: Cowboy[];
  industries: string[];
  years: number[];
  states: string[];
  userEmail: string;
  username: string | null;
  publicProfiles: Record<number, PublicProfile>;
  isAdmin: boolean;
  firstName: string | null;
}

export default function DirectoryClient({ members, industries, years, states, userEmail, username, publicProfiles, isAdmin, firstName }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [year, setYear] = useState("");
  const [state, setState] = useState("");
  const [selectedMember, setSelectedMember] = useState<Cowboy | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (q && !`${m.name} ${m.company} ${m.role}`.toLowerCase().includes(q)) return false;
      if (industry && m.industry !== industry) return false;
      if (year && m.new_man_year !== Number(year)) return false;
      if (state && m.state !== state) return false;
      return true;
    });
  }, [members, search, industry, year, state]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleCardClick(member: Cowboy) {
    if (publicProfiles[member.id]) {
      setSelectedMember(member);
    }
  }

  const selectClass = "px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-burnt focus:border-transparent";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/directory" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-burnt flex items-center justify-center">
              <span className="text-white text-sm font-bold">TC</span>
            </div>
            <div>
              <p className="font-semibold text-stone-900 leading-tight">1922</p>
              <p className="text-xs text-stone-400 leading-tight">Texas Cowboys</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-stone-600 hover:text-burnt font-medium transition-colors hidden sm:block">
              {username ? `@${username}` : userEmail}
            </Link>
            <button onClick={handleSignOut} className="text-sm text-stone-600 hover:text-burnt font-medium transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, company, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-burnt focus:border-transparent"
          />
          <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
            <option value="">All Industries</option>
            {industries.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
            <option value="">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => { setSearch(""); setIndustry(""); setYear(""); setState(""); }}
            className="px-4 py-2 text-sm font-medium text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap"
          >
            Reset
          </button>
        </div>

        {firstName && (
          <p className="text-2xl font-semibold text-burnt mb-4">Welcome {firstName}!</p>
        )}
        <p className="text-sm text-stone-500 mb-4">
          {filtered.length} {filtered.length === 1 ? "member" : "members"}
          {filtered.length !== members.length && ` of ${members.length}`}
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">No members match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                hasPublicProfile={!!publicProfiles[m.id]}
                onClick={() => handleCardClick(m)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedMember && publicProfiles[selectedMember.id] && (
        <MemberModal
          member={selectedMember}
          profile={publicProfiles[selectedMember.id]}
          onClose={() => setSelectedMember(null)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
