import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../../utils/monthlySyncManager';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import MpcsWizardHeader from './MpcsWizardHeader';
import { webCapWidth } from '../../utils/webStyles';

const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  border: '#E7E2DA',
  calcBg: '#EDE8E0',
};

const FONT_FAMILY = 'Manrope';

function formatWhole(val) {
  const n = parseFloat((val || '').toString().replace(/,/g, ''));
  if (!n) return '0';
  return Math.round(n).toLocaleString('en-IN');
}

// Monthly: whether this month's loan recovery has been reported. The loan's
// existence, type, sanction date, and amount extended are Master Data (set
// once on the Loan Details screen) — this screen only tracks the recurring
// repayment status against that master record. Data entry here doesn't wait
// on Master data being filled in first: a CI can log what was recovered in
// the field, then set the loan record up back at the office, so every
// field below degrades gracefully (a "Set it" link, a placeholder message)
// instead of blocking on masterHasLoan the way the old three-state screen did.
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
  onOpenLoanSetup,
  activeTab,
  onTabPress,
}) {
  const [loanRecovered, setLoanRecovered] = useState('');

  const loanConfigured = masterHasLoan && Boolean(masterLoanExtended);

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
    const isCompleted = masterLoanCleared || !!loanRecovered;
    await saveMilkSectionData(societyName, reportingMonth, 'mpcs_loan', {
      loanRecovered,
      loanOutstanding,
      isCompleted
    });
    if (onSaveNext) onSaveNext();
  };

  const toggleCleared = () => {
    if (masterLoanCleared) return;
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

  const recordStatusText = masterLoanCleared
    ? 'Cleared'
    : loanConfigured
      ? `${masterLoanType || 'Loan'} · ₹${formatWhole(masterLoanExtended)} extended`
      : 'Not set in Master data';

  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Loan Status"
        step={5}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.recordRow}>
          <View>
            <Text style={styles.recordLabel}>Loan on record</Text>
            <Text style={styles.recordValue}>{recordStatusText}</Text>
          </View>
          {!loanConfigured && !masterLoanCleared && onOpenLoanSetup && (
            <Pressable onPress={onOpenLoanSetup} hitSlop={8}>
              <Text style={styles.setItLink}>Set it</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Recovered to date</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              value={loanRecovered}
              onChangeText={setLoanRecovered}
              placeholder="0"
              placeholderTextColor={COLORS.slate500}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helperText}>Total recovered since the loan was extended.</Text>
        </View>

        <View style={styles.calcCard}>
          <Text style={styles.calcLabel}>CALCULATED FOR YOU</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcRowLabel}>Outstanding balance</Text>
            {loanConfigured ? (
              <Text style={styles.calcRowValue}>₹{formatWhole(loanOutstanding)}</Text>
            ) : (
              <Text style={styles.calcRowPlaceholder}>Needs the loan amount</Text>
            )}
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <View>
              <Text style={styles.calcRowLabel}>Amount extended</Text>
              <Text style={styles.calcRowSub}>From Master data</Text>
            </View>
            <Text style={styles.calcRowValue}>{masterLoanExtended ? `₹${formatWhole(masterLoanExtended)}` : '—'}</Text>
          </View>
        </View>

        <Pressable style={styles.checkRow} onPress={toggleCleared}>
          <View style={[styles.checkbox, masterLoanCleared && styles.checkboxChecked]}>
            {masterLoanCleared && <MaterialCommunityIcons name="check" size={14} color="#ffffff" />}
          </View>
          <Text style={styles.checkRowLabel}>Loan fully cleared</Text>
          <Text style={styles.checkRowSub}>Closes the ledger</Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <Pressable style={styles.backOutlineBtn} onPress={onBack}>
            <Text style={styles.backOutlineText}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={handleSaveNext}
          >
            <Text style={styles.primaryBtnText}>Save and continue</Text>
          </Pressable>
        </View>

        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.draftLink}>Save as draft</Text>
        </Pressable>
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  recordLabel: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500 },
  recordValue: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: COLORS.ink, marginTop: 2 },
  setItLink: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.maroon },

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
    height: 52,
  },
  currencyPrefix: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700', color: COLORS.maroon, marginRight: 8 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  helperText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500 },

  calcCard: { backgroundColor: COLORS.calcBg, borderRadius: 14, padding: 14, gap: 12 },
  calcLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 1 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calcDivider: { height: 1, backgroundColor: COLORS.border },
  calcRowLabel: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  calcRowSub: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.slate500 },
  calcRowValue: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: COLORS.ink },
  calcRowPlaceholder: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.slate500 },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.maroon, borderColor: COLORS.maroon },
  checkRowLabel: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.ink },
  checkRowSub: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate500 },

  divider: { height: 1, backgroundColor: COLORS.border },

  footerRow: { flexDirection: 'row', gap: 10 },
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
  primaryBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.maroon, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },
  draftLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate500, textAlign: 'center' },
});
