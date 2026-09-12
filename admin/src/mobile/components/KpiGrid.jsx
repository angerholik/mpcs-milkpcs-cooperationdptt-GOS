import { COLOR, FONT, RADIUS, SHADOW } from '../tokens';
import { iconEl } from '../icons';

// 2-column KPI grid (Member Registry, Loan Beneficiaries) — as opposed to
// KpiRail's horizontal scroller (MPCS/Milk registries). `items`:
// { label, value, icon, tint, ink, selected?, onClick? }. A selected card
// (Member Registry highlights whichever card matches the active Type
// filter) uses the maroon "selected" treatment; onClick is optional — the
// cards can be purely informational (Loan Beneficiaries) or tappable
// filters (Member Registry).
export default function KpiGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {items.map((it, i) => {
        const Tag = it.onClick ? 'button' : 'div';
        return (
          <Tag
            key={i}
            type={it.onClick ? 'button' : undefined}
            onClick={it.onClick}
            style={{
              textAlign: 'left', background: it.selected ? COLOR.selectedSurface : COLOR.surface,
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
