import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';

const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  green700: '#15803D',
  greenBg: '#E7F3EA',
};

const FONT_FAMILY = 'Manrope';

const isFilled = (v) => v !== undefined && v !== null && v !== '';

// Same "most recently completed FY" convention as the rest of Master Data.
function lastCompletedFY() {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 4 ? y - 1 : y - 2;
  return `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

function formatUpdated(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return null;
  }
}

const DEMOGRAPHIC_CATEGORIES = ['SC', 'ST', 'OBC', 'Others'];

// Replaces MpcsMasterDataPagerScreen's "Record N of 8" pager with a single
// scrollable list where each record is its own accordion row: tap to expand
// in place, save on its own, no shared final submit. Matches the "Save as
// you go" reference (list + inline expand + save toast w/ Undo). Loan
// Details is the 7th row but stays a real navigation to the existing
// MpcsLoanSetupScreen rather than an inline form — that screen already
// handles the loan type/beneficiaries/cleared flow end to end, and
// duplicating it inline here would just be the same form twice.
export default function MpcsMasterDataListScreen({
  societyName = '',
  panCard = '',
  regNumber = '',
  regDate = '',
  presidentName = '',
  presidentMobile = '',
  managerName = '',
  managerMobile = '',
  demographicsData = [],
  complianceData = {},
  financialsData = {},
  dividendData = {},
  shareCapitalData = {},
  loanData = {},
  masterDataUpdated = {},
  onSaveProfile,
  onSaveDemographics,
  onSaveCompliance,
  onSaveFinancials,
  onSaveDividend,
  onSaveShareCapital,
  onOpenLoan,
  onBack,
  activeTab = 'home',
  onTabPress,
}) {
  const [expanded, setExpanded] = useState(null);
  const [banner, setBanner] = useState(null); // { message, undo }
  const fy = lastCompletedFY();

  const totalMembers = demographicsData.reduce((s, r) => s + (parseInt(r.male) || 0) + (parseInt(r.female) || 0), 0);
  const loanState = loanData?.loanCleared ? 'loan cleared' : loanData?.hasLoan ? 'loan active' : 'no loan';

  const records = [
    {
      key: 'profile', title: 'Society identification',
      updated: masterDataUpdated.instProfile,
      detail: totalMembers >= 0 && isFilled(societyName) ? '' : '',
    },
    {
      key: 'demographics', title: 'Registered demographics',
      updated: masterDataUpdated.demographics,
      detail: totalMembers ? `${totalMembers} members` : '',
    },
    {
      key: 'loan', title: 'Loan details',
      updated: masterDataUpdated.loan,
      detail: loanData?.hasLoan !== undefined ? loanState : '',
    },
    {
      key: 'compliance', title: 'Compliance and audit',
      updated: masterDataUpdated.compliance,
      detail: '',
    },
    {
      key: 'financials', title: 'Financial performance',
      updated: masterDataUpdated.financials,
      detail: '',
    },
    {
      key: 'dividend', title: 'Dividend details',
      updated: masterDataUpdated.dividend,
      detail: '',
    },
    {
      key: 'shareCapital', title: 'Share capital',
      updated: masterDataUpdated.shareCapital,
      detail: '',
    },
  ];
  const recordedCount = records.filter(r => r.updated).length;

  const toggle = (key) => {
    if (key === 'loan') { onOpenLoan && onOpenLoan(); return; }
    setBanner(null);
    setExpanded(prev => (prev === key ? null : key));
  };

  const finishSave = (key, title, save, prevData) => {
    save();
    setExpanded(null);
    const recordsLeft = records.filter(r => r.key !== key && !r.updated).length;
    setBanner({
      message: `${title} saved. ${recordsLeft} record${recordsLeft === 1 ? '' : 's'} left.`,
      undo: () => { save(prevData); setBanner(null); },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Master data</Text>
            <Text style={styles.subtitle}>
              {(societyName || 'Society').toUpperCase()} · {recordedCount} OF {records.length} RECORDED
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>CI</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.helperText}>Each record saves on its own. Verification starts once all seven are in.</Text>

        {banner && (
          <View style={styles.banner}>
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.green700} />
            <Text style={styles.bannerText}>{banner.message}</Text>
            <Pressable onPress={banner.undo} hitSlop={8}>
              <Text style={styles.bannerUndo}>Undo</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listCard}>
          {records.map((r, i) => {
            const isOpen = expanded === r.key;
            return (
              <View key={r.key} style={[styles.rowWrap, i !== records.length - 1 && !isOpen && styles.rowBorder]}>
                {isOpen ? (
                  <RecordEditor
                    recordKey={r.key}
                    title={r.title}
                    fy={fy}
                    onCollapse={() => setExpanded(null)}
                    profileInitial={{ societyName, panCard, regNumber, regDate, presidentName, presidentMobile, managerName, managerMobile }}
                    demographicsInitial={demographicsData}
                    complianceInitial={complianceData}
                    financialsInitial={financialsData}
                    dividendInitial={dividendData}
                    shareCapitalInitial={shareCapitalData}
                    onSaveProfile={(data, prev) => finishSave('profile', r.title, (d) => onSaveProfile && onSaveProfile(d || data), prev)}
                    onSaveDemographics={(data, prev) => finishSave('demographics', r.title, (d) => onSaveDemographics && onSaveDemographics(d || data), prev)}
                    onSaveCompliance={(data, prev) => finishSave('compliance', r.title, (d) => onSaveCompliance && onSaveCompliance(d || data), prev)}
                    onSaveFinancials={(data, prev) => finishSave('financials', r.title, (d) => onSaveFinancials && onSaveFinancials(d || data), prev)}
                    onSaveDividend={(data, prev) => finishSave('dividend', r.title, (d) => onSaveDividend && onSaveDividend(d || data), prev)}
                    onSaveShareCapital={(data, prev) => finishSave('shareCapital', r.title, (d) => onSaveShareCapital && onSaveShareCapital(d || data), prev)}
                  />
                ) : (
                  <Pressable style={styles.row} onPress={() => toggle(r.key)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{r.title}</Text>
                      <Text style={styles.rowSubtitle}>
                        {r.updated
                          ? `Updated ${formatUpdated(r.updated) || 'recently'}${r.detail ? ` · ${r.detail}` : ''}`
                          : 'Never updated'}
                      </Text>
                    </View>
                    {r.key === 'loan' ? (
                      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.slate400} />
                    ) : r.updated ? (
                      <MaterialCommunityIcons name="check" size={20} color={COLORS.green700} />
                    ) : (
                      <Text style={styles.addLink}>Add</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab} onTabPress={onTabPress} />}
    </View>
  );
}

function RecordEditor({
  recordKey, title, fy, onCollapse,
  profileInitial, demographicsInitial, complianceInitial, financialsInitial, dividendInitial, shareCapitalInitial,
  onSaveProfile, onSaveDemographics, onSaveCompliance, onSaveFinancials, onSaveDividend, onSaveShareCapital,
}) {
  return (
    <View style={styles.editCard}>
      <View style={styles.editHeaderRow}>
        <Text style={styles.editTitle}>{title}</Text>
        <Pressable onPress={onCollapse} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-up" size={20} color={COLORS.slate500} />
        </Pressable>
      </View>

      {recordKey === 'profile' && (
        <ProfileForm initial={profileInitial} onCancel={onCollapse} onSave={onSaveProfile} />
      )}
      {recordKey === 'demographics' && (
        <DemographicsForm initial={demographicsInitial} onCancel={onCollapse} onSave={onSaveDemographics} />
      )}
      {recordKey === 'compliance' && (
        <ComplianceForm initial={complianceInitial} fy={fy} onCancel={onCollapse} onSave={onSaveCompliance} />
      )}
      {recordKey === 'financials' && (
        <FinancialsForm initial={financialsInitial} onCancel={onCollapse} onSave={onSaveFinancials} />
      )}
      {recordKey === 'dividend' && (
        <DividendForm initial={dividendInitial} onCancel={onCollapse} onSave={onSaveDividend} />
      )}
      {recordKey === 'shareCapital' && (
        <ShareCapitalForm initial={shareCapitalInitial} onCancel={onCollapse} onSave={onSaveShareCapital} />
      )}
    </View>
  );
}

// ─── Per-record forms ───────────────────────────────────────────────────

function ProfileForm({ initial, onCancel, onSave }) {
  const prev = {
    societyName: initial.societyName || '', panCard: initial.panCard || '',
    regNumber: initial.regNumber || '', regDate: initial.regDate || '',
    presidentName: initial.presidentName || '', presidentMobile: initial.presidentMobile || '',
    secretaryName: initial.managerName || '', secretaryMobile: initial.managerMobile || '',
  };
  const [form, setForm] = useState(prev);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <FormBody onCancel={onCancel} onSave={() => onSave(form, prev)}>
      <Field label="Society name" value={form.societyName} onChangeText={set('societyName')} />
      <Field label="Registration number" value={form.regNumber} onChangeText={set('regNumber')} />
      <Field label="Date of registration" value={form.regDate} onChangeText={set('regDate')} placeholder="DD Mon YYYY" />
      <Field label="PAN" value={form.panCard} onChangeText={set('panCard')} autoCapitalize="characters" />
      <Field label="President name" value={form.presidentName} onChangeText={set('presidentName')} />
      <Field label="President mobile" value={form.presidentMobile} onChangeText={set('presidentMobile')} keyboardType="numeric" />
      <Field label="Manager name" value={form.secretaryName} onChangeText={set('secretaryName')} />
      <Field label="Manager mobile" value={form.secretaryMobile} onChangeText={set('secretaryMobile')} keyboardType="numeric" />
    </FormBody>
  );
}

function DemographicsForm({ initial, onCancel, onSave }) {
  const byCategory = {};
  (initial || []).forEach(row => { byCategory[row.category] = row; });
  const prev = DEMOGRAPHIC_CATEGORIES.map(cat => ({
    category: cat, male: byCategory[cat]?.male || '', female: byCategory[cat]?.female || '',
  }));
  const [rows, setRows] = useState(prev);
  const setCell = (cat, key) => (v) => setRows(p => p.map(r => r.category === cat ? { ...r, [key]: v } : r));
  const handleSave = () => {
    onSave(rows.map(r => ({ ...r, total: String((parseInt(r.male) || 0) + (parseInt(r.female) || 0)) })), prev);
  };
  return (
    <FormBody onCancel={onCancel} onSave={handleSave}>
      {rows.map(r => (
        <View key={r.category} style={styles.rowHalf}>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>{r.category} male</Text>
            <View style={styles.inputBox}>
              <TextInput style={styles.textInput} value={r.male} onChangeText={setCell(r.category, 'male')} placeholder="0" placeholderTextColor={COLORS.slate400} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>{r.category} female</Text>
            <View style={styles.inputBox}>
              <TextInput style={styles.textInput} value={r.female} onChangeText={setCell(r.category, 'female')} placeholder="0" placeholderTextColor={COLORS.slate400} keyboardType="numeric" />
            </View>
          </View>
        </View>
      ))}
    </FormBody>
  );
}

function StatusToggle({ value, onChange }) {
  return (
    <View style={styles.statusToggle}>
      {['Done', 'Pending'].map(opt => (
        <Pressable
          key={opt}
          style={[styles.statusOption, value === opt && styles.statusOptionActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.statusOptionText, value === opt && styles.statusOptionTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ComplianceForm({ initial, fy, onCancel, onSave }) {
  const prev = {
    auditYear: initial?.auditYear || fy, auditDate: initial?.auditDate || '', auditStatus: initial?.auditStatus || 'Pending',
    agmYear: initial?.agmYear || fy, agmDate: initial?.agmDate || '', agmStatus: initial?.agmStatus || 'Pending',
  };
  const [form, setForm] = useState(prev);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <FormBody onCancel={onCancel} onSave={() => onSave(form, prev)}>
      <View style={styles.rowHalf}>
        <View style={styles.fieldHalf}><Field label="Audit year" value={form.auditYear} onChangeText={set('auditYear')} /></View>
        <View style={styles.fieldHalf}><Field label="Audit date" value={form.auditDate} onChangeText={set('auditDate')} placeholder="DD/MM/YYYY" /></View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>Audit status</Text>
        <StatusToggle value={form.auditStatus === 'Done' || form.auditStatus === 'Completed' ? 'Done' : 'Pending'} onChange={set('auditStatus')} />
      </View>
      <View style={styles.rowHalf}>
        <View style={styles.fieldHalf}><Field label="AGM year" value={form.agmYear} onChangeText={set('agmYear')} /></View>
        <View style={styles.fieldHalf}><Field label="AGM date" value={form.agmDate} onChangeText={set('agmDate')} placeholder="DD/MM/YYYY" /></View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.inputLabel}>AGM status</Text>
        <StatusToggle value={form.agmStatus === 'Done' || form.agmStatus === 'Completed' ? 'Done' : 'Pending'} onChange={set('agmStatus')} />
      </View>
    </FormBody>
  );
}

function FinancialsForm({ initial, onCancel, onSave }) {
  const prev = {
    annualTurnover: initial?.annualTurnover || '', totalIncome: initial?.totalIncome || '', totalExpenses: initial?.totalExpenses || '',
  };
  const [form, setForm] = useState(prev);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <FormBody onCancel={onCancel} onSave={() => onSave(form, prev)}>
      <Field label="Annual turnover (₹)" value={form.annualTurnover} onChangeText={set('annualTurnover')} keyboardType="numeric" />
      <Field label="Gross income (₹)" value={form.totalIncome} onChangeText={set('totalIncome')} keyboardType="numeric" />
      <Field label="Total expenses (₹)" value={form.totalExpenses} onChangeText={set('totalExpenses')} keyboardType="numeric" />
    </FormBody>
  );
}

function DividendForm({ initial, onCancel, onSave }) {
  const prev = {
    dividendPolicy: initial?.dividendPolicy || '', dividendRate: initial?.dividendRate || '',
    dividendAmount: initial?.dividendAmount || '', distributionDate: initial?.distributionDate || '',
    dividendAnnounced: initial?.dividendAmount || initial?.dividendRate ? 'Yes' : (initial?.dividendAnnounced || ''),
  };
  const [form, setForm] = useState(prev);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <FormBody onCancel={onCancel} onSave={() => onSave(form, prev)}>
      <Field label="Dividend policy" value={form.dividendPolicy} onChangeText={set('dividendPolicy')} multiline />
      <Field label="Rate" value={form.dividendRate} onChangeText={set('dividendRate')} placeholder="e.g. 8%" />
      <Field label="Amount (₹)" value={form.dividendAmount} onChangeText={set('dividendAmount')} keyboardType="numeric" />
      <Field label="Distribution date" value={form.distributionDate} onChangeText={set('distributionDate')} placeholder="DD Mon YYYY" />
    </FormBody>
  );
}

function ShareCapitalForm({ initial, onCancel, onSave }) {
  const prev = {
    authorizedCapital: initial?.authorizedCapital || '', paidUpCapital: initial?.paidUpCapital || '',
    totalDeposits: initial?.totalDeposits || '', asOfDate: initial?.asOfDate || '',
  };
  const [form, setForm] = useState(prev);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <FormBody onCancel={onCancel} onSave={() => onSave(form, prev)}>
      <Field label="Authorised share capital (₹)" value={form.authorizedCapital} onChangeText={set('authorizedCapital')} keyboardType="numeric" />
      <Field label="Paid-up share capital (₹)" value={form.paidUpCapital} onChangeText={set('paidUpCapital')} keyboardType="numeric" />
      <Field label="Total member deposits (₹)" value={form.totalDeposits} onChangeText={set('totalDeposits')} keyboardType="numeric" />
      <Field label="As on date" value={form.asOfDate} onChangeText={set('asOfDate')} placeholder="DD Mon YYYY" />
    </FormBody>
  );
}

// ─── Shared bits ────────────────────────────────────────────────────────

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, multiline }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputBox, multiline && { height: 80, alignItems: 'flex-start', paddingVertical: 12 }]}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || ''}
          placeholderTextColor={COLORS.slate400}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

function FormBody({ onCancel, onSave, children }) {
  return (
    <View style={{ gap: 14 }}>
      {children}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
        <Pressable style={styles.outlineBtn} onPress={onCancel}>
          <Text style={styles.outlineBtnText}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, { flex: 1 }]} onPress={onSave}>
          <Text style={styles.saveBtnText}>Save this record</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { backgroundColor: COLORS.maroon, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  backBtn: { width: 28, height: 28, justifyContent: 'center' },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.6, marginTop: 4 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: '#ffffff' },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  helperText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate600, lineHeight: 19 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.greenBg, borderRadius: 12, padding: 12 },
  bannerText: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.green700 },
  bannerUndo: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.green700, textDecorationLine: 'underline' },

  listCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  rowWrap: {},
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 16 },
  rowTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },
  rowSubtitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 2 },
  addLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },

  editCard: { borderWidth: 1.5, borderColor: COLORS.maroon, borderRadius: 14, padding: 16, margin: 10 },
  editHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  editTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.ink },

  fieldGroup: { gap: 6 },
  inputLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.ink },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  textInput: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '600', color: COLORS.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  rowHalf: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1, gap: 6 },

  statusToggle: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.bg, borderRadius: 12, padding: 4 },
  statusOption: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  statusOptionActive: { backgroundColor: COLORS.maroon },
  statusOptionText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.ink },
  statusOptionTextActive: { color: '#ffffff' },

  outlineBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  outlineBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  saveBtn: { backgroundColor: COLORS.maroon, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
