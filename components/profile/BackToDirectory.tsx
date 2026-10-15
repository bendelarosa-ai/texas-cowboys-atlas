"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Returns to the directory. When the member came from the directory, go back
 * in history so their search, filters and scroll position are restored.
 */
export default function BackToDirectory() {
  const router = useRouter();
  const [fromDirectory, setFromDirectory] = useState(false);

  useEffect(() => {
    try {
      setFromDirectory(sessionStorage.getItem("tc_from_directory") === "1" && window.history.length > 1);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Link
      href="/directory"
      onClick={(e) => {
        if (!fromDirectory) return;
        e.preventDefault();
        try {
          sessionStorage.removeItem("tc_from_directory");
        } catch {
          /* ignore */
        }
        router.back();
      }}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.61l4.17 3.97a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.61 9.25h10.64A.75.75 0 0117 10z" clipRule="evenodd" />
      </svg>
      {fromDirectory ? "Back to results" : "Directory"}
    </Link>
  );
}
