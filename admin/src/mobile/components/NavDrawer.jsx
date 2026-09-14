import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import drawerIllustration from '../nav-drawer-illustration.jpg';

// Same 9-item list as the desktop sidebar (App.jsx's "MAIN OPERATIONS"
// group), plus Settings gated the same way (System-Admin-only). All items
// are tappable — Benchmarks, Official Registry, and Settings weren't part
// of the original 7-screen design handoff (no mobile layout was ever
// designed for them), so they route to MobileApp's "Not built yet" fallback
// instead of being greyed out.
const ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: 'grid', enabled: true },
  { id: 'MPCS', label: 'MPCS Societies', icon: 'home', enabled: true },
  { id: 'MILK', label: 'Milk Units', icon: 'drop', enabled: true },
  { id: 'MEMBERS', label: 'Member Registry', icon: 'person', enabled: true },
  { id: 'LOAN_BENEFICIARIES', label: 'Loan Beneficiaries', icon: 'rupee', enabled: true },
  { id: 'STATS', label: 'Benchmarks', icon: 'bars', enabled: true },
  { id: 'OFFICERS', label: 'Official Registry', icon: 'users', enabled: true },
  { id: 'REPORTS', label: 'Reports', icon: 'download', enabled: true },
  { id: 'USERS', label: 'Users & Roles', icon: 'person', enabled: true },
];

export default function NavDrawer({ open, onClose, userRole, onSelect, onLogout }) {
  if (!open) return null;
  const items = userRole === 'System Admin'
    ? [...ITEMS, { id: 'SETTINGS', label: 'Settings', icon: 'moreVertical', enabled: true }]
    : ITEMS;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(42,35,34,.35)' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 40, background: '#FCFBF8', overflow: 'hidden', boxShadow: '4px 0 24px rgba(74,20,20,.18)' }}>
        {/* The supplied Himalayan mountain + rhododendron illustration as
            the drawer's own backdrop — one continuous piece of artwork,
            not composited from photos. Sized to cover and anchored to the
            bottom so the mountains and florals sit low in the panel (per
            the reference), with a soft ivory gradient over it so the nav
            list always reads clean regardless of what's behind it. Fixed
            in this outer layer (not the scrollable one below) so it reads
            as the drawer's own backdrop instead of scrolling with the nav
            items. */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `url(${drawerIllustration})`,
          backgroundPosition: 'center bottom',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          opacity: 0.8,
        }}/>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(252,251,248,.95) 0%, rgba(252,251,248,.78) 42%, rgba(252,251,248,.55) 68%, rgba(252,251,248,.72) 100%)',
        }}/>
        <div style={{ position: 'absolute', bottom: 150, right: 20, textAlign: 'right', pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.14em', color: COLOR.mutedLight, lineHeight: 1.7 }}>
            PEOPLE<br/>PROGRESS<br/>PROSPERITY
          </div>
          <div style={{ width: 26, height: 1.5, borderRadius: 1, background: COLOR.maroon, opacity: 0.5, marginLeft: 'auto', marginTop: 6 }}/>
        </div>

        <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: '18px 14px' }}>
          <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 15, letterSpacing: '.15em', color: COLOR.maroon, padding: '6px 10px 0' }}>CORE</div>
          <div style={{ width: 34, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${COLOR.amberDot}, transparent)`, margin: '8px 10px 8px' }}/>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight, lineHeight: 1.6, padding: '0 10px 16px' }}>
            FOR A STRONGER<br/>COOPERATIVE SIKKIM
          </div>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              disabled={!it.enabled}
              onClick={() => { onSelect(it.id); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                background: 'none', border: 'none', textAlign: 'left',
                padding: '12px 10px', borderRadius: 12, minHeight: 44,
                opacity: it.enabled ? 1 : 0.4,
                fontFamily: FONT.body, fontSize: 14, fontWeight: 500, color: COLOR.ink800,
              }}
            >
              {iconEl(it.icon, COLOR.muted, 18)}
              {it.label}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${COLOR.hairline}`, marginTop: 12, paddingTop: 12 }}>
            <button
              type="button"
              onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: '12px 10px', borderRadius: 12, minHeight: 44, fontFamily: FONT.body, fontSize: 14, fontWeight: 500, color: COLOR.maroon }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
