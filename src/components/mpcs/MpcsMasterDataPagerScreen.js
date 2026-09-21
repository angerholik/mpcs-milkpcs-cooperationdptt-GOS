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
  amber50: '#FFF7ED',
  amber700: '#B45309',
};

const FONT_FAMILY = 'Manrope';

const fmt = (v) => (v === undefined || v === null || v === '' ? '—' : v);
const isFilled = (v) => v !== undefined && v !== null && v !== '';

// The financial/compliance year this app tracks is the most recently
// COMPLETED one, not the one currently running — a cooperative's audit,
// AGM and annual figures for FY2025–26 get reported during FY2026–27,
// the year after it closes.
function lastCompletedFY() {
  const now = new Date();
  const y = now.getFullYear();
  const start = now.getMonth() + 1 >= 4 ? y - 1 : y - 2;
  return `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

const DEMOGRAPHIC_CATEGORIES = ['SC', 'ST', 'OBC', 'Others'];

// New paginated Master Data flow — one section per screen with its own
// read-only summary + an "Edit record" bottom sheet, Record N of 8 /
// Prev-Next footer, replacing the single scrollable list (still used by
// nothing now — MpcsMasterDataScreen.js is superseded by this). Built
// against Claude Design canvas screenshots for the first 6 of 8 sections;
// Share Capital's "Loan →" hands off to the existing (already redesigned)
// standalone Loan flow rather than a 7th page here, since Loan/CSC Details
// weren't part of this batch.
export default function MpcsMasterDataPagerScreen({
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
  onSaveProfile,
  onSaveDemographics,
  onSaveCompliance,
  onSaveFinancials,
  onSaveDividend,
  onSaveShareCapital,
  initialIndex = 0,
  onNavigateScreen,
  onBack,
  activeTab = 'home',
  onTabPress,
}) {
  const [index, setIndex] = useState(initialIndex);
  const [editing, setEditing] = useState(false);

  const goTo = (i) => { setIndex(i); setEditing(false); };

  const fy = lastCompletedFY();

  const SECTIONS = [
    { key: 'profile', title: 'Institutional profile' },
    { key: 'demographics', title: 'Demographics' },
    { key: 'compliance', title: 'Compliance & audit' },
    { key: 'financials', title: 'Financials' },
    { key: 'dividend', title: 'Dividend' },
    { key: 'shareCapital', title: 'Share capital' },
  ];
  const total = 8;
  const current = SECTIONS[index];

  const headerBack = () => {
    if (editing) { setEditing(false); return; }
    if (index === 0) { onBack && onBack(); return; }
    goTo(index - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={headerBack} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MASTER DATA</Text>
            <Text style={styles.title}>{current.title}</Text>
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
        {current.key === 'profile' && (
          editing ? (
            <ProfileEdit
              initial={{ societyName, panCard, regNumber, regDate, presidentName, presidentMobile, managerName, managerMobile }}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveProfile && onSaveProfile(data); setEditing(false); }}
            />
          ) : (
            <ProfileRead
              societyName={societyName} panCard={panCard} regNumber={regNumber} regDate={regDate}
              presidentName={presidentName} presidentMobile={presidentMobile}
              managerName={managerName} managerMobile={managerMobile}
              onEdit={() => setEditing(true)}
            />
          )
        )}

        {current.key === 'demographics' && (
          editing ? (
            <DemographicsEdit
              initial={demographicsData}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveDemographics && onSaveDemographics(data); setEditing(false); }}
            />
          ) : (
            <DemographicsRead demographicsData={demographicsData} onEdit={() => setEditing(true)} />
          )
        )}

        {current.key === 'compliance' && (
          editing ? (
            <ComplianceEdit
              initial={complianceData}
              fy={fy}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveCompliance && onSaveCompliance(data); setEditing(false); }}
            />
          ) : (
            <ComplianceRead complianceData={complianceData} fy={fy} onEdit={() => setEditing(true)} />
          )
        )}

        {current.key === 'financials' && (
          editing ? (
            <FinancialsEdit
              initial={financialsData}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveFinancials && onSaveFinancials(data); setEditing(false); }}
            />
          ) : (
            <FinancialsRead financialsData={financialsData} fy={fy} onEdit={() => setEditing(true)} />
          )
        )}

        {current.key === 'dividend' && (
          editing ? (
            <DividendEdit
              initial={dividendData}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveDividend && onSaveDividend(data); setEditing(false); }}
            />
          ) : (
            <DividendRead
              dividendData={dividendData}
              fy={fy}
              onEdit={() => setEditing(true)}
              onConfirmNone={() => onSaveDividend && onSaveDividend({ ...dividendData, dividendAnnounced: 'No' })}
            />
          )
        )}

        {current.key === 'shareCapital' && (
          editing ? (
            <ShareCapitalEdit
              initial={shareCapitalData}
              onCancel={() => setEditing(false)}
              onSave={(data) => { onSaveShareCapital && onSaveShareCapital(data); setEditing(false); }}
            />
          ) : (
            <ShareCapitalRead shareCapitalData={shareCapitalData} onEdit={() => setEditing(true)} />
          )
        )}

        {!editing && (
          <View style={styles.pagerRow}>
            <Text style={styles.pagerLabel}>Record {index + 1} of {total}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {index > 0 && (
                <Pressable style={styles.pagerBtn} onPress={() => goTo(index - 1)}>
                  <Text style={styles.pagerBtnText}>← {SECTIONS[index - 1].title}</Text>
                </Pressable>
              )}
              {index < SECTIONS.length - 1 ? (
                <Pressable style={styles.pagerBtn} onPress={() => goTo(index + 1)}>
                  <Text style={styles.pagerBtnText}>{SECTIONS[index + 1].title} →</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.pagerBtn} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_LOAN')}>
                  <Text style={styles.pagerBtnText}>Loan →</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab} onTabPress={onTabPress} />}
    </View>
  );
}

// ─── Institutional profile ──────────────────────────────────────────────

function ProfileRead({ societyName, panCard, regNumber, regDate, presidentName, presidentMobile, managerName, managerMobile, onEdit }) {
  const idFields = [
    { label: 'Registration number', value: regNumber },
    { label: 'Date of registration', value: regDate },
    { label: 'PAN', value: panCard },
  ];
  const pendingIdFields = idFields.filter(f => !isFilled(f.value));
  const hasPersonnel = isFilled(presidentName) || isFilled(managerName);
  const totalFields = 1 + idFields.length + 4; // society name always present + 3 id fields + 4 personnel fields
  const recordedCount = 1 + idFields.filter(f => isFilled(f.value)).length
    + (isFilled(presidentName) ? 1 : 0) + (isFilled(presidentMobile) ? 1 : 0)
    + (isFilled(managerName) ? 1 : 0) + (isFilled(managerMobile) ? 1 : 0);
  const pendingCount = totalFields - recordedCount;

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{recordedCount} field{recordedCount === 1 ? '' : 's'} recorded</Text> · {pendingCount} pending
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Society identification</Text>
        <Text style={styles.fieldLabel}>REGISTERED NAME</Text>
        <Text style={styles.fieldValueLg}>{fmt(societyName)}</Text>
        {idFields.some(f => isFilled(f.value)) && (
          <View style={styles.divider} />
        )}
        {idFields.filter(f => isFilled(f.value)).map(f => (
          <View key={f.label} style={{ marginTop: 10 }}>
            <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
            <Text style={styles.fieldValue}>{f.value}</Text>
          </View>
        ))}
        {pendingIdFields.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.pendingLabel}>Pending</Text>
            <View style={styles.pillRow}>
              {pendingIdFields.map(f => (
                <View key={f.label} style={styles.dashedPill}><Text style={styles.dashedPillText}>{f.label}</Text></View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key personnel</Text>
        {hasPersonnel ? (
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
        ) : (
          <>
            <Text style={styles.cardDesc}>No president or manager on record. Four fields pending: name and mobile for each.</Text>
            <Pressable style={styles.addBtn} onPress={onEdit}>
              <Text style={styles.addBtnText}>Add personnel</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

function ProfileEdit({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    societyName: initial.societyName || '', panCard: initial.panCard || '',
    regNumber: initial.regNumber || '', regDate: initial.regDate || '',
    presidentName: initial.presidentName || '', presidentMobile: initial.presidentMobile || '',
    secretaryName: initial.managerName || '', secretaryMobile: initial.managerMobile || '',
  });
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <EditCard title="Edit institutional profile" onCancel={onCancel} onSave={() => onSave(form)}>
      <Field label="Society name" value={form.societyName} onChangeText={set('societyName')} />
      <Field label="Registration number" value={form.regNumber} onChangeText={set('regNumber')} />
      <Field label="Date of registration" value={form.regDate} onChangeText={set('regDate')} placeholder="DD Mon YYYY" />
      <Field label="PAN" value={form.panCard} onChangeText={set('panCard')} autoCapitalize="characters" />
      <Field label="President name" value={form.presidentName} onChangeText={set('presidentName')} />
      <Field label="President mobile" value={form.presidentMobile} onChangeText={set('presidentMobile')} keyboardType="numeric" />
      <Field label="Manager name" value={form.secretaryName} onChangeText={set('secretaryName')} />
      <Field label="Manager mobile" value={form.secretaryMobile} onChangeText={set('secretaryMobile')} keyboardType="numeric" />
    </EditCard>
  );
}

// ─── Demographics ───────────────────────────────────────────────────────

function DemographicsRead({ demographicsData, onEdit }) {
  const byCategory = {};
  demographicsData.forEach(row => { byCategory[row.category] = row; });
  const totalMale = demographicsData.reduce((s, r) => s + (parseInt(r.male) || 0), 0);
  const totalFemale = demographicsData.reduce((s, r) => s + (parseInt(r.female) || 0), 0);
  const blankCategories = DEMOGRAPHIC_CATEGORIES.filter(c => !byCategory[c] || (!byCategory[c].male && !byCategory[c].female));

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{totalMale + totalFemale} members</Text> across {DEMOGRAPHIC_CATEGORIES.length} categories
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
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
      </View>

      {blankCategories.length > 0 && blankCategories.length < DEMOGRAPHIC_CATEGORIES.length && (
        <Text style={styles.footnote}>{joinWithAnd(blankCategories)} left blank: none in the society.</Text>
      )}
    </>
  );
}

function joinWithAnd(arr) {
  if (arr.length === 1) return arr[0];
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

function DemographicsEdit({ initial, onCancel, onSave }) {
  const byCategory = {};
  (initial || []).forEach(row => { byCategory[row.category] = row; });
  const [rows, setRows] = useState(
    DEMOGRAPHIC_CATEGORIES.map(cat => ({
      category: cat,
      male: byCategory[cat]?.male || '',
      female: byCategory[cat]?.female || '',
    }))
  );
  const setCell = (cat, key) => (v) => setRows(prev => prev.map(r => r.category === cat ? { ...r, [key]: v } : r));
  const handleSave = () => {
    const data = rows.map(r => ({ ...r, total: String((parseInt(r.male) || 0) + (parseInt(r.female) || 0)) }));
    onSave(data);
  };
  return (
    <EditCard title="Edit demographics" onCancel={onCancel} onSave={handleSave}>
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
    </EditCard>
  );
}

// ─── Compliance & audit ─────────────────────────────────────────────────

function ComplianceRead({ complianceData, fy, onEdit }) {
  const auditDone = isFilled(complianceData?.auditYear) || isFilled(complianceData?.auditDate);
  const agmDone = isFilled(complianceData?.agmYear) || isFilled(complianceData?.agmDate);
  const recordedCount = (auditDone ? 3 : 0) + (agmDone ? 3 : 0);
  const pendingCount = 6 - recordedCount;

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{recordedCount === 0 ? 'Nothing recorded' : `${recordedCount} recorded`}</Text> · {pendingCount} pending
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Latest audit</Text>
          <View style={auditDone ? styles.donePill : styles.pendingPill}>
            <Text style={auditDone ? styles.donePillText : styles.pendingPillText}>{auditDone ? 'DONE' : 'PENDING'}</Text>
          </View>
        </View>
        {auditDone ? (
          <Text style={styles.cardDesc}>
            {complianceData.auditStatus || 'Audit'} for {complianceData.auditYear || fy}{complianceData.auditDate ? ` on ${complianceData.auditDate}` : ''}.
          </Text>
        ) : (
          <Text style={styles.cardDesc}>No audit recorded for {fy}. Year and date pending.</Text>
        )}
        <Pressable style={styles.addBtn} onPress={onEdit}>
          <Text style={styles.addBtnText}>{auditDone ? 'Edit audit' : 'Add audit'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Latest AGM</Text>
          <View style={agmDone ? styles.donePill : styles.pendingPill}>
            <Text style={agmDone ? styles.donePillText : styles.pendingPillText}>{agmDone ? 'DONE' : 'PENDING'}</Text>
          </View>
        </View>
        {agmDone ? (
          <Text style={styles.cardDesc}>
            {complianceData.agmStatus || 'AGM'} for {complianceData.agmYear || fy}{complianceData.agmDate ? ` on ${complianceData.agmDate}` : ''}.
          </Text>
        ) : (
          <Text style={styles.cardDesc}>No general meeting recorded for {fy}. Year and date pending.</Text>
        )}
        <Pressable style={styles.addBtn} onPress={onEdit}>
          <Text style={styles.addBtnText}>{agmDone ? 'Edit AGM' : 'Add AGM'}</Text>
        </Pressable>
      </View>
    </>
  );
}

function ComplianceEdit({ initial, fy, onCancel, onSave }) {
  const [form, setForm] = useState({
    auditYear: initial?.auditYear || fy, auditDate: initial?.auditDate || '', auditStatus: initial?.auditStatus || 'Completed',
    agmYear: initial?.agmYear || fy, agmDate: initial?.agmDate || '', agmStatus: initial?.agmStatus || 'Completed',
  });
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <EditCard title="Edit compliance & audit" onCancel={onCancel} onSave={() => onSave(form)}>
      <Field label="Audit year" value={form.auditYear} onChangeText={set('auditYear')} />
      <Field label="Audit date" value={form.auditDate} onChangeText={set('auditDate')} placeholder="DD Mon YYYY" />
      <Field label="AGM year" value={form.agmYear} onChangeText={set('agmYear')} />
      <Field label="AGM date" value={form.agmDate} onChangeText={set('agmDate')} placeholder="DD Mon YYYY" />
    </EditCard>
  );
}

// ─── Financials ─────────────────────────────────────────────────────────

function FinancialsRead({ financialsData, fy, onEdit }) {
  const fields = [
    { label: 'Annual turnover', value: financialsData?.annualTurnover },
    { label: 'Gross income', value: financialsData?.totalIncome },
    { label: 'Total expenses', value: financialsData?.totalExpenses },
  ];
  const allFilled = fields.every(f => isFilled(f.value));
  const netProfit = allFilled ? (parseFloat(financialsData.totalIncome) - parseFloat(financialsData.totalExpenses)) : null;

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{allFilled ? 'Recorded' : 'Nothing recorded'}</Text> · year {fy}
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Annual figures</Text>
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
          <>
            <Text style={styles.cardDesc}>
              Turnover, gross income and total expenses are pending. Profit or loss and profitability margin are worked out from them, so they stay blank until all three are in.
            </Text>
            <View style={styles.pillRow}>
              {fields.map(f => (
                <View key={f.label} style={styles.dashedPillRow}>
                  <Text style={styles.dashedPillRowLabel}>{f.label}</Text>
                  <Text style={styles.dashedPillRowValue}>{isFilled(f.value) ? `₹${Number(f.value).toLocaleString('en-IN')}` : 'Pending'}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.addBtn} onPress={onEdit}>
              <Text style={styles.addBtnText}>Add the three figures</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

function FinancialsEdit({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    annualTurnover: initial?.annualTurnover || '', totalIncome: initial?.totalIncome || '', totalExpenses: initial?.totalExpenses || '',
  });
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <EditCard title="Edit financials" onCancel={onCancel} onSave={() => onSave(form)}>
      <Field label="Annual turnover (₹)" value={form.annualTurnover} onChangeText={set('annualTurnover')} keyboardType="numeric" />
      <Field label="Gross income (₹)" value={form.totalIncome} onChangeText={set('totalIncome')} keyboardType="numeric" />
      <Field label="Total expenses (₹)" value={form.totalExpenses} onChangeText={set('totalExpenses')} keyboardType="numeric" />
    </EditCard>
  );
}

// ─── Dividend ───────────────────────────────────────────────────────────

function DividendRead({ dividendData, fy, onEdit, onConfirmNone }) {
  const confirmedNone = dividendData?.dividendAnnounced === 'No';
  const distributed = isFilled(dividendData?.dividendAmount) || isFilled(dividendData?.dividendRate);

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{distributed ? 'Distributed' : confirmedNone ? 'Confirmed none' : 'No distribution'}</Text> · year {fy}
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dividend distribution</Text>
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
              {confirmedNone
                ? `Confirmed: no dividend was distributed for ${fy}.`
                : "Nothing distributed this year. If the society did declare a dividend, record the date, rate and total paid; the policy is held against the society, not the year."}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable style={styles.addBtn} onPress={onEdit}>
                <Text style={styles.addBtnText}>Record a dividend</Text>
              </Pressable>
              {!confirmedNone && (
                <Pressable style={styles.outlineBtn} onPress={onConfirmNone}>
                  <Text style={styles.outlineBtnText}>Confirm none</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.recordRow}>
        <View>
          <Text style={styles.recordLabel}>DIVIDEND POLICY</Text>
          <Text style={styles.recordValue}>{fmt(dividendData?.dividendPolicy)}</Text>
        </View>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.setItLink}>{isFilled(dividendData?.dividendPolicy) ? 'Edit' : 'Set it'}</Text>
        </Pressable>
      </View>
    </>
  );
}

function DividendEdit({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    dividendPolicy: initial?.dividendPolicy || '', dividendRate: initial?.dividendRate || '',
    dividendAmount: initial?.dividendAmount || '', distributionDate: initial?.distributionDate || '',
    dividendAnnounced: initial?.dividendAmount || initial?.dividendRate ? 'Yes' : (initial?.dividendAnnounced || ''),
  });
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <EditCard title="Edit dividend" onCancel={onCancel} onSave={() => onSave(form)}>
      <Field label="Dividend policy" value={form.dividendPolicy} onChangeText={set('dividendPolicy')} multiline />
      <Field label="Rate" value={form.dividendRate} onChangeText={set('dividendRate')} placeholder="e.g. 8%" />
      <Field label="Amount (₹)" value={form.dividendAmount} onChangeText={set('dividendAmount')} keyboardType="numeric" />
      <Field label="Distribution date" value={form.distributionDate} onChangeText={set('distributionDate')} placeholder="DD Mon YYYY" />
    </EditCard>
  );
}

// ─── Share capital ──────────────────────────────────────────────────────

function ShareCapitalRead({ shareCapitalData, onEdit }) {
  const fields = [
    { label: 'Authorised share capital', value: shareCapitalData?.authorizedCapital },
    { label: 'Paid-up share capital', value: shareCapitalData?.paidUpCapital },
    { label: 'Total member deposits', value: shareCapitalData?.totalDeposits },
  ];
  const recordedCount = fields.filter(f => isFilled(f.value)).length + (isFilled(shareCapitalData?.asOfDate) ? 1 : 0);
  const pendingCount = 4 - recordedCount;
  const allFilled = pendingCount === 0;

  return (
    <>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryBold}>{recordedCount === 0 ? 'Nothing recorded' : `${recordedCount} recorded`}</Text> · {pendingCount} pending
        </Text>
        <Pressable style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Edit record</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
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
          <>
            <View style={styles.pillRow}>
              {fields.map(f => (
                <View key={f.label} style={styles.dashedPillRow}>
                  <Text style={styles.dashedPillRowLabel}>{f.label}</Text>
                  <Text style={styles.dashedPillRowValue}>{isFilled(f.value) ? `₹${Number(f.value).toLocaleString('en-IN')}` : 'Pending'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.footnoteInCard}>Recorded as on a date you choose, so the registrar knows how current the figures are.</Text>
            <Pressable style={styles.addBtn} onPress={onEdit}>
              <Text style={styles.addBtnText}>Add capital figures</Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

function ShareCapitalEdit({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({
    authorizedCapital: initial?.authorizedCapital || '', paidUpCapital: initial?.paidUpCapital || '',
    totalDeposits: initial?.totalDeposits || '', asOfDate: initial?.asOfDate || '',
  });
  const set = (k) => (v) => setForm(prev => ({ ...prev, [k]: v }));
  return (
    <EditCard title="Edit share capital" onCancel={onCancel} onSave={() => onSave(form)}>
      <Field label="Authorised share capital (₹)" value={form.authorizedCapital} onChangeText={set('authorizedCapital')} keyboardType="numeric" />
      <Field label="Paid-up share capital (₹)" value={form.paidUpCapital} onChangeText={set('paidUpCapital')} keyboardType="numeric" />
      <Field label="Total member deposits (₹)" value={form.totalDeposits} onChangeText={set('totalDeposits')} keyboardType="numeric" />
      <Field label="As on date" value={form.asOfDate} onChangeText={set('asOfDate')} placeholder="DD Mon YYYY" />
    </EditCard>
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

function EditCard({ title, onCancel, onSave, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={{ gap: 14, marginTop: 12 }}>
        {children}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Pressable style={styles.outlineBtn} onPress={onCancel}>
          <Text style={styles.outlineBtnText}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.saveBtn, { flex: 1 }]} onPress={onSave}>
          <Text style={styles.saveBtnText}>Save</Text>
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
  eyebrow: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: '#ffffff' },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: '#ffffff' },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '500', color: COLORS.slate600, flex: 1, marginRight: 10 },
  summaryBold: { fontWeight: '800', color: COLORS.ink },
  editBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  editBtnText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },

  card: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: COLORS.ink },
  cardDesc: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate600, lineHeight: 19, marginTop: 8, marginBottom: 14 },

  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.6, marginTop: 10 },
  fieldValue: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginTop: 2 },
  fieldValueLg: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  detailRowInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  divider: { height: 1, backgroundColor: COLORS.border, marginTop: 14 },
  pendingLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500, marginTop: 14, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  dashedPill: { borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  dashedPillText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 },
  dashedPillRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dashedPillRowLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  dashedPillRowValue: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.slate500 },

  addBtn: { backgroundColor: COLORS.maroon, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  addBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },
  outlineBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  outlineBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  saveBtn: { backgroundColor: COLORS.maroon, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },

  tableHeaderRow: { flexDirection: 'row', paddingBottom: 8 },
  tableHeaderCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.5 },
  tableCellCenter: { textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 12 },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  tableCellName: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },
  tableCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600', color: COLORS.ink },
  tableTotalRow: { backgroundColor: COLORS.bg, marginHorizontal: -16, marginBottom: -16, marginTop: 4, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: COLORS.border, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  tableTotalCell: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },

  footnote: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500 },
  footnoteInCard: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 10 },

  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  recordLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.6 },
  recordValue: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink, marginTop: 3 },
  setItLink: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.maroon },

  pendingPill: { backgroundColor: COLORS.amber50, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pendingPillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.amber700, letterSpacing: 0.5 },
  donePill: { backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  donePillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.ink, letterSpacing: 0.5 },

  fieldGroup: { gap: 6 },
  inputLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.ink },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, height: 48 },
  textInput: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '600', color: COLORS.ink, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  rowHalf: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1, gap: 6 },

  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  pagerLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500 },
  pagerBtn: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  pagerBtnText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.ink },
});
