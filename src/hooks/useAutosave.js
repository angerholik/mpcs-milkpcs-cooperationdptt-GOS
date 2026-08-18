import { useEffect, useRef } from 'react';

// Fires `persistFn` a short while after any value in `deps` changes, so
// edits made inside a screen's "Edit" modal reach AsyncStorage (via the
// screen's own onSave* callback) without the user having to tap Save.
// Without this, a value typed but not yet saved is only ever held in this
// component's React state — a Chrome background-tab discard (which does a
// full page reload, common when switching away for a while) wipes it
// completely, since nothing was ever written to disk.
// Skips the run that fires from the initial mount (deps already match the
// just-loaded saved values, so there's nothing new to persist).
export function useAutosave(persistFn, deps, delayMs = 1200) {
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      persistFn();
    }, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
