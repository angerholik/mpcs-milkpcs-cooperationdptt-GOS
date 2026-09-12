import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import KpiGrid from '../components/KpiGrid';
import SearchFilterBar from '../components/SearchFilterBar';
import EmptyStateCard from '../components/EmptyStateCard';
import PaginationCard from '../components/PaginationCard';
import { fmtRs, fmtAadhaar } from '../format';

export default function LoanBeneficiariesScreen({
  scopedLoanBenRows, loanBenFiltered, loanBenStats, loanBenPaged, loanBenPage, loanBenPageSize,
  loanBenTotalPages, loanBenPageClamped, setLoanBenPage,
  loanBenSearchQ, setLoanBenSearchQ, loanBenTypeFilter, setLoanBenTypeFilter,
  loanBenSocietyFilter, setLoanBenSocietyFilter, loanBenSocietyOptions,
  downloadLoanBeneficiariesCSV,
}) {
  const hasActiveFilter = Boolean(loanBenSearchQ || loanBenTypeFilter || loanBenSocietyFilter);

  const clearAll = () => {
    setLoanBenSearchQ('');
    setLoanBenTypeFilter('');
    setLoanBenSocietyFilter('');
  };

  const toggleType = (type) => setLoanBenTypeFilter((prev) => (prev === type ? '' : type));

  return (
    <>
      <PageHeader
        eyebrow="LOAN DISBURSEMENT RECORDS"
        title="Loan Beneficiaries"
        countLabel={`${loanBenStats.total} BENEFICIARIES`}
        subtitle="Disbursements recorded across all societies"
        actions={[{ label: 'Export CSV', icon: 'download', primary: true, onClick: () => downloadLoanBeneficiariesCSV(loanBenFiltered, 'Gyalshing_Loan_Beneficiaries') }]}
      />

      <KpiGrid
        items={[
          { label: 'TOTAL BENEFICIARIES', value: loanBenStats.total, icon: 'person', tint: COLOR.blueTint, ink: COLOR.blue },
          {
            label: 'MPCS BENEFICIARIES', value: loanBenStats.mpcs, icon: 'home',
            tint: loanBenTypeFilter === 'MPCS' ? COLOR.roseTint2 : COLOR.roseTint, ink: COLOR.maroon,
            selected: loanBenTypeFilter === 'MPCS', onClick: () => toggleType('MPCS'),
          },
          {
            label: 'MILK UNIT BENEFICIARIES', value: loanBenStats.milk, icon: 'drop',
            tint: COLOR.amberTint, ink: COLOR.amber,
            selected: loanBenTypeFilter === 'MILK', onClick: () => toggleType('MILK'),
          },
          { label: 'TOTAL OUTSTANDING (₹)', value: fmtRs(loanBenStats.totalRemaining), icon: 'rupee', tint: COLOR.roseTint, ink: COLOR.maroon },
        ]}
      />

      <SearchFilterBar
        searchValue={loanBenSearchQ}
        onSearchChange={setLoanBenSearchQ}
        searchPlaceholder="Search name, society or account"
        showClear={hasActiveFilter}
        onClear={clearAll}
        filters={[
          {
            label: 'TYPE', value: loanBenTypeFilter || 'All types',
            selected: Boolean(loanBenTypeFilter), rawValue: loanBenTypeFilter, onChange: setLoanBenTypeFilter,
            options: [{ value: '', label: 'All types' }, { value: 'MPCS', label: 'MPCS' }, { value: 'MILK', label: 'Milk Unit' }],
          },
          {
            label: 'SOCIETY', value: loanBenSocietyFilter || 'All societies',
            selected: Boolean(loanBenSocietyFilter), rawValue: loanBenSocietyFilter, onChange: setLoanBenSocietyFilter,
            options: [{ value: '', label: 'All societies' }, ...loanBenSocietyOptions.map((s) => ({ value: s, label: s }))],
          },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Beneficiary Records</span>
        <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
          {loanBenFiltered.length} BENEFICIARIES
        </span>
      </div>

      {loanBenFiltered.length === 0 ? (
        <EmptyStateCard
          icon="rupee"
          title="No loan beneficiaries found"
          body={scopedLoanBenRows.length === 0 ? "No beneficiaries recorded yet — add one from the mobile app's Loan Setup → Manage Beneficiaries screen." : 'Try adjusting your filters.'}
          actionLabel="Refresh records"
          onAction={clearAll}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loanBenPaged.map((b) => (
            <Card key={b.id} style={{ padding: 15 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: b.society_type === 'MPCS' ? COLOR.roseTint : COLOR.amberTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {iconEl('rupee', b.society_type === 'MPCS' ? COLOR.maroon : COLOR.amber, 19)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT.heading, fontSize: 15.5, fontWeight: 600, color: COLOR.ink900 }}>{b.beneficiary_name || '—'}</div>
                  <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>{b.society_name || '—'}</div>
                  <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 2 }}>{b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : '—'}</div>
                </div>
                <span style={{ background: b.society_type === 'MPCS' ? COLOR.roseTint : COLOR.amberTint, color: b.society_type === 'MPCS' ? COLOR.maroon : COLOR.amber, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em', flex: '0 0 auto' }}>
                  {b.society_type || '—'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 }}>
                {[
                  { label: 'AADHAAR', value: b.aadhaar_number ? fmtAadhaar(b.aadhaar_number) : '—', color: COLOR.ink900 },
                  { label: 'AMOUNT TAKEN', value: fmtRs(b.amount_taken), color: COLOR.ink900 },
                  { label: 'TOTAL PAID', value: fmtRs(b.amount_paid), color: COLOR.green },
                  { label: 'REMAINING', value: fmtRs(b.amount_remaining), color: COLOR.maroon },
                ].map((s) => (
                  <div key={s.label} style={{ background: COLOR.inset, borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.11em', color: COLOR.mutedLight }}>{s.label}</div>
                    <div style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 600, color: s.color, marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <PaginationCard
        page={loanBenPageClamped}
        totalPages={loanBenTotalPages}
        total={loanBenFiltered.length}
        pageSize={loanBenPageSize}
        onPageChange={setLoanBenPage}
        showingLabel={`Showing ${loanBenFiltered.length === 0 ? 0 : (loanBenPageClamped - 1) * loanBenPageSize + 1}–${Math.min(loanBenPageClamped * loanBenPageSize, loanBenFiltered.length)} of ${loanBenFiltered.length}`}
      />
    </>
  );
}
