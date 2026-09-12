import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import KpiRail from '../components/KpiRail';
import SearchFilterBar from '../components/SearchFilterBar';
import EmptyStateCard from '../components/EmptyStateCard';
import PaginationCard from '../components/PaginationCard';
import { fmtL, fmtRs, isYes } from '../format';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function IdentityCard({ userRole, fullName, assignedUnits }) {
  const isAdmin = userRole === 'System Admin';
  return (
    <Card style={{ padding: 15 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: isAdmin ? COLOR.greenTint : COLOR.amberTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          {iconEl(isAdmin ? 'shieldCheck' : 'person', isAdmin ? COLOR.green : COLOR.amber, 18)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.heading, fontSize: 15.5, fontWeight: 600, color: COLOR.ink900 }}>{fullName}</div>
          <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>
            {isAdmin ? 'System Administrator · All Gyalshing District' : `Cooperative Inspector · ${assignedUnits.length} assigned MPCS units`}
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', color: COLOR.mutedLight }}>SYNC</div>
          <div style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 600, color: COLOR.ink900, marginTop: 2 }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MilkRegistryScreen({
  userRole, session, assignedUnits, scopedMilkRows, milkFiltered, milkStats,
  milkPaged, milkPage, milkPageSize, milkTotalPages, milkPageClamped, setMilkPage,
  searchQ, setSearchQ, filterMonth, setFilterMonth, filterCenter, setFilterCenter,
  centerOptions, activeFilter, setActiveFilter, downloadCSV, onView, getMilkAuditAgm, resolveSubmitter,
}) {
  const fullName = session?.user?.user_metadata?.fullName || session?.user?.email || '?';
  const hasActiveFilter = Boolean(searchQ || filterMonth || filterCenter || activeFilter);

  const clearAll = () => {
    setSearchQ('');
    setFilterMonth('');
    setFilterCenter('');
    setActiveFilter(null);
  };

  return (
    <>
      <IdentityCard userRole={userRole} fullName={fullName} assignedUnits={assignedUnits} />

      <PageHeader
        eyebrow="DAIRY COOPERATIVE OPERATIONS"
        title="Milk PCS Units"
        countLabel={`${milkStats.total} TOTAL SUBMISSIONS`}
        subtitle="Registry & returns for all milk collection centres"
        actions={[{ label: 'Export CSV', icon: 'download', primary: true, onClick: () => downloadCSV(milkFiltered, 'Milk_PCS_Submissions') }]}
      />

      <KpiRail
        items={[
          { label: 'TOTAL LITRES', value: fmtL(milkStats.litres), icon: 'drop', tint: COLOR.roseTint, ink: COLOR.maroon },
          { label: 'TOTAL WITHDRAWAL', value: fmtRs(milkStats.withdrawal), icon: 'rupee', tint: COLOR.amberTint, ink: COLOR.amber },
          { label: 'AGGREGATE BALANCE', value: fmtRs(milkStats.balance), icon: 'rupee', tint: COLOR.greenTint, ink: COLOR.green },
          { label: 'TOTAL MEMBERS', value: milkStats.members, icon: 'users', tint: COLOR.blueTint, ink: COLOR.blue },
          { label: 'ACTIVE LOANS', value: milkStats.loans, icon: 'briefcase', tint: COLOR.roseTint, ink: COLOR.maroon },
        ]}
      />

      <SearchFilterBar
        searchValue={searchQ}
        onSearchChange={setSearchQ}
        searchPlaceholder="Search officer or centre name"
        showClear={hasActiveFilter}
        onClear={clearAll}
        filters={[
          {
            label: 'MONTH', value: filterMonth || 'All months',
            selected: Boolean(filterMonth), rawValue: filterMonth, onChange: setFilterMonth,
            options: [{ value: '', label: 'All months' }, ...MONTHS.map((m) => ({ value: m, label: m }))],
          },
          {
            label: 'CENTRE', value: filterCenter || 'All centres',
            selected: Boolean(filterCenter), rawValue: filterCenter, onChange: setFilterCenter,
            options: [{ value: '', label: 'All centres' }, ...centerOptions.map((c) => ({ value: c, label: c }))],
          },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Returns & Evidence Log</span>
        <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
          {milkFiltered.length} VERIFIED
        </span>
      </div>

      {milkFiltered.length === 0 ? (
        <EmptyStateCard
          icon="drop"
          title="No Milk PCS submissions found"
          body={scopedMilkRows.length === 0 ? 'No records yet — submit a form from the Milk PCS app.' : 'Try adjusting your filters.'}
          actionLabel="Refresh log"
          onAction={clearAll}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {milkPaged.map((row) => {
            const auditAgm = getMilkAuditAgm(row);
            return (
              <Card key={row.id} style={{ padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR.roseTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    {iconEl('drop', COLOR.maroon, 19)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT.heading, fontSize: 15.5, fontWeight: 600, color: COLOR.ink900, lineHeight: 1.25, textWrap: 'pretty' }}>{row.center_name || '—'}</div>
                    <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 3 }}>{resolveSubmitter(row, '—')}</div>
                    <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 2 }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                  {row.reporting_month && (
                    <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
                      {row.reporting_month.slice(0, 3).toUpperCase()} {new Date(row.created_at || Date.now()).getFullYear()}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {!isYes(auditAgm.audit_done) && (
                    <span style={{ background: COLOR.roseTint, color: COLOR.maroon, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>AUDIT NO</span>
                  )}
                  {!isYes(auditAgm.agm_done) && (
                    <span style={{ background: COLOR.roseTint, color: COLOR.maroon, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>AGM NO</span>
                  )}
                  <span style={{ background: row.photo_url ? COLOR.greenTint : COLOR.inset, color: row.photo_url ? COLOR.green : COLOR.mutedLight, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>
                    PHOTO {row.photo_url ? '✓' : '—'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 }}>
                  {[
                    { label: 'LITRES', value: fmtL(row.litres), color: COLOR.maroon },
                    { label: 'WITHDRAWAL', value: fmtRs(row.withdrawal), color: COLOR.amber },
                    { label: 'BALANCE', value: fmtRs(row.balance), color: COLOR.green },
                    { label: 'MEMBERS', value: row.total_members || 0, color: COLOR.ink900 },
                  ].map((s) => (
                    <div key={s.label} style={{ background: COLOR.inset, borderRadius: 12, padding: '11px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.11em', color: COLOR.mutedLight }}>{s.label}</div>
                      <div style={{ fontFamily: FONT.heading, fontSize: 16, fontWeight: 600, color: s.color, marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${COLOR.hairline}` }}>
                  <span style={{ fontSize: 11.5, color: COLOR.muted }}>Loan {row.has_loan ? 'Active' : '—'}</span>
                  <button
                    type="button"
                    onClick={() => onView(row)}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', fontFamily: FONT.heading, fontSize: 12, fontWeight: 700, color: COLOR.maroon }}
                  >
                    View return
                    {iconEl('arrowRight', COLOR.maroon, 14, 2)}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PaginationCard
        page={milkPageClamped}
        totalPages={milkTotalPages}
        total={milkFiltered.length}
        pageSize={milkPageSize}
        onPageChange={setMilkPage}
        showingLabel={`Showing ${milkFiltered.length === 0 ? 0 : (milkPageClamped - 1) * milkPageSize + 1}–${Math.min(milkPageClamped * milkPageSize, milkFiltered.length)} of ${milkFiltered.length}`}
      />
    </>
  );
}
