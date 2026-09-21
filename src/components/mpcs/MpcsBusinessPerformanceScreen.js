import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import MpcsWizardHeader from './MpcsWizardHeader';
import { webCapWidth } from '../../utils/webStyles';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "2 · Monthly return", screen "Business Performance" (parameter
// 4 of 5) — includes the reference's inline sanity-check warning when
// gross income looks implausible against the registered member count.
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  border: '#E7E2DA',
  calcBg: '#EDE8E0',
  warnBorder: '#7B1420',
  warnBg: '#FBEEEF',
};

const FONT_FAMILY = 'Manrope';

function formatWhole(n) {
  if (!n) return '0';
  return Math.round(n).toLocaleString('en-IN');
}

// A cooperative society's monthly gross income averaging more than
// ₹10,00,000 per active member is almost always a data-entry error (an
// extra digit or two typed), not a real figure — flag it for a second
// look rather than silently accepting it.
const PLAUSIBLE_INCOME_PER_MEMBER = 1000000;

export default function MpcsBusinessPerformanceScreen({
  reportingMonth = "",
  totalIncome = "",
  setTotalIncome,
  totalExpenses = "",
  setTotalExpenses,
  totalMembers = "",
  onSaveNext,
  onBack,
  activeTab,
  onTabPress,
}) {
  // totalMembers arrives as a real number (a demographics sum from App.js),
  // not a string like totalIncome/totalExpenses — (str || '').replace(...)
  // called .replace on that number directly whenever it was non-zero and
  // crashed with no error boundary above it, which unmounts the whole app.
  const parseNum = (str) => parseFloat(String(str ?? '').replace(/,/g, '')) || 0;
  const incomeVal = parseNum(totalIncome);
  const expenseVal = parseNum(totalExpenses);
  const memberVal = parseNum(totalMembers);
  const diff = incomeVal - expenseVal;
  const bothFilled = Boolean(totalIncome) && Boolean(totalExpenses);

  const showIncomeWarning = incomeVal > 0 && memberVal > 0 && (incomeVal / memberVal) > PLAUSIBLE_INCOME_PER_MEMBER;
  const crore = (incomeVal / 10000000);
  const croreLabel = crore >= 1 ? `₹${crore % 1 === 0 ? crore : crore.toFixed(1)} crore` : `₹${formatWhole(incomeVal)}`;

  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Business Performance"
        step={4}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Gross income</Text>
          <View style={[styles.inputBox, showIncomeWarning && styles.inputBoxWarn]}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              value={totalIncome}
              onChangeText={setTotalIncome}
              placeholder="0"
              placeholderTextColor={COLORS.slate500}
              keyboardType="numeric"
            />
          </View>
          {showIncomeWarning && (
            <View style={styles.warningRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.maroon} />
              <Text style={styles.warningText}>
                That is {croreLabel} against {formatWhole(memberVal)} active members. Check the figure before continuing.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Total expenses</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              value={totalExpenses}
              onChangeText={setTotalExpenses}
              placeholder="0"
              placeholderTextColor={COLORS.slate500}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.calcCard}>
          <Text style={styles.calcLabel}>CALCULATED FOR YOU</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcRowLabel}>Net surplus / deficit</Text>
            {bothFilled ? (
              <Text style={styles.calcRowValue}>
                {diff < 0 ? '−' : ''}₹{formatWhole(Math.abs(diff))}
              </Text>
            ) : (
              <Text style={styles.calcRowPlaceholder}>Fill both fields above</Text>
            )}
          </View>
          <View style={styles.calcRow}>
            <View>
              <Text style={styles.calcRowLabel}>Active members</Text>
              <Text style={styles.calcRowSub}>From Registered Demographics</Text>
            </View>
            <Text style={styles.calcRowValue}>{totalMembers || 0}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Pressable style={styles.backOutlineBtn} onPress={onBack}>
            <Text style={styles.backOutlineText}>Back</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={onSaveNext}
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

  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
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
  inputBoxWarn: {
    borderColor: COLORS.warnBorder,
    borderWidth: 1.5,
  },
  currencyPrefix: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.maroon,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  warningText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.maroon,
    lineHeight: 17,
  },

  calcCard: {
    backgroundColor: COLORS.calcBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  calcLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcRowLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  calcRowSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  calcRowValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  calcRowPlaceholder: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate500,
  },

  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backOutlineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOutlineText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  primaryBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.maroon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  draftLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate500,
    textAlign: 'center',
  },
});
