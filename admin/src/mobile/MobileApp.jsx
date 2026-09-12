import { useState } from 'react';
import { COLOR, FONT } from './tokens';
import './mobile.css';
import AppBar from './components/AppBar';
import NavDrawer from './components/NavDrawer';
import TabBar from './components/TabBar';
import FooterLine from './components/FooterLine';
import DashboardScreen from './screens/DashboardScreen';
import MpcsRegistryScreen from './screens/MpcsRegistryScreen';
import MilkRegistryScreen from './screens/MilkRegistryScreen';
import MemberRegistryScreen from './screens/MemberRegistryScreen';
import LoanBeneficiariesScreen from './screens/LoanBeneficiariesScreen';
import ReportsScreen from './screens/ReportsScreen';

// Top-level shell for the mobile admin/inspector UI (see
// /Users/vivekrai/.claude/plans/buzzing-scribbling-dawn.md). Rendered by
// Dashboard (App.jsx) instead of the desktop JSX when useIsMobileViewport()
// is true — everything here is presentation only; all data comes from
// Dashboard's already-computed state via props.
export default function MobileApp({ session, userRole, onLogout, dashboard, mpcsRegistry, milkRegistry, memberRegistry, loanBenRegistry, reportsRegistry }) {
  const [tab, setTab] = useState('HOME');
  const [record, setRecord] = useState('MPCS');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fullName = session?.user?.user_metadata?.fullName || session?.user?.email || '?';
  const unreadCount = dashboard.recentActivities?.length || 0;

  const handleDrawerSelect = (id) => {
    if (id === 'DASHBOARD') setTab('HOME');
    else { setTab('RECORDS'); setRecord(id); }
  };

  let body;
  if (tab === 'HOME') {
    body = <DashboardScreen {...dashboard} userRole={userRole} onOpenRecords={(r) => { setTab('RECORDS'); setRecord(r); }} />;
  } else if (tab === 'RECORDS' && record === 'MPCS') {
    body = <MpcsRegistryScreen {...mpcsRegistry} />;
  } else if (tab === 'RECORDS' && record === 'MILK') {
    body = <MilkRegistryScreen {...milkRegistry} userRole={userRole} session={session} />;
  } else if (tab === 'RECORDS' && record === 'MEMBERS') {
    body = <MemberRegistryScreen {...memberRegistry} />;
  } else if (tab === 'RECORDS' && record === 'LOAN_BENEFICIARIES') {
    body = <LoanBeneficiariesScreen {...loanBenRegistry} />;
  } else if (tab === 'RECORDS' && record === 'REPORTS') {
    body = <ReportsScreen {...reportsRegistry} />;
  } else {
    body = (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.heading, fontSize: 16, fontWeight: 600, color: COLOR.ink700 }}>
          Not built yet
        </div>
        <div style={{ fontSize: 13, color: COLOR.mutedLight, marginTop: 6 }}>
          This screen isn't part of the mobile UI's first pass — open it on desktop for now.
        </div>
      </div>
    );
  }

  return (
    // overflow: clip (not 'hidden') — the KPI rail and filter-pill row both
    // bleed edge-to-edge via negative margins, which is fine visually, but
    // a hidden-overflow ancestor still lets the browser scroll itself when
    // a focused element (e.g. a transparent <select> in a filter pill)
    // requests to be scrolled into view. That silently shifted this whole
    // container sideways after any such focus. `clip` disables scrolling
    // entirely, including that programmatic case, while still clipping the
    // decorative background circles the same as `hidden` did visually.
    <div className="core-mobile" style={{ background: COLOR.ground, minHeight: '100vh', position: 'relative', overflowX: 'clip' }}>
      <div style={{ position: 'absolute', top: 120, right: -90, width: 280, height: 280, borderRadius: '50%', background: COLOR.watermark1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 620, left: -120, width: 300, height: 300, borderRadius: '50%', background: COLOR.watermark2, pointerEvents: 'none' }} />

      <AppBar
        userRole={userRole}
        fullName={fullName}
        unreadCount={unreadCount}
        onMenu={() => setDrawerOpen(true)}
        onBell={() => {}}
        onAvatar={() => {}}
      />

      {/* AppBar is position:fixed (not sticky — see AppBar.jsx for why), so
          it no longer occupies space in flow; padding-top here reserves
          room for it instead. Bottom clearance for the fixed TabBar is
          already handled by FooterLine's own 120px bottom padding. */}
      <div style={{ position: 'relative', padding: '74px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {body}
        <FooterLine />
      </div>

      <NavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        onSelect={handleDrawerSelect}
        onLogout={onLogout}
      />

      <TabBar active={tab} onSelect={setTab} />
    </div>
  );
}
