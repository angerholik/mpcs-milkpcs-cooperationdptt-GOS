import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAutosave } from '../../hooks/useAutosave';

const COLORS = {
  surface: '#ffffff',
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
  amber900: '#78350f',
  amber100: '#fef3c7',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
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
  lastVerified = "Not verified",
  initialHasLoan = false,
  initialLoanType = "",
  initialSanctionDate = "",
  initialBeneficiaries = "",
  initialLoanExtended = "",
  initialLoanCleared = false,
  onSaveLoan,
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);

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
      {/* Top Header */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={styles.backBtn} onPress={() => { handleSave(); if (onBack) onBack(); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS MASTER DATA</Text>
          <Text style={styles.screenTitleHeader}>Loan Details</Text>
        </View>
      </View>

      {/* Sticky Action Banner at Top — only the contextual edit action.
          "Save & Next" is the wizard's forward-navigation action, so it
          lives in a bottom footer after the reviewable content instead. */}
      <View style={styles.stickyActionBanner}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={styles.btnWrapper}>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={['#7a1a1f', '#4a1017']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#ffffff" />
              <Text style={styles.editCtaText}>Edit Loan Details</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Profile Status Banner */}
        <View style={styles.alertCard}>
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="bank-outline" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Loan Record</Text>
            <Text style={styles.alertText}>Last verified: {lastVerified}</Text>
          </View>
        </View>

        {/* Active / Inactive Selector — settable up front, without opening Edit */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: hasLoan ? COLORS.emerald700 : COLORS.slate200,
              backgroundColor: hasLoan ? COLORS.emerald50 : COLORS.surface
            }}
            onPress={() => { setHasLoan(true); handleSave({ hasLoan: true }); }}
          >
            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: hasLoan ? COLORS.emerald700 : COLORS.slate500 }}>
              ✓ ACTIVE LOAN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: !hasLoan ? COLORS.amber900 : COLORS.slate200,
              backgroundColor: !hasLoan ? COLORS.amber100 : COLORS.surface
            }}
            onPress={() => { setHasLoan(false); handleSave({ hasLoan: false }); }}
          >
            <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: !hasLoan ? COLORS.amber900 : COLORS.slate500 }}>
              ⚠ NO ACTIVE LOAN
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.card, !hasLoan && { opacity: 0.75 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="bank" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Loan Setup</Text>
            <View style={{
              marginLeft: 'auto',
              backgroundColor: hasLoan ? (loanCleared ? COLORS.slate100 : COLORS.emerald50) : COLORS.slate100,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: hasLoan ? (loanCleared ? COLORS.slate200 : 'rgba(16,185,129,0.3)') : COLORS.slate200
            }}>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: hasLoan ? (loanCleared ? COLORS.slate500 : COLORS.emerald700) : COLORS.slate500 }}>
                {hasLoan ? (loanCleared ? '✓ CLEARED' : '✓ ACTIVE') : '⚠ NONE'}
              </Text>
            </View>
          </View>

          {hasLoan ? (
            <>
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>LOAN TYPE</Text>
                  <Text style={styles.infoValue}>{loanType || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>SANCTION DATE</Text>
                  <Text style={styles.infoValue}>{sanctionDate || "-"}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>NO. OF BENEFICIARIES</Text>
                  <Text style={styles.infoValue}>{beneficiaries || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>AMOUNT EXTENDED (₹)</Text>
                  <Text style={styles.infoValue}>{loanExtended || "-"}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="bank-off-outline" size={32} color={COLORS.slate400} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 }}>
                No Active Loan
              </Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This society has no loan currently on record. Fields are non-mandatory.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Bottom Footer: wizard forward-navigation action */}
      {onNext && (
        <View style={styles.bottomFooter}>
          <View style={styles.btnWrapper}>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={() => { handleSave(); onNext(); }}
            >
              <LinearGradient
                colors={['#047857', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.editCtaText}>Save & Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Loan Details</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>

              {/* Active / No Loan Selector */}
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Loan Status for this Society</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: hasLoan ? COLORS.emerald700 : COLORS.slate200,
                      backgroundColor: hasLoan ? COLORS.emerald50 : COLORS.slate50
                    }}
                    onPress={() => setHasLoan(true)}
                  >
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: hasLoan ? COLORS.emerald700 : COLORS.slate500 }}>
                      ✓ ACTIVE LOAN
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: !hasLoan ? COLORS.amber900 : COLORS.slate200,
                      backgroundColor: !hasLoan ? COLORS.amber100 : COLORS.slate50
                    }}
                    onPress={() => setHasLoan(false)}
                  >
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: !hasLoan ? COLORS.amber900 : COLORS.slate500 }}>
                      ⚠ NO LOAN
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Loan Type</Text>
                <TextInput style={styles.modalInput} value={loanType} onChangeText={setLoanType} placeholder="e.g. Cash Credit Limit" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Sanction Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="date"
                      value={formatToIsoDate(sanctionDate)}
                      onChange={(e) => setSanctionDate(formatFromIsoDate(e.target.value))}
                      style={{
                        width: '100%', height: '100%', border: 'none', outline: 'none',
                        background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px',
                        color: '#1e293b', fontWeight: '500', cursor: 'pointer',
                      }}
                    />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={sanctionDate} onChangeText={setSanctionDate} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>No. of Beneficiaries</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={beneficiaries} onChangeText={setBeneficiaries} placeholder="0" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Amount Extended (₹)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={loanExtended} onChangeText={setLoanExtended} placeholder="0" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={[styles.btnWrapper, { marginTop: 16, marginBottom: 20 }]}>
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.saveModalBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={() => handleSave()}
                >
                  <LinearGradient
                    colors={['#7a1a1f', '#4a1017']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.saveModalText}>Save Changes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50, position: 'relative' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    overflow: 'hidden',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  topBarTitleContainer: {
    flex: 1,
  },
  stickyActionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  bottomFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    zIndex: 10,
  },
  bgBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(122, 26, 31, 0.08)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(180, 83, 9, 0.06)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    top: '40%',
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(122, 26, 31, 0.05)',
    zIndex: -1,
  },
  moduleTag: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.16,
  },
  scrollContent: { flex: 1 },
  scrollInner: {
    padding: 12,
    gap: 12,
    paddingBottom: 40,
  },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.8)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.5)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 12,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    paddingRight: 8,
  },
  alertTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.amber900,
    marginBottom: 2,
  },
  alertText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(146, 64, 14, 0.9)',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
    letterSpacing: -0.14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.slate100,
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12
  },
  infoCol: {
    flex: 1
  },
  infoLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate800,
  },
  btnWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  editCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editCtaText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // In-App Slide-Up Sheet
  inAppModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 25,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.16,
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: {
    maxHeight: 500
  },
  modalFormGroup: {
    marginBottom: 12,
    gap: 6
  },
  modalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  datePickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: COLORS.slate50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveModalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveModalText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
