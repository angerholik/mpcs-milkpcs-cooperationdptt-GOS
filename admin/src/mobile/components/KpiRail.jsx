import { useState } from 'react';
import { COLOR, FONT, RADIUS, SHADOW } from '../tokens';
import { iconEl } from '../icons';

// Horizontal-scroller KPI cards (screens 2-3 in the handoff). `items`:
// { label, value, icon, tint, ink, selected?, onClick?, breakdown?, entityLabel?, entityNoun?, entityNounPlural? }.
// `onClick` mirrors desktop's quick-filter affordance (Active Loans, Audits
// Done, Active Profits). `breakdown` mirrors desktop's StatCard hover
// popover (App.jsx's StatCard, ~line 843) — since there's no hover on
// touch, a small chevron button on the card toggles a per-society/center
// breakdown panel below the rail instead, without disturbing the card's
// own onClick (filter) behavior.
export default function KpiRail({ items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const open = openIndex !== null ? items[openIndex] : null;

  return (
    <div>
      <div
        className="hide-sb"
        style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -16px', padding: '0 16px', scrollbarWidth: 'none' }}
      >
        {items.map((it, i) => {
          const Tag = it.onClick ? 'button' : 'div';
          const hasBreakdown = Array.isArray(it.breakdown) && it.breakdown.length > 0;
          return (
            <Tag
              key={i}
              type={it.onClick ? 'button' : undefined}
              onClick={it.onClick}
              style={{
                position: 'relative', textAlign: 'left', flex: '0 0 auto', width: 146,
                background: it.selected ? COLOR.selectedSurface : COLOR.surface,
                border: `1px solid ${it.selected || openIndex === i ? COLOR.selectedBorder : COLOR.surface}`,
                borderRadius: RADIUS.card, padding: 15, boxShadow: SHADOW.card,
              }}
            >
              {hasBreakdown && (
                <button
                  type="button"
                  aria-label={openIndex === i ? `Hide ${it.label.toLowerCase()} breakdown` : `Show ${it.label.toLowerCase()} breakdown`}
                  onClick={(e) => { e.stopPropagation(); setOpenIndex(openIndex === i ? null : i); }}
                  style={{
                    position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%',
                    background: openIndex === i ? COLOR.selectedSurface : COLOR.inset, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {iconEl(openIndex === i ? 'up' : 'down', openIndex === i ? COLOR.maroon : COLOR.mutedLight, 12, 2.2)}
                </button>
              )}
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: it.selected ? COLOR.maroon : COLOR.mutedLight }}>{it.label}</div>
              <div style={{ width: 30, height: 30, borderRadius: RADIUS.tile30, background: it.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                {iconEl(it.icon, it.ink, 16)}
              </div>
              <div style={{ fontFamily: FONT.heading, fontSize: 23, fontWeight: 600, color: it.selected ? COLOR.maroon : COLOR.ink900, marginTop: 10 }}>{it.value}</div>
            </Tag>
          );
        })}
      </div>

      {open && (
        <BreakdownPanel item={open} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}

function BreakdownPanel({ item, onClose }) {
  const { breakdown, label, icon, tint, ink, entityLabel = 'Society', entityNoun = 'record', entityNounPlural = 'records' } = item;

  const magnitudes = breakdown.map((row) => {
    const n = parseFloat(String(row.value).replace(/[^0-9.]/g, ''));
    return Number.isNaN(n) ? 0 : n;
  });
  const maxMag = Math.max(...magnitudes, 0);
  const rankColor = ['#B45309', '#94A3B8', '#B45309'];
  const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div
      className="fade-in"
      style={{
        marginTop: 10, background: COLOR.surface, border: `1px solid ${COLOR.hairline}`,
        borderRadius: RADIUS.card, boxShadow: SHADOW.card, overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: tint, borderBottom: `1px solid ${COLOR.hairline}` }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          {iconEl(icon, '#fff', 14)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: COLOR.ink900, lineHeight: 1.2 }}>{label}</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: COLOR.muted, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Breakdown by {entityLabel} · {breakdown.length} {breakdown.length === 1 ? entityNoun : entityNounPlural}
          </div>
        </div>
        <button
          type="button"
          aria-label="Close breakdown"
          onClick={onClose}
          style={{ width: 22, height: 22, borderRadius: '50%', background: COLOR.surface, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}
        >
          {iconEl('slash', COLOR.muted, 11, 2)}
        </button>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '6px 8px' }}>
        {breakdown.map((row, i) => {
          const pct = maxMag > 0 ? Math.max(4, (magnitudes[i] / maxMag) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 6px' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: i < 3 ? `${rankColor[i]}1A` : COLOR.inset,
                color: i < 3 ? rankColor[i] : COLOR.mutedLight,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800,
              }}>
                {i + 1}
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `${ink}14`, color: ink, border: `1.5px solid ${ink}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800,
              }}>
                {initialsOf(row.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ color: COLOR.ink800, fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                  <span style={{ color: ink, fontWeight: 800, fontSize: 12.5, whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
                {maxMag > 0 && (
                  <div style={{ marginTop: 5, height: 4, borderRadius: 3, background: COLOR.inset, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: ink }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
