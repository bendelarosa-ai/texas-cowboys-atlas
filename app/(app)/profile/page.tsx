import Link from "next/link";
import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { getRosterRecord, requireViewer } from "@/lib/data";
import { profileCompletion } from "@/lib/completion";

export const metadata: Metadata = { title: "My Profile" };

export default async function MyProfilePage() {
  const viewer = await requireViewer();
  const p = viewer.profile;
  const roster = await getRosterRecord(p?.cowboy_id);
  const completion = profileCompletion(p, roster);
  const shared = !!p?.profile_public;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ScrollToTop />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-900">My Profile</h1>
          <p className="mt-1 text-stone-600">Signed in as {viewer.email}</p>
        </div>
        <Link href="/profile/edit" className="btn-primary self-start sm:self-auto">Edit profile</Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Completion */}
        <section className="card p-5" aria-labelledby="completion-title">
          <div className="flex items-center justify-between">
            <h2 id="completion-title" className="text-sm font-semibold text-stone-900">
              {completion.percent === 100 ? "Your profile is complete" : `Your profile is ${completion.percent}% complete`}
            </h2>
            <span className="text-sm tabular-nums text-stone-600">{completion.items.filter((i) => i.done).length}/{completion.items.length}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <div className="h-full rounded-full bg-burnt transition-[width]" style={{ width: `${completion.percent}%` }} />
          </div>
          <ul className="mt-4 space-y-2">
            {completion.items.map((item) => (
              <li key={item.key} className="flex items-center gap-2.5 text-sm">
                {item.done ? (
                  <svg className="h-4 w-4 shrink-0 text-burnt" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.86-9.81a.75.75 0 00-1.22-.88l-3.24 4.5-1.6-1.6a.75.75 0 10-1.06 1.06l2.22 2.22a.75.75 0 001.14-.09l3.76-5.21z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-stone-300" aria-hidden="true" />
                )}
                {item.done ? (
                  <span className="text-stone-500">{item.label}</span>
                ) : (
                  <Link href={`/profile/edit#${item.section}`} className="text-stone-800 hover:text-burnt-dark hover:underline">
                    {item.label}
                  </Link>
                )}
                <span className="sr-only">{item.done ? "(done)" : "(to do)"}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Visibility */}
        <section className="card flex flex-col p-5" aria-labelledby="visibility-title">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${shared ? "bg-green-600" : "bg-stone-400"}`} aria-hidden="true" />
            <h2 id="visibility-title" className="text-sm font-semibold text-stone-900">
              {!p ? "Profile not set up" : shared ? "Shared with fellow Cowboys" : "Private"}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {!p
              ? "Set up your profile so fellow Cowboys can learn what you do and how to reach you."
              : shared
                ? "Signed-in members can see your photo, work, bio and the contact details you've added. Your profile is never public on the web."
                : "Members can only see your directory record (name, New Man year and roster details). Your photo, bio and contact details stay hidden."}
          </p>
          <div className="mt-auto pt-4">
            <Link href={p ? "/profile/edit#privacy" : "/profile/edit"} className="btn-secondary btn-sm">
              {!p ? "Set up profile" : shared ? "Change visibility" : "Share my profile"}
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="section-label">Preview — exactly what fellow Cowboys see</h2>
          {roster && (
            <Link href={`/directory/${roster.id}`} className="text-sm font-medium text-burnt-dark hover:underline">
              Open in directory
            </Link>
          )}
        </div>
        {roster ? (
          <ProfileView cowboy={roster} profile={shared ? p : null} access={shared ? "shared" : "none"} isSelf={false} nested />
        ) : (
          <div className="card px-6 py-10 text-center">
            <p className="font-serif text-2xl font-semibold text-stone-900">Link your directory record</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              Connect your account to your entry in the Texas Cowboys directory so your profile appears on your card.
            </p>
            <Link href="/profile/edit#record" className="btn-primary mt-5">Find my record</Link>
          </div>
        )}
      </div>
    </div>
  );
}
