import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';

// Shared "page header" pattern used by screens 2-7 in the handoff: eyebrow,
// title + count pill, subtitle, and a compact action (Export CSV etc.).
// Actions used to render as full-width buttons — disproportionate for an
// occasional action like exporting, and it out-weighted the actual content
// below. Now a compact pill in the title row, matching how the desktop
// version treats the same button.
export default function PageHeader({ eyebrow, title, countLabel, subtitle, actions }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', color: COLOR.green }}>
          {eyebrow}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: 8, flex: '0 0 auto' }}>
            {actions.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={a.onClick}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: a.primary ? COLOR.maroon : COLOR.surface,
                  border: a.primary ? 'none' : `1px solid ${COLOR.border}`,
                  color: a.primary ? '#FFFFFF' : COLOR.ink800,
                  borderRadius: 10,
                  padding: '8px 13px',
                  fontFamily: FONT.heading,
                  fontWeight: 600,
                  fontSize: 12,
                  minHeight: 34,
                  whiteSpace: 'nowrap',
                }}
              >
                {a.icon && iconEl(a.icon, a.primary ? '#FFFFFF' : COLOR.ink800, 14)}
                {a.label}
              </button>
            ))}
          </div>
        )}
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
    </div>
  );
}
