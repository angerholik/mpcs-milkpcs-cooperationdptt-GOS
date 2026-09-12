import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT_PX } from './tokens';

// Decides desktop-vs-mobile UI by screen width alone, not by role — the
// design handoff itself renders both an "ADMIN" and an "Inspector" variant
// of every screen, so this is for whoever is on a phone, not CI-only.
export default function useIsMobileViewport() {
  const query = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
}
