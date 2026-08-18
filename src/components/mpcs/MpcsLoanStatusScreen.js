import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../../utils/monthlySyncManager';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  amber100: '#fef3c7',
  amber900: '#78350f',
  emerald700: '#047857',
  emerald50: '#ecfdf5',
};

const FONT_FAMILY = 'Manrope';

// Monthly: whether this month's loan recovery has been reported. The loan's
// existence, type, sanction date, and amount extended are Master Data (set
// once on the Loan Details screen) — this screen only tracks the recurring
// repayment status against that master record, the same split already used
// for Milk PCS's loan tracking (see ComplianceScreen.js).
export default function MpcsLoanStatusScreen({
  societyName = "",
  reportingMonth = "",
  masterHasLoan = false,
  masterLoanCleared = false,
  masterLoanType = "",
  masterLoanExtended = "",
  onLoanCleared,
  onSave,
  onSaveNext,
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastVerified, setLastVerified] = useState('Not verified');

  const [loanRecovered, setLoanRecovered] = useState('');
  const [tempLoanRecovered, setTempLoanRecovered] = useState('');

  const loanIsActive = masterHasLoan && !masterLoanCleared;

  // Outstanding is derived, never entered directly — always
  // (amount extended at loan setup) - (recovered to date).
  const computeOutstanding = (recoveredValue) => {
    const extended = parseFloat(masterLoanExtended) || 0;
    const recovered = parseFloat(recoveredValue) || 0;
    return Math.max(extended - recovered, 0).toString();
  };

  const loanOutstanding = computeOutstanding(loanRecovered);

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'mpcs_loan');
      if (data) {
        setLoanRecovered(data.loanRecovered || '');
        if (data.loanRecovered) {
          setLastVerified(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        }
      }
    })();
  }, [societyName, reportingMonth]);

  const openModal = () => {
    setTempLoanRecovered(loanRecovered);
    setModalVisible(true);
  };

  const saveToLocal = async (newData) => {
    const isCompleted = !loanIsActive || !!newData.loanRecovered;
    await saveMilkSectionData(societyName, reportingMonth, 'mpcs_loan', { ...newData, isCompleted });
    return isCompleted;
  };

  const handleSaveModal = async () => {
    setLoanRecovered(tempLoanRecovered);
    setLastVerified(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setModalVisible(false);
    await saveToLocal({ loanRecovered: tempLoanRecovered, loanOutstanding: computeOutstanding(tempLoanRecovered) });
    if (onSave) onSave();
  };

  const handleSaveAndNext = async () => {
    await saveToLocal({ loanRecovered, loanOutstanding });
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const confirmMarkCleared = () => {
    const doClear = () => {
      if (onLoanCleared) onLoanCleared();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Mark this loan as fully cleared? It will no longer appear as an active loan.')) doClear();
    } else {
      Alert.alert('Mark Loan Cleared', 'Mark this loan as fully cleared? It will no longer appear as an active loan.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: doClear }
      ]);
    }
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
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (onBack) onBack(); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS MONTHLY DATA</Text>
          <Text style={styles.screenTitleHeader}>Loan Status</Text>
        </View>
      </View>

      {/* Sticky Action Banner */}
      {loanIsActive && (
        <View style={styles.stickyActionBanner}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.btnWrapper, { flex: 1 }]}>
              <Pressable
                style={({ hovered, pressed }) => [
                  styles.editCtaBtn,
                  pressed && { transform: [{ scale: 0.98 }] },
                  hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                ]}
                onPress={openModal}
              >
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <MaterialCommunityIcons name="pencil-outline" size={16} color="#ffffff" />
                <Text style={styles.editCtaText}>Update Recovery</Text>
              </Pressable>
            </View>

            {onNext && (
              <View style={[styles.btnWrapper, { flex: 1 }]}>
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.editCtaBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={handleSaveAndNext}
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
            )}
          </View>
        </View>
      )}

      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        <View style={styles.alertCard}>
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="bank-outline" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Loan Repayment Status</Text>
            <Text style={styles.alertText}>Last verified: {lastVerified}</Text>
          </View>
        </View>

        {!masterHasLoan ? (
          <View style={styles.card}>
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="bank-off-outline" size={32} color={COLORS.slate400} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 }}>
                No Active Loan
              </Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This society has no loan on record. Set one up on the Loan Details Master Data screen if that changes.
              </Text>
            </View>
          </View>
        ) : masterLoanCleared ? (
          <View style={styles.card}>
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="check-decagram-outline" size={32} color={COLORS.emerald700} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.emerald700 }}>
                Loan Cleared
              </Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This loan has been marked fully cleared. Nothing to report this month.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="cash-refund" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.cardHeaderTitle}>Recovery This Month</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LOAN TYPE</Text>
                <Text style={styles.infoValue}>{masterLoanType || "-"}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>AMOUNT EXTENDED (₹)</Text>
                <Text style={styles.infoValue}>{masterLoanExtended || "-"}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>RECOVERED TO DATE (₹)</Text>
                <Text style={styles.infoValue}>{loanRecovered || "-"}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>OUTSTANDING (₹)</Text>
                <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '800' }]}>{loanOutstanding}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearLoanBtn} onPress={confirmMarkCleared} activeOpacity={0.7}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.emerald700} />
              <Text style={styles.clearLoanText}>Mark Loan as Cleared</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update Loan Recovery</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Recovered to Date (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={tempLoanRecovered}
                  onChangeText={setTempLoanRecovered}
                  placeholder="0"
                  placeholderTextColor={COLORS.slate400}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Outstanding Balance (auto-calculated)</Text>
                <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '800', paddingVertical: 8 }]}>
                  ₹ {computeOutstanding(tempLoanRecovered)}
                </Text>
              </View>

              <View style={[styles.btnWrapper, { marginTop: 16, marginBottom: 20 }]}>
                <Pressable
                  style={({ hovered, pressed }) => [
                    styles.saveModalBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={handleSaveModal}
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
  backBtn: { padding: 8, marginRight: 8 },
  topBarTitleContainer: { flex: 1 },
  stickyActionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  bgBlobTop: {
    position: 'absolute', top: -40, right: -40, width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(122, 26, 31, 0.08)', zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute', bottom: 80, left: -50, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(180, 83, 9, 0.06)', zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute', top: '40%', right: -60, width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(122, 26, 31, 0.05)', zIndex: -1,
  },
  moduleTag: {
    color: 'rgba(255,255,255,0.7)', fontFamily: FONT_FAMILY, fontSize: 8, fontWeight: '800',
    letterSpacing: 1.2, marginBottom: 2,
  },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', letterSpacing: -0.16 },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 12, gap: 12, paddingBottom: 40 },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.8)', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.5)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    marginBottom: 12,
  },
  alertIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.amber100, alignItems: 'center', justifyContent: 'center' },
  alertBody: { flex: 1, paddingRight: 8 },
  alertTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.amber900, marginBottom: 2 },
  alertText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: 'rgba(146, 64, 14, 0.9)' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.slate50, borderWidth: 1,
    borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.slate800, letterSpacing: -0.14 },
  divider: { height: 1, backgroundColor: COLORS.slate100, marginVertical: 12 },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontFamily: FONT_FAMILY, fontSize: 8, fontWeight: '800', color: COLORS.slate400, letterSpacing: 1.2, marginBottom: 2 },
  infoValue: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.slate800 },
  btnWrapper: {
    borderRadius: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  editCtaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  editCtaText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  clearLoanBtn: {
    marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: COLORS.emerald50,
  },
  clearLoanText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.emerald700 },

  inAppModalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end', zIndex: 9999,
  },
  modalCard: {
    width: '100%', backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '85%',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 25,
  },
  modalHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100, marginBottom: 16,
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.slate800, letterSpacing: -0.16 },
  closeBtnCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.slate50, borderWidth: 1,
    borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  modalFormScroll: { maxHeight: 500 },
  modalFormGroup: { marginBottom: 12, gap: 6 },
  modalLabel: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '800', color: COLORS.slate500, letterSpacing: 1.2, marginBottom: 2 },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, height: 42,
    fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate800,
    backgroundColor: COLORS.slate50, ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  saveModalBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  saveModalText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
