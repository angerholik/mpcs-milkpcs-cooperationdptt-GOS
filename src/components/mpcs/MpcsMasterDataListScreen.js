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
  amber50: '#FFF7ED',
  amber700: '#B45309',
};

const FONT_FAMILY = 'Manrope';

const fmt = (v) => (v === undefined || v === null || v === '' ? '—' : v);
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

function joinWithAnd(arr) {
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

const DEMOGRAPHIC_CATEGORIES = ['SC', 'ST', 'OBC', 'Others'];

// Single scrollable list where each record is its own accordion row: tap
// "View" to see what's on record (read-only), tap "Update" from there to
// edit, or tap "Add" to go straight to the form when nothing's recorded
// yet. Each record saves on its own — no shared final submit. Loan Details
// is the 7th row but stays a real navigation to the existing
// MpcsLoanSetupScreen rather than an inline form — that screen already
// handles the loan type/beneficiaries/cleared flow (and its own
// read+edit toggle) end to end.
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
  const [expanded, setExpanded] = useState(null); // { key, mode: 'view' | 'edit' }
  const [banner, setBanner] = useState(null); // { message, undo }
  const fy = lastCompletedFY();

  const totalMembers = demographicsData.reduce((s, r) => s + (parseInt(r.male) || 0) + (parseInt(r.female) || 0), 0);
  const loanState = loanData?.loanCleared ? 'loan cleared' : loanData?.hasLoan ? 'loan active' : 'no loan';

  const auditDone = complianceData?.auditStatus === 'Done' || complianceData?.auditStatus === 'Completed';
  const agmDone = complianceData?.agmStatus === 'Done' || complianceData?.agmStatus === 'Completed';
  const complianceDetail = masterDataUpdated.compliance
    ? `audit ${auditDone ? 'done' : 'pending'} · AGM ${agmDone ? 'done' : 'pending'}`
    : '';

  const financialsAllFilled = isFilled(financialsData?.annualTurnover) && isFilled(financialsData?.totalIncome) && isFilled(financialsData?.totalExpenses);
  const financialsDetail = financialsAllFilled
    ? `₹${Number(financialsData.annualTurnover).toLocaleString('en-IN')} turnover`
    : '';

  const dividendDistributed = isFilled(dividendData?.dividendAmount) || isFilled(dividendData?.dividendRate);
  const dividendDetail = dividendDistributed
    ? `₹${Number(dividendData.dividendAmount || 0).toLocaleString('en-IN')} distributed`
    : dividendData?.dividendAnnounced === 'No' ? 'no distribution' : '';

  const shareCapitalAllFilled = isFilled(shareCapitalData?.authorizedCapital) && isFilled(shareCapitalData?.paidUpCapital) && isFilled(shareCapitalData?.totalDeposits);
  const shareCapitalDetail = shareCapitalAllFilled
    ? `₹${Number(shareCapitalData.authorizedCapital).toLocaleString('en-IN')} authorised`
    : '';

  const records = [
    { key: 'profile', title: 'Society identification', updated: masterDataUpdated.instProfile, detail: '' },
    { key: 'demographics', title: 'Registered demographics', updated: masterDataUpdated.demographics, detail: totalMembers ? `${totalMembers} members` : '' },
    { key: 'loan', title: 'Loan details', updated: masterDataUpdated.loan, detail: loanData?.hasLoan !== undefined ? loanState : '' },
    { key: 'compliance', title: 'Compliance and audit', updated: masterDataUpdated.compliance, detail: complianceDetail },
    { key: 'financials', title: 'Financial performance', updated: masterDataUpdated.financials, detail: financialsDetail },
    { key: 'dividend', title: 'Dividend details', updated: masterDataUpdated.dividend, detail: dividendDetail },
    { key: 'shareCapital', title: 'Share capital', updated: masterDataUpdated.shareCapital, detail: shareCapitalDetail },
  ];
  const recordedCount = records.filter(r => r.updated).length;

  const openRow = (key, recorded) => {
    if (key === 'loan') { onOpenLoan && onOpenLoan(); return; }
    setBanner(null);
    setExpanded({ key, mode: recorded ? 'view' : 'edit' });
  };
  const collapse = () => setExpanded(null);
  const goToEdit = (key) => setExpanded({ key, mode: 'edit' });
  const cancelEdit = (key, recorded) => setExpanded(recorded ? { key, mode: 'view' } : null);

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
            const isOpen = expanded?.key === r.key;
            const recorded = !!r.updated;
            return (
              <View key={r.key} style={[styles.rowWrap, i !== records.length - 1 && !isOpen && styles.rowBorder]}>
                {isOpen ? (
                  <RecordPanel
                    recordKey={r.key}
                    title={r.title}
                    mode={expanded.mode}
                    fy={fy}
                    onCollapse={collapse}
                    onGoToEdit={() => goToEdit(r.key)}
                    onCancelEdit={() => cancelEdit(r.key, recorded)}
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
                  <Pressable style={styles.row} onPress={() => openRow(r.key, recorded)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{r.title}</Text>
                      <Text style={styles.rowSubtitle}>
                        {recorded
                          ? `Updated ${formatUpdated(r.updated) || 'recently'}${r.detail ? ` · ${r.detail}` : ''}`
                          : 'Never updated'}
                      </Text>
                    </View>
                    {r.key === 'loan' ? (
                      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.slate400} />
                    ) : recorded ? (
                      <Text style={styles.viewLink}>View</Text>
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

function RecordPanel({
  recordKey, title, mode, fy, onCollapse, onGoToEdit, onCancelEdit,
  profileInitial, demographicsInitial, complianceInitial, financialsInitial, dividendInitial, shareCapitalInitial,
  onSaveProfile, onSaveDemographics, onSaveCompliance, onSaveFinancials, onSaveDividend, onSaveShareCapital,
}) {
  return (
    <View style={styles.editCard}>
      <View style={styles.editHeaderRow}>
        <Text style={styles.editTitle}>{title}</Text>
        <View style={styles.editHeaderActions}>
          {mode === 'view' && (
            <Pressable onPress={onGoToEdit} hitSlop={8}>
              <Text style={styles.updateLink}>Update</Text>
            </Pressable>
          )}
          <Pressable onPress={onCollapse} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-up" size={20} color={COLORS.slate500} />
          </Pressable>
        </View>
      </View>

      {mode === 'view' ? (
        <>
          {recordKey === 'profile' && <ProfileRead {...profileInitial} onUpdate={onGoToEdit} />}
          {recordKey === 'demographics' && <DemographicsRead demographicsData={demographicsInitial} onUpdate={onGoToEdit} />}
          {recordKey === 'compliance' && <ComplianceRead complianceData={complianceInitial} fy={fy} onUpdate={onGoToEdit} />}
          {recordKey === 'financials' && <FinancialsRead financialsData={financialsInitial} fy={fy} onUpdate={onGoToEdit} />}
          {recordKey === 'dividend' && (
            <DividendRead
              dividendData={dividendInitial}
              fy={fy}
              onUpdate={onGoToEdit}
              onConfirmNone={() => onSaveDividend({ ...dividendInitial, dividendAnnounced: 'No' }, dividendInitial)}
            />
          )}
          {recordKey === 'shareCapital' && <ShareCapitalRead shareCapitalData={shareCapitalInitial} onUpdate={onGoToEdit} />}
        </>
      ) : (
        <>
          {recordKey === 'profile' && <ProfileForm initial={profileInitial} onCancel={onCancelEdit} onSave={onSaveProfile} />}
          {recordKey === 'demographics' && <DemographicsForm initial={demographicsInitial} onCancel={onCancelEdit} onSave={onSaveDemographics} />}
          {recordKey === 'compliance' && <ComplianceForm initial={complianceInitial} fy={fy} onCancel={onCancelEdit} onSave={onSaveCompliance} />}
          {recordKey === 'financials' && <FinancialsForm initial={financialsInitial} onCancel={onCancelEdit} onSave={onSaveFinancials} />}
          {recordKey === 'dividend' && <DividendForm initial={dividendInitial} onCancel={onCancelEdit} onSave={onSaveDividend} />}
          {recordKey === 'shareCapital' && <ShareCapitalForm initial={shareCapitalInitial} onCancel={onCancelEdit} onSave={onSaveShareCapital} />}
        </>
      )}
    </View>
  );
}

// ─── Read (view-only) summaries ─────────────────────────────────────────

function ProfileRead({ societyName, panCard, regNumber, regDate, presidentName, presidentMobile, managerName, managerMobile, onUpdate }) {
  const idFields = [
    { label: 'Registration number', value: regNumber },
    { label: 'Date of registration', value: regDate },
    { label: 'PAN', value: panCard },
  ];
  const hasPersonnel = isFilled(presidentName) || isFilled(managerName);
  return (
    <>
      <View style={styles.readCard}>
        <Text style={styles.cardTitle}>Society identification</Text>
        <Text style={styles.fieldLabel}>REGISTERED NAME</Text>
        <Text style={styles.fieldValueLg}>{fmt(societyName)}</Text>
        {idFields.filter(f => isFilled(f.value)).map(f => (
          <View key={f.label} style={{ marginTop: 10 }}>
            <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
            <Text style={styles.fieldValue}>{f.value}</Text>
          </View>
        ))}
      </View>
      {hasPersonnel && (
        <View style={styles.readCard}>
          <Text style={styles.cardTitle}>Key personnel</Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            {isFilled(presidentName) && (
              <View>
                <Text style={styles.fieldLabel}>PRESIDENT</Text>
                <Text style={styles.fieldValue}>{presidentName}{isFilled(presidentMobile) ? ` · ${presidentMobile}` : ''}</Text>
              </View>
            )}
            {isFilled(managerName) && (
              <View>
                <Text style={styles.fieldLabel}>MANAGER</Text>
                <Text style={styles.fieldValue}>{managerName}{isFilled(managerMobile) ? ` · ${managerMobile}` : ''}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

function DemographicsRead({ demographicsData, onUpdate }) {
  const byCategory = {};
  (demographicsData || []).forEach(row => { byCategory[row.category] = row; });
  const totalMale = (demographicsData || []).reduce((s, r) => s + (parseInt(r.male) || 0), 0);
  const totalFemale = (demographicsData || []).reduce((s, r) => s + (parseInt(r.female) || 0), 0);
  const blankCategories = DEMOGRAPHIC_CATEGORIES.filter(c => !byCategory[c] || (!byCategory[c].male && !byCategory[c].female));
  return (
    <View style={styles.readCard}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>CATEGORY</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>MALE</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>FEMALE</Text>
        <Text style={[styles.tableHeaderCell, styles.tableCellCenter]}>TOTAL</Text>
      </View>
      {DEMOGRAPHIC_CATEGORIES.map((cat) => {
        const row = byCategory[cat];
        const blank = !row || (!row.male && !row.female);
        return (
          <View style={[styles.tableRow, styles.tableRowBorder]} key={cat}>
            <Text style={[styles.tableCellName, { flex: 1.4 }]}>{cat}</Text>
            <Text style={[styles.tableCell, styles.tableCellCenter]}>{blank ? '—' : (row.male || 0)}</Text>
            <Text style={[styles.tableCell, styles.tableCellCenter]}>{blank ? '—' : (row.female || 0)}</Text>
            <Text style={[styles.tableCell, styles.tableCellCenter]}>{blank ? '—' : (row.total || (parseInt(row.male || 0) + parseInt(row.female || 0)))}</Text>
          </View>
        );
      })}
      <View style={[styles.tableRow, styles.tableTotalRow]}>
        <Text style={[styles.tableTotalCell, { flex: 1.4 }]}>Total</Text>
        <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalMale}</Text>
        <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalFemale}</Text>
        <Text style={[styles.tableTotalCell, styles.tableCellCenter]}>{totalMale + totalFemale}</Text>
      </View>
      {blankCategories.length > 0 && blankCategories.length < DEMOGRAPHIC_CATEGORIES.length && (
        <Text style={styles.footnoteInCard}>{joinWithAnd(blankCategories)} left blank: none in the society.</Text>
      )}
    </View>
  );
}

function ComplianceRead({ complianceData, fy, onUpdate }) {
  const auditDone = complianceData?.auditStatus === 'Done' || complianceData?.auditStatus === 'Completed';
  const agmDone = complianceData?.agmStatus === 'Done' || complianceData?.agmStatus === 'Completed';
  return (
    <>
      <View style={styles.readCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Latest audit</Text>
          <View style={auditDone ? styles.donePill : styles.pendingPill}>
            <Text style={auditDone ? styles.donePillText : styles.pendingPillText}>{auditDone ? 'DONE' : 'PENDING'}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>
          {auditDone
            ? `${complianceData.auditStatus || 'Audit'} for ${complianceData.auditYear || fy}${complianceData.auditDate ? ` on ${complianceData.auditDate}` : ''}.`
            : `No audit recorded for ${fy}.`}
        </Text>
      </View>
      <View style={styles.readCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Latest AGM</Text>
          <View style={agmDone ? styles.donePill : styles.pendingPill}>
            <Text style={agmDone ? styles.donePillText : styles.pendingPillText}>{agmDone ? 'DONE' : 'PENDING'}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>
          {agmDone
            ? `${complianceData.agmStatus || 'AGM'} for ${complianceData.agmYear || fy}${complianceData.agmDate ? ` on ${complianceData.agmDate}` : ''}.`
            : `No general meeting recorded for ${fy}.`}
        </Text>
      </View>
    </>
  );
}

function FinancialsRead({ financialsData, fy, onUpdate }) {
  const fields = [
    { label: 'Annual turnover', value: financialsData?.annualTurnover },
    { label: 'Gross income', value: financialsData?.totalIncome },
    { label: 'Total expenses', value: financialsData?.totalExpenses },
  ];
  const allFilled = fields.every(f => isFilled(f.value));
  const netProfit = allFilled ? (parseFloat(financialsData.totalIncome) - parseFloat(financialsData.totalExpenses)) : null;
  return (
    <View style={styles.readCard}>
      <Text style={styles.cardTitle}>Annual figures · {fy}</Text>
      {allFilled ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          {fields.map(f => (
            <View key={f.label} style={styles.detailRowInline}>
              <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
              <Text style={styles.fieldValue}>₹{Number(f.value).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.detailRowInline}>
            <Text style={styles.fieldLabel}>{netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}</Text>
            <Text style={styles.fieldValue}>₹{Math.abs(netProfit).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.cardDesc}>Turnover, gross income and total expenses are pending.</Text>
      )}
    </View>
  );
}

function DividendRead({ dividendData, fy, onUpdate, onConfirmNone }) {
  const confirmedNone = dividendData?.dividendAnnounced === 'No';
  const distributed = isFilled(dividendData?.dividendAmount) || isFilled(dividendData?.dividendRate);
  return (
    <>
      <View style={styles.readCard}>
        <Text style={styles.cardTitle}>Dividend distribution · {fy}</Text>
        {distributed ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <View style={styles.detailRowInline}>
              <Text style={styles.fieldLabel}>RATE</Text>
              <Text style={styles.fieldValue}>{fmt(dividendData.dividendRate)}</Text>
            </View>
            <View style={styles.detailRowInline}>
              <Text style={styles.fieldLabel}>AMOUNT</Text>
              <Text style={styles.fieldValue}>₹{Number(dividendData.dividendAmount || 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.cardDesc}>
              {confirmedNone ? `Confirmed: no dividend was distributed for ${fy}.` : 'Nothing distributed this year.'}
            </Text>
            {!confirmedNone && (
              <Pressable style={styles.outlineBtnInline} onPress={onConfirmNone}>
                <Text style={styles.outlineBtnText}>Confirm none</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
      <View style={styles.recordRow}>
        <View>
          <Text style={styles.fieldLabel}>DIVIDEND POLICY</Text>
          <Text style={styles.fieldValue}>{fmt(dividendData?.dividendPolicy)}</Text>
        </View>
      </View>
    </>
  );
}

function ShareCapitalRead({ shareCapitalData, onUpdate }) {
  const fields = [
    { label: 'Authorised share capital', value: shareCapitalData?.authorizedCapital },
    { label: 'Paid-up share capital', value: shareCapitalData?.paidUpCapital },
    { label: 'Total member deposits', value: shareCapitalData?.totalDeposits },
  ];
  const allFilled = fields.every(f => isFilled(f.value));
  return (
    <View style={styles.readCard}>
      <Text style={styles.cardTitle}>Capital & deposits</Text>
      {allFilled ? (
        <View style={{ gap: 10, marginTop: 4 }}>
          {fields.map(f => (
            <View key={f.label} style={styles.detailRowInline}>
              <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
              <Text style={styles.fieldValue}>₹{Number(f.value).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <Text style={styles.footnoteInCard}>As on {fmt(shareCapitalData?.asOfDate)}.</Text>
        </View>
      ) : (
        <Text style={styles.cardDesc}>Capital and deposit figures are pending.</Text>
      )}
    </View>
  );
}

// ─── Per-record edit forms ──────────────────────────────────────────────

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
  viewLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.ink },

  editCard: { borderWidth: 1.5, borderColor: COLORS.maroon, borderRadius: 14, padding: 16, margin: 10, gap: 12 },
  editHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.ink },
  updateLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },

  readCard: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 14 },
  cardTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },
  cardDesc: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate600, lineHeight: 19, marginTop: 8 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.6, marginTop: 10 },
  fieldValue: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginTop: 2 },
  fieldValueLg: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  detailRowInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 4 },
  footnoteInCard: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 10 },

  recordRow: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 14 },

  pendingPill: { backgroundColor: COLORS.amber50, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pendingPillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.amber700, letterSpacing: 0.5 },
  donePill: { backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  donePillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.ink, letterSpacing: 0.5 },

  tableHeaderRow: { flexDirection: 'row', paddingBottom: 8 },
  tableHeaderCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.5 },
  tableCellCenter: { textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  tableCellName: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  tableCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600', color: COLORS.ink },
  tableTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  tableTotalCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },

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
  outlineBtnInline: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginTop: 10 },
  outlineBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  saveBtn: { backgroundColor: COLORS.maroon, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
