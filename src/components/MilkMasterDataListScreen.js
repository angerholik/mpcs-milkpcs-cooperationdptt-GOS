import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from './ScreenHeader';
import BottomNav from './BottomNav';
import PressScale from './PressScale';
import { WizardField } from './WizardField';
import { ReadCard, ChipSelect, DateField, EditFooter } from './MasterRecord';
import { webCapWidth } from '../utils/webStyles';
import { formatToIsoDate, formatFromIsoDate, deriveFinancialYear } from '../utils/masterDates';

// Milk PCS Master Data — same accordion as MpcsMasterDataListScreen: each
// record is a row; tapping opens it inline (read-only first, Update to edit),
// and each record saves on its own.
const F = 'Manrope';
const C = { maroon: '#7B1420', ink: '#1E1B18', border: '#E7E2DA', s500: '#78716C', s400: '#A8A29E' };

const SECTIONS = [
  { title: 'Society info', desc: 'Basic details, membership and compliance', icon: 'bank', headerBg: '#EBF9F5', iconBg: '#D1F2E8', color: '#00897B', badgeBg: '#D6F5EB', keys: ['profile', 'compliance', 'demographics'] },
  { title: 'Optional services', desc: 'Loan details', icon: 'view-grid-outline', headerBg: '#F3F0FF', iconBg: '#E4DCFF', color: '#6D28D9', badgeBg: '#EAE4FF', keys: ['loan'] },
];

const RECORDS = {
  profile: { title: 'Society identification', stampKey: 'instProfile', icon: 'file-document-outline', bg: '#E8F1FD', color: '#2563EB', desc: 'Basic registration details of the society' },
  compliance: { title: 'Compliance & Audit', stampKey: 'complianceAudit', icon: 'shield-check-outline', bg: '#FEF3C7', color: '#EA580C', desc: 'Audit and AGM status' },
  demographics: { title: 'Registered demographics', stampKey: 'demographics', icon: 'account-group-outline', bg: '#EDE9FE', color: '#6366F1', desc: 'Member headcount by category' },
  loan: { title: 'Loan Details', stampKey: 'loanSetup', icon: 'bank-outline', bg: '#E0F7FA', color: '#00838F', desc: 'Active loan and beneficiaries' },
};

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const num = (setter) => (v) => setter(v.replace(/[^0-9]/g, ''));

function ProfilePanel({ initial, editing, onSave, onCancel }) {
  const [d, setD] = useState(initial);
  const set = (k) => (v) => setD((p) => ({ ...p, [k]: v }));
  if (!editing) {
    return (
      <>
        <ReadCard inline title="Society identification" rows={[
          { label: 'Registered name', value: initial.centerName, large: true },
          { label: 'Registration number', value: initial.registrationNumber },
        ]} />
        <ReadCard inline title="Key personnel" rows={[
          { label: 'President', value: [initial.presidentName, initial.presidentMobile].filter(Boolean).join(' · ') },
          { label: 'Manager', value: [initial.managerName, initial.managerMobile].filter(Boolean).join(' · ') },
        ]} />
      </>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      <WizardField grey required label="Milk center name" value={d.centerName} editable={false} helper="Fixed at registration. Ask the administrator to change it." />
      <WizardField grey required label="Registration number" value={d.registrationNumber} onChangeText={set('registrationNumber')} placeholder="Enter registration number" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><WizardField grey label="President name" value={d.presidentName} onChangeText={set('presidentName')} placeholder="President name" /></View>
        <View style={{ flex: 1 }}><WizardField grey phone label="President mobile" value={d.presidentMobile} onChangeText={set('presidentMobile')} keyboardType="phone-pad" placeholder="10 digits" /></View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}><WizardField grey label="Manager name" value={d.managerName} onChangeText={set('managerName')} placeholder="Manager name" /></View>
        <View style={{ flex: 1 }}><WizardField grey phone label="Manager mobile" value={d.managerMobile} onChangeText={set('managerMobile')} keyboardType="phone-pad" placeholder="10 digits" /></View>
      </View>
      <EditFooter onCancel={onCancel} onSave={() => onSave(d)} saveLabel="Save this record" />
    </View>
  );
}

function CompliancePanel({ initial, editing, onSave, onCancel }) {
  const [d, setD] = useState(initial);
  const color = (s) => (s === 'Completed' ? '#047857' : '#B45309');
  const pick = (prefix) => (iso) => setD((p) => ({ ...p, [`${prefix}Date`]: formatFromIsoDate(iso), [`${prefix}Year`]: deriveFinancialYear(iso) }));
  if (!editing) {
    return (
      <>
        <ReadCard inline title="Latest audit" rows={[
          { label: 'Audit year', value: initial.auditYear },
          { label: 'Audit date', value: initial.auditDate },
          { label: 'Audit status', value: initial.auditStatus || 'Pending', color: color(initial.auditStatus) },
        ]} />
        <ReadCard inline title="Latest AGM" rows={[
          { label: 'AGM year', value: initial.agmYear },
          { label: 'AGM date', value: initial.agmDate },
          { label: 'AGM status', value: initial.agmStatus || 'Pending', color: color(initial.agmStatus) },
        ]} />
      </>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      <DateField label="Audit date" valueIso={formatToIsoDate(d.auditDate)} onChangeIso={pick('audit')} />
      <ChipSelect label="Audit status" options={['Pending', 'Completed']} value={d.auditStatus} onChange={(v) => setD((p) => ({ ...p, auditStatus: v }))} />
      <DateField label="AGM date" valueIso={formatToIsoDate(d.agmDate)} onChangeIso={pick('agm')} />
      <ChipSelect label="AGM status" options={['Pending', 'Completed']} value={d.agmStatus} onChange={(v) => setD((p) => ({ ...p, agmStatus: v }))} />
      <EditFooter onCancel={onCancel} onSave={() => onSave(d)} saveLabel="Save this record" />
    </View>
  );
}

function LoanPanel({ initial, editing, onSave, onCancel, onManageBeneficiaries }) {
  const [d, setD] = useState(initial);
  const set = (k) => (v) => setD((p) => ({ ...p, [k]: v }));
  if (!editing) {
    return (
      <>
        <ReadCard
          inline
          title="Loan record"
          rows={initial.hasLoan ? [
            { label: 'Status', value: initial.loanCleared ? 'Cleared' : 'Active', color: initial.loanCleared ? C.s500 : '#047857' },
            { label: 'Loan type', value: initial.loanType },
            { label: 'Sanction date', value: initial.sanctionDate },
            { label: 'Beneficiaries', value: initial.beneficiaries },
            { label: 'Amount extended', value: initial.loanExtended ? `₹${initial.loanExtended}` : '' },
          ] : [{ label: 'Status', value: 'No active loan' }]}
        />
        {initial.hasLoan && onManageBeneficiaries ? (
          <Pressable style={s.linkRow} onPress={onManageBeneficiaries}>
            <MaterialCommunityIcons name="account-cash-outline" size={20} color={C.maroon} />
            <Text style={s.linkText}>Manage beneficiaries</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={C.s400} />
          </Pressable>
        ) : null}
      </>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      <ChipSelect label="Loan on record" options={['Active loan', 'No active loan']} value={d.hasLoan ? 'Active loan' : 'No active loan'} onChange={(v) => set('hasLoan')(v === 'Active loan')} />
      {d.hasLoan ? (
        <>
          <WizardField grey label="Loan type" value={d.loanType} onChangeText={set('loanType')} placeholder="e.g. Cash Credit Limit" />
          <DateField label="Sanction date" valueIso={formatToIsoDate(d.sanctionDate)} onChangeIso={(v) => set('sanctionDate')(formatFromIsoDate(v))} />
          <WizardField grey label="No. of beneficiaries" value={d.beneficiaries} onChangeText={set('beneficiaries')} keyboardType="numeric" />
          <WizardField grey label="Amount extended" prefix="₹" value={d.loanExtended} onChangeText={set('loanExtended')} keyboardType="numeric" />
        </>
      ) : null}
      <EditFooter onCancel={onCancel} onSave={() => onSave(d)} saveLabel="Save this record" />
    </View>
  );
}

const CATS = [['SC', 'mSc', 'fSc'], ['ST', 'mSt', 'fSt'], ['OBC', 'mObc', 'fObc'], ['Others', 'mGen', 'fGen']];

function DemographicsPanel({ initial, editing, onSave, onCancel }) {
  const [d, setD] = useState(initial);
  const set = (k) => (v) => setD((p) => ({ ...p, [k]: v.replace(/[^0-9]/g, '') }));
  if (!editing) {
    const n = (v) => parseInt(v) || 0;
    const mTot = CATS.reduce((a, [, m]) => a + n(initial[m]), 0);
    const fTot = CATS.reduce((a, [, , f]) => a + n(initial[f]), 0);
    const cell = (v, extra) => <Text style={[s.cell, extra]}>{v || v === 0 ? v : '—'}</Text>;
    return (
      <View style={s.table}>
        <View style={s.tr}>
          {['CATEGORY', 'MALE', 'FEMALE', 'TOTAL'].map((h, i) => <Text key={h} style={[s.th, i === 0 ? { flex: 1.4, textAlign: 'left' } : null]}>{h}</Text>)}
        </View>
        {CATS.map(([cat, m, f]) => (
          <View key={cat} style={[s.tr, s.trBorder]}>
            <Text style={[s.cell, { flex: 1.4, textAlign: 'left', fontWeight: '800' }]}>{cat}</Text>
            {cell(initial[m] !== '' ? initial[m] : '')}
            {cell(initial[f] !== '' ? initial[f] : '')}
            {cell(n(initial[m]) + n(initial[f]) || '', { fontWeight: '800' })}
          </View>
        ))}
        <View style={[s.tr, s.trBorder, { borderTopWidth: 1.5 }]}>
          <Text style={[s.cell, { flex: 1.4, textAlign: 'left', fontWeight: '800', color: '#57534E' }]}>TOTAL</Text>
          {cell(mTot || '', { fontWeight: '800' })}
          {cell(fTot || '', { fontWeight: '800' })}
          {cell(mTot + fTot || '', { fontWeight: '800', color: C.maroon })}
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      {CATS.map(([cat, m, f]) => (
        <View key={cat} style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}><WizardField grey label={`${cat} male`} value={d[m]} onChangeText={set(m)} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><WizardField grey label={`${cat} female`} value={d[f]} onChangeText={set(f)} keyboardType="numeric" /></View>
        </View>
      ))}
      <EditFooter onCancel={onCancel} onSave={() => onSave(d)} saveLabel="Save this record" />
    </View>
  );
}

export default function MilkMasterDataListScreen({
  societyName = '',
  profile, compliance, loan, demographics,
  masterDataUpdated = {},
  onSaveProfile, onSaveCompliance, onSaveLoan, onSaveDemographics,
  onManageBeneficiaries,
  onBack, onNotifyPress, onProfilePress, unreadCount = 0,
  activeTab, onTabPress,
}) {
  const [expanded, setExpanded] = useState(null); // { key, editing }
  const [collapsed, setCollapsed] = useState({});
  const [banner, setBanner] = useState('');

  const savers = { profile: onSaveProfile, compliance: onSaveCompliance, loan: onSaveLoan, demographics: onSaveDemographics };
  const initials = { profile, compliance, loan, demographics };
  const isRecorded = (k) => !!masterDataUpdated[RECORDS[k].stampKey];

  const open = (k) => setExpanded({ key: k, editing: !isRecorded(k) });
  const save = (k, data) => {
    savers[k] && savers[k](data);
    setExpanded({ key: k, editing: false });
    setBanner(`${RECORDS[k].title} saved`);
    setTimeout(() => setBanner(''), 2500);
  };

  const panel = (k, editing) => {
    const props = { key: `${k}-${editing}`, initial: initials[k], editing, onCancel: () => (isRecorded(k) ? setExpanded({ key: k, editing: false }) : setExpanded(null)), onSave: (d) => save(k, d) };
    if (k === 'profile') return <ProfilePanel {...props} />;
    if (k === 'compliance') return <CompliancePanel {...props} />;
    if (k === 'loan') return <LoanPanel {...props} onManageBeneficiaries={onManageBeneficiaries} />;
    return <DemographicsPanel {...props} />;
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Master Data" subtitle={(societyName || 'MILK PCS').toUpperCase()} onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.inner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {banner ? (
          <View style={s.banner}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#15803D" />
            <Text style={s.bannerText}>{banner}</Text>
          </View>
        ) : null}

        {SECTIONS.map((sec) => {
          const done = sec.keys.filter(isRecorded).length;
          const isCollapsed = !!collapsed[sec.title];
          return (
            <View key={sec.title} style={s.sectionCard}>
              <Pressable style={[s.sectionHead, { backgroundColor: sec.headerBg }]} onPress={() => setCollapsed((p) => ({ ...p, [sec.title]: !p[sec.title] }))}>
                <View style={[s.sectionIcon, { backgroundColor: sec.iconBg }]}><MaterialCommunityIcons name={sec.icon} size={17} color={sec.color} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionTitle}>{sec.title}</Text>
                  <Text style={s.sectionDesc} numberOfLines={1}>{sec.desc}</Text>
                </View>
                <View style={[s.count, { backgroundColor: sec.badgeBg }]}><Text style={[s.countText, { color: sec.color }]}>{done}/{sec.keys.length}</Text></View>
                <MaterialCommunityIcons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={18} color={sec.color} />
              </Pressable>
              {!isCollapsed && sec.keys.map((k, i) => {
                const rec = RECORDS[k];
                const isOpen = expanded?.key === k;
                const recorded = isRecorded(k);
                const stamp = fmtDate(masterDataUpdated[rec.stampKey]);
                return (
                  <View key={k} style={[s.rowWrap, i !== sec.keys.length - 1 && !isOpen && s.rowBorder]}>
                    {isOpen ? (
                      <View style={s.openCard}>
                        <View style={s.openHead}>
                          <View style={[s.rowIcon, { backgroundColor: rec.bg }]}><MaterialCommunityIcons name={rec.icon} size={18} color={rec.color} /></View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.rowTitle}>{rec.title}</Text>
                            <Text style={s.rowSub}>{rec.desc}</Text>
                          </View>
                          {!expanded.editing ? (
                            <Pressable onPress={() => setExpanded({ key: k, editing: true })} hitSlop={8}><Text style={s.update}>Update</Text></Pressable>
                          ) : null}
                          <Pressable onPress={() => setExpanded(null)} hitSlop={8}><MaterialCommunityIcons name="chevron-up" size={20} color={C.s500} /></Pressable>
                        </View>
                        <View style={{ gap: 12 }}>{panel(k, expanded.editing)}</View>
                      </View>
                    ) : (
                      <PressScale scaleTo={0.985} style={s.row} onPress={() => open(k)}>
                        <View style={[s.rowIcon, { backgroundColor: rec.bg }]}><MaterialCommunityIcons name={rec.icon} size={19} color={rec.color} /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.rowTitle}>{rec.title}</Text>
                          <Text style={s.rowSub}>{recorded ? `Updated ${stamp || 'recently'}` : 'Never updated'}</Text>
                        </View>
                        <View style={s.pill}>
                          <Text style={[s.pillText, !recorded && { color: C.maroon }]}>{recorded ? 'View' : 'Add'}</Text>
                          <MaterialCommunityIcons name="chevron-right" size={12} color={recorded ? C.s500 : C.maroon} />
                        </View>
                      </PressScale>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  inner: { padding: 16, paddingBottom: 110, gap: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E7F3EA', borderRadius: 12, padding: 12 },
  bannerText: { flex: 1, fontFamily: F, fontSize: 13, fontWeight: '700', color: '#15803D' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontFamily: F, fontSize: 15, fontWeight: '800', color: C.ink },
  sectionDesc: { fontFamily: F, fontSize: 12, fontWeight: '500', color: C.s500 },
  count: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  countText: { fontFamily: F, fontSize: 12, fontWeight: '800' },
  rowWrap: { },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F, fontSize: 14, fontWeight: '700', color: C.ink },
  rowSub: { fontFamily: F, fontSize: 12, fontWeight: '500', color: C.s500, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  pillText: { fontFamily: F, fontSize: 12, fontWeight: '600', color: C.ink },
  openCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 18, margin: 10, gap: 14, shadowColor: '#1E1B18', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  openHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  update: { fontFamily: F, fontSize: 13, fontWeight: '800', color: C.maroon },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F4F5F7', borderRadius: 14, padding: 14 },
  linkText: { flex: 1, fontFamily: F, fontSize: 15, fontWeight: '800', color: C.ink },
  table: { backgroundColor: '#F4F5F7', borderRadius: 14, padding: 14, gap: 10 },
  tr: { flexDirection: 'row' },
  trBorder: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 },
  th: { flex: 1, textAlign: 'center', fontFamily: F, fontSize: 11, fontWeight: '700', color: C.s500, letterSpacing: 0.6 },
  cell: { flex: 1, textAlign: 'center', fontFamily: F, fontSize: 15, fontWeight: '600', color: C.ink },
  catTitle: { fontFamily: F, fontSize: 15, fontWeight: '800', color: C.ink },
});
