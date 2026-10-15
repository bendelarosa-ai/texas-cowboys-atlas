"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Cowboy } from "@/types/cowboy";
import type { LinkableRecord, ProfileRow } from "@/lib/types";
import { classifyLink, clean, joinLocation, looksLikeStreetAddress, normalizeUrl } from "@/lib/format";
import { buildSearchText, matchesTokens, tokenize } from "@/lib/search";
import Avatar from "@/components/ui/Avatar";

interface Props {
  userId: string;
  email: string;
  profile: ProfileRow | null;
  roster: Cowboy | null;
  records: LinkableRecord[];
  claimedIds: number[];
  preview: boolean;
}

interface Form {
  display_name: string;
  preferred_name: string;
  address: string;
  role: string;
  company: string;
  website: string;
  email_contact: string;
  phone: string;
  bio: string;
  personal_statement: string;
  username: string;
  profile_public: boolean;
  avatar_url: string;
  cowboy_id: number | null;
}
type Errors = Partial<Record<keyof Form, string>>;

const SECTIONS = [
  { id: "basic", label: "Basic information" },
  { id: "professional", label: "Professional" },
  { id: "contact", label: "Contact" },
  { id: "about", label: "About you" },
  { id: "record", label: "Directory record" },
  { id: "privacy", label: "Privacy" },
  { id: "account", label: "Account" },
];

const BIO_MAX = 200;
const STATEMENT_MAX = 2000;
const PHOTO_MAX_BYTES = 15 * 1024 * 1024;

function initialForm(p: ProfileRow | null, email: string): Form {
  return {
    display_name: p?.display_name ?? "",
    preferred_name: p?.preferred_name ?? "",
    address: p?.address ?? "",
    role: p?.role ?? "",
    company: p?.company ?? "",
    website: p?.website ?? "",
    email_contact: p?.email_contact ?? "",
    phone: p?.phone ?? "",
    bio: p?.bio ?? "",
    personal_statement: p?.personal_statement ?? "",
    username: p?.username ?? email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30),
    profile_public: p?.profile_public ?? false,
    avatar_url: p?.avatar_url ?? "",
    cowboy_id: p?.cowboy_id ?? null,
  };
}

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!/^[a-z0-9_]{3,30}$/.test(f.username.trim().toLowerCase())) {
    e.username = "Use 3–30 letters, numbers or underscores.";
  }
  if (f.email_contact.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email_contact.trim())) {
    e.email_contact = "Enter a valid email address, like name@example.com.";
  }
  const digits = f.phone.replace(/\D/g, "");
  if (f.phone.trim() && (digits.length < 7 || digits.length > 15)) {
    e.phone = "Enter a phone number with area code.";
  }
  if (f.website.trim() && !/^(https?:\/\/)?[^\s/.]+\.[^\s]{2,}$/i.test(f.website.trim())) {
    e.website = "Enter a web address, like example.com.";
  }
  if (f.bio.length > BIO_MAX) e.bio = `Keep your bio under ${BIO_MAX} characters.`;
  if (f.personal_statement.length > STATEMENT_MAX) e.personal_statement = `Keep this under ${STATEMENT_MAX} characters.`;
  return e;
}

/** Square-crop (biased toward the top for portraits) and shrink to 512px. */
async function prepareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = bitmap.height > bitmap.width ? (bitmap.height - side) * 0.25 : (bitmap.height - side) / 2;
  const size = Math.min(512, side);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.88)
  );
}

function storagePath(url: string, userId: string): string | null {
  const marker = "/object/public/avatars/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return path.startsWith(`${userId}/`) ? path : null;
}

export default function ProfileEditor({ userId, email, profile, roster, records, claimedIds, preview }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [saved, setSaved] = useState<Form>(() => initialForm(profile, email));
  const [form, setForm] = useState<Form>(saved);
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [activeSection, setActiveSection] = useState("basic");
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const isNew = !profile;

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (attempted) setErrors(validate(next));
      return next;
    });
  }

  // Toast auto-dismiss.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Warn before leaving with unsaved changes (tab close / in-app links).
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // in-page anchors
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  // Highlight the section currently in view.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  async function onPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("That file isn't an image. Choose a JPG, PNG, WebP or HEIC photo.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhotoError("That photo is over 15 MB. Choose a smaller one.");
      return;
    }
    setUploading(true);
    try {
      const blob = await prepareAvatar(file);
      if (preview) {
        set("avatar_url", URL.createObjectURL(blob));
      } else {
        const path = `${userId}/avatar-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        set("avatar_url", supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setPhotoError(
        msg.toLowerCase().includes("row-level security")
          ? "Photo uploads aren't enabled for your account yet. Please let a directory admin know."
          : "We couldn't process that photo. Try a JPG or PNG."
      );
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setAttempted(true);
    const v = validate(form);
    setErrors(v);
    const firstInvalid = Object.keys(v)[0];
    if (firstInvalid) {
      document.getElementById(`f-${firstInvalid}`)?.focus();
      setToast({ text: "Please fix the highlighted fields.", tone: "error" });
      return;
    }

    setSaving(true);
    const clean: Form = {
      ...form,
      username: form.username.trim().toLowerCase(),
      website: form.website.trim() ? normalizeUrl(form.website.trim()) : "",
    };
    const payload = {
      id: userId,
      username: clean.username,
      display_name: clean.display_name.trim(),
      preferred_name: clean.preferred_name.trim(),
      address: clean.address.trim(),
      role: clean.role.trim(),
      company: clean.company.trim(),
      website: clean.website,
      email_contact: clean.email_contact.trim(),
      phone: clean.phone.trim(),
      bio: clean.bio.trim(),
      personal_statement: clean.personal_statement.trim(),
      profile_public: clean.profile_public,
      avatar_url: clean.avatar_url,
      cowboy_id: clean.cowboy_id,
      updated_at: new Date().toISOString(),
    };

    let errorText: string | null = null;
    if (preview) {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("username")) errorText = "That username is already taken.";
        else if (m.includes("row-level security") || m.includes("permission")) errorText = "You don't have permission to update this profile.";
        else errorText = "We couldn't save your changes. Please try again.";
        if (m.includes("username")) setErrors((e) => ({ ...e, username: "That username is already taken." }));
      }
    }
    setSaving(false);

    if (errorText) {
      setToast({ text: errorText, tone: "error" });
      return;
    }

    // Tidy up the previous photo file, best effort.
    const oldPath = saved.avatar_url !== clean.avatar_url ? storagePath(saved.avatar_url, userId) : null;
    if (oldPath && !preview) void supabase.storage.from("avatars").remove([oldPath]);

    setForm(clean);
    setSaved(clean);
    setToast({ text: "Profile saved.", tone: "ok" });
    router.refresh();
  }

  const firstError = attempted ? Object.keys(errors).length : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900">
            {isNew ? "Set up your profile" : "Edit profile"}
          </h1>
          <p className="mt-1 max-w-xl text-stone-600">
            {isNew
              ? "A few details help fellow Cowboys recognize you and know how to reach you. Everything is optional except a username."
              : "Changes appear on your profile as soon as you save."}
          </p>
        </div>
        {!isNew && (
          <Link href="/profile" className="btn-secondary self-start sm:self-auto">View my profile</Link>
        )}
      </div>

      {/* Mobile section jump bar */}
      <nav aria-label="Profile sections" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip shrink-0 hover:border-stone-400">{s.label}</a>
        ))}
      </nav>

      <div className="mt-6 lg:grid lg:grid-cols-[13rem,minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Profile sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={activeSection === s.id ? "true" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeSection === s.id ? "bg-white font-medium text-stone-900 shadow-sm ring-1 ring-stone-200" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <form
          className="space-y-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {/* BASIC */}
          <Section id="basic" title="Basic information" description="How you appear across the directory.">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={form.display_name || roster?.name || email} src={form.avatar_url || null} size="lg" />
              <div>
                <div className="flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhotoChosen} aria-label="Upload a profile photo" tabIndex={-1} />
                  <button type="button" className="btn-secondary btn-sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    {uploading ? "Processing…" : form.avatar_url ? "Replace photo" : "Upload photo"}
                  </button>
                  {form.avatar_url && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => set("avatar_url", "")}>Remove</button>
                  )}
                </div>
                <p className="field-hint">A clear, recent headshot works best. We crop it to a square automatically.</p>
                {photoError && <p className="field-error" role="alert">{photoError}</p>}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="display_name"
                label="Full name"
                hint={roster?.name && form.display_name.trim() !== roster.name.trim() ? `The directory lists you as “${roster.name}”.` : undefined}
              >
                <TextInput id="display_name" value={form.display_name} onChange={(v) => set("display_name", v)} placeholder={roster?.name ?? "Your full name"} autoComplete="name" />
              </Field>
              <Field id="preferred_name" label="Preferred name" optional hint="What fellow Cowboys call you, e.g. “Trey”.">
                <TextInput id="preferred_name" value={form.preferred_name} onChange={(v) => set("preferred_name", v)} autoComplete="nickname" />
              </Field>
              <Field
                id="address"
                label="City & state"
                hint={
                  form.address && looksLikeStreetAddress(form.address)
                    ? "This looks like a street address — it will only show in your contact details, not on your directory card."
                    : "Shown on your directory card, e.g. Dallas, TX."
                }
              >
                <TextInput id="address" value={form.address} onChange={(v) => set("address", v)} placeholder={joinLocation(roster?.city, roster?.state) ?? "City, State"} autoComplete="address-level2" />
              </Field>
              <ReadOnly label="New Man year" value={currentRecord(records, form.cowboy_id)?.new_man_year?.toString() ?? null} note="Set by directory admins" />
            </div>
          </Section>

          {/* PROFESSIONAL */}
          <Section id="professional" title="Professional" description="Helps Cowboys find you by career and company.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="role" label="Job title">
                <TextInput id="role" value={form.role} onChange={(v) => set("role", v)} placeholder={clean(roster?.role) ?? "e.g. Managing Director"} autoComplete="organization-title" />
              </Field>
              <Field id="company" label="Company">
                <TextInput id="company" value={form.company} onChange={(v) => set("company", v)} placeholder={clean(roster?.company) ?? "e.g. Vinson & Elkins"} autoComplete="organization" />
              </Field>
              <Field id="website" label="Website" optional error={errors.website}>
                <TextInput id="website" value={form.website} onChange={(v) => set("website", v)} placeholder="example.com" inputMode="url" invalid={!!errors.website} />
              </Field>
              <ReadOnly label="Industry" value={roster && roster.id === form.cowboy_id ? clean(roster.industry) : null} note="From the directory record" />
              <ReadOnly
                label="LinkedIn"
                value={roster && roster.id === form.cowboy_id && roster.linkedin && classifyLink(roster.linkedin) === "linkedin" ? "Linked from your directory record" : null}
                note="Ask a directory admin to add or update it"
              />
            </div>
          </Section>

          {/* CONTACT */}
          <Section id="contact" title="Contact" description="How fellow Cowboys can reach you.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="email_contact" label="Preferred email" optional error={errors.email_contact} hint={`Can differ from your sign-in email (${email}).`}>
                <TextInput id="email_contact" type="email" value={form.email_contact} onChange={(v) => set("email_contact", v)} placeholder="name@example.com" autoComplete="email" invalid={!!errors.email_contact} />
              </Field>
              <Field id="phone" label="Phone" optional error={errors.phone}>
                <TextInput id="phone" type="tel" value={form.phone} onChange={(v) => set("phone", v)} placeholder="(512) 555-0123" autoComplete="tel" invalid={!!errors.phone} />
              </Field>
            </div>
            <p className="mt-5 rounded-lg bg-stone-50 px-4 py-3 text-[13px] leading-relaxed text-stone-600">
              Contact details are visible only to signed-in Texas Cowboys, and only while your profile is shared
              ({form.profile_public ? "it currently is" : "it currently isn't"} — see <a href="#privacy" className="font-medium text-burnt-dark underline underline-offset-2">Privacy</a>).
              Leave a field blank to keep it to yourself.
            </p>
          </Section>

          {/* ABOUT */}
          <Section id="about" title="About you" description="A little personality goes a long way.">
            <div className="space-y-5">
              <Field id="bio" label="Short bio" optional error={errors.bio} counter={`${form.bio.length}/${BIO_MAX}`} hint="One or two sentences shown at the top of your profile.">
                <textarea id="f-bio" rows={2} maxLength={BIO_MAX} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="input resize-y" placeholder="Energy lawyer in Houston, father of three, still never misses a home game." />
              </Field>
              <Field id="personal_statement" label="Personal introduction" optional error={errors.personal_statement} counter={`${form.personal_statement.length}/${STATEMENT_MAX}`} hint="Your story since Texas, what you'd love to talk about, how you can help younger Cowboys.">
                <textarea id="f-personal_statement" rows={6} maxLength={STATEMENT_MAX} value={form.personal_statement} onChange={(e) => set("personal_statement", e.target.value)} className="input resize-y" />
              </Field>
            </div>
          </Section>

          {/* DIRECTORY RECORD */}
          <Section id="record" title="Directory record" description="Connects your account to your entry in the Texas Cowboys directory, so your photo and details appear on your card.">
            <RecordPicker
              records={records}
              claimedIds={claimedIds}
              value={form.cowboy_id}
              savedValue={saved.cowboy_id}
              onChange={(id) => set("cowboy_id", id)}
            />
          </Section>

          {/* PRIVACY */}
          <Section id="privacy" title="Privacy" description="You decide what fellow Cowboys can see.">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p id="share-label" className="text-[15px] font-medium text-stone-900">Share my profile with fellow Cowboys</p>
                <p id="share-desc" className="mt-1 text-sm leading-relaxed text-stone-600">
                  {form.profile_public
                    ? "Signed-in members can see your photo, work, bio and any contact details you've added."
                    : "Members see only your directory record — name, New Man year and roster details. Your photo, bio and contact details stay hidden."}{" "}
                  Your profile is never visible to the public or search engines.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.profile_public}
                aria-labelledby="share-label"
                aria-describedby="share-desc"
                onClick={() => set("profile_public", !form.profile_public)}
                className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${form.profile_public ? "bg-burnt" : "bg-stone-300"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.profile_public ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </Section>

          {/* ACCOUNT */}
          <Section id="account" title="Account" description="Sign-in details. None of this appears on your profile.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="username" label="Username" error={errors.username} hint="Letters, numbers and underscores.">
                <div className={`flex items-center overflow-hidden rounded-lg border bg-white focus-within:border-burnt focus-within:ring-2 focus-within:ring-burnt/20 ${errors.username ? "border-red-500" : "border-stone-300"}`}>
                  <span className="border-r border-stone-200 bg-stone-50 px-3 py-2 text-[15px] text-stone-500">@</span>
                  <input
                    id="f-username"
                    value={form.username}
                    onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    autoComplete="username"
                    aria-invalid={!!errors.username}
                    aria-describedby="username-msg"
                    className="min-w-0 flex-1 px-3 py-2 text-[15px] text-stone-900 focus:outline-none"
                  />
                </div>
              </Field>
              <ReadOnly label="Sign-in email" value={email} note="Contact an admin to change it" />
            </div>
            <PasswordChange supabase={supabase} preview={preview} onDone={(text, tone) => setToast({ text, tone })} />
          </Section>
        </form>
      </div>

      {/* Sticky save bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur transition-transform duration-200 ${dirty ? "translate-y-0" : "translate-y-full"}`}
        aria-hidden={!dirty}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-stone-700">
            {firstError ? <span className="text-red-700">{firstError === 1 ? "1 field needs" : `${firstError} fields need`} attention</span> : "You have unsaved changes"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost"
              tabIndex={dirty ? 0 : -1}
              onClick={() => {
                setForm(saved);
                setErrors({});
                setAttempted(false);
              }}
            >
              Discard
            </button>
            <button type="button" className="btn-primary" tabIndex={dirty ? 0 : -1} disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
        {toast && (
          <div className={`pointer-events-auto rounded-full px-4 py-2 text-sm font-medium shadow-lg ${toast.tone === "ok" ? "bg-stone-900 text-white" : "bg-red-700 text-white"}`}>
            {toast.text}
          </div>
        )}
      </div>
    </div>
  );
}

function currentRecord(records: LinkableRecord[], id: number | null) {
  return id ? records.find((r) => r.id === id) ?? null : null;
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-24 p-5 sm:p-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold text-stone-900">{title}</h2>
      <p className="mb-5 mt-0.5 text-sm text-stone-600">{description}</p>
      {children}
    </section>
  );
}

function Field({ id, label, hint, error, optional, counter, children }: { id: string; label: string; hint?: string; error?: string; optional?: boolean; counter?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`f-${id}`} className="field-label">
          {label} {optional && <span className="font-normal text-stone-500">(optional)</span>}
        </label>
        {counter && <span className="text-xs tabular-nums text-stone-500">{counter}</span>}
      </div>
      {children}
      <div id={`${id}-msg`}>
        {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
      </div>
    </div>
  );
}

function TextInput({
  id, value, onChange, type = "text", placeholder, autoComplete, inputMode, invalid,
}: {
  id: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; invalid?: boolean;
}) {
  return (
    <input
      id={`f-${id}`}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      aria-invalid={invalid || undefined}
      aria-describedby={`${id}-msg`}
      className={`input ${invalid ? "input-invalid" : ""}`}
    />
  );
}

function ReadOnly({ label, value, note }: { label: string; value: string | null; note: string }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-[15px] text-stone-700">
        {value ?? <span className="text-stone-500">Not listed</span>}
      </p>
      <p className="field-hint">{note}</p>
    </div>
  );
}

function RecordPicker({
  records, claimedIds, value, savedValue, onChange,
}: {
  records: LinkableRecord[]; claimedIds: number[]; value: number | null; savedValue: number | null; onChange: (id: number | null) => void;
}) {
  const [term, setTerm] = useState("");
  const [changing, setChanging] = useState(false);
  const claimed = useMemo(() => new Set(claimedIds), [claimedIds]);
  const indexed = useMemo(
    () => records.map((r) => ({ r, text: buildSearchText([r.name, r.new_man_year, r.company, r.city, r.state]) })),
    [records]
  );
  const tokens = tokenize(term);
  const matches = tokens.length ? indexed.filter((x) => matchesTokens(x.text, tokens)).slice(0, 8).map((x) => x.r) : [];
  const current = value ? records.find((r) => r.id === value) ?? null : null;

  const describe = (r: LinkableRecord) =>
    [r.new_man_year ? `New Man ${r.new_man_year}` : null, r.company, joinLocation(r.city, r.state)].filter(Boolean).join(" · ");

  if (current && !changing) {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-burnt/25 bg-burnt/[0.04] p-4">
        <div>
          <p className="font-semibold text-stone-900">{current.name}</p>
          <p className="mt-0.5 text-sm text-stone-600">{describe(current) || "No other details on file"}</p>
          {value !== savedValue && <p className="mt-2 text-[13px] text-burnt-dark">Not saved yet — save to link this record.</p>}
        </div>
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => setChanging(true)}>Change</button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="record-search" className="field-label">Find your name</label>
      <input
        id="record-search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Start typing your name or New Man year…"
        className="input"
        autoComplete="off"
      />
      {term && (
        <ul className="mt-2 divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
          {matches.length === 0 && <li className="px-4 py-3 text-sm text-stone-600">No records match “{term}”. Try your last name only.</li>}
          {matches.map((r) => {
            const taken = claimed.has(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={taken}
                  onClick={() => {
                    onChange(r.id);
                    setChanging(false);
                    setTerm("");
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-stone-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  <span>
                    <span className={`block text-sm font-medium ${taken ? "text-stone-500" : "text-stone-900"}`}>{r.name}</span>
                    <span className="block text-[13px] text-stone-500">{describe(r)}</span>
                  </span>
                  {taken && <span className="badge-neutral shrink-0">Linked to another member</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-3">
        {changing && (
          <button type="button" className="btn-ghost btn-sm" onClick={() => setChanging(false)}>Cancel</button>
        )}
        {value && changing && (
          <button type="button" className="text-[13px] font-medium text-red-700 hover:underline" onClick={() => { onChange(null); setChanging(false); }}>
            Unlink my record
          </button>
        )}
      </div>
      <p className="field-hint">If your record is linked to someone else by mistake, contact a directory admin.</p>
    </div>
  );
}

function PasswordChange({
  supabase, preview, onDone,
}: {
  supabase: ReturnType<typeof createClient>; preview: boolean; onDone: (text: string, tone: "ok" | "error") => void;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update() {
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== confirm) return setError("Passwords don't match.");
    setError(null);
    setBusy(true);
    const { error } = preview ? { error: null } : await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setError(error.message.includes("different") ? "Choose a password you haven't used before." : "Couldn't update your password. Try signing out and back in first.");
      return;
    }
    setPw("");
    setConfirm("");
    setOpen(false);
    onDone("Password updated.", "ok");
  }

  if (!open) {
    return (
      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-5">
        <div>
          <p className="text-[15px] font-medium text-stone-900">Password</p>
          <p className="text-sm text-stone-600">Change the password you use to sign in.</p>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={() => setOpen(true)}>Change password</button>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-stone-100 pt-5">
      <p className="text-[15px] font-medium text-stone-900">Change password</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="field-label">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="input" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="field-label">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
        </div>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={busy} onClick={() => void update()}>{busy ? "Updating…" : "Update password"}</button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => { setOpen(false); setError(null); setPw(""); setConfirm(""); }}>Cancel</button>
      </div>
    </div>
  );
}
