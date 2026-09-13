import { useState } from 'react';
import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import { supabase } from '../../supabase';

const PROFIT_COLOR = { Profitable: COLOR.green, 'Loss Making': COLOR.maroon, 'Break-even': COLOR.amber };
const COMPLIANCE_COLOR = {
  'Audit Completed': COLOR.green, 'Audit Pending': COLOR.maroon,
  'AGM Completed': COLOR.blue, 'AGM Pending': COLOR.amber,
};

function StatCol({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', color: COLOR.mutedLight }}>{label}</div>
      <div style={{ fontFamily: FONT.heading, fontSize: 18, fontWeight: 600, color: COLOR.ink900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function RegistryTile({ icon, tint, ink, label, count, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{ textAlign: 'left', background: COLOR.surface, border: 'none', borderRadius: 16, padding: 15, boxShadow: '0 1px 3px rgba(74,20,20,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {iconEl(icon, ink, 19)}
        </div>
        <div style={{ marginLeft: 'auto' }}>{iconEl('arrowRight', COLOR.faint, 15, 2)}</div>
      </div>
      <div style={{ fontFamily: FONT.heading, fontSize: 14.5, fontWeight: 600, color: COLOR.ink900, marginTop: 13, lineHeight: 1.25 }}>{label}</div>
      <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 5 }}>{count} on record</div>
    </button>
  );
}

function isThisMonth(d) {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
}

export default function DashboardScreen({
  userRole, session, scopedOfficers, scopedMpcsRows, scopedMilkRows, recentActivities,
  chartData_MpcsProfit, chartData_ComplianceAudit,
  getMpcsAuditAgm, getMilkAuditAgm, onOpenRecords,
  setMpcsSelected, setMilkSelected,
}) {
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [activityCount, setActivityCount] = useState(4);

  const isAdmin = userRole === 'System Admin';
  const districtName = 'Gyalshing District';
  // Same "still pending AGM or Audit" definition DistrictPerformance (the
  // Benchmarks page) uses — computed here directly since that page's
  // mpcsPendingCompliance/milkPendingCompliance are local to its own
  // component, not reachable from Dashboard's scope.
  const mpcsPendingCompliance = scopedMpcsRows.filter((r) => {
    const s = getMpcsAuditAgm(r);
    return s.agm_status !== 'Completed' || s.audit_status !== 'Completed';
  }).length;
  const milkPendingCompliance = scopedMilkRows.filter((r) => {
    const s = getMilkAuditAgm(r);
    return s.agm_status !== 'Completed' || s.audit_status !== 'Completed';
  }).length;
  const mpcsSubmittedThisMonth = scopedMpcsRows.filter((r) => isThisMonth(r.created_at)).length;
  const milkSubmittedThisMonth = scopedMilkRows.filter((r) => isThisMonth(r.created_at)).length;
  const pendingAudits = mpcsPendingCompliance + milkPendingCompliance;
  // Same district/authority union desktop's own Registries tab tile uses.
  const districtCount = new Set(
    [...scopedMilkRows, ...scopedMpcsRows].map((r) => r.district || r.registration_authority).filter(Boolean)
  ).size;

  const sendBroadcast = async () => {
    if (!broadcastText.trim() || broadcastSending) return;
    setBroadcastSending(true);
    // broadcast_alerts already exists and is already consumed by the
    // field-officer app (App.js: fetches it, subscribes to INSERTs, shows
    // an "Important Notice" banner) — that side was built, but nothing
    // ever wrote to the table. This is the missing send path, not a new
    // table: same schema (message/sender/type) the field app already reads.
    const { error } = await supabase.from('broadcast_alerts').insert([{
      message: broadcastText.trim(),
      sender: session?.user?.user_metadata?.fullName || session?.user?.email || 'Admin',
      type: 'info',
    }]);
    setBroadcastSending(false);
    if (error) {
      alert('Broadcast failed: ' + error.message);
      return;
    }
    setBroadcastText('');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT.heading, fontSize: 21, fontWeight: 600, color: COLOR.ink900, letterSpacing: '-.01em' }}>{districtName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
              {iconEl('mapPin', '#9B8F8D', 14, 1.7)}
              <span style={{ fontSize: 13, color: COLOR.ink600 }}>Department of Cooperation, Sikkim</span>
            </div>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.greenAccent }} />
            {isAdmin ? 'ADMIN' : 'INSPECTOR'}
          </span>
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLOR.divider}`, display: 'flex' }}>
          <StatCol label="FIELD OFFICERS" value={`${scopedOfficers.length} active`} />
          <StatCol label="LAST SYNC" value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900 }}>Audit Queue</div>
            <div style={{ fontSize: 13, color: COLOR.ink600, marginTop: 3 }}>Awaiting your review</div>
          </div>
          <div style={{ background: COLOR.amberTint, borderRadius: 12, padding: '9px 15px' }}>
            <span style={{ fontFamily: FONT.heading, fontSize: 18, fontWeight: 600, color: COLOR.amber }}>{pendingAudits}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLOR.divider}` }}>
          <StatCol label="MILK SUBMISSIONS" value={`${milkSubmittedThisMonth} total`} />
          <StatCol label="MPCS RETURNS" value={`${mpcsSubmittedThisMonth} filed`} />
        </div>
      </Card>

      {isAdmin && (
        <div style={{ background: COLOR.broadcastCard, borderRadius: 16, padding: '16px 18px 18px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.13em', color: 'rgba(255,255,255,.62)' }}>EMERGENCY COMM TERMINAL</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              {iconEl('send', '#FFFFFF', 21, 1.6)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT.heading, fontSize: 16, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25 }}>Broadcast a directive</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.68)', marginTop: 4, lineHeight: 1.4 }}>Encrypted push to all active field officers.</div>
            </div>
          </div>
          <input
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder={broadcastSent ? 'Directive sent.' : 'Synchronize directive with all stations…'}
            style={{ marginTop: 15, width: '100%', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,.2)', borderRadius: 12, padding: '13px 14px', fontSize: 13, color: '#FFFFFF', background: 'rgba(255,255,255,.08)', outline: 'none' }}
          />
          <button
            type="button"
            onClick={sendBroadcast}
            disabled={!broadcastText.trim() || broadcastSending}
            style={{ marginTop: 10, width: '100%', border: 'none', borderRadius: 12, background: '#FFFFFF', color: COLOR.maroon, fontFamily: FONT.heading, fontSize: 13.5, fontWeight: 600, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: broadcastText.trim() ? 1 : 0.6 }}
          >
            {broadcastSending ? 'Sending…' : 'Initiate broadcast'}
            {iconEl('arrowRight', COLOR.maroon, 15, 2.1)}
          </button>
        </div>
      )}

      <div>
        <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900 }}>Registries</div>
        <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 6 }}>Jump into the records you oversee</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <RegistryTile icon="home" tint={COLOR.greenTint} ink={COLOR.green} label="MPCS Societies" count={scopedMpcsRows.length} onClick={() => onOpenRecords('MPCS')} />
          <RegistryTile icon="drop" tint={COLOR.amberTint} ink={COLOR.amberAccent} label="Milk Units" count={scopedMilkRows.length} onClick={() => onOpenRecords('MILK')} />
          <RegistryTile icon="bars" tint={COLOR.blueTint} ink={COLOR.blue} label="Benchmarks" count={districtCount} onClick={() => onOpenRecords('STATS')} />
          <RegistryTile icon="users" tint={COLOR.roseTint} ink={COLOR.maroon} label="Official Registry" count={scopedOfficers.length} onClick={() => onOpenRecords('OFFICERS')} />
        </div>
      </div>

      <Card>
        <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900 }}>Economic Sustainability</div>
        <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 3 }}>Profitability ratio — MPCS societies</div>
        {chartData_MpcsProfit.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: COLOR.mutedLight, fontSize: 12.5 }}>No profit/loss data recorded yet.</div>
        ) : (
          <>
            <div style={{ marginTop: 16, height: 12, borderRadius: 999, display: 'flex', overflow: 'hidden', background: COLOR.barTrack }}>
              {chartData_MpcsProfit.map((d) => {
                const total = chartData_MpcsProfit.reduce((s, x) => s + x.value, 0);
                return <div key={d.name} style={{ width: `${(d.value / total) * 100}%`, background: PROFIT_COLOR[d.name] || COLOR.mutedLight }} />;
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {chartData_MpcsProfit.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: PROFIT_COLOR[d.name] || COLOR.mutedLight, flex: '0 0 auto' }} />
                  <span style={{ fontSize: 13, color: COLOR.ink800, flex: 1 }}>{d.name}</span>
                  <span style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 600, color: COLOR.ink900 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900 }}>Compliance Audit</div>
        <div style={{ fontSize: 13, color: COLOR.muted, marginTop: 3 }}>AGM & audit completion — MPCS societies + milk units</div>
        {chartData_ComplianceAudit.every((d) => d.value === 0) ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: COLOR.mutedLight, fontSize: 12.5 }}>No societies or units on record yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 16 }}>
            {chartData_ComplianceAudit.map((d) => (
              <div key={d.name} style={{ background: COLOR.inset, borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', color: COLOR.mutedLight }}>{d.name.toUpperCase()}</div>
                <div style={{ fontFamily: FONT.heading, fontSize: 19, fontWeight: 600, color: COMPLIANCE_COLOR[d.name] || COLOR.ink900, marginTop: 5 }}>{d.value}</div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpenRecords('STATS')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 17, paddingTop: 15, borderTop: `1px solid ${COLOR.divider}`, background: 'none', border: 'none', borderTopWidth: 1, fontFamily: FONT.heading, fontSize: 13, fontWeight: 600, color: COLOR.maroon, width: '100%' }}
        >
          View detailed benchmarks
          {iconEl('arrowRight', COLOR.maroon, 14, 2.1)}
        </button>
      </Card>

      <Card>
        <div style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900 }}>System Overview</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[
            { label: 'Field Officers Active', value: scopedOfficers.length, tint: COLOR.greenTint, ink: COLOR.green },
            { label: 'Pending Audits', value: pendingAudits, tint: COLOR.amberTint, ink: COLOR.amber },
            { label: 'Total Milk Submissions', value: milkSubmittedThisMonth, tint: COLOR.blueTint, ink: COLOR.blue },
          ].map((o) => (
            <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: COLOR.inset, borderRadius: 12, padding: 13 }}>
              <span style={{ fontSize: 13, color: COLOR.ink700, flex: 1 }}>{o.label}</span>
              <span style={{ background: o.tint, color: o.ink, borderRadius: 999, padding: '5px 11px', fontFamily: FONT.heading, fontSize: 13, fontWeight: 600 }}>{o.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: COLOR.inset, borderRadius: 12, padding: 13 }}>
            <span style={{ fontSize: 13, color: COLOR.ink700, flex: 1 }}>Data Sync Engine</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 11px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.greenAccent }} />LIVE
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Recent Activity</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', whiteSpace: 'nowrap' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLOR.greenAccent }} />REALTIME
          </span>
        </div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {recentActivities.slice(0, activityCount).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => (a.isMpcs ? setMpcsSelected(a.row) : setMilkSelected(a.row))}
              style={{ display: 'flex', gap: 12, background: COLOR.inset, border: 'none', borderRadius: 14, padding: 14, textAlign: 'left', width: '100%' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: a.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={a.iconColor} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 500, color: COLOR.ink900, lineHeight: 1.3 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 5, lineHeight: 1.4 }}>{a.sub}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9 }}>
                  <span style={{ background: a.badgeBg, color: a.badgeColor, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.09em' }}>{a.badgeText}</span>
                  <span style={{ fontSize: 11, color: COLOR.mutedLight }}>{a.timeStr ? new Date(a.timeStr).toLocaleDateString('en-IN') : '—'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', flex: '0 0 auto' }}>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: COLOR.blue, whiteSpace: 'nowrap' }}>View →</span>
              </div>
            </button>
          ))}
        </div>
        {recentActivities.length > activityCount && (
          <button type="button" onClick={() => setActivityCount((n) => n + 4)} style={{ marginTop: 13, width: '100%', background: COLOR.inset, border: 'none', borderRadius: 12, padding: 13, fontFamily: FONT.heading, fontSize: 13, fontWeight: 500, color: COLOR.ink700 }}>
            Load older activity
          </button>
        )}
      </Card>
    </>
  );
}
