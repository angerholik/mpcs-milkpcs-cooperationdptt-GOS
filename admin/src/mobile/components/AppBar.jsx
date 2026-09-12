import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function AppBar({ userRole, fullName, unreadCount, onMenu, onBell, onAvatar }) {
  const isAdmin = userRole === 'System Admin';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, background: COLOR.headerGradient, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button type="button" onClick={onMenu} aria-label="Open navigation" style={{ background: 'none', border: 'none', padding: 4, display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 auto' }}>
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
      </button>
      <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 19, letterSpacing: '.2em', color: '#FFFFFF', flex: 1 }}>CORE</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.16)', borderRadius: 999, padding: '6px 10px', flex: '0 0 auto' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAdmin ? COLOR.greenAccent : COLOR.amberDot, flex: '0 0 auto' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{isAdmin ? 'All Gyalshing' : 'Inspector'}</span>
        {iconEl('down', '#FFFFFF', 11, 2.6)}
      </div>
      <button type="button" onClick={onBell} aria-label="Notifications" style={{ position: 'relative', flex: '0 0 auto', background: 'none', border: 'none', padding: 0 }}>
        {iconEl('bell', '#FFFFFF', 20)}
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -4, minWidth: 15, height: 15, borderRadius: 8, background: COLOR.greenTint2, color: COLOR.green, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onAvatar} aria-label="Account" style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.9)', color: COLOR.maroonDeep, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', border: 'none' }}>
        {initialsOf(fullName)}
      </button>
    </div>
  );
}
