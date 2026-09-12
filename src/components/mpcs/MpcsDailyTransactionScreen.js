import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Pressable, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';
import { getMpcsDailyTransactions, saveMpcsDailyTransaction, deleteMpcsDailyTransaction } from '../../supabase';

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
  slate50:  '#f8fafc',
  primary:  '#7a1a1f',
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald50:  '#ecfdf5',
};

const FONT_FAMILY = 'Manrope';

function formatDMYToIso(displayStr) {
  if (!displayStr) return '';
  const parts = displayStr.trim().split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && y.length === 4) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

function formatIsoToDMY(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return isoStr;
}

function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

// A running cash-book style ledger per society — Transaction No. auto-
// increments per institution and entries are never reset or scoped to a
// reporting month, matching how CSC Transactions now works too.
export default function MpcsDailyTransactionScreen({
  societyName = '',
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [txDate, setTxDate] = useState('');
  const [particulars, setParticulars] = useState('');
  const [amount, setAmount] = useState('');

  const nextTransactionNo = (transactions[0]?.transaction_no || 0) + 1;

  const loadTransactions = useCallback(async () => {
    if (!societyName) { setLoading(false); return; }
    setLoading(true);
    const { data } = await getMpcsDailyTransactions(societyName);
    setTransactions(data || []);
    setLoading(false);
  }, [societyName]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const canAdd = txDate && particulars && amount && !saving;

  const handleAdd = async () => {
    if (!canAdd) return;
    setSaving(true);
    const { error } = await saveMpcsDailyTransaction(societyName, {
      transactionDate: formatDMYToIso(txDate),
      particulars,
      amount,
    });
    setSaving(false);
    if (error) {
      const msg = 'Could not save this transaction. Please try again.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Save Failed', msg);
      return;
    }
    setTxDate(''); setParticulars(''); setAmount('');
    loadTransactions();
  };

  const handleDelete = async (id) => {
    await deleteMpcsDailyTransaction(id);
    loadTransactions();
  };

  const totalAmount = transactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  return (
    <View style={styles.container}>
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
          <Text style={styles.moduleTag}>MPCS · QUICK ACCESS</Text>
          <Text style={styles.screenTitleHeader}>Daily Transactions</Text>
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
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <>
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.cardHeaderTitle}>Add Transaction Entry</Text>
              </View>

              <View style={styles.inputRowHalf}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Transaction No.</Text>
                  <View style={[styles.inputBox, styles.readOnlyBox]}>
                    <MaterialCommunityIcons name="pound" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                    <Text style={styles.readOnlyText}>{nextTransactionNo}</Text>
                  </View>
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Transaction Date</Text>
                  <View style={styles.inputBox}>
                    <MaterialCommunityIcons name="calendar-range" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={formatDMYToIso(txDate)}
                        onChange={(e) => setTxDate(formatIsoToDMY(e.target.value))}
                        style={{
                          width: '100%', height: '100%', border: 'none', outline: 'none',
                          background: 'transparent', fontFamily: FONT_FAMILY, fontSize: 13,
                          color: COLORS.slate800, fontWeight: '500', cursor: 'pointer',
                        }}
                      />
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        value={txDate}
                        onChangeText={setTxDate}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={COLORS.slate300}
                      />
                    )}
                  </View>
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Particulars</Text>
                <View style={[styles.inputBox, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
                  <MaterialCommunityIcons name="text-box-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
                  <TextInput
                    style={[styles.textInput, { height: '100%' }]}
                    value={particulars}
                    onChangeText={setParticulars}
                    placeholder="Describe this transaction..."
                    placeholderTextColor={COLORS.slate300}
                    multiline
                  />
                </View>
              </View>

              <View>
                <Text style={styles.inputLabel}>Transaction Amount (₹)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.slate300}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.btnWrapper}>
                <Pressable
                  style={({ pressed }) => [
                    styles.addBtn,
                    !canAdd && styles.addBtnDisabled,
                    pressed && canAdd && { transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={handleAdd}
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
                  {saving ? (
                    <ActivityIndicator color={canAdd ? '#ffffff' : COLORS.slate400} size="small" />
                  ) : (
                    <MaterialCommunityIcons name="plus-circle" size={17} color={canAdd ? '#ffffff' : COLORS.slate400} />
                  )}
                  <Text style={[styles.addBtnText, !canAdd && { color: COLORS.slate400 }]}>
                    {saving ? 'SAVING...' : 'ADD TO LEDGER'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recorded Transactions</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{transactions.length}</Text>
              </View>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="notebook-outline" size={32} color={COLORS.slate300} />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Fill in the form above and tap "Add to Ledger" to record each transaction.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryStrip}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Entries</Text>
                    <Text style={styles.summaryValue}>{transactions.length}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Amount</Text>
                    <Text style={[styles.summaryValue, { color: COLORS.emerald700 }]}>{formatCurrency(totalAmount)}</Text>
                  </View>
                </View>

                <View style={styles.tableCard}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, { flex: 0.6 }]}>No.</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Particulars</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                    <View style={{ width: 30 }} />
                  </View>
                  {transactions.map((tx) => (
                    <View key={tx.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 0.6, fontWeight: '800', color: COLORS.primary }]}>{tx.transaction_no}</Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{formatIsoToDMY(tx.transaction_date)}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>{tx.particulars}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>{formatCurrency(tx.amount)}</Text>
                      <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="trash-can-outline" size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 8 }} />
          </>
        )}

        <View style={[{ flexDirection: 'row', flex: 1, gap: 10 }, webCapWidth]}>
          <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.buttonTextSecondary}>BACK</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

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

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

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
  readOnlyBox: { backgroundColor: COLORS.slate100 },
  readOnlyText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.slate600 },
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

  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  tableHeaderCell: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  tableCell: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate700,
    paddingRight: 4,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
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
});
