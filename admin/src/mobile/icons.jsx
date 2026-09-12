// Inline-SVG icon set for the mobile UI, ported from the design handoff's
// own `I(paths, color, size)` helper + `P` path map (both prototype
// constructs) into a real component. Lucide/Feather-style glyphs, matching
// the handoff's stated stroke widths (1.6-1.8 body, 2-2.6 for chevrons /
// arrows / kebabs).

export function MIcon({ d, color = 'currentColor', size = 18, sw = 1.7 }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

export const MP = {
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  home: ['M4 10.6 12 4l8 6.6', 'M6.4 9.6V20h11.2V9.6'],
  drop: ['M12 3.2c2.6 3 5.4 5.9 5.4 9.1a5.4 5.4 0 0 1-10.8 0c0-3.2 2.8-6.1 5.4-9.1Z'],
  bars: ['M5 20V11', 'M12 20V4.5', 'M19 20v-6'],
  users: ['M9 11.2a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z', 'M2.8 20c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6', 'M16.4 5.2a3 3 0 0 1 0 5.8', 'M18 14.8c2.1.5 3.4 2.1 3.4 4.4'],
  person: ['M12 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z', 'M4.6 20.2c0-3.7 3.3-6 7.4-6s7.4 2.3 7.4 6'],
  grid: ['M4 4h6.4v6.4H4V4Z', 'M13.6 4H20v6.4h-6.4V4Z', 'M4 13.6h6.4V20H4v-6.4Z', 'M13.6 13.6H20V20h-6.4v-6.4Z'],
  doc: ['M6.5 3.5h7L18 8v12.5H6.5V3.5Z', 'M13.2 3.7V8H17.8', 'M9.4 12.6h5.2', 'M9.4 16h5.2'],
  bank: ['M4 9.6 12 4.4l8 5.2', 'M6.4 9.8V19h11.2V9.8', 'M4.6 19h14.8'],
  slash: ['M5.5 18.5 18.5 5.5'],
  down: ['M6 9.5l6 6 6-6'],
  up: ['M6 14.5l6-6 6 6'],
  left: ['M14 6.5 8.5 12 14 17.5'],
  right: ['M10 6.5 15.5 12 10 17.5'],
  mapPin: ['M12 21c4.2-4.6 6.4-7.7 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 13.3 7.8 16.4 12 21Z', 'M12 10.4m-2.2 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0'],
  bell: ['M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 18h15L18 15.5Z', 'M10 21h4'],
  search: ['M15.8 15.8 20 20', 'M11 17.4a6.4 6.4 0 1 0 0-12.8 6.4 6.4 0 0 0 0 12.8Z'],
  send: ['M3.5 11.5 20 4.5l-7 16-2.6-7.4-6.9-1.6Z'],
  arrowRight: ['M5 12h13', 'M13 6.5 18.5 12 13 17.5'],
  download: ['M4 21h16', 'M12 3v13', 'M6.5 11.5 12 17l5.5-5.5'],
  rupee: ['M7 4h10', 'M7 9h10', 'M7 4c5 0 7.5 1.6 7.5 4.2S12 12.4 7 12.4h-.3L17 20'],
  briefcase: ['M4 8.5h16v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z', 'M9 8.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5'],
  refresh: ['M4 4v6h6', 'M20 20v-6h-6', 'M4.5 9A9 9 0 0 1 20.5 15', 'M19.5 15A9 9 0 0 1 3.5 9'],
  eye: ['M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z'],
  calendar: ['M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z', 'M8 3v3', 'M16 3v3', 'M3.5 10h17'],
  monitor: ['M3.5 4.5h17v11h-17z', 'M9 20h6', 'M12 15.5V20'],
  book: ['M5 4.5h9a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2Z', 'M16 4.5h1.5A1.5 1.5 0 0 1 19 6v14h-3'],
  shieldCheck: ['M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4Z', 'M9 12l2 2 4-4'],
  moreVertical: ['M12 6.2v.1', 'M12 12v.1', 'M12 17.8v.1'],
  check: ['M5 12.5l4.5 4.5L19 7'],
};

export function iconEl(key, color, size = 18, sw) {
  return <MIcon d={MP[key]} color={color} size={size} sw={sw} />;
}
