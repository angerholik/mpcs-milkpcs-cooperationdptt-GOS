import { COLOR, SHADOW } from '../tokens';
import { iconEl } from '../icons';

const TABS = [
  { id: 'HOME', label: 'HOME', icon: 'home' },
  { id: 'RECORDS', label: 'RECORDS', icon: 'bars' },
  { id: 'PROFILE', label: 'PROFILE', icon: 'person' },
  { id: 'MORE', label: 'MORE', icon: 'grid' },
];

export default function TabBar({ active, onSelect }) {
  return (
    <div style={{ position: 'sticky', bottom: 0, zIndex: 30, padding: '0 18px 18px', pointerEvents: 'none' }}>
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
