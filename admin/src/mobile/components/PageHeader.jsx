import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';

// Shared "page header" pattern used by screens 2-7 in the handoff: eyebrow,
// title + count pill, subtitle, and 1-2 full-width action buttons.
export default function PageHeader({ eyebrow, title, countLabel, subtitle, actions }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', color: COLOR.green }}>
        {eyebrow}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 24, fontWeight: 600, color: COLOR.ink900, letterSpacing: '-.015em' }}>
          {title}
        </span>
        {countLabel && (
          <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
            {countLabel}
          </span>
        )}
      </div>
      {subtitle && <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 7 }}>{subtitle}</div>}
      {actions && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              onClick={a.onClick}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: a.primary ? COLOR.maroon : COLOR.surface,
                border: a.primary ? 'none' : `1px solid ${COLOR.border}`,
                color: a.primary ? '#FFFFFF' : COLOR.ink800,
                borderRadius: 12,
                padding: 13,
                fontFamily: FONT.heading,
                fontWeight: 600,
                fontSize: 13,
                minHeight: 44,
              }}
            >
              {a.icon && iconEl(a.icon, a.primary ? '#FFFFFF' : COLOR.ink800, 16)}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
