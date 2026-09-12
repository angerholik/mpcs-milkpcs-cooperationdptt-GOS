import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';

// Same 9-item list as the desktop sidebar (App.jsx's "MAIN OPERATIONS"
// group), plus Settings gated the same way (System-Admin-only). Items
// beyond phase 1 (Dashboard + MPCS Societies) are present but disabled —
// they route nowhere yet until their screens are built in a later pass.
const ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: 'grid', enabled: true },
  { id: 'MPCS', label: 'MPCS Societies', icon: 'home', enabled: true },
  { id: 'MILK', label: 'Milk Units', icon: 'drop', enabled: true },
  { id: 'MEMBERS', label: 'Member Registry', icon: 'person', enabled: true },
  { id: 'LOAN_BENEFICIARIES', label: 'Loan Beneficiaries', icon: 'rupee', enabled: true },
  { id: 'STATS', label: 'Benchmarks', icon: 'bars', enabled: false },
  { id: 'OFFICERS', label: 'Official Registry', icon: 'users', enabled: false },
  { id: 'REPORTS', label: 'Reports', icon: 'download', enabled: false },
  { id: 'USERS', label: 'Users & Roles', icon: 'person', enabled: false },
];

export default function NavDrawer({ open, onClose, userRole, onSelect, onLogout }) {
  if (!open) return null;
  const items = userRole === 'System Admin'
    ? [...ITEMS, { id: 'SETTINGS', label: 'Settings', icon: 'moreVertical', enabled: false }]
    : ITEMS;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(42,35,34,.35)' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, zIndex: 40, background: COLOR.surface, padding: '18px 14px', overflowY: 'auto', boxShadow: '4px 0 24px rgba(74,20,20,.18)' }}>
        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 15, letterSpacing: '.15em', color: COLOR.maroon, padding: '6px 10px 16px' }}>CORE</div>
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
    </>
  );
}
