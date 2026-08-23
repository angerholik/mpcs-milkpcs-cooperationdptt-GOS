import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../../utils/monthlySyncManager';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';

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
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  amber50: '#fffbeb',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

function formatCurrency(val) {
  const n = parseFloat((val || '').toString().replace(/,/g, ''));
  if (isNaN(n)) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// Monthly: whether this month's loan recovery has been reported. The loan's
// existence, type, sanction date, and amount extended are Master Data (set
// once on the Loan Details screen) — this screen only tracks the recurring
// repayment status against that master record, the same split already used
// for Milk PCS's loan tracking (see ComplianceScreen.js). Follows the same
// visual theme as the other Monthly Data screens (Sales & Deposit etc.)
// rather than the Master Data edit-modal pattern.
export default function MpcsLoanStatusScreen({
  societyName = "",
  reportingMonth = "",
  masterHasLoan = false,
  masterLoanCleared = false,
  masterLoanType = "",
  masterLoanExtended = "",
  onLoanCleared,
  onSaveNext,
  onBack,
  activeTab,
  onTabPress
}) {
  const [loanRecovered, setLoanRecovered] = useState('');

  const loanIsActive = masterHasLoan && !masterLoanCleared;

  // Outstanding is derived, never entered directly: always
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
      if (data) setLoanRecovered(data.loanRecovered || '');
    })();
  }, [societyName, reportingMonth]);

  const handleSaveNext = async () => {
    const isCompleted = !loanIsActive || !!loanRecovered;
    await saveMilkSectionData(societyName, reportingMonth, 'mpcs_loan', {
      loanRecovered,
      loanOutstanding,
      isCompleted
    });
    if (onSaveNext) onSaveNext();
  };

  const confirmMarkCleared = () => {
    const doClear = () => { if (onLoanCleared) onLoanCleared(); };
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
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Monthly Loan Status</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <LinearGradient
            colors={['rgba(122,26,31,0.06)', 'rgba(122,26,31,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.monthIconBox}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.monthLabel}>Reporting Period</Text>
            <Text style={styles.monthValue}>{reportingMonth || 'Current Month'}</Text>
          </View>
          <View style={styles.draftChip}>
            <Text style={styles.draftChipText}>DRAFT</Text>
          </View>
        </View>

        {!masterHasLoan ? (
          <View style={styles.card}>
            <View style={{ alignItems: 'center', paddingVertical: 10, gap: 4 }}>
              <MaterialCommunityIcons name="bank-off-outline" size={32} color={COLORS.slate400} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 }}>No Active Loan</Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This society has no loan on record. Set one up on the Loan Details Master Data screen if that changes.
              </Text>
            </View>
          </View>
        ) : masterLoanCleared ? (
          <View style={styles.card}>
            <View style={{ alignItems: 'center', paddingVertical: 10, gap: 4 }}>
              <MaterialCommunityIcons name="check-decagram-outline" size={32} color={COLORS.emerald700} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.emerald700 }}>Loan Cleared</Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This loan has been marked fully cleared. Nothing to report this month.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <MaterialCommunityIcons name="cash-refund" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardHeaderTitle}>Loan Recovery Ledger</Text>
                <Text style={styles.cardHeaderSub}>{masterLoanType || 'Loan type not set'} — ₹{masterLoanExtended || 0} extended</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recovered to Date (₹)</Text>
              <View style={styles.inputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  value={loanRecovered}
                  onChangeText={setLoanRecovered}
                  placeholder="e.g. 25,000"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="numeric"
                />
                <MaterialCommunityIcons name="cash-multiple" size={16} color={COLORS.slate400} />
              </View>
            </View>

            <View style={styles.summaryStrip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>OUTSTANDING BALANCE (AUTO)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(loanOutstanding)}</Text>
              </View>
              <View style={styles.autoBadge}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={14} color={COLORS.emerald700} />
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.clearLoanBtn} onPress={confirmMarkCleared} activeOpacity={0.7}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={COLORS.emerald700} />
              <Text style={styles.clearLoanText}>Mark Loan as Cleared</Text>
            </TouchableOpacity>
          </View>
        )}
      {/* Wizard navigation actions now scroll with the content
          instead of sitting in a fixed footer, which competed with the
          floating BottomNav pill for the same strip at the bottom. */}
        <View style={[{ flexDirection: 'row', flex: 1, gap: 10 }, webCapWidth]}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <Pressable
          style={({ pressed }) => [styles.navNextBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={handleSaveNext}
        >
          <LinearGradient
            colors={['#7a1a1f', '#4a1017']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.buttonTextPrimary}>SAVE & NEXT</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
        </Pressable>
        </View>

      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

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
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    overflow: 'hidden',
  },
  monthIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  draftChip: {
    backgroundColor: COLORS.amber50,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  draftChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.amber900,
    letterSpacing: 0.5,
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

  inputGroup: { gap: 5 },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
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
  currencyPrefix: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emerald50,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.emerald700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  autoBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: 0.5,
  },

  clearLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: COLORS.emerald50,
  },
  clearLoanText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.emerald700 },
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: COLORS.slate500,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
