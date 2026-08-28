import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import { fetchLoanBeneficiaries, saveLoanBeneficiary, updateLoanBeneficiary, deleteLoanBeneficiary } from '../supabase';

const COLORS = {
  surface: '#ffffff',
  bg: '#F8F5F2',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  amber50: '#fffbeb',
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
  return isNaN(num) ? '—' : `₹ ${num.toLocaleString('en-IN')}`;
};

// RN's Alert.alert is a silent no-op on web — without this, a failed save
// or delete looked like nothing happened at all, with no visible feedback.
const notify = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// Per-institution loan beneficiary roster — mirrors MemberDataScreen's shape
// (society_name + society_type scoping, same add/edit/review/delete flow) but
// for who actually received loan money against this society's active loan,
// rather than the general membership.
export default function LoanBeneficiaryListScreen({
  societyName = '',
  societyType = 'MPCS',
  onBack,
  onBeneficiariesChanged
}) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showReview, setShowReview] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchLoanBeneficiaries(societyName, societyType);
    setBeneficiaries(data || []);
    setLoading(false);
  }, [societyName, societyType]);

  useEffect(() => { loadBeneficiaries(); }, [loadBeneficiaries]);

  const setField = (key) => (value) => setForm(prev => {
    const next = { ...prev, [key]: value };
    // Keep "Total Remaining" following Taken/Paid unless the CI has
    // deliberately typed their own value into that field — auto-fill saves
    // the common case (remaining = taken - paid) without locking out the
    // rare one (e.g. an adjusted balance after a penalty or waiver).
    if ((key === 'amountTaken' || key === 'amountPaid') && !prev.remainingTouched) {
      const taken = parseFloat(key === 'amountTaken' ? value : prev.amountTaken) || 0;
      const paid = parseFloat(key === 'amountPaid' ? value : prev.amountPaid) || 0;
      next.amountRemaining = String(Math.max(taken - paid, 0));
    }
    return next;
  });

  const setRemainingField = (value) => setForm(prev => ({ ...prev, amountRemaining: value, remainingTouched: true }));

  const canSave = form.beneficiaryName.trim().length > 0 && form.amountTaken !== '' && !isNaN(parseFloat(form.amountTaken));

  const handleConfirmSave = async () => {
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
      : await saveLoanBeneficiary({ societyName, societyType, ...payload });
    setSaving(false);
    if (error) {
      console.error('[CORE] saveLoanBeneficiary failed:', error);
      notify('Save Failed', error.message || 'Could not save beneficiary. Please try again.');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowReview(false);
    loadBeneficiaries();
    if (onBeneficiariesChanged) onBeneficiariesChanged();
  };

  const handleEditClick = (b) => {
    setEditingId(b.id);
    setForm({
      beneficiaryName: b.beneficiary_name || '',
      aadhaarNumber: b.aadhaar_number || '',
      amountTaken: b.amount_taken != null ? String(b.amount_taken) : '',
      amountPaid: b.amount_paid != null ? String(b.amount_paid) : '',
      amountRemaining: b.amount_remaining != null ? String(b.amount_remaining) : '',
      remainingTouched: true,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (b) => {
    const doDelete = async () => {
      const { error } = await deleteLoanBeneficiary(b.id);
      if (error) {
        console.error('[CORE] deleteLoanBeneficiary failed:', error);
        notify('Delete Failed', error.message || 'Could not delete beneficiary.');
        return;
      }
      setBeneficiaries(prev => prev.filter(x => x.id !== b.id));
      if (editingId === b.id) handleCancelEdit();
      if (onBeneficiariesChanged) onBeneficiariesChanged();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${b.beneficiary_name} from the loan beneficiary list?`)) doDelete();
    } else {
      Alert.alert('Remove Beneficiary', `Remove ${b.beneficiary_name} from the loan beneficiary list?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>{societyType} LOAN RECORD</Text>
          <Text style={styles.screenTitleHeader}>Loan Beneficiaries</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Society Indicator Card — auto-filled, not editable here, so a
            beneficiary can never be mis-filed against the wrong institution. */}
        <View style={styles.societyCard}>
          <LinearGradient
            colors={['rgba(122,26,31,0.06)', 'rgba(122,26,31,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.societyIconBox}>
            <MaterialCommunityIcons name="domain" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.societyLabel}>Loan Record For</Text>
            <Text style={styles.societyValue}>{societyName || 'Unknown Society'}</Text>
          </View>
        </View>

        {/* ── Add / Edit Beneficiary Form ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name={editingId ? 'account-edit-outline' : 'account-plus-outline'} size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>{editingId ? 'Edit Beneficiary' : 'Add Loan Beneficiary'}</Text>
              <Text style={styles.cardHeaderSub}>Who received loan money from this society's active loan</Text>
            </View>
            {editingId ? (
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditBtn} activeOpacity={0.7}>
                <Text style={styles.cancelEditBtnText}>CANCEL</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Beneficiary Name *</Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="account-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.beneficiaryName}
                onChangeText={setField('beneficiaryName')}
                placeholder="e.g. Karma Bhutia"
                placeholderTextColor={COLORS.slate300}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aadhaar Number <Text style={styles.inputHint}>(12 digits)</Text></Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="shield-key-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.aadhaarNumber}
                onChangeText={(v) => setField('aadhaarNumber')(v.replace(/[^0-9]/g, '').slice(0, 12))}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
                maxLength={12}
              />
            </View>
          </View>

          <View style={styles.inputRowHalf}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Amount Taken (₹) *</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="cash-plus" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.amountTaken}
                  onChangeText={setField('amountTaken')}
                  placeholder="0"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Total Payment Made (₹)</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="cash-check" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.amountPaid}
                  onChangeText={setField('amountPaid')}
                  placeholder="0"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Remaining (₹) <Text style={styles.inputHint}>(auto-filled, editable)</Text></Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="cash-remove" size={15} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={form.amountRemaining}
                onChangeText={setRemainingField}
                placeholder="0"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.btnWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                !canSave && styles.addBtnDisabled,
                pressed && canSave && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => setShowReview(true)}
              disabled={!canSave}
            >
              {canSave && (
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <MaterialCommunityIcons name="clipboard-text-outline" size={17} color={canSave ? '#ffffff' : COLORS.slate400} />
              <Text style={[styles.addBtnText, !canSave && { color: COLORS.slate400 }]}>
                {editingId ? 'REVIEW & UPDATE BENEFICIARY' : 'REVIEW & SAVE TO DATABASE'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Beneficiary List Section ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Loan Beneficiaries</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{beneficiaries.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : beneficiaries.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="cash-multiple" size={32} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No beneficiaries recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Add everyone who received money from this society's active loan.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <View style={[styles.th, styles.colSrNo]}>
                  <Text style={styles.thText}>SR. NO</Text>
                </View>
                <View style={[styles.th, styles.colMember]}>
                  <Text style={styles.thText}>BENEFICIARY NAME</Text>
                </View>
                <View style={[styles.th, styles.colAadhaar]}>
                  <Text style={styles.thText}>AADHAAR NO</Text>
                </View>
                <View style={[styles.th, styles.colAmount]}>
                  <Text style={styles.thText}>AMOUNT TAKEN</Text>
                </View>
                <View style={[styles.th, styles.colAmount]}>
                  <Text style={styles.thText}>TOTAL PAID</Text>
                </View>
                <View style={[styles.th, styles.colAmount]}>
                  <Text style={styles.thText}>REMAINING</Text>
                </View>
                <View style={[styles.th, styles.colAction]} />
              </View>

              {beneficiaries.map((b, idx) => (
                <View
                  key={b.id}
                  style={[styles.tr, idx % 2 === 1 && styles.trAlt]}
                >
                  <View style={[styles.td, styles.colSrNo]}>
                    <Text style={styles.tdText}>{idx + 1}</Text>
                  </View>
                  <View style={[styles.td, styles.colMember]}>
                    <Text style={styles.tdMemberName} numberOfLines={1}>{b.beneficiary_name}</Text>
                  </View>
                  <View style={[styles.td, styles.colAadhaar]}>
                    <Text style={styles.tdText} numberOfLines={1}>{b.aadhaar_number ? formatAadhaar(b.aadhaar_number) : '—'}</Text>
                  </View>
                  <View style={[styles.td, styles.colAmount]}>
                    <Text style={styles.tdText}>{formatRs(b.amount_taken)}</Text>
                  </View>
                  <View style={[styles.td, styles.colAmount]}>
                    <Text style={styles.tdText}>{formatRs(b.amount_paid)}</Text>
                  </View>
                  <View style={[styles.td, styles.colAmount]}>
                    <Text style={styles.tdText}>{formatRs(b.amount_remaining)}</Text>
                  </View>
                  <View style={[styles.td, styles.colAction]}>
                    <TouchableOpacity
                      onPress={() => handleEditClick(b)}
                      style={styles.editBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.slate600} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(b)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      {/* ── Review & Confirm Sheet ── */}
      {showReview && (
        <View style={styles.reviewOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => !saving && setShowReview(false)} />
          <View style={styles.reviewSheet}>
            <View style={styles.reviewHeaderRow}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>{editingId ? 'Review Before Updating' : 'Review Before Saving'}</Text>
                <Text style={styles.cardHeaderSub}>Confirm these details are correct before {editingId ? 'updating this record' : 'saving to the database'}.</Text>
              </View>
            </View>

            <View style={styles.reviewList}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Beneficiary Name</Text>
                <Text style={styles.reviewValue}>{form.beneficiaryName.trim() || '—'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Aadhaar Number</Text>
                <Text style={styles.reviewValue}>{form.aadhaarNumber ? formatAadhaar(form.aadhaarNumber) : '—'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Amount Taken</Text>
                <Text style={styles.reviewValue}>{formatRs(form.amountTaken)}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Total Payment Made</Text>
                <Text style={styles.reviewValue}>{formatRs(form.amountPaid || 0)}</Text>
              </View>
              <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reviewLabel}>Total Remaining</Text>
                <Text style={styles.reviewValue}>{formatRs(form.amountRemaining)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.reviewBackBtn}
                onPress={() => setShowReview(false)}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.reviewBackBtnText}>BACK TO EDIT</Text>
              </TouchableOpacity>
              <Pressable
                style={({ pressed }) => [styles.reviewConfirmBtn, pressed && { transform: [{ scale: 0.98 }] }]}
                onPress={handleConfirmSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <MaterialCommunityIcons name="database-check-outline" size={16} color="#ffffff" />
                )}
                <Text style={styles.addBtnText}>{saving ? (editingId ? 'UPDATING...' : 'SAVING...') : (editingId ? 'CONFIRM & UPDATE' : 'CONFIRM & SAVE')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, position: 'relative' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    overflow: 'hidden',
  },
  backBtn: { padding: 4, zIndex: 1 },
  topBarTitleContainer: { flex: 1, marginLeft: 12 },
  moduleTag: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 32, gap: 14 },

  societyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    overflow: 'hidden',
  },
  societyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  societyLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  societyValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.2,
    marginTop: 1,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },
  cancelEditBtn: {
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelEditBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate600,
    letterSpacing: 0.4,
  },

  inputRowHalf: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1, gap: 5 },
  inputGroup: { gap: 5 },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
  },
  inputHint: {
    fontWeight: '500',
    color: COLORS.slate400,
    textTransform: 'none',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: { marginRight: 6 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  btnWrapper: { borderRadius: 12, overflow: 'hidden' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.slate200,
  },
  addBtnDisabled: { backgroundColor: COLORS.slate100 },
  addBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  tableScrollContent: {
    flexGrow: 1,
    minWidth: '100%',
  },
  table: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    minWidth: 700,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  th: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
  },
  thText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  trAlt: {
    backgroundColor: COLORS.surface,
  },
  td: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  colSrNo: { width: 56 },
  colMember: { width: 170 },
  colAadhaar: { width: 150 },
  colAmount: { width: 130 },
  colAction: { width: 76, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  tdMemberName: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  tdText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Review Sheet
  reviewOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  reviewSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    maxHeight: '85%',
  },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewList: {
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    paddingHorizontal: 14,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    gap: 12,
  },
  reviewLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  reviewValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
    textAlign: 'right',
    flexShrink: 1,
  },
  reviewBackBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
  },
  reviewBackBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.slate600,
    letterSpacing: 0.5,
  },
  reviewConfirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
