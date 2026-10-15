"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";

interface Props {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export default function UserMenu({ name, email, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(wrapRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLElement);
        const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
        list[next]?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const item = "block w-full rounded-md px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus:bg-stone-100";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 hover:bg-stone-100"
      >
        <Avatar name={name} src={avatarUrl} size="xs" />
        <span className="sr-only">Account menu</span>
        <svg className="h-4 w-4 text-stone-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-stone-900">{name}</p>
            <p className="truncate text-[13px] text-stone-500">{email}</p>
          </div>
          <div className="my-1 h-px bg-stone-100" />
          <Link role="menuitem" href="/profile" className={item} onClick={() => setOpen(false)}>
            View my profile
          </Link>
          <Link role="menuitem" href="/profile/edit" className={item} onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <Link role="menuitem" href="/profile/edit#account" className={item} onClick={() => setOpen(false)}>
            Account settings
          </Link>
          <div className="my-1 h-px bg-stone-100" />
          <button role="menuitem" type="button" onClick={signOut} className={item}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
