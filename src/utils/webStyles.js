import { Platform } from 'react-native';

// These screens are mobile-first, but the CORE app also runs on web
// (react-native-web). Without a cap, content stretches edge-to-edge on a
// wide desktop viewport, leaving short label/value pairs looking sparse
// and unbalanced. No-op on native/narrow web, since maxWidth only binds
// once the available width actually exceeds it.
export const webCapWidth = Platform.OS === 'web'
  ? { width: '100%', maxWidth: 640, alignSelf: 'center' }
  : {};
