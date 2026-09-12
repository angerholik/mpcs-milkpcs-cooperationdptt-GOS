// Design tokens for the mobile admin UI, taken verbatim from the design
// handoff's README (~/Downloads/design_handoff_core_mobile 2/README.md).
// Intentionally a separate palette from admin/src/index.css's desktop
// tokens — this mobile UI borrows the field-officer app's visual language,
// not the desktop dashboard's.

export const COLOR = {
  maroon: '#8C1C1C',
  maroonDeep: '#6B1414',
  maroonDarkest: '#4E0D0D',
  broadcastCard: '#601111',
  headerGradient: 'linear-gradient(100deg, #7C1A1A 0%, #601111 60%, #4E0D0D 100%)',

  ground: '#FAF6F5',
  surface: '#FFFFFF',
  inset: '#FBF9F9',
  watermark1: '#F2E9E8',
  watermark2: '#F3EBEA',

  selectedSurface: '#FDF1F1',
  selectedBorder: '#F0D5D5',
  segmentedTrack: '#F1ECEB',
  barTrack: '#F4F0EF',

  divider: '#F2EEED',
  hairline: '#F1EDEC',
  border: '#EBE5E4',
  radioRing: '#DDD5D4',

  ink900: '#2A2322',
  ink800: '#3E3634',
  ink700: '#5C5250',
  ink600: '#7A6F6D',
  muted: '#8A7F7D',
  mutedLight: '#A79B99',
  faint: '#B6AAA8',
  faintLight: '#C4B8B6',

  green: '#0E6B4B',
  greenAccent: '#12A36B',
  greenTint: '#EAF6F0',
  greenTint2: '#E8F0EC',
  roseTint: '#FCEFEF',
  roseTint2: '#FCE6E6',

  amber: '#92400E',
  amberAccent: '#B45309',
  amberDot: '#E8A33D',
  amberTint: '#FDF3E2',
  amberTint2: '#FDF6E7',

  blue: '#1D4ED8',
  blueTint: '#EAF1FB',
  violet: '#5B21B6',
  violetTint: '#F0EBFB',
};

export const FONT = {
  heading: "'Outfit', sans-serif",
  body: "'DM Sans', system-ui, sans-serif",
};

export const RADIUS = {
  pill: 999,
  emptyTile: 20,
  card: 16,
  inset: 14,
  control: 12,
  segment: 11,
  small: 10,
  tile30: 9,
  tile26: 8,
  swatch: 3,
};

export const SHADOW = {
  card: '0 1px 3px rgba(74,20,20,.06)',
  segmentActive: '0 1px 3px rgba(74,20,20,.1)',
  tabBar: '0 6px 22px rgba(74,20,20,.13)',
};

// Role badge tints for officer cards / scope pill (Users & Roles, screen 7)
export const ROLE_TINT = {
  CI: { bg: COLOR.amberTint, ink: COLOR.amber },
  ACI: { bg: COLOR.violetTint, ink: COLOR.violet },
  PA: { bg: COLOR.greenTint, ink: COLOR.green },
};

// Google Fonts <link> href used by the handoff — injected once by MobileApp.
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap';

export const MOBILE_BREAKPOINT_PX = 900;
