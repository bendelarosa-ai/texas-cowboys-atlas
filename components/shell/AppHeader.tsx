import Link from "next/link";
import type { Viewer } from "@/lib/types";
import NavLinks from "./NavLinks";
import UserMenu from "./UserMenu";

export default function AppHeader({ viewer, preview }: { viewer: Viewer; preview?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-app flex h-16 items-stretch gap-4 sm:gap-8">
        <Link href="/directory" className="flex shrink-0 items-center gap-2.5" aria-label="Texas Cowboys Network home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cowboy-logo.webp" alt="" className="h-9 w-auto" />
          <span className="hidden leading-none md:block">
            <span className="block font-serif text-[22px] font-semibold tracking-tight text-stone-900">Texas Cowboys</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">Alumni Network</span>
          </span>
        </Link>

        <NavLinks />

        <div className="ml-auto flex items-center gap-3">
          {preview && <span className="badge-neutral hidden sm:inline-flex">Sample data</span>}
          <UserMenu
            name={viewer.displayName}
            email={viewer.email}
            avatarUrl={viewer.profile?.avatar_url ?? null}
          />
        </div>
      </div>
    </header>
  );
}
