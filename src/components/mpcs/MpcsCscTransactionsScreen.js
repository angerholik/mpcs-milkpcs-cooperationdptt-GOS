import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Switch, Platform, Pressable,
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
  slate50:  '#f8fafc',
  primary:  '#7a1a1f',
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50:  '#ecfdf5',
  amber900: '#78350f',
  amber50:  '#fffbeb',
  red50:    '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

const SERVICE_TYPES = [
  'Banking / Aadhaar',
  'Govt. Certificates',
  'Bill Payment',
  'Insurance / Pension',
  'Agricultural / PMKSY',
  'Ration / PDS',
  'Mobile / DTH Recharge',
  'Other Govt. Services',
];

const SERVICE_ICONS = {
  'Banking / Aadhaar': 'bank-outline',
  'Govt. Certificates': 'file-certificate-outline',
  'Bill Payment': 'lightning-bolt-outline',
  'Insurance / Pension': 'shield-check-outline',
  'Agricultural / PMKSY': 'leaf',
  'Ration / PDS': 'cart-outline',
  'Mobile / DTH Recharge': 'cellphone',
  'Other Govt. Services': 'office-building-outline',
};

function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

export default function MpcsCscTransactionsScreen({
  reportingMonth = '',
  cscTransData = {},
  onChangeCscTrans,
  onSaveNext,
  onBack,
}) {
  const isCscActive = cscTransData.isCscActive ?? false;
  const transactions = cscTransData.transactions ?? [];

  // Local form state for the "Add Transaction" form
  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState('');
  const [txCount, setTxCount] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCommission, setTxCommission] = useState('');

  const autoTotal =
    (parseFloat(txAmount) || 0) + (parseFloat(txCommission) || 0);

  const update = (patch) => {
    onChangeCscTrans && onChangeCscTrans({ ...cscTransData, ...patch });
  };

  const handleToggle = (val) => update({ isCscActive: val });

  const handleAddTransaction = () => {
    if (!txDate || !txType || !txCount || !txAmount) return;
    const newTx = {
      id: Date.now().toString(),
      date: txDate,
      type: txType,
      count: txCount,
      amount: txAmount,
      commission: txCommission,
      totalIncome: autoTotal.toFixed(2),
    };
    update({ transactions: [newTx, ...transactions] });
    // Clear form
    setTxDate('');
    setTxType('');
    setTxCount('');
    setTxAmount('');
    setTxCommission('');
  };

  const handleDeleteTransaction = (id) => {
    update({ transactions: transactions.filter((t) => t.id !== id) });
  };

  // Summary totals
  const totalTxCount = transactions.reduce((s, t) => s + (parseInt(t.count) || 0), 0);
  const totalTxAmount = transactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalCommission = transactions.reduce((s, t) => s + (parseFloat(t.commission) || 0), 0);
  const grandTotal = totalTxAmount + totalCommission;

  const canAdd = txDate && txType && txCount && txAmount;

  return (
    <View style={styles.container}>
      {/* ── Premium Header ── */}
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
          <Text style={styles.screenTitleHeader}>CSC Monthly Transactions</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepIndicator}>4 of 5</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month Indicator */}
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

        {/* ── CSC Activity Toggle ── */}
        <View style={[styles.toggleCard, isCscActive && styles.toggleCardActive]}>
          <View style={[styles.toggleIconBox, { backgroundColor: isCscActive ? COLORS.emerald50 : COLORS.slate100 }]}>
            <MaterialCommunityIcons
              name={isCscActive ? 'wifi' : 'wifi-off'}
              size={22}
              color={isCscActive ? COLORS.emerald500 : COLORS.slate400}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.toggleTitle}>CSC Centre Activity</Text>
            <Text style={[styles.toggleSub, { color: isCscActive ? COLORS.emerald700 : COLORS.slate400 }]}>
              {isCscActive
                ? 'Active — transactions carried out this month'
                : 'Inactive / Closed this month'}
            </Text>
          </View>
          <Switch
            value={isCscActive}
            onValueChange={handleToggle}
            trackColor={{ false: COLORS.slate200, true: '#6EE7B7' }}
            thumbColor={isCscActive ? COLORS.emerald500 : COLORS.slate400}
          />
        </View>

        {/* ── INACTIVE STATE ── */}
        {!isCscActive && (
          <View style={styles.inactiveNotice}>
            <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.slate400} />
            <Text style={styles.inactiveText}>
              Toggle the switch to <Text style={{ fontWeight: '800', color: COLORS.slate700 }}>Active</Text> if this MPCS has a CSC centre with transactions this month.
            </Text>
          </View>
        )}

        {/* ── ACTIVE STATE ── */}
        {isCscActive && (
          <>
            {/* Add Transaction Form */}
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Add Transaction Entry</Text>
              </View>

              {/* Row 1: Date + Type */}
              <View style={styles.inputRowHalf}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Transaction Date</Text>
                  <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="calendar-range" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={txDate}
                      onChangeText={setTxDate}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={COLORS.slate300}
                    />
                  </View>
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>No. of Transactions</Text>
                  <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="counter" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={txCount}
                      onChangeText={setTxCount}
                      placeholder="e.g. 48"
                      placeholderTextColor={COLORS.slate300}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Service Type Chips */}
              <View>
                <Text style={styles.inputLabel}>Service / Transaction Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {SERVICE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, txType === type && styles.chipActive]}
                      onPress={() => setTxType(type)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={SERVICE_ICONS[type] || 'tag-outline'}
                        size={13}
                        color={txType === type ? COLORS.primary : COLORS.slate400}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.chipText, txType === type && styles.chipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Free-text fallback */}
                <View style={[styles.inputBox, { marginTop: 6 }]}>
                  <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={txType}
                    onChangeText={setTxType}
                    placeholder="Or type custom service name..."
                    placeholderTextColor={COLORS.slate300}
                  />
                </View>
              </View>

              {/* Row 2: Amount + Commission */}
              <View style={styles.inputRowHalf}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Transaction Amount (₹)</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={txAmount}
                      onChangeText={setTxAmount}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.slate300}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Commission / Charge (₹)</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={txCommission}
                      onChangeText={setTxCommission}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.slate300}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Auto-computed Total Income */}
              <View style={styles.autoTotalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Total Income (Auto)</Text>
                  <Text style={styles.autoTotalValue}>
                    {autoTotal > 0 ? formatCurrency(autoTotal) : '—'}
                  </Text>
                  <Text style={styles.autoTotalHint}>= Amount + Commission</Text>
                </View>
                <View style={styles.autoCalcBadge}>
                  <MaterialCommunityIcons name="calculator-variant-outline" size={14} color={COLORS.emerald700} />
                  <Text style={styles.autoCalcText}>AUTO</Text>
                </View>
              </View>

              {/* Add Button */}
              <View style={styles.btnWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.addBtn,
                    !canAdd && styles.addBtnDisabled,
                    pressed && canAdd && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleAddTransaction}
                  disabled={!canAdd}
                >
                  {canAdd && (
                    <LinearGradient
                      colors={['#7a1a1f', '#4a1017']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={17}
                    color={canAdd ? '#ffffff' : COLORS.slate400}
                  />
                  <Text style={[styles.addBtnText, !canAdd && { color: COLORS.slate400 }]}>
                    ADD TO LEDGER
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* ── Transactions List ── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recorded Transactions</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{transactions.length}</Text>
              </View>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="receipt-text-outline" size={32} color={COLORS.slate300} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Fill in the form above and tap "Add to Ledger" to record each transaction.
                </Text>
              </View>
            ) : (
              <>
                {/* Summary Strip */}
                <View style={styles.summaryStrip}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Transactions</Text>
                    <Text style={styles.summaryValue}>{totalTxCount}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalTxAmount)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Income</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.emerald700 }]}>
                      {formatCurrency(grandTotal)}
                    </Text>
                  </View>
                </View>

                {/* Transaction Cards */}
                {transactions.map((tx, idx) => (
                  <View key={tx.id} style={styles.txCard}>
                    {/* Card Header */}
                    <View style={styles.txCardHeader}>
                      <View style={styles.txTypeChip}>
                        <MaterialCommunityIcons
                          name={SERVICE_ICONS[tx.type] || 'tag-outline'}
                          size={12}
                          color={COLORS.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.txTypeText}>{tx.type}</Text>
                      </View>
                      <Text style={styles.txDateText}>{tx.date}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteTransaction(tx.id)}
                        style={styles.deleteBtn}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    {/* Card Metrics Grid */}
                    <View style={styles.txMetricsRow}>
                      <View style={styles.txMetric}>
                        <Text style={styles.txMetricLabel}>No. of Txns</Text>
                        <Text style={styles.txMetricValue}>{tx.count}</Text>
                      </View>
                      <View style={styles.txMetricDivider} />
                      <View style={styles.txMetric}>
                        <Text style={styles.txMetricLabel}>Amount</Text>
                        <Text style={styles.txMetricValue}>{formatCurrency(tx.amount)}</Text>
                      </View>
                      <View style={styles.txMetricDivider} />
                      <View style={styles.txMetric}>
                        <Text style={styles.txMetricLabel}>Commission</Text>
                        <Text style={styles.txMetricValue}>{formatCurrency(tx.commission)}</Text>
                      </View>
                      <View style={styles.txMetricDivider} />
                      <View style={styles.txMetric}>
                        <Text style={styles.txMetricLabel}>Income</Text>
                        <Text style={[styles.txMetricValue, { color: COLORS.emerald700, fontWeight: '800' }]}>
                          {formatCurrency(tx.totalIncome)}
                        </Text>
                      </View>
                    </View>

                    {/* Sequence indicator */}
                    <View style={styles.txSeqBar}>
                      <Text style={styles.txSeqText}>Entry #{transactions.length - idx}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <View style={{ height: 8 }} />
          </>
        )}
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
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
          <Text style={styles.buttonTextPrimary}>SAVE &amp; NEXT</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──
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

  // ── Scroll ──
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 24 },

  // ── Month Card ──
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    marginBottom: 12,
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

  // ── Toggle Card ──
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    padding: 14,
    marginBottom: 12,
  },
  toggleCardActive: {
    borderColor: '#6EE7B7',
    backgroundColor: '#F0FDF4',
  },
  toggleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.1,
  },
  toggleSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Inactive Notice ──
  inactiveNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderStyle: 'dashed',
    padding: 14,
  },
  inactiveText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.slate500,
    lineHeight: 20,
  },

  // ── Form Card ──
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 16,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
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

  // ── Inputs ──
  inputRowHalf: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1, gap: 5 },
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
  inputIcon: { marginRight: 6 },
  currencySymbol: {
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

  // ── Chips ──
  chipsScroll: { marginTop: 6, marginBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.surface,
    marginRight: 7,
    marginBottom: 2,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  chipTextActive: { color: COLORS.primary },

  // ── Auto Total ──
  autoTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emerald50,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  autoTotalValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  autoTotalHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    color: COLORS.emerald700,
    opacity: 0.7,
    marginTop: 2,
  },
  autoCalcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  autoCalcText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: 0.5,
  },

  // ── Add Button ──
  btnWrapper: { borderRadius: 12, overflow: 'hidden' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.slate200,
  },
  addBtnDisabled: { backgroundColor: COLORS.slate100 },
  addBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Section Header ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ── Empty State ──
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // ── Summary Strip ──
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate800,
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.slate200,
    marginHorizontal: 4,
  },

  // ── Transaction Card ──
  txCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 10,
    overflow: 'hidden',
  },
  txCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  txTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  txTypeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  txDateText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: '500',
    textAlign: 'right',
    marginRight: 4,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 0,
  },
  txMetric: { flex: 1, alignItems: 'center' },
  txMetricLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  txMetricValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate700,
    marginTop: 2,
  },
  txMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.slate100,
    marginHorizontal: 2,
  },
  txSeqBar: {
    backgroundColor: COLORS.slate50,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  txSeqText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.slate400,
    letterSpacing: 0.3,
  },

  // ── Bottom Bar ──
  bottomBar: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    gap: 10,
  },
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
