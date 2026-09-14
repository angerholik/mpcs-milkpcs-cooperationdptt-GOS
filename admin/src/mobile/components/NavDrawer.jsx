import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import rhododendron from '../../rhododendron.jpg';

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
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 40, background: COLOR.surface, overflow: 'hidden', boxShadow: '4px 0 24px rgba(74,20,20,.18)' }}>
        {/* Rhododendron, faded into the surface from the bottom corner — a
            quiet echo of the login page's floral artwork rather than a loud
            photo panel, since the drawer sits on a plain white surface.
            Fixed in this outer layer (not the scrollable one below) so it
            reads as the drawer's own backdrop instead of scrolling with
            the nav items. */}
        <img src={rhododendron} alt="" style={{
          position: 'absolute', bottom: -30, left: -55, width: 250, height: 250, borderRadius: '50%',
          objectFit: 'cover', opacity: 0.22, filter: 'grayscale(0.2) contrast(1.05) saturate(1.15)', pointerEvents: 'none',
        }}/>
        <div style={{ position: 'absolute', top: 90, right: -70, width: 200, height: 200, borderRadius: '50%', background: COLOR.watermark1, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, height: '100%', overflowY: 'auto', padding: '18px 14px' }}>
          <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 15, letterSpacing: '.15em', color: COLOR.maroon, padding: '6px 10px 0' }}>CORE</div>
          <div style={{ width: 34, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${COLOR.amberDot}, transparent)`, margin: '8px 10px 16px' }}/>
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
