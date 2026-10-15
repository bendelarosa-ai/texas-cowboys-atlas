"use client";

import { useEffect } from "react";

/** Detail pages open at the top (or at #section), not mid-page. */
export default function ScrollToTop() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);
  return null;
}
