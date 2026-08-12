import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B1212',
  primaryLight: '#FEF2F2',
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

export default function MpcsSalesDepositScreen({
  reportingMonth = "",
  sales = "",
  setSales,
  deposit = "",
  setDeposit,
  totalMembers = "",
  setTotalMembers,
  remarks = "",
  setRemarks,
  onSaveNext,
  onBack
}) {
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Monthly Sales / Deposit</Text>
        </View>
        <Text style={styles.stepIndicator}>2 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Month & Year</Text>
            <Text style={styles.monthTitleText}>{reportingMonth}</Text>
          </View>
          <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
        </View>

        {/* Input Form Card */}
        <View style={styles.formCard}>
          {/* Field 1: Total Sales */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Sales (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={sales}
                onChangeText={setSales}
                placeholder="1,25,000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Field 2: Total Deposit */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Deposit (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={deposit}
                onChangeText={setDeposit}
                placeholder="98,500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Field 3: Total Members */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Members</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="groups" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                value={totalMembers}
                onChangeText={setTotalMembers}
                placeholder="245"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Field 4: Remarks */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Remarks (Optional)</Text>
            <View style={[styles.inputBox, { height: 70, alignItems: 'flex-start', paddingTop: 8 }]}>
              <TextInput
                style={[styles.textInput, { height: '100%' }]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter remarks..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onSaveNext} activeOpacity={0.85}>
          <Text style={styles.buttonTextPrimary}>SAVE & NEXT</Text>
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
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backBtn: { padding: 4 },
  moduleTag: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  stepIndicator: { color: 'rgba(255,255,255,0.85)', fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14 },
  monthCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  monthTitleText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    gap: 12,
  },
  inputGroup: { gap: 4 },
  inputLabel: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  currencyPrefix: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600', color: COLORS.primary, marginRight: 8 },
  textInput: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '400', color: COLORS.textPrimary, outlineStyle: 'none' },
  bottomBar: { flexDirection: 'row', padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  navBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  buttonTextSecondary: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  navNextBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  buttonTextPrimary: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
});
