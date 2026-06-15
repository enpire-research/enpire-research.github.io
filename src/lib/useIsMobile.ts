"use client";

import { useEffect, useState } from "react";

// SSR-safe matchMedia hook. Returns false during prerender / first paint, then
// updates on mount and whenever the query result changes.
export function useIsMobile(query = "(max-width: 820px)"): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
