import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import encheyMonastery from '../../enchey-monastery.jpg';

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function AppBar({ userRole, fullName, unreadCount, onMenu, onBell, onAvatar }) {
  const isAdmin = userRole === 'System Admin';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30, background: COLOR.headerGradient, overflow: 'hidden', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Enchey Monastery photo, duotone-treated — same principle as the
          field officer app's Kanchenjunga header photo, but a different
          landmark so the admin console reads as visually distinct at a
          glance rather than a re-skin of the user app. */}
      <img src={encheyMonastery} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%',
        opacity: 0.3, filter: 'grayscale(0.35) contrast(1.2) brightness(0.7)', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(100deg, rgba(78,13,13,0.7) 0%, rgba(107,20,20,0.55) 60%, rgba(107,20,20,0.4) 100%)',
      }}/>
      <button type="button" onClick={onMenu} aria-label="Open navigation" style={{ position: 'relative', zIndex: 1, background: 'none', border: 'none', padding: 4, display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 auto' }}>
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
        <span style={{ display: 'block', width: 19, height: 2, borderRadius: 2, background: '#FFFFFF' }} />
      </button>
      <div style={{ position: 'relative', zIndex: 1, fontFamily: FONT.heading, fontWeight: 700, fontSize: 19, letterSpacing: '.2em', color: '#FFFFFF', flex: 1 }}>CORE</div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.16)', borderRadius: 999, padding: '6px 10px', flex: '0 0 auto' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAdmin ? COLOR.greenAccent : COLOR.amberDot, flex: '0 0 auto' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{isAdmin ? 'All Gyalshing' : 'Inspector'}</span>
        {iconEl('down', '#FFFFFF', 11, 2.6)}
      </div>
      <button type="button" onClick={onBell} aria-label="Notifications" style={{ position: 'relative', zIndex: 1, flex: '0 0 auto', background: 'none', border: 'none', padding: 0 }}>
        {iconEl('bell', '#FFFFFF', 20)}
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -3, right: -4, minWidth: 15, height: 15, borderRadius: 8, background: COLOR.greenTint2, color: COLOR.green, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button type="button" onClick={onAvatar} aria-label="Account" style={{ position: 'relative', zIndex: 1, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.9)', color: COLOR.maroonDeep, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', border: 'none' }}>
        {initialsOf(fullName)}
      </button>
    </div>
  );
}
