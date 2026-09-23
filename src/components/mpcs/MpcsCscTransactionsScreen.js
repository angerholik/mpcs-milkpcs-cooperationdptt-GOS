import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';
import { getMpcsCscTransactions, saveMpcsCscTransaction, deleteMpcsCscTransaction } from '../../supabase';
import { queueSubmission } from '../../utils/syncManager';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "4 · Daily ledger", screens 7e/7d "CSC transactions" —
// "State said once; dependent fields dimmed" (the active-CSC check lives
// on the Master Data CSC Details screen, not duplicated here) and
// "Commission is the income; value handled is separate."
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  border: '#E7E2DA',
  undoBg: '#EDE8E0',
};

const FONT_FAMILY = 'Manrope';
const UNDO_WINDOW_MS = 5000;

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

function formatWhole(val) {
  const n = parseFloat(val);
  if (!n) return '0';
  return Math.round(n).toLocaleString('en-IN');
}

const SERVICE_TYPES = ['Banking / Aadhaar', 'Certificates', 'Bill payment', 'Insurance'];

// CSC transactions can happen any day — this is a continuous running ledger
// per society in its own table, not draft state tied to a monthly
// submission. Whether the society even has a CSC centre is a Master Data
// fact (cscIsActive, set on the CSC Details screen), so that's read-only
// here rather than a second, redundant "active this month" toggle.
export default function MpcsCscTransactionsScreen({
  societyName = '',
  reportingMonth = '',
  cscIsActive = false,
  onBack,
  activeTab,
  onTabPress,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [txCount, setTxCount] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCommission, setTxCommission] = useState('');

  const pendingDeleteRef = useRef(null);
  useEffect(() => { pendingDeleteRef.current = pendingDelete; }, [pendingDelete]);
  useEffect(() => () => {
    // A failed delete here used to be silently dropped — queue it for
    // retry like every other write that can fail offline.
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timer);
      const txId = pendingDeleteRef.current.id;
      deleteMpcsCscTransaction(txId).then(({ error }) => {
        if (error) queueSubmission('DELETE_CSC_TX', { transactionId: txId });
      });
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!societyName) { setLoading(false); return; }
    setLoading(true);
    // A failed fetch (offline, flaky connection) used to wipe the visibly
    // loaded ledger back to an empty list — keep whatever's already
    // showing instead of clobbering it with an empty result.
    const { data, error } = await getMpcsCscTransactions(societyName);
    if (!error) setTransactions(data || []);
    setLoading(false);
  }, [societyName]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const canAdd = txDate && txType && !saving;

  const handleAddTransaction = async () => {
    if (!canAdd) return;
    setSaving(true);
    const { error } = await saveMpcsCscTransaction(societyName, {
      transactionDate: formatDMYToIso(txDate),
      serviceType: txType,
      count: txCount,
      amount: txAmount,
      commission: txCommission,
    });
    setSaving(false);
    if (error) {
      const msg = 'Could not save this transaction. Please try again.';
      if (Platform.OS === 'web') alert(msg); else Alert.alert('Save Failed', msg);
      return;
    }
    setTxDate(''); setTxType(''); setShowOtherInput(false); setTxCount(''); setTxAmount(''); setTxCommission('');
    loadTransactions();
  };

  const handleDeletePress = (tx) => {
    setMenuOpenId(null);
    if (pendingDelete) {
      clearTimeout(pendingDelete.timer);
      const prevId = pendingDelete.id;
      deleteMpcsCscTransaction(prevId).then(({ error }) => {
        if (error) queueSubmission('DELETE_CSC_TX', { transactionId: prevId });
      });
    }
    const timer = setTimeout(async () => {
      const { error } = await deleteMpcsCscTransaction(tx.id);
      if (error) await queueSubmission('DELETE_CSC_TX', { transactionId: tx.id });
      loadTransactions();
      setPendingDelete((cur) => (cur && cur.id === tx.id ? null : cur));
    }, UNDO_WINDOW_MS);
    setPendingDelete({ id: tx.id, timer });
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    setPendingDelete(null);
  };

  const visibleTransactions = transactions.filter((t) => t.id !== pendingDelete?.id);
  const totalTxCount = visibleTransactions.reduce((s, t) => s + (parseInt(t.transaction_count) || 0), 0);
  const totalAmount = visibleTransactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalCommission = visibleTransactions.reduce((s, t) => s + (parseFloat(t.commission) || 0), 0);

  const entryIncome = (parseFloat(txCommission) || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>CSC transactions</Text>
        <Text style={styles.headerSubtitle}>
          {(reportingMonth || 'This month')} · {visibleTransactions.length === 0 ? 'no entries yet' : `${visibleTransactions.length} ${visibleTransactions.length === 1 ? 'entry' : 'entries'} · ₹${formatWhole(totalCommission)} commission`}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!cscIsActive ? (
          <View style={styles.inactiveCard}>
            <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.slate500} />
            <Text style={styles.inactiveText}>
              This society's CSC Details (Master Data) is marked Inactive. Mark it Active there first to log transactions here.
            </Text>
          </View>
        ) : loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.maroon} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{visibleTransactions.length === 0 ? 'First entry' : 'New entry'}</Text>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <View style={styles.inputBox}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={formatDMYToIso(txDate)}
                        onChange={(e) => setTxDate(formatIsoToDMY(e.target.value))}
                        style={{
                          width: '100%', height: '100%', border: 'none', outline: 'none',
                          background: 'transparent', fontFamily: FONT_FAMILY, fontSize: 15,
                          color: COLORS.ink, fontWeight: '700', cursor: 'pointer',
                        }}
                      />
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        value={txDate}
                        onChangeText={setTxDate}
                        placeholder="DD/MM/YYYY"
                        placeholderTextColor={COLORS.slate500}
                      />
                    )}
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>How many</Text>
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      value={txCount}
                      onChangeText={setTxCount}
                      placeholder="0"
                      placeholderTextColor={COLORS.slate500}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Service</Text>
                <View style={styles.chipGrid}>
                  {SERVICE_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.chip, txType === type && styles.chipActive]}
                      onPress={() => { setTxType(type); setShowOtherInput(false); }}
                    >
                      <Text style={[styles.chipText, txType === type && styles.chipTextActive]}>{type}</Text>
                    </Pressable>
                  ))}
                  <Pressable
                    style={[styles.chip, styles.chipOther, showOtherInput && styles.chipActive]}
                    onPress={() => { setShowOtherInput(true); setTxType(''); }}
                  >
                    <Text style={[styles.chipText, showOtherInput && styles.chipTextActive]}>Other…</Text>
                  </Pressable>
                </View>
                {showOtherInput && (
                  <View style={styles.inputBox}>
                    <TextInput
                      style={styles.textInput}
                      value={txType}
                      onChangeText={setTxType}
                      placeholder="Name this service"
                      placeholderTextColor={COLORS.slate500}
                    />
                  </View>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Value handled</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={txAmount}
                      onChangeText={setTxAmount}
                      placeholder="0"
                      placeholderTextColor={COLORS.slate500}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Commission</Text>
                  <View style={styles.inputBox}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={txCommission}
                      onChangeText={setTxCommission}
                      placeholder="0"
                      placeholderTextColor={COLORS.slate500}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.calcCard}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcRowLabel}>Society income from this entry</Text>
                  {txCommission ? (
                    <Text style={styles.calcRowValue}>₹{formatWhole(entryIncome)}</Text>
                  ) : (
                    <Text style={styles.calcRowPlaceholder}>Enter a commission</Text>
                  )}
                </View>
                <Text style={styles.calcHint}>
                  Commission only. Value handled belongs to customers and is recorded separately.
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.addBtn, !canAdd && styles.addBtnDisabled, pressed && canAdd && { opacity: 0.9 }]}
                onPress={handleAddTransaction}
                disabled={!canAdd}
              >
                {saving ? (
                  <ActivityIndicator color={canAdd ? '#ffffff' : COLORS.slate500} size="small" />
                ) : (
                  <Text style={[styles.addBtnText, !canAdd && { color: COLORS.slate500 }]}>Add entry</Text>
                )}
              </Pressable>
              <Text style={styles.hintText}>Pick a date and a service to add</Text>
            </View>

            <Text style={styles.sectionLabel}>ENTRIES THIS MONTH</Text>

            {visibleTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nothing recorded yet</Text>
                <Text style={styles.emptyDesc}>Entries added above appear here, newest first, with the month's commission as the last row.</Text>
              </View>
            ) : (
              <>
                <View style={styles.listCard}>
                  {visibleTransactions.map((tx) => (
                    <View key={tx.id} style={styles.listRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listRowTitle}>{tx.service_type}</Text>
                        <Text style={styles.listRowSub}>
                          {formatIsoToDMY(tx.transaction_date)} · {tx.transaction_count || 0} transactions · ₹{formatWhole(tx.amount)} handled
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.listRowAmount}>₹{formatWhole(tx.commission)}</Text>
                        <Text style={styles.listRowAmountSub}>commission</Text>
                      </View>
                      <View>
                        <Pressable
                          hitSlop={8}
                          style={styles.rowMenuBtn}
                          onPress={() => setMenuOpenId((cur) => (cur === tx.id ? null : tx.id))}
                        >
                          <MaterialCommunityIcons name="dots-vertical" size={18} color={COLORS.slate500} />
                        </Pressable>
                        {menuOpenId === tx.id && (
                          <View style={styles.rowMenu}>
                            <Pressable style={styles.rowMenuItem} onPress={() => handleDeletePress(tx)}>
                              <MaterialCommunityIcons name="trash-can-outline" size={15} color={COLORS.maroon} />
                              <Text style={styles.rowMenuItemText}>Delete</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                  <View style={[styles.listRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Commission this month</Text>
                    <Text style={styles.totalValue}>₹{formatWhole(totalCommission)}</Text>
                  </View>
                </View>
                <Text style={styles.footerCaption}>
                  ₹{formatWhole(totalAmount)} handled across {totalTxCount} transactions.
                </Text>
              </>
            )}

            {pendingDelete && (
              <View style={styles.undoBar}>
                <MaterialCommunityIcons name="undo-variant" size={16} color={COLORS.ink} />
                <Text style={styles.undoText}>Entry deleted</Text>
                <Pressable onPress={handleUndo} hitSlop={8}>
                  <Text style={styles.undoLink}>Undo</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 14 },

  inactiveCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: 16,
  },
  inactiveText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
    lineHeight: 19,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  row: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1, gap: 6 },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
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
    height: 48,
  },
  currencyPrefix: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.maroon,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: {
    borderColor: COLORS.maroon,
    backgroundColor: COLORS.maroon,
  },
  chipOther: { borderStyle: 'dashed' },
  chipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  chipTextActive: { color: '#ffffff' },

  calcCard: {
    backgroundColor: COLORS.undoBg,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcRowLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    flex: 1,
    marginRight: 8,
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
  calcHint: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
    lineHeight: 16,
  },

  addBtn: {
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: COLORS.undoBg },
  addBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  hintText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },

  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  emptyDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },

  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRowTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listRowSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    marginTop: 2,
  },
  listRowAmount: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  listRowAmountSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  rowMenuBtn: {
    width: 28,
    height: 28,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMenu: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    minWidth: 120,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  rowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowMenuItemText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.maroon,
  },
  totalRow: { borderBottomWidth: 0 },
  totalLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },
  totalValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  footerCaption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    textAlign: 'center',
  },

  undoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.undoBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  undoText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
  },
  undoLink: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.maroon,
  },
});
