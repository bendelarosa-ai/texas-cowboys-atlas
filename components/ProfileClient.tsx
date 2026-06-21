"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Cowboy } from "@/types/cowboy";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  cowboy_id: number | null;
  personal_statement: string | null;
  profile_public: boolean | null;
  preferred_name: string | null;
  phone: string | null;
  email_contact: string | null;
  company: string | null;
  role: string | null;
  address: string | null;
  website: string | null;
  avatar_url: string | null;
}

interface Props {
  userId: string;
  email: string;
  profile: Profile | null;
  cowboys: Cowboy[];
  linkedCowboy: Cowboy | null;
}

export default function ProfileClient({ userId, email, profile, cowboys, linkedCowboy }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [cowboyId, setCowboyId] = useState<number | null>(profile?.cowboy_id ?? null);
  const [search, setSearch] = useState("");

  // Extended fields
  const [profilePublic, setProfilePublic] = useState(profile?.profile_public ?? false);
  const [personalStatement, setPersonalStatement] = useState(profile?.personal_statement ?? "");
  const [preferredName, setPreferredName] = useState(profile?.preferred_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [emailContact, setEmailContact] = useState(profile?.email_contact ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");
  const [role, setRole] = useState(profile?.role ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredCowboys = cowboys.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );
  const selectedCowboy = cowboys.find((c) => c.id === cowboyId) ?? null;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setError("Photo upload failed: " + uploadError.message);
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username: username.trim().toLowerCase().replace(/\s+/g, "_"),
      display_name: displayName.trim(),
      bio: bio.trim(),
      cowboy_id: cowboyId,
      profile_public: profilePublic,
      personal_statement: personalStatement.trim(),
      preferred_name: preferredName.trim(),
      phone: phone.trim(),
      email_contact: emailContact.trim(),
      company: company.trim(),
      role: role.trim(),
      address: address.trim(),
      website: website.trim(),
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setError(error.message.includes("unique") ? "That username is already taken." : error.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const inputClass = "w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-burnt focus:border-transparent";

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
            <Link href="/directory" className="text-sm text-stone-600 hover:text-burnt font-medium transition-colors">
              Directory
            </Link>
            <button onClick={handleSignOut} className="text-sm text-stone-600 hover:text-burnt font-medium transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 mb-1">Your Profile</h1>
          <p className="text-sm text-stone-500">{email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* Photo */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="font-semibold text-stone-800 mb-4">Photo</h2>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl font-bold">
                    {(displayName || email)[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload Photo"}
                </button>
                {avatarUrl && (
                  <button type="button" onClick={() => setAvatarUrl("")} className="block text-xs text-stone-400 hover:text-red-500 transition-colors">
                    Remove photo
                  </button>
                )}
                <p className="text-xs text-stone-400">JPG, PNG, or GIF. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-stone-800">Account</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
              <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-burnt focus-within:border-transparent">
                <span className="px-3 py-2 bg-stone-50 text-stone-400 text-sm border-r border-stone-300">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 px-3 py-2 text-stone-900 text-sm focus:outline-none"
                  placeholder="yourname"
                  pattern="[a-zA-Z0-9_]+"
                  title="Letters, numbers, and underscores only"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Preferred Name</label>
              <input type="text" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} className={inputClass} placeholder="Nickname or preferred name" />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-stone-800">Contact & Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Contact Email</label>
                <input type="email" value={emailContact} onChange={(e) => setEmailContact(e.target.value)} className={inputClass} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Company</label>
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="Where you work" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Role / Title</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} placeholder="Your title" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="City, State or full address" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-1">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://yoursite.com" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-stone-800">About You</h2>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={inputClass + " resize-none"} placeholder="Short bio" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Personal Statement</label>
              <textarea value={personalStatement} onChange={(e) => setPersonalStatement(e.target.value)} rows={4} className={inputClass + " resize-none"} placeholder="Anything you'd like other members to know about you…" />
            </div>
          </div>

          {/* Link to cowboys record */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-stone-800">Link to Your Directory Record</h2>
              <p className="text-xs text-stone-400 mt-0.5">Connect your account to your entry in the Cowboys directory.</p>
            </div>
            {selectedCowboy ? (
              <div className="flex items-start justify-between gap-4 p-4 bg-burnt/5 border border-burnt/20 rounded-xl">
                <div>
                  <p className="font-semibold text-stone-900">{selectedCowboy.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {[`New Man ${selectedCowboy.new_man_year}`, selectedCowboy.company, [selectedCowboy.city, selectedCowboy.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button type="button" onClick={() => { setCowboyId(null); setSearch(""); }} className="text-xs text-stone-400 hover:text-red-500 transition-colors shrink-0">
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your name…"
                  className={inputClass}
                />
                {search && (
                  <div className="border border-stone-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-stone-100">
                    {filteredCowboys.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-stone-400">No matches found.</p>
                    ) : (
                      filteredCowboys.slice(0, 20).map((c) => (
                        <button key={c.id} type="button" onClick={() => { setCowboyId(c.id); setSearch(""); }} className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors">
                          <p className="text-sm font-medium text-stone-900">{c.name}</p>
                          <p className="text-xs text-stone-400">
                            {[`New Man ${c.new_man_year}`, c.company, [c.city, c.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Directory info read-only */}
          {linkedCowboy && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-stone-800">Your Directory Info</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {([
                  ["New Man Year", linkedCowboy.new_man_year],
                  ["Location", [linkedCowboy.city, linkedCowboy.state].filter(Boolean).join(", ")],
                  ["Industry", linkedCowboy.industry],
                  ["Company", linkedCowboy.company],
                  ["Role", linkedCowboy.role],
                  ["Org", linkedCowboy.org],
                  ["Major", linkedCowboy.major],
                  ["Grad School", linkedCowboy.grad_school],
                  ["High School", linkedCowboy.high_school],
                ] as [string, unknown][]).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-stone-400 font-medium uppercase tracking-wide">{label}</dt>
                    <dd className="text-stone-800 mt-0.5">{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-stone-400">To update this info, contact the directory administrator.</p>
            </div>
          )}

          {/* Public toggle */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-stone-800">Make Profile Public</h2>
                <p className="text-xs text-stone-400 mt-0.5">
                  {profilePublic
                    ? "Other members can view your profile by clicking your card in the directory."
                    : "Only you can see your profile details. Turn this on to share with other members."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProfilePublic(!profilePublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${profilePublic ? "bg-burnt" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${profilePublic ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Profile saved!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 bg-burnt text-white font-semibold rounded-lg hover:bg-burnt-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
