import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import KpiGrid from '../components/KpiGrid';
import SearchFilterBar from '../components/SearchFilterBar';
import EmptyStateCard from '../components/EmptyStateCard';
import PaginationCard from '../components/PaginationCard';
import { fmtAadhaar } from '../format';

export default function MemberRegistryScreen({
  scopedMemberRows, memberFiltered, memberStats, memberPaged, memberPage, memberPageSize,
  memberTotalPages, memberPageClamped, setMemberPage,
  memberSearchQ, setMemberSearchQ, memberTypeFilter, setMemberTypeFilter,
  memberSocietyFilter, setMemberSocietyFilter, memberWardFilter, setMemberWardFilter,
  memberSocietyOptions, memberWardOptions, downloadCSV, handleFlagMember, handleUnflagMember,
}) {
  const hasActiveFilter = Boolean(memberSearchQ || memberTypeFilter || memberSocietyFilter || memberWardFilter);

  const clearAll = () => {
    setMemberSearchQ('');
    setMemberTypeFilter('');
    setMemberSocietyFilter('');
    setMemberWardFilter('');
  };

  const toggleType = (type) => setMemberTypeFilter((prev) => (prev === type ? '' : type));

  return (
    <>
      <PageHeader
        eyebrow="PERSISTENT SOCIETY ROSTERS"
        title="Member Registry"
        countLabel={`${memberStats.total} REGISTERED MEMBERS`}
        subtitle="Rosters held across every society on record"
        actions={[{ label: 'Export CSV', icon: 'download', primary: true, onClick: () => downloadCSV(memberFiltered, 'Gyalshing_Member_Registry') }]}
      />

      <KpiGrid
        items={[
          { label: 'TOTAL MEMBERS', value: memberStats.total, icon: 'person', tint: COLOR.blueTint, ink: COLOR.blue },
          {
            label: 'MPCS MEMBERS', value: memberStats.mpcs, icon: 'home',
            tint: memberTypeFilter === 'MPCS' ? COLOR.roseTint2 : COLOR.roseTint, ink: COLOR.maroon,
            selected: memberTypeFilter === 'MPCS', onClick: () => toggleType('MPCS'),
          },
          {
            label: 'MILK UNIT MEMBERS', value: memberStats.milk, icon: 'drop',
            tint: COLOR.amberTint, ink: COLOR.amber,
            selected: memberTypeFilter === 'MILK', onClick: () => toggleType('MILK'),
          },
          { label: 'SOCIETIES COVERED', value: memberStats.societies, icon: 'users', tint: COLOR.greenTint, ink: COLOR.green },
        ]}
      />

      <SearchFilterBar
        searchValue={memberSearchQ}
        onSearchChange={setMemberSearchQ}
        searchPlaceholder="Search name, society or roll no."
        showClear={false}
        filters={[
          {
            label: 'TYPE', value: memberTypeFilter || 'All types',
            selected: Boolean(memberTypeFilter), rawValue: memberTypeFilter, onChange: setMemberTypeFilter,
            options: [{ value: '', label: 'All types' }, { value: 'MPCS', label: 'MPCS' }, { value: 'MILK', label: 'Milk Unit' }],
          },
          {
            label: 'SOCIETY', value: memberSocietyFilter || 'All societies',
            selected: Boolean(memberSocietyFilter), rawValue: memberSocietyFilter, onChange: setMemberSocietyFilter,
            options: [{ value: '', label: 'All societies' }, ...memberSocietyOptions.map((s) => ({ value: s, label: s }))],
          },
          {
            label: 'WARD', value: memberWardFilter || 'All wards',
            selected: Boolean(memberWardFilter), rawValue: memberWardFilter, onChange: setMemberWardFilter,
            options: [{ value: '', label: 'All wards' }, ...memberWardOptions.map((w) => ({ value: w, label: w }))],
          },
        ]}
      />

      {hasActiveFilter && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 8, borderTop: `1px solid ${COLOR.divider}` }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: COLOR.green, flex: 1 }}>
            Showing {memberFiltered.length} of {scopedMemberRows.length} registered members
          </span>
          <button type="button" onClick={clearAll} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: COLOR.maroon, padding: 0 }}>
            Clear all
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Registered Members</span>
        <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '5px 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
          {memberFiltered.length} MEMBERS
        </span>
      </div>

      {memberFiltered.length === 0 ? (
        <EmptyStateCard
          icon="person"
          title="No members found"
          body={scopedMemberRows.length === 0 ? "No members registered yet — add one from the mobile app's Master Data → Member Data screen." : 'Try adjusting your filters.'}
          actionLabel="Refresh roster"
          onAction={clearAll}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {memberPaged.map((m) => (
            <Card key={m.id} style={{ padding: 15 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: m.society_type === 'MPCS' ? COLOR.greenTint : COLOR.amberTint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                  {iconEl('person', m.society_type === 'MPCS' ? COLOR.green : COLOR.amber, 19)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONT.heading, fontSize: 15.5, fontWeight: 600, color: COLOR.ink900 }}>{m.member_name || '—'}</div>
                  <div style={{ fontSize: 12, color: COLOR.muted, marginTop: 2 }}>{m.society_name || '—'} {m.ward_name ? `· ${m.ward_name}` : ''}</div>
                  <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 2 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-IN') : '—'}</div>
                </div>
                <span style={{ background: m.society_type === 'MPCS' ? COLOR.greenTint : COLOR.amberTint, color: m.society_type === 'MPCS' ? COLOR.green : COLOR.amber, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em', flex: '0 0 auto' }}>
                  {m.society_type || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {m.flagged && (
                  <span style={{ background: COLOR.amberTint, color: COLOR.amber, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }} title={[m.flag_reason, m.flagged_by ? `Flagged by ${m.flagged_by}` : null].filter(Boolean).join(' — ')}>
                    🚩 FLAGGED FOR REVIEW
                  </span>
                )}
                {!m.flagged && m.resolved_at && (
                  <span style={{ background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.06em' }}>
                    ✓ REVIEWED{m.resolved_by ? ` BY ${m.resolved_by}` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 }}>
                <div style={{ background: COLOR.inset, borderRadius: 12, padding: '11px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.11em', color: COLOR.mutedLight }}>MOBILE</div>
                  <div style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 600, color: COLOR.ink900, marginTop: 4 }}>{m.mobile_number || '—'}</div>
                </div>
                <div style={{ background: COLOR.inset, borderRadius: 12, padding: '11px 12px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.11em', color: COLOR.mutedLight }}>AADHAAR</div>
                  <div style={{ fontFamily: FONT.heading, fontSize: 14, fontWeight: 600, color: COLOR.ink900, marginTop: 4 }}>{m.aadhaar_number ? fmtAadhaar(m.aadhaar_number) : '—'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (m.flagged ? handleUnflagMember(m) : handleFlagMember(m))}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 12, background: COLOR.inset, border: 'none', borderRadius: 12, padding: 12, fontFamily: FONT.heading, fontSize: 13, fontWeight: 600, color: m.flagged ? COLOR.amber : COLOR.maroon }}
              >
                {m.flagged ? 'Unflag' : '🚩 Flag for review'}
              </button>
            </Card>
          ))}
        </div>
      )}

      <PaginationCard
        page={memberPageClamped}
        totalPages={memberTotalPages}
        total={memberFiltered.length}
        pageSize={memberPageSize}
        onPageChange={setMemberPage}
        showingLabel={`Showing ${memberFiltered.length === 0 ? 0 : (memberPageClamped - 1) * memberPageSize + 1}–${Math.min(memberPageClamped * memberPageSize, memberFiltered.length)} of ${memberFiltered.length}`}
      />
    </>
  );
}
