import { useMemo, useState } from 'react';
import { COLOR, FONT } from '../tokens';
import { iconEl } from '../icons';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import SearchFilterBar from '../components/SearchFilterBar';
import EmptyStateCard from '../components/EmptyStateCard';
import PaginationCard from '../components/PaginationCard';
import { officerInitials, officerRoleCode } from '../format';

const AVATAR_PALETTE = [
  { bg: COLOR.roseTint, ink: COLOR.maroon },
  { bg: COLOR.blueTint, ink: COLOR.blue },
  { bg: COLOR.amberTint, ink: COLOR.amber },
  { bg: COLOR.greenTint, ink: COLOR.green },
  { bg: COLOR.violetTint, ink: COLOR.violet },
];

const avatarStyle = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const ROLE_BADGE = {
  CI: { tint: COLOR.amberTint, ink: COLOR.amber },
  ACI: { tint: COLOR.violetTint, ink: COLOR.violet },
  PA: { tint: COLOR.greenTint, ink: COLOR.green },
  Admin: { tint: COLOR.roseTint, ink: COLOR.maroon },
};

const PAGE_SIZE = 10;

export default function UsersRolesScreen({
  scopedOfficers, scopedHierarchyMapping, userRole,
  setAssignAciPrefillUnit, setAssignDelegateRole, setAssignDelegatePrefillAssignee, setShowAssignAciModal,
  openReassignDelegate, handleRevokeDelegate, setScopeOfficer,
}) {
  const [searchQ, setSearchQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [page, setPage] = useState(1);

  const hasActiveFilter = Boolean(searchQ || roleFilter);
  const clearAll = () => { setSearchQ(''); setRoleFilter(''); };

  const filtered = useMemo(() => {
    let d = [...scopedOfficers];
    if (roleFilter) d = d.filter((o) => officerRoleCode(o.role || 'ACI / Field Officer') === roleFilter);
    const q = searchQ.toLowerCase().trim();
    if (q) d = d.filter((o) => (o.name || '').toLowerCase().includes(q));
    return d;
  }, [scopedOfficers, roleFilter, searchQ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const paged = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="ACCESS & ASSIGNMENTS"
        title="Users & Roles"
        countLabel={`${scopedOfficers.length} OFFICERS`}
        subtitle="Designations and assigned institutions"
      />

      <SearchFilterBar
        searchValue={searchQ}
        onSearchChange={setSearchQ}
        searchPlaceholder="Search officer name or ID"
        showClear={hasActiveFilter}
        onClear={clearAll}
        filters={[
          {
            label: 'ROLE', value: roleFilter || 'All roles',
            selected: Boolean(roleFilter), rawValue: roleFilter, onChange: (v) => { setRoleFilter(v); setPage(1); },
            options: [
              { value: '', label: 'All roles' }, { value: 'CI', label: 'CI' },
              { value: 'ACI', label: 'ACI' }, { value: 'PA', label: 'PA' },
            ],
          },
          {
            label: 'STATUS', value: 'Active', selected: false, rawValue: 'Active', onChange: () => {},
            options: [{ value: 'Active', label: 'Active' }],
          },
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 2px' }}>
        <span style={{ fontFamily: FONT.heading, fontSize: 17, fontWeight: 600, color: COLOR.ink900, flex: 1 }}>Officer Roster</span>
        <span style={{ fontSize: 12, color: COLOR.muted, whiteSpace: 'nowrap' }}>
          {filtered.length === 0 ? 'Showing 0 of 0' : `Showing ${(pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyStateCard
          icon="person"
          title="No officers found"
          body={scopedOfficers.length === 0 ? 'No officers have registered yet.' : 'Try adjusting your filters.'}
          actionLabel="Refresh roster"
          onAction={clearAll}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {paged.map((off, pageIdx) => {
            const idx = filtered.indexOf(off);
            const officerCode = `OF-${String(idx + 1).padStart(3, '0')}`;
            const roleCode = officerRoleCode(off.role || 'ACI / Field Officer');
            const isCiOfficer = (off.role || '').includes('Cooperative Inspector');
            const isPaOfficer = (off.role || '').includes('Project Assistant');
            const avatar = avatarStyle(off.name);
            const badge = ROLE_BADGE[roleCode] || ROLE_BADGE.ACI;

            const assignments = [
              ...Object.entries(scopedHierarchyMapping)
                .filter(([, m]) => m.aci === off.name)
                .map(([unitName, m]) => ({ unitName, role: 'ACI' })),
              ...Object.entries(scopedHierarchyMapping)
                .filter(([, m]) => m.pa === off.name)
                .map(([unitName, m]) => ({ unitName, role: 'PA' })),
            ];
            const displayAssignments = isCiOfficer
              ? (off.assigned_units || []).map((unitName) => ({ unitName, role: 'Scope' }))
              : assignments;
            const has = displayAssignments.length > 0;
            const isOpen = expandedId === (off.id || idx);
            const canAssignScope = isCiOfficer && userRole === 'System Admin';
            const hasAnyAction = canAssignScope || !isCiOfficer;
            const isMenuOpen = menuOpenId === (off.id || idx);

            const openManageAccess = () => {
              if (canAssignScope) { setScopeOfficer(off); return; }
              if (!isCiOfficer) {
                setAssignAciPrefillUnit(null);
                setAssignDelegateRole(isPaOfficer ? 'PA' : 'ACI');
                setAssignDelegatePrefillAssignee(off.name);
                setShowAssignAciModal(true);
              }
            };

            return (
              <Card key={off.id || idx} style={{ padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: avatar.bg, color: avatar.ink, fontFamily: FONT.heading, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    {officerInitials(off.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT.heading, fontSize: 15, fontWeight: 600, color: COLOR.ink900, lineHeight: 1.3 }}>{off.name || '—'}</div>
                    <div style={{ fontSize: 11.5, color: COLOR.mutedLight, marginTop: 3 }}>{officerCode}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flex: '0 0 auto' }}>
                    <span style={{ background: badge.tint, color: badge.ink, borderRadius: 999, padding: '4px 9px', fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em' }}>{roleCode}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: COLOR.greenTint, color: COLOR.green, borderRadius: 999, padding: '4px 9px', fontSize: 9, fontWeight: 700, letterSpacing: '.09em', whiteSpace: 'nowrap' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: COLOR.greenAccent }} />
                      ACTIVE
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => has && setExpandedId(isOpen ? null : (off.id || idx))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: COLOR.inset,
                    border: 'none', borderRadius: 12, padding: 12, marginTop: 13, minHeight: 44,
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: has ? COLOR.blueTint : COLOR.barTrack, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                    {iconEl(has ? 'bank' : 'slash', has ? COLOR.blue : COLOR.faintLight, 15)}
                  </div>
                  <span style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 12.5, color: has ? COLOR.ink800 : COLOR.muted, fontWeight: has ? 500 : 400 }}>
                    {has ? `${displayAssignments.length} institution${displayAssignments.length > 1 ? 's' : ''} assigned` : 'No institutions assigned'}
                  </span>
                  {has && iconEl(isOpen ? 'up' : 'down', COLOR.muted, 13, 2.4)}
                </button>

                {isOpen && has && (
                  <div style={{ background: COLOR.inset, borderRadius: 12, padding: '4px 12px 12px', marginTop: -1 }}>
                    {displayAssignments.map((a, i) => (
                      <div key={`${a.role}_${a.unitName}`} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: `1px solid ${COLOR.divider}` }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: COLOR.blueTint, color: COLOR.blue, fontFamily: FONT.heading, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                          {i + 1}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: COLOR.ink800 }}>{a.unitName}</span>
                        {a.role !== 'Scope' && (
                          <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                            <button type="button" onClick={() => openReassignDelegate(a.unitName, a.role)} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: COLOR.ink700, padding: '4px 6px' }}>
                              Reassign
                            </button>
                            <button type="button" onClick={() => handleRevokeDelegate(a.unitName, a.role)} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 700, color: COLOR.maroon, padding: '4px 6px' }}>
                              Revoke
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
                  <button
                    type="button"
                    disabled={!hasAnyAction}
                    onClick={openManageAccess}
                    style={{
                      flex: 1, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`, borderRadius: 12,
                      padding: 11, fontFamily: FONT.heading, fontSize: 12.5, fontWeight: 600,
                      color: hasAnyAction ? COLOR.maroon : COLOR.faintLight, minHeight: 44,
                    }}
                  >
                    Manage access
                  </button>
                  {!isCiOfficer && assignments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(isMenuOpen ? null : (off.id || idx))}
                      style={{ width: 44, background: COLOR.inset, border: `1px solid ${COLOR.hairline}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', minHeight: 44 }}
                    >
                      {iconEl('moreVertical', COLOR.muted, 16, 2.4)}
                    </button>
                  )}
                </div>

                {isMenuOpen && (
                  <div style={{ background: COLOR.inset, borderRadius: 12, padding: 10, marginTop: 9, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAssignAciPrefillUnit(null);
                        setAssignDelegateRole(isPaOfficer ? 'PA' : 'ACI');
                        setAssignDelegatePrefillAssignee(off.name);
                        setShowAssignAciModal(true);
                        setMenuOpenId(null);
                      }}
                      style={{ textAlign: 'left', background: 'none', border: 'none', padding: '9px 6px', fontSize: 12.5, fontWeight: 600, color: COLOR.blue }}
                    >
                      Assign another institution
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <PaginationCard
        page={pageClamped}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        showingLabel={`Showing ${filtered.length === 0 ? 0 : (pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
      />
    </>
  );
}
