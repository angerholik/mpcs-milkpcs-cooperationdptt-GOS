import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Pressable, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';

// Same subtle Kanchenjunga treatment used on every header across the app.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

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
  const n = parseFloat((val || '').replace(/,/g, ''));
  if (isNaN(n)) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function MpcsSalesDepositScreen({
  reportingMonth = "",
  sales = "",
  setSales,
  deposit = "",
  setDeposit,
  totalMembers = "",
  remarks = "",
  setRemarks,
  onSaveNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const salesVal = parseFloat((sales || '').replace(/,/g, '')) || 0;
  const depositVal = parseFloat((deposit || '').replace(/,/g, '')) || 0;
  const totalTurnover = salesVal;

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
        <Image
          source={require('../../../assets/core/kanchenjunga.jpg')}
          style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, headerPhotoFilter]}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Monthly Sales / Deposit</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={onNotifyPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF" />
          {unreadCount > 0 && <View style={styles.notifyBadge} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress} activeOpacity={0.8}>
          <Text style={styles.avatarText}>CI</Text>
        </TouchableOpacity>
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

        {/* ── Input Form Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="cash-multiple" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Sales & Deposit Ledger</Text>
              <Text style={styles.cardHeaderSub}>Record monthly collections & active members</Text>
            </View>
          </View>

          {/* Field 1: Total Sales */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Sales (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={sales}
                onChangeText={setSales}
                placeholder="e.g. 1,25,000"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
              <MaterialCommunityIcons name="chart-line-variant" size={16} color={COLORS.slate400} />
            </View>
          </View>

          {/* Field 2: Total Bank Deposit */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Bank Deposit (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                value={deposit}
                onChangeText={setDeposit}
                placeholder="e.g. 98,500"
                placeholderTextColor={COLORS.slate300}
                keyboardType="numeric"
              />
              <MaterialCommunityIcons name="bank-transfer-in" size={16} color={COLORS.slate400} />
            </View>
          </View>

          {/* Monthly Turnover Summary Strip */}
          <View style={styles.summaryStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>MONTHLY TURNOVER (AUTO)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalTurnover.toString())}</Text>
            </View>
            <View style={styles.autoBadge}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={14} color={COLORS.emerald700} />
              <Text style={styles.autoBadgeText}>AUTO</Text>
            </View>
          </View>

          {/* Field 3: Total Members — read-only, sourced from Registered
              Demographics (Master Data). Previously a free-typed number
              here could (and did) drift from the actual demographic
              breakdown; there is exactly one place membership counts are
              entered now. */}
          <View style={styles.summaryStrip}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>TOTAL ACTIVE MEMBERS (FROM DEMOGRAPHICS)</Text>
              <Text style={styles.summaryValue}>{totalMembers || '0'}</Text>
            </View>
            <View style={styles.autoBadge}>
              <MaterialCommunityIcons name="account-group-outline" size={14} color={COLORS.emerald700} />
              <Text style={styles.autoBadgeText}>AUTO</Text>
            </View>
          </View>

          {/* Field 4: Remarks */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operational Remarks (Optional)</Text>
            <View style={[styles.inputBox, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
              <MaterialCommunityIcons name="notebook-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
              <TextInput
                style={[styles.textInput, { height: '100%' }]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Enter remarks regarding sales or deposits..."
                placeholderTextColor={COLORS.slate300}
                multiline
              />
            </View>
          </View>
        </View>
      {/* Wizard navigation actions now scroll with the content
          instead of sitting in a fixed footer, which competed with the
          floating BottomNav pill for the same strip at the bottom. */}
        <View style={[{ flexDirection: 'row', flex: 1, gap: 10 }, webCapWidth]}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <Pressable
          style={({ pressed }) => [styles.navNextBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={onSaveNext}
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

  // Header
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    overflow: 'hidden',
  },
  backBtn: { padding: 4, zIndex: 1 },
  topBarTitleContainer: { flex: 1, marginLeft: 12 },
  notifyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
  },
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
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  // Month Card
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

  // Card
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

  // Inputs
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

  // Summary Strip
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

  // Bottom Bar
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
