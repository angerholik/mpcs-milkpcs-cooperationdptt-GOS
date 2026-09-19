import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable } from 'react-native';
import BottomNav from '../BottomNav';
import MpcsWizardHeader from './MpcsWizardHeader';
import { webCapWidth } from '../../utils/webStyles';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "2 · Monthly return", screen 5a "Sales & deposit" — "No false
// zero; rupees stated once", hence formatWhole below instead of the old
// forced ₹0.00 two-decimal display.
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
  return n.toLocaleString('en-IN');
}

export default function MpcsSalesDepositScreen({
  reportingMonth = "",
  sales = "",
  setSales,
  deposit = "",
  setDeposit,
  totalMembers = "",
  onSaveNext,
  onBack,
  activeTab,
  onTabPress,
}) {
  const bothFilled = Boolean(sales) && Boolean(deposit);

  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Sales & Deposit"
        step={3}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Total sales</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              value={sales}
              onChangeText={setSales}
              placeholder="0"
              placeholderTextColor={COLORS.slate500}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helperText}>Whole rupees. For example 1,25,000.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Total bank deposit</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              value={deposit}
              onChangeText={setDeposit}
              placeholder="0"
              placeholderTextColor={COLORS.slate500}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.helperText}>Amount actually deposited this month.</Text>
        </View>

        <View style={styles.calcCard}>
          <Text style={styles.calcLabel}>CALCULATED FOR YOU</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcRowLabel}>Monthly turnover</Text>
            {bothFilled ? (
              <Text style={styles.calcRowValue}>₹{formatWhole(sales)}</Text>
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
  helperText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
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
