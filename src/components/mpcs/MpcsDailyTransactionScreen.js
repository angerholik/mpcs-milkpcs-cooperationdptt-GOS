import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../BottomNav';
import { webCapWidth } from '../../utils/webStyles';
import { getMpcsDailyTransactions, saveMpcsDailyTransaction, deleteMpcsDailyTransaction } from '../../supabase';
import { queueSubmission } from '../../utils/syncManager';

// Redesign source: https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx,
// section "4 · Daily ledger", screen 7a "Cash book" — "Row menu and undo
// instead of one-tap delete", hence the undo snackbar below rather than an
// inline trash icon that deletes immediately.
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

// A running cash-book style ledger per society — Transaction No. auto-
// increments per institution and entries are never reset or scoped to a
// reporting month, matching how CSC Transactions now works too.
export default function MpcsDailyTransactionScreen({
  societyName = '',
  reportingMonth = '',
  onBack,
  activeTab,
  onTabPress,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, timer }
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [txDate, setTxDate] = useState('');
  const [particulars, setParticulars] = useState('');
  const [amount, setAmount] = useState('');

  const pendingDeleteRef = useRef(null);
  useEffect(() => { pendingDeleteRef.current = pendingDelete; }, [pendingDelete]);
  useEffect(() => () => {
    // Commit any still-pending delete if the screen unmounts before the
    // undo window closes, rather than leaking a timer that never fires.
    // A failed delete here used to be silently dropped — queue it for
    // retry like every other write that can fail offline.
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timer);
      const txId = pendingDeleteRef.current.id;
      deleteMpcsDailyTransaction(txId).then(({ error }) => {
        if (error) queueSubmission('DELETE_DAILY_TX', { transactionId: txId });
      });
    }
  }, []);

  const nextTransactionNo = (transactions[0]?.transaction_no || 0) + 1;

  const loadTransactions = useCallback(async () => {
    if (!societyName) { setLoading(false); return; }
    setLoading(true);
    // A failed fetch (offline, flaky connection) used to wipe the visibly
    // loaded ledger back to an empty list — real, already-saved entries
    // would vanish from the screen even though nothing happened to them
    // server-side. Keep whatever's already showing instead of clobbering
    // it with an empty result.
    const { data, error } = await getMpcsDailyTransactions(societyName);
    if (!error) setTransactions(data || []);
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

  // Optimistically hides the row and offers Undo for a few seconds before
  // actually deleting — a mistaken tap on a cash-book entry (real money,
  // already reported) shouldn't be a one-tap, irreversible action.
  const handleDeletePress = (tx) => {
    setMenuOpenId(null);
    if (pendingDelete) {
      clearTimeout(pendingDelete.timer);
      const prevId = pendingDelete.id;
      deleteMpcsDailyTransaction(prevId).then(({ error }) => {
        if (error) queueSubmission('DELETE_DAILY_TX', { transactionId: prevId });
      });
    }
    const timer = setTimeout(async () => {
      const { error } = await deleteMpcsDailyTransaction(tx.id);
      if (error) await queueSubmission('DELETE_DAILY_TX', { transactionId: tx.id });
      loadTransactions();
      setPendingDelete((cur) => (cur && cur.id === tx.id ? null : cur));
    }, UNDO_WINDOW_MS);
    setPendingDelete({ id: tx.id, no: tx.transaction_no, timer });
  };

  const handleUndo = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    setPendingDelete(null);
  };

  const visibleTransactions = transactions.filter((t) => t.id !== pendingDelete?.id);
  const totalAmount = visibleTransactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>MPCS cash book</Text>
        <Text style={styles.headerSubtitle}>
          {(reportingMonth || 'This month')} · {visibleTransactions.length} {visibleTransactions.length === 1 ? 'entry' : 'entries'} · ₹{formatWhole(totalAmount)}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={COLORS.maroon} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New entry</Text>

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
                  <Text style={styles.fieldLabel}>Entry no.</Text>
                  <View style={[styles.inputBox, styles.readOnlyBox]}>
                    <Text style={styles.readOnlyText}>{nextTransactionNo}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Particulars</Text>
                <TextInput
                  style={styles.textArea}
                  value={particulars}
                  onChangeText={setParticulars}
                  placeholder="What was this payment for?"
                  placeholderTextColor={COLORS.slate500}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.slate500}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.addBtn, !canAdd && styles.addBtnDisabled, pressed && canAdd && { opacity: 0.9 }]}
                onPress={handleAdd}
                disabled={!canAdd}
              >
                {saving ? (
                  <ActivityIndicator color={canAdd ? '#ffffff' : COLORS.slate500} size="small" />
                ) : (
                  <Text style={[styles.addBtnText, !canAdd && { color: COLORS.slate500 }]}>Add entry</Text>
                )}
              </Pressable>
              <Text style={styles.hintText}>Enter particulars and an amount to add</Text>
            </View>

            <Text style={styles.sectionLabel}>ENTRIES THIS MONTH</Text>

            {visibleTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nothing recorded yet</Text>
                <Text style={styles.emptyDesc}>Entries added above appear here, newest first.</Text>
              </View>
            ) : (
              <View style={styles.listCard}>
                {visibleTransactions.map((tx) => (
                  <View key={tx.id} style={styles.listRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle} numberOfLines={1}>{tx.particulars}</Text>
                      <Text style={styles.listRowSub}>{formatIsoToDMY(tx.transaction_date)} · entry {tx.transaction_no}</Text>
                    </View>
                    <Text style={styles.listRowAmount}>₹{formatWhole(tx.amount)}</Text>
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
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{formatWhole(totalAmount)}</Text>
                </View>
              </View>
            )}

            {pendingDelete && (
              <View style={styles.undoBar}>
                <MaterialCommunityIcons name="undo-variant" size={16} color={COLORS.ink} />
                <Text style={styles.undoText}>Entry {pendingDelete.no} deleted</Text>
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
  fieldGroup: { gap: 6 },
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
  readOnlyBox: { backgroundColor: COLORS.undoBg },
  readOnlyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.slate600,
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
  textArea: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 48,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
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
