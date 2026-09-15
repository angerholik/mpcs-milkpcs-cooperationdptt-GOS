import { COLOR, SHADOW } from '../tokens';
import { iconEl } from '../icons';

// Admin's real navigation lives in the hamburger drawer (10 items), not a
// fixed daily task flow like the field-officer app's HOME/RECORDS/PROFILE/
// MORE bar this was originally copied from — "Records" was vague once
// there wasn't one records type, just distinct registries. These four
// point at what admins actually reach for most: the dashboard, and the
// two dominant registries (MPCS, Milk) surfaced directly instead of
// through a generic bucket. Profile drops as a tab since it's already one
// tap via the avatar in AppBar — MORE opens the same drawer that icon
// does, for everything else (Members, Loans, Benchmarks, Officers,
// Reports, Users, Settings).
const TABS = [
  { id: 'DASHBOARD', label: 'DASHBOARD', icon: 'grid' },
  { id: 'MPCS', label: 'MPCS', icon: 'home' },
  { id: 'MILK', label: 'MILK', icon: 'drop' },
  { id: 'MORE', label: 'MORE', icon: 'menu' },
];

export default function TabBar({ active, onSelect }) {
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '0 18px 18px', pointerEvents: 'none' }}>
      <div style={{ background: COLOR.surface, borderRadius: 999, boxShadow: SHADOW.tabBar, display: 'flex', padding: '9px 8px', pointerEvents: 'auto' }}>
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minHeight: 44, justifyContent: 'center', background: 'none', border: 'none' }}
            >
              <span style={{ width: 38, height: 30, borderRadius: 11, background: isActive ? COLOR.roseTint : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {iconEl(t.icon, isActive ? COLOR.maroon : COLOR.mutedLight, 19)}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.09em', color: isActive ? COLOR.maroon : COLOR.mutedLight }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
