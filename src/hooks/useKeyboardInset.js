import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// react-native-web's KeyboardAvoidingView is a no-op — behavior is destructured
// and discarded, onKeyboardChange is an empty function (see
// node_modules/react-native-web/src/exports/KeyboardAvoidingView). On native,
// behavior="padding" adds bottom padding equal to the keyboard's height so the
// ScrollView's own (already-correct) scrolling absorbs it. This hook
// reimplements that specific effect for web: when the keyboard opens, the
// browser's on-screen keyboard shrinks or pans window.visualViewport away from
// window.innerHeight, and that gap is what we return as extra bottom padding
// to add to a ScrollView's contentContainerStyle.
//
// The point is to give the ScrollView's own scroll box enough room to bring
// the focused field into view *inside itself*, so it becomes the nearest
// scrollable ancestor for the browser's native focus-scroll to act on,
// instead of the browser falling back to scrolling/panning the whole page —
// which is what was producing the cropped-content-plus-dead-space glitch.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const sync = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(gap > 40 ? Math.round(gap) : 0);
    };
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    sync();
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  return inset;
}
