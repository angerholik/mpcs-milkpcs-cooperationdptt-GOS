import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B1212',
  primaryLight: '#FAF0F0',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function OperationsScreen({
  reportingMonth = "",
  setReportingMonth,
  litres = "",
  setLitres,
  withdrawal = "",
  setWithdrawal,
  balance = "",
  setBalance,
  onNext,
  onBack
}) {
  return (
    <View style={styles.container}>
      {/* Top Bar Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitleHeader}>Monthly Operations</Text>
        <Text style={styles.stepIndicator}>2 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Reporting Month Card */}
        <View style={styles.monthCard}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fieldLabel}>REPORTING MONTH</Text>
            <TextInput
              style={styles.monthInputText}
              value={reportingMonth}
              onChangeText={setReportingMonth}
              placeholder="e.g. August 2026"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Unified Operations Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <MaterialIcons name="analytics" size={18} color={COLORS.primary} />
            <Text style={styles.formHeaderTitle}>Monthly Figures & Procurement</Text>
          </View>

          {/* Input 1: Litres Collected */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>LITRES COLLECTED (LITRES)</Text>
            <View style={styles.inputBox}>
              <View style={styles.leftIconBox}>
                <MaterialIcons name="opacity" size={18} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.textInput}
                value={litres}
                onChangeText={setLitres}
                placeholder="Enter total litres procured (e.g. 12,480)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>Litres</Text>
            </View>
          </View>

          {/* Input 2: Total Withdrawal */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>TOTAL WITHDRAWAL (RS)</Text>
            <View style={styles.inputBox}>
              <View style={styles.leftIconBox}>
                <Text style={styles.currencySymbol}>₹</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={withdrawal}
                onChangeText={setWithdrawal}
                placeholder="Enter total disbursement (e.g. 1,84,500)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Input 3: Bank Closing Balance */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>BANK CLOSING BALANCE (RS)</Text>
            <View style={styles.inputBox}>
              <View style={styles.leftIconBox}>
                <MaterialIcons name="account-balance" size={18} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.textInput}
                value={balance}
                onChangeText={setBalance}
                placeholder="Enter closing bank balance (e.g. 4,82,650)"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Helper Directive Banner */}
        <View style={styles.directiveBanner}>
          <MaterialIcons name="info-outline" size={18} color={COLORS.primary} />
          <Text style={styles.directiveText}>
            Ensure all figures match the official society ledger records for {reportingMonth || 'this month'}.
          </Text>
        </View>
      </ScrollView>

      {/* Nav Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.buttonTextPrimary}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
  },
  backBtn: { padding: 4 },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '600',
  },
  stepIndicator: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '400',
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16 },

  monthCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 16,
    elevation: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  monthInputText: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 2,
    outlineStyle: 'none',
  },

  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    gap: 16,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inputGroup: {
    gap: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  leftIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  currencySymbol: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.textPrimary,
    outlineStyle: 'none',
  },
  unitText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },

  directiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  directiveText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '400',
    lineHeight: 18,
  },

  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
  },
  navNextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '600',
  },
});
