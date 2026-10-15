"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/directory", label: "Directory", short: "Directory" },
  { href: "/chat", label: "Ask AI", short: "Ask AI" },
  { href: "/profile", label: "My Profile", short: "Profile" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex h-full items-stretch gap-0.5 sm:gap-4">
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center whitespace-nowrap border-b-2 px-1.5 text-sm font-medium transition-colors sm:px-2 ${
              active ? "border-burnt text-stone-900" : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
