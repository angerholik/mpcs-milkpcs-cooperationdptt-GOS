import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
};

const FONT_FAMILY = 'Manrope';

export default function OperationsScreen({
  societyName = "",
  reportingMonth = "",
  onSave,
  onSaveNext,
  onNext,
  onBack
}) {
  const [litres, setLitres] = useState("");
  const [withdrawal, setWithdrawal] = useState("");
  const [balance, setBalance] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'operations');
      if (data) {
        setLitres(data.litres || "");
        setWithdrawal(data.withdrawal || "");
        setBalance(data.balance || "");
      }
    })();
  }, [societyName, reportingMonth]);

  const handleSave = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'operations', { litres, withdrawal, balance });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onSave) onSave();
  };

  const handleSaveAndNext = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'operations', { litres, withdrawal, balance });
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const parseNum = (val) => {
    if (!val) return 0;
    const clean = val.toString().replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (val) => {
    if (!val) return "";
    const clean = val.toString().replace(/,/g, '');
    if (isNaN(clean) || clean === "") return clean;
    return parseFloat(clean).toLocaleString('en-IN');
  };

  const handleWithdrawalChange = (text) => {
    setWithdrawal(formatCurrency(text));
  };

  const handleBalanceChange = (text) => {
    setBalance(formatCurrency(text));
  };

  const handleLitresChange = (text) => {
    setLitres(formatCurrency(text));
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
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Monthly Collection & Deposit</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Reporting Month Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="calendar-month-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Reporting Period</Text>
              <Text style={styles.cardHeaderSub}>Select the month for this return</Text>
            </View>
          </View>
          <View style={styles.inputBox}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={16} color={COLORS.slate400} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={reportingMonth}
              editable={false}
              placeholder="e.g. August 2026"
              placeholderTextColor={COLORS.slate400}
            />
          </View>
        </View>

        {/* Operations Data Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="chart-bar" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Collections & Withdrawals</Text>
              <Text style={styles.cardHeaderSub}>Monthly operational figures</Text>
            </View>
          </View>

          {/* Litres Collected */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TOTAL LITRES COLLECTED</Text>
            <View style={styles.inputBox}>
              <MaterialCommunityIcons name="water-outline" size={16} color={COLORS.slate400} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={litres}
                onChangeText={handleLitresChange}
                placeholder="0"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>L</Text>
            </View>
          </View>

          {/* Total Withdrawal */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TOTAL WITHDRAWAL (RS)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={withdrawal}
                onChangeText={handleWithdrawalChange}
                placeholder="0"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Closing Balance */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CLOSING BALANCE (RS)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={balance}
                onChangeText={handleBalanceChange}
                placeholder="0"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Navigation Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>

        <Pressable
          style={({ pressed }) => [styles.navNextBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={handleSaveAndNext}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topBarTitleContainer: { flex: 1 },
  moduleTag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
    fontFamily: FONT_FAMILY,
  },
  screenTitleHeader: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTitle: { fontSize: 15, fontWeight: '800', color: COLORS.slate800, fontFamily: FONT_FAMILY },
  cardHeaderSub: { fontSize: 12, color: COLORS.slate500, marginTop: 2, fontFamily: FONT_FAMILY },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate500,
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: FONT_FAMILY,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  currencySymbol: {
    fontSize: 16,
    color: COLORS.slate400,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: FONT_FAMILY,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate800,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.slate400,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },

  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    gap: 12,
  },
  navBackBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSaveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate300,
    backgroundColor: COLORS.slate50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navSaveBtnSuccess: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  navNextBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextSecondary: {
    color: COLORS.slate700,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  buttonTextSave: {
    color: COLORS.slate700,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
});
