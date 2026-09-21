import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { webCapWidth } from '../../utils/webStyles';
import { fetchLoanBeneficiaries, saveLoanBeneficiary, updateLoanBeneficiary, deleteLoanBeneficiary } from '../../supabase';

const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  calcBg: '#EDE8E0',
};

const FONT_FAMILY = 'Manrope';

const emptyForm = { beneficiaryName: '', aadhaarNumber: '', amountTaken: '', amountPaid: '', amountRemaining: '' };

const formatAadhaar = (num) => {
  const digits = (num || '').replace(/\D/g, '');
  if (digits.length !== 12) return digits || '—';
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
};

const formatRs = (n) => {
  if (n === '' || n === null || n === undefined) return '—';
  const num = Number(n);
  return isNaN(num) ? '—' : `₹${Math.round(num).toLocaleString('en-IN')}`;
};

const formatWhole = (n) => {
  const num = Number(n) || 0;
  return Math.round(num).toLocaleString('en-IN');
};

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// RN's Alert.alert is a silent no-op on web — without this, a failed save
// or delete looked like nothing happened at all, with no visible feedback.
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Supabase surfaces a blocked RLS write as a raw Postgres error, which
// means nothing to a field officer. Only a permission gap produces this
// specific error, so it can be swapped for plain language without masking
// any other real failure (network, validation, etc.).
const friendlyErrorMessage = (error, fallback) => {
  if (error?.code === '42501' || /row-level security policy/i.test(error?.message || '')) {
    return "You don't have access to do this for this institution — only the Cooperative Inspector or an ACI/PA assigned here can.";
  }
  return error?.message || fallback;
};

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// MPCS-only restyle of the shared LoanBeneficiaryListScreen (still used
// as-is by the Milk PCS module) — same fetch/save/update/delete calls and
// auto-filled "remaining" logic, redesign source: the maroon wizard/master-
// data card system already used across MpcsLoanSetupScreen etc. The add/
// edit form and the roster live together on one page (a "list-first"
// separate screen was tried and rolled back); tapping a row still opens a
// read-only detail view rather than jumping straight into edit mode, and
// CSV/PDF export cover the roster.
export default function MpcsLoanBeneficiariesScreen({
  societyName = '',
  loanExtended = '',
  onBack,
  onBeneficiariesChanged,
}) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  // 'main' (form + list together) | 'detail' (read-only, one beneficiary)
  const [view, setView] = useState('main');
  const [selectedId, setSelectedId] = useState(null);

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchLoanBeneficiaries(societyName, 'MPCS');
    setBeneficiaries(data || []);
    setLoading(false);
  }, [societyName]);

  useEffect(() => { loadBeneficiaries(); }, [loadBeneficiaries]);

  const setField = (key) => (value) => setForm(prev => {
    const next = { ...prev, [key]: value };
    // Keep "remaining" following taken/paid unless the CI has deliberately
    // typed their own value into that field — auto-fill saves the common
    // case (remaining = taken - paid) without locking out the rare one
    // (e.g. an adjusted balance after a penalty or waiver).
    if ((key === 'amountTaken' || key === 'amountPaid') && !prev.remainingTouched) {
      const taken = parseFloat(key === 'amountTaken' ? value : prev.amountTaken) || 0;
      const paid = parseFloat(key === 'amountPaid' ? value : prev.amountPaid) || 0;
      next.amountRemaining = String(Math.max(taken - paid, 0));
    }
    return next;
  });

  const setRemainingField = (value) => setForm(prev => ({ ...prev, amountRemaining: value, remainingTouched: true }));

  const hasName = form.beneficiaryName.trim().length > 0;
  const hasAmount = form.amountTaken !== '' && !isNaN(parseFloat(form.amountTaken));
  const canSave = hasName && hasAmount;

  // The loan's "Amount extended" is a pool every beneficiary draws from —
  // what's already taken by everyone else on this loan sets the ceiling
  // for what's left to hand out. Excludes the beneficiary being edited so
  // editing someone's own row doesn't count their old amount against them.
  const extendedTotal = parseFloat(loanExtended) || 0;
  const totalAllocated = beneficiaries.reduce((sum, b) => sum + (parseFloat(b.amount_taken) || 0), 0);
  const takenByOthers = beneficiaries
    .filter(b => b.id !== editingId)
    .reduce((sum, b) => sum + (parseFloat(b.amount_taken) || 0), 0);
  const remainingEligible = Math.max(extendedTotal - takenByOthers, 0);
  const takenValue = parseFloat(form.amountTaken) || 0;
  const overAllocated = extendedTotal > 0 && takenValue > remainingEligible;

  const missingLabel = !hasName && !hasAmount
    ? 'Name and amount needed'
    : !hasName
      ? 'Name needed'
      : 'Amount needed';

  const openDetail = (b) => {
    setSelectedId(b.id);
    setView('detail');
  };

  const openEditForm = (b) => {
    setEditingId(b.id);
    setForm({
      beneficiaryName: b.beneficiary_name || '',
      aadhaarNumber: b.aadhaar_number || '',
      amountTaken: b.amount_taken != null ? String(b.amount_taken) : '',
      amountPaid: b.amount_paid != null ? String(b.amount_paid) : '',
      amountRemaining: b.amount_remaining != null ? String(b.amount_remaining) : '',
      remainingTouched: true,
    });
    setView('main');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      beneficiaryName: form.beneficiaryName.trim(),
      aadhaarNumber: form.aadhaarNumber,
      amountTaken: form.amountTaken,
      amountPaid: form.amountPaid,
      amountRemaining: form.amountRemaining,
    };
    const { error } = editingId
      ? await updateLoanBeneficiary(editingId, payload)
      : await saveLoanBeneficiary({ societyName, societyType: 'MPCS', ...payload });
    setSaving(false);
    if (error) {
      console.error('[CORE] saveLoanBeneficiary failed:', error);
      notify('Save failed', friendlyErrorMessage(error, 'Could not save beneficiary. Please try again.'));
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    loadBeneficiaries();
    if (onBeneficiariesChanged) onBeneficiariesChanged();
  };

  const handleDelete = () => {
    const target = beneficiaries.find(b => b.id === editingId);
    if (!target) return;
    const doDelete = async () => {
      const { error } = await deleteLoanBeneficiary(target.id);
      if (error) {
        console.error('[CORE] deleteLoanBeneficiary failed:', error);
        notify('Delete failed', friendlyErrorMessage(error, 'Could not delete beneficiary.'));
        return;
      }
      setBeneficiaries(prev => prev.filter(x => x.id !== target.id));
      setEditingId(null);
      setForm(emptyForm);
      setView('main');
      if (onBeneficiariesChanged) onBeneficiariesChanged();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${target.beneficiary_name} from the loan beneficiary list?`)) doDelete();
    } else {
      Alert.alert('Remove beneficiary', `Remove ${target.beneficiary_name} from the loan beneficiary list?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const downloadCsv = () => {
    const header = ['Name', 'Aadhaar number', 'Amount taken', 'Repaid so far', 'Outstanding'];
    const rows = beneficiaries.map(b => [
      b.beneficiary_name || '',
      b.aadhaar_number ? formatAadhaar(b.aadhaar_number) : '',
      b.amount_taken ?? '',
      b.amount_paid ?? '',
      b.amount_remaining ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(societyName || 'loan-beneficiaries').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-beneficiaries.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buildPdfHtml = () => {
    const rows = beneficiaries.map((b, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(b.beneficiary_name)}</td>
        <td>${b.aadhaar_number ? escapeHtml(formatAadhaar(b.aadhaar_number)) : '—'}</td>
        <td>${escapeHtml(formatRs(b.amount_taken))}</td>
        <td>${escapeHtml(formatRs(b.amount_paid))}</td>
        <td>${escapeHtml(formatRs(b.amount_remaining))}</td>
      </tr>
    `).join('');
    return `
      <html>
        <head><meta charset="utf-8" />
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1E1B18; }
            h1 { font-size: 18px; margin-bottom: 2px; }
            p.sub { color: #57534E; font-size: 12px; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #E7E2DA; padding: 8px 10px; font-size: 12px; text-align: left; }
            th { background: #F5F1EC; text-transform: uppercase; letter-spacing: 0.4px; font-size: 10px; color: #57534E; }
          </style>
        </head>
        <body>
          <h1>Loan Beneficiaries</h1>
          <p class="sub">${escapeHtml(societyName || 'Society')} · ${beneficiaries.length} on record</p>
          <table>
            <thead><tr><th>Sr.</th><th>Name</th><th>Aadhaar</th><th>Amount taken</th><th>Repaid</th><th>Outstanding</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  const downloadPdf = async () => {
    const html = buildPdfHtml();
    if (Platform.OS === 'web') {
      // expo-print's printToFileAsync isn't supported on web — open the
      // report in a new tab and let the browser's own print dialog save it
      // as a PDF, same escape hatch every other web-only export in this
      // app would need without adding a PDF-generation library just for web.
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
      }
      return;
    }
    try {
      const printResult = await Print.printToFileAsync({ html });
      if (printResult?.uri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(printResult.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      console.warn('Beneficiary PDF export failed:', e);
    }
  };

  const selected = beneficiaries.find(b => b.id === selectedId);

  const headerTitle = view === 'detail' ? 'Beneficiary' : 'Beneficiaries';
  const headerBack = view === 'detail' ? () => setView('main') : onBack;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={headerBack} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MASTER DATA · LOAN</Text>
            <Text style={styles.title}>{headerTitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === 'main' && (
          <>
            <View style={styles.formCard}>
              <View style={styles.formHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formTitle}>{editingId ? 'Edit beneficiary' : 'Add a beneficiary'}</Text>
                  <Text style={styles.formSub}>Someone who received money from this society's loan.</Text>
                </View>
                {editingId && (
                  <Pressable onPress={cancelEdit} hitSlop={8}>
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Name</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={form.beneficiaryName}
                    onChangeText={setField('beneficiaryName')}
                    placeholder="e.g. Karma Bhutia"
                    placeholderTextColor={COLORS.slate400}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Aadhaar number</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    value={form.aadhaarNumber}
                    onChangeText={(v) => setField('aadhaarNumber')(v.replace(/[^0-9]/g, '').slice(0, 12))}
                    placeholder="12 digits"
                    placeholderTextColor={COLORS.slate400}
                    keyboardType="numeric"
                    maxLength={12}
                  />
                </View>
                <Text style={styles.optionalNote}>Optional.</Text>
              </View>

              <View style={styles.rowHalf}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Amount taken</Text>
                  <View style={[styles.inputBox, overAllocated && styles.inputBoxWarn]}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.amountTaken}
                      onChangeText={setField('amountTaken')}
                      placeholder="0"
                      placeholderTextColor={COLORS.slate400}
                      keyboardType="numeric"
                    />
                  </View>
                  {extendedTotal > 0 && (
                    <Text style={overAllocated ? styles.warnNote : styles.optionalNote}>
                      {overAllocated
                        ? `Only ₹${formatWhole(remainingEligible)} left of the ₹${formatWhole(extendedTotal)} extended.`
                        : `Up to ₹${formatWhole(remainingEligible)} left on this loan.`}
                    </Text>
                  )}
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Repaid so far</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.amountPaid}
                      onChangeText={setField('amountPaid')}
                      placeholder="0"
                      placeholderTextColor={COLORS.slate400}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.calcStrip}>
                <View>
                  <Text style={styles.calcLabel}>Still outstanding</Text>
                  <Text style={styles.calcSub}>Worked out from the two figures</Text>
                </View>
                <TextInput
                  style={styles.calcValueInput}
                  value={form.amountRemaining}
                  onChangeText={setRemainingField}
                  placeholder="—"
                  placeholderTextColor={COLORS.ink}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              {editingId && (
                <Pressable onPress={handleDelete} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
                  <Text style={styles.removeLink}>Remove beneficiary</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                    {canSave ? (editingId ? 'Save changes' : 'Add beneficiary') : missingLabel}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>ON THIS LOAN</Text>
              <Text style={styles.sectionCount}>{beneficiaries.length}</Text>
            </View>
            {extendedTotal > 0 && beneficiaries.length > 0 && (
              <Text style={styles.allocationNote}>
                ₹{formatWhole(totalAllocated)} of ₹{formatWhole(extendedTotal)} extended already allocated
              </Text>
            )}

            {loading ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator size="small" color={COLORS.maroon} />
              </View>
            ) : beneficiaries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No beneficiaries recorded yet.</Text>
              </View>
            ) : (
              <>
                <View style={styles.listCard}>
                  {beneficiaries.map((b, idx) => (
                    <Pressable
                      key={b.id}
                      style={[styles.listRow, idx > 0 && styles.listRowBorder]}
                      onPress={() => openDetail(b)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listRowName}>{b.beneficiary_name}</Text>
                        <Text style={styles.listRowSub}>{b.aadhaar_number ? `Aadhaar ${formatAadhaar(b.aadhaar_number)}` : 'No Aadhaar on record'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.listRowAmount}>{formatRs(b.amount_taken)}</Text>
                        <Text style={styles.listRowSub}>{formatRs(b.amount_remaining)} outstanding</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
                    </Pressable>
                  ))}
                </View>

                <View style={styles.downloadRow}>
                  <Pressable style={styles.downloadBtn} onPress={downloadCsv}>
                    <MaterialCommunityIcons name="file-delimited-outline" size={16} color={COLORS.maroon} />
                    <Text style={styles.downloadBtnText}>Download CSV</Text>
                  </Pressable>
                  <Pressable style={styles.downloadBtn} onPress={downloadPdf}>
                    <MaterialCommunityIcons name="file-pdf-box" size={16} color={COLORS.maroon} />
                    <Text style={styles.downloadBtnText}>Download PDF</Text>
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

        {view === 'detail' && selected && (
          <View style={styles.formCard}>
            <View style={styles.listCard}>
              <View style={styles.detailRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.detailValue}>{selected.beneficiary_name || '—'}</Text>
              </View>
              <View style={[styles.detailRow, styles.listRowBorder]}>
                <Text style={styles.fieldLabel}>Aadhaar number</Text>
                <Text style={styles.detailValue}>{selected.aadhaar_number ? formatAadhaar(selected.aadhaar_number) : '—'}</Text>
              </View>
              <View style={[styles.detailRow, styles.listRowBorder]}>
                <Text style={styles.fieldLabel}>Amount taken</Text>
                <Text style={styles.detailValue}>{formatRs(selected.amount_taken)}</Text>
              </View>
              <View style={[styles.detailRow, styles.listRowBorder]}>
                <Text style={styles.fieldLabel}>Repaid so far</Text>
                <Text style={styles.detailValue}>{formatRs(selected.amount_paid)}</Text>
              </View>
              <View style={[styles.detailRow, styles.listRowBorder]}>
                <Text style={styles.fieldLabel}>Still outstanding</Text>
                <Text style={styles.detailValue}>{formatRs(selected.amount_remaining)}</Text>
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={() => openEditForm(selected)}>
              <Text style={styles.saveBtnText}>Edit beneficiary</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  backBtn: { width: 28, height: 28, justifyContent: 'center' },
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: '#ffffff' },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 40, gap: 16 },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
  },
  sectionCount: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },
  allocationNote: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: -8 },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500 },

  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  listRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  listRowName: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  listRowSub: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 2 },
  listRowAmount: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.ink },

  downloadRow: { flexDirection: 'row', gap: 10 },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.maroon,
  },
  downloadBtnText: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
  },
  formSub: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500, lineHeight: 18 },
  formHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  formTitle: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: COLORS.ink, marginBottom: 3 },
  cancelLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailValue: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputBoxWarn: { borderColor: COLORS.maroon, borderWidth: 1.5 },
  currencyPrefix: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: COLORS.maroon, marginRight: 6 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  optionalNote: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500 },
  warnNote: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.maroon },

  rowHalf: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1, gap: 6 },

  calcStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.calcBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  calcLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  calcSub: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 2 },
  calcValueInput: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    minWidth: 60,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  removeLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },


  saveBtn: {
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnDisabled: { backgroundColor: '#DCD3C8' },
  saveBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: '#ffffff' },
  saveBtnTextDisabled: { color: '#4A4038' },
});
