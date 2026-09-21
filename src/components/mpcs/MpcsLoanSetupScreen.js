import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAutosave } from '../../hooks/useAutosave';
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
};

const FONT_FAMILY = 'Manrope';

const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatToIsoDate(displayStr) {
  if (!displayStr) return '';
  if (displayStr.includes('-') && displayStr.length === 10) return displayStr;
  const parts = displayStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

function formatFromIsoDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = monthNames[monthIdx] || 'Jan';
    return `${day} ${monthName} ${year}`;
  }
  return isoStr;
}

// Master Data: the one-time (or once-per-loan) loan setup — whether this
// society currently has a loan on record, and its type/sanction date/amount.
// The MONTHLY repayment tracking (amount recovered, outstanding balance) is
// a separate screen (MpcsLoanStatusScreen) that reads masterHasLoan/
// masterLoanExtended/masterLoanCleared from here rather than duplicating them.
export default function MpcsLoanSetupScreen({
  initialHasLoan = false,
  initialLoanType = "",
  initialSanctionDate = "",
  initialBeneficiaries = "",
  initialLoanExtended = "",
  initialLoanCleared = false,
  onSaveLoan,
  onNext,
  onBack,
  onManageBeneficiaries,
  activeTab,
  onTabPress,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // hasLoan itself is answered one screen back (the Master Data list's
  // own Yes/No toggle, which is also the only thing that navigates here)
  // — this screen only ever opens once that answer is already Yes, so it
  // has no toggle of its own and just carries the value through to saves.
  const [hasLoan, setHasLoan] = useState(initialHasLoan);
  const [loanType, setLoanType] = useState(initialLoanType);
  const [sanctionDate, setSanctionDate] = useState(initialSanctionDate);
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [loanExtended, setLoanExtended] = useState(initialLoanExtended);
  const [loanCleared, setLoanCleared] = useState(initialLoanCleared);

  React.useEffect(() => {
    setHasLoan(initialHasLoan);
    if (initialLoanType) setLoanType(initialLoanType);
    if (initialSanctionDate) setSanctionDate(initialSanctionDate);
    if (initialBeneficiaries) setBeneficiaries(initialBeneficiaries);
    if (initialLoanExtended) setLoanExtended(initialLoanExtended);
    setLoanCleared(initialLoanCleared);
  }, [initialHasLoan, initialLoanType, initialSanctionDate, initialBeneficiaries, initialLoanExtended, initialLoanCleared]);

  const persistLoan = (overrides = {}) => {
    const data = { hasLoan, loanType, sanctionDate, beneficiaries, loanExtended, loanCleared, ...overrides };
    if (onSaveLoan) onSaveLoan(data);
  };

  // Persists edits shortly after they change, so a value entered here
  // survives even if the tab reloads before "Save" is tapped.
  useAutosave(() => persistLoan(), [hasLoan, loanType, sanctionDate, beneficiaries, loanExtended, loanCleared]);

  const handleSave = (overrides = {}) => {
    persistLoan(overrides);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={() => { handleSave(); if (onBack) onBack(); }} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MASTER DATA</Text>
            <Text style={styles.title}>Loan details</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeaderTitle}>Loan record</Text>
            <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>

          <View style={[styles.listRow, styles.listRowBorder]}>
            <Text style={styles.listRowLabel}>Loan type</Text>
            <Text style={styles.listRowValue}>{loanType || '—'}</Text>
          </View>
          <View style={[styles.listRow, styles.listRowBorder]}>
            <Text style={styles.listRowLabel}>Sanction date</Text>
            <Text style={styles.listRowValue}>{sanctionDate || '—'}</Text>
          </View>
          <View style={[styles.listRow, styles.listRowBorder]}>
            <Text style={styles.listRowLabel}>Amount extended</Text>
            <Text style={styles.listRowValue}>{loanExtended || '—'}</Text>
          </View>
          <View style={[styles.listRow, styles.listRowBorder]}>
            <Text style={styles.listRowLabel}>Number of Beneficiaries</Text>
            <Text style={styles.listRowValue}>{beneficiaries || '—'}</Text>
          </View>

          {onManageBeneficiaries && (
            <Pressable style={styles.manageRow} onPress={() => { handleSave(); onManageBeneficiaries(); }}>
              <Text style={styles.manageRowText}>Manage beneficiaries</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
            </Pressable>
          )}
        </View>

        <Text style={styles.verifiedNote}>This record has not been verified.</Text>

        {onNext && (
          <View style={styles.footerRow}>
            <Pressable style={styles.backOutlineBtn} onPress={() => { handleSave(); if (onBack) onBack(); }}>
              <Text style={styles.backOutlineText}>Back</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              onPress={() => { handleSave(); onNext(); }}
            >
              <Text style={styles.primaryBtnText}>Save loan details</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit loan details</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.slate500} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Loan type</Text>
                <TextInput style={styles.modalInput} value={loanType} onChangeText={setLoanType} placeholder="e.g. Cash Credit Limit" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Sanction date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="date"
                      value={formatToIsoDate(sanctionDate)}
                      onChange={(e) => setSanctionDate(formatFromIsoDate(e.target.value))}
                      style={{
                        width: '100%', height: '100%', border: 'none', outline: 'none',
                        background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '16px',
                        color: COLORS.ink, fontWeight: '600', cursor: 'pointer',
                      }}
                    />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={sanctionDate} onChangeText={setSanctionDate} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Amount extended (₹)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={loanExtended} onChangeText={setLoanExtended} placeholder="0" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Number of Beneficiaries</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={beneficiaries} onChangeText={setBeneficiaries} placeholder="0" placeholderTextColor={COLORS.slate400} />
              </View>

              <Pressable style={[styles.primaryBtn, { marginTop: 8, marginBottom: 4 }]} onPress={() => handleSave()}>
                <Text style={styles.primaryBtnText}>Save changes</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      )}
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
  scrollInner: { padding: 16, paddingBottom: 110, gap: 8 },

  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: 8,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  listHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.ink },
  editLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.maroon },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  listRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  listRowLabel: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '500', color: COLORS.slate600 },
  listRowValue: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  manageRowText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },

  verifiedNote: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 10, marginBottom: 8 },

  footerRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backOutlineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOutlineText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },

  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30,27,24,0.55)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.ink },
  modalFormGroup: { marginBottom: 14, gap: 6 },
  modalLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.ink },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  datePickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
});
