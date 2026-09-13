import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import KpiRail from '../components/KpiRail';
import SearchFilterBar from '../components/SearchFilterBar';
import EmptyStateCard from '../components/EmptyStateCard';
import PaginationCard from '../components/PaginationCard';
import { fmtRs } from '../format';

export default function MpcsRegistryScreen({
  scopedMpcsRows, mpcsFiltered, mpcsStats, mpcsPaged, mpcsPage, mpcsPageSize, mpcsTotalPages, mpcsPageClamped,
  setMpcsPage, searchQ, setSearchQ,
  filterMpcsAuditStatus, setFilterMpcsAuditStatus, filterMpcsProfitStatus, setFilterMpcsProfitStatus,
  filterMpcsAuditGrade, setFilterMpcsAuditGrade, activeFilter, setActiveFilter,
  downloadCSV, onView, getMpcsAuditAgm,
}) {
  const hasActiveFilter = Boolean(searchQ || filterMpcsAuditStatus || filterMpcsProfitStatus || filterMpcsAuditGrade || activeFilter);

  const clearAll = () => {
    setSearchQ('');
    setFilterMpcsAuditStatus('');
    setFilterMpcsProfitStatus('');
    setFilterMpcsAuditGrade('');
    setActiveFilter(null);
  };

  return (
    <>
      <PageHeader
        eyebrow="COOPERATIVE SECTOR OVERSIGHT"
        title="MPCS Societies"
        countLabel={`${mpcsStats.total} TOTAL RETURNS`}
        subtitle="Registry & returns for all societies on record"
        actions={[{ label: 'Export CSV', icon: 'download', primary: true, onClick: () => downloadCSV(mpcsFiltered, 'MPCS_Returns') }]}
      />

      <KpiRail
        items={[
          { label: 'TOTAL TURNOVER', value: fmtRs(mpcsStats.turnover), icon: 'rupee', tint: COLOR.roseTint, ink: COLOR.maroon },
          { label: 'TOTAL MEMBERS', value: mpcsStats.members, icon: 'users', tint: COLOR.amberTint, ink: COLOR.amber },
          {
            label: 'ACTIVE LOANS', value: mpcsStats.loans, icon: 'briefcase', tint: COLOR.roseTint, ink: COLOR.maroon,
            selected: activeFilter === 'loan', onClick: () => setActiveFilter(activeFilter === 'loan' ? null : 'loan'),
          },
          {
            label: 'AUDITS DONE', value: mpcsStats.audits, icon: 'refresh', tint: COLOR.roseTint, ink: COLOR.maroon,
            selected: activeFilter === 'audit', onClick: () => setActiveFilter(activeFilter === 'audit' ? null : 'audit'),
          },
          {
            label: 'ACTIVE PROFITS', value: mpcsStats.profits, icon: 'doc', tint: COLOR.amberTint, ink: COLOR.amber,
            selected: activeFilter === 'profit', onClick: () => setActiveFilter(activeFilter === 'profit' ? null : 'profit'),
          },
        ]}
      />

      <SearchFilterBar
        searchValue={searchQ}
        onSearchChange={setSearchQ}
        searchPlaceholder="Search society name or reg. no."
        showClear={hasActiveFilter}
        onClear={clearAll}
        filters={[
          {
            label: 'AUDIT', value: filterMpcsAuditStatus ? (filterMpcsAuditStatus === 'Yes' ? 'Completed' : 'Not completed') : 'All statuses',
            selected: Boolean(filterMpcsAuditStatus), rawValue: filterMpcsAuditStatus, onChange: setFilterMpcsAuditStatus,
            options: [{ value: '', label: 'All statuses' }, { value: 'Yes', label: 'Completed' }, { value: 'No', label: 'Not completed' }],
          },
          {
            label: 'PROFIT', value: filterMpcsProfitStatus || 'All statuses',
            selected: Boolean(filterMpcsProfitStatus), rawValue: filterMpcsProfitStatus, onChange: setFilterMpcsProfitStatus,
            options: [{ value: '', label: 'All statuses' }, { value: 'PROFIT', label: 'Profit' }, { value: 'LOSS', label: 'Loss' }, { value: 'NO_PROFIT_NO_LOSS', label: 'No profit/loss' }],
          },
          {
            label: 'GRADE', value: filterMpcsAuditGrade ? `Grade ${filterMpcsAuditGrade}` : 'All grades',
            selected: Boolean(filterMpcsAuditGrade), rawValue: filterMpcsAuditGrade, onChange: setFilterMpcsAuditGrade,
            options: [{ value: '', label: 'All grades' }, { value: 'A', label: 'Grade A' }, { value: 'B', label: 'Grade B' }, { value: 'C', label: 'Grade C' }, { value: 'D', label: 'Grade D' }],
          },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Official Returns Registry</span>
        <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
          {mpcsFiltered.length} VERIFIED
        </span>
      </div>

      {mpcsFiltered.length === 0 ? (
        <EmptyStateCard
          icon="home"
          title="No MPCS returns found"
          body={scopedMpcsRows.length === 0 ? 'No records yet — submit a form from the MPCS app!' : 'Try adjusting your filters.'}
          actionLabel="Refresh registry"
          onAction={clearAll}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mpcsPaged.map((row) => {
            const auditAgm = getMpcsAuditAgm(row);
            const auditIncomplete = auditAgm.audit_status !== 'Completed';
            return (
              <Card key={row.id} style={{ padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: COLOR.greenTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    {iconEl('home', COLOR.green, 19)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT.heading, fontSize: 15.5, fontWeight: 600, color: COLOR.ink900 }}>{row.society_name || '—'}</div>
                    <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>
                      {row.district || row.form_data?.gpu || 'Sikkim'} · Reg. {row.registration_number || '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 2 }}>
                      {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {auditIncomplete && (
                    <span style={{ background: COLOR.roseTint, color: COLOR.maroon, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>AUDIT NOT COMPLETED</span>
                  )}
                  {row.has_loan && (
                    <span style={{ background: COLOR.amberTint, color: COLOR.amber, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>LOAN ACTIVE</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 }}>
                  {[
                    { label: 'MEMBERS', value: row.total_members || 0, color: COLOR.ink900 },
                    { label: 'TURNOVER', value: fmtRs(row.annual_turnover), color: COLOR.maroon },
                    { label: 'BANK BALANCE', value: fmtRs(row.bank_balance), color: COLOR.green },
                    { label: 'PROFIT?', value: row.is_profit === 'PROFIT' || row.is_profit === 'Yes' ? 'Profit' : row.is_profit === 'LOSS' || row.is_profit === 'No' ? 'Loss' : '—', color: COLOR.mutedLight },
                  ].map((s) => (
                    <div key={s.label} style={{ background: COLOR.inset, borderRadius: 12, padding: '11px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.11em', color: COLOR.mutedLight }}>{s.label}</div>
                      <div style={{ fontFamily: FONT.heading, fontSize: 16, fontWeight: 600, color: s.color, marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onView(row)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 12, background: COLOR.inset, border: 'none', borderRadius: 12, padding: 12, fontFamily: FONT.heading, fontSize: 13, fontWeight: 600, color: COLOR.maroon }}
                >
                  View return
                  {iconEl('arrowRight', COLOR.maroon, 14, 2)}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      <PaginationCard
        page={mpcsPageClamped}
        totalPages={mpcsTotalPages}
        total={mpcsFiltered.length}
        pageSize={mpcsPageSize}
        onPageChange={setMpcsPage}
        showingLabel={`Showing ${mpcsFiltered.length === 0 ? 0 : (mpcsPageClamped - 1) * mpcsPageSize + 1}–${Math.min(mpcsPageClamped * mpcsPageSize, mpcsFiltered.length)} of ${mpcsFiltered.length}`}
      />
    </>
  );
}
