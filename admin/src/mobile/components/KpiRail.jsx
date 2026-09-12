import { COLOR, FONT, RADIUS, SHADOW } from '../tokens';
import { iconEl } from '../icons';

// Horizontal-scroller KPI cards (screens 2-3 in the handoff). `items`:
// { label, value, icon, tint, ink }.
export default function KpiRail({ items }) {
  return (
    <div
      className="hide-sb"
      style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -16px', padding: '0 16px', scrollbarWidth: 'none' }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{ flex: '0 0 auto', width: 146, background: COLOR.surface, borderRadius: RADIUS.card, padding: 15, boxShadow: SHADOW.card }}
        >
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: COLOR.mutedLight }}>{it.label}</div>
          <div style={{ width: 30, height: 30, borderRadius: RADIUS.tile30, background: it.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            {iconEl(it.icon, it.ink, 16)}
          </div>
          <div style={{ fontFamily: FONT.heading, fontSize: 23, fontWeight: 600, color: COLOR.ink900, marginTop: 10 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
