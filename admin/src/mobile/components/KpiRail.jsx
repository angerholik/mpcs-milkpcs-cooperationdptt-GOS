import { COLOR, FONT, RADIUS, SHADOW } from '../tokens';
import { iconEl } from '../icons';

// Horizontal-scroller KPI cards (screens 2-3 in the handoff). `items`:
// { label, value, icon, tint, ink, selected?, onClick? }. Mirrors KpiGrid's
// optional tappable-filter treatment — desktop's matching StatCards (Active
// Loans, Audits Done, Active Profits) are quick filters onto activeFilter,
// so these need the same affordance rather than being purely decorative.
export default function KpiRail({ items }) {
  return (
    <div
      className="hide-sb"
      style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -16px', padding: '0 16px', scrollbarWidth: 'none' }}
    >
      {items.map((it, i) => {
        const Tag = it.onClick ? 'button' : 'div';
        return (
          <Tag
            key={i}
            type={it.onClick ? 'button' : undefined}
            onClick={it.onClick}
            style={{
              textAlign: 'left', flex: '0 0 auto', width: 146,
              background: it.selected ? COLOR.selectedSurface : COLOR.surface,
              border: `1px solid ${it.selected ? COLOR.selectedBorder : COLOR.surface}`,
              borderRadius: RADIUS.card, padding: 15, boxShadow: SHADOW.card,
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: it.selected ? COLOR.maroon : COLOR.mutedLight }}>{it.label}</div>
            <div style={{ width: 30, height: 30, borderRadius: RADIUS.tile30, background: it.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
              {iconEl(it.icon, it.ink, 16)}
            </div>
            <div style={{ fontFamily: FONT.heading, fontSize: 23, fontWeight: 600, color: it.selected ? COLOR.maroon : COLOR.ink900, marginTop: 10 }}>{it.value}</div>
          </Tag>
        );
      })}
    </div>
  );
}
