import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';
import { getMpcsDailyTransactions, getMpcsCscTransactions } from '../../supabase';

// Redesign source: a reference mockup the user supplied directly (gradient
// header with ambient glow, colored per-parameter icon badges, 2-column
// Daily Ledgers grid with a live stat line). Deliberately keeps this
// gradient/photo-adjacent treatment scoped to Home only — Master Data,
// Cash Book, CSC Transactions, Profile, and More all moved to a flat
// maroon/cream system earlier in this pass, and that decision stands;
// Home is the one screen where richer decoration was explicitly requested.
// Every stat shown here is real data from the same tables the Cash
// Book/CSC Transactions screens themselves read — no placeholder numbers.
const COLORS = {
  maroon: '#7B1420',
  maroonDark: '#4A0D14',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  track: '#EDE8E0',
  pillBg: '#F6E3E5',
  amber50: '#FFF7ED',
  amber700: '#B45309',
  rose50: '#FFF1F2',
  rose600: '#E11D48',
  emerald50: '#ECFDF5',
  emerald600: '#059669',
  sky50: '#F0F9FF',
  sky700: '#0369A1',
  slateBg: '#F1F5F9',
};

const FONT_FAMILY = 'Manrope';

const isEvidenceCaptured = (st) => Boolean(st) && st.includes('CAPTURED') && !st.includes('NOT');

// The GPU name is stored as whatever the inspector typed when registering
// the institution, not guaranteed to already say "GPU" — append the suffix
// for display without doubling it up for GPU names that already include it.
const formatGpuLabel = (value) => {
  if (!value) return value;
  return /\bgpu\b/i.test(value) ? value : `${value} GPU`;
};

const formatWhole = (n) => Math.round(n || 0).toLocaleString('en-IN');

const NEXT_ACTION_BUTTON_LABEL = {
  'camera-outline': 'Open camera',
  'file-check-outline': 'Review',
};

// Fixed icon/color per parameter type (not per completion state) — matches
// how the reference mockup differentiates rows, and gives Digital Evidence/
// Sales/Performance/Loan a consistent identity whether open or done.
const PARAM_STYLE = {
  MPCS_EVIDENCE: { icon: 'camera-outline', bg: COLORS.rose50, fg: COLORS.rose600 },
  MPCS_SALES: { icon: 'wallet-outline', bg: COLORS.emerald50, fg: COLORS.emerald600 },
  MPCS_BUSINESS: { icon: 'chart-bar', bg: COLORS.sky50, fg: COLORS.sky700 },
  MPCS_LOAN_STATUS: { icon: 'bank-outline', bg: COLORS.slateBg, fg: COLORS.slate500 },
};

export default function HomeScreen({
  societyName = "",
  centerId = "",
  district = "",
  reportingMonth = "",
  reportStatus = "DRAFT",
  progressPercent = 0,
  completedCount = 0,
  totalCount = 5,
  evidenceStatus = "NOT CAPTURED",
  salesStatus = "NOT COMPLETED",
  businessStatus = "NOT COMPLETED",
  loanIsActive = false,
  loanStatus = "NOT APPLICABLE",
  masterDataUpdated = {},
  activeAlert,
  selectedSociety,
  onNavigateScreen,
  onManageInstitutions,
  onNotifyPress,
  onProfilePress,
  role,
  activeTab = 'home',
  onTabPress
}) {
  const [internalTab, setInternalTab] = useState('monthly');
  const [alertVisible, setAlertVisible] = useState(true);
  const [cashBookStats, setCashBookStats] = useState(null); // { count, total }
  const [cscStats, setCscStats] = useState(null); // { count, commission }

  const activeSocietyName = selectedSociety?.name || societyName;

  // Same tables the Cash Book / CSC Transactions screens themselves read —
  // this just summarizes what's already there, it doesn't compute anything
  // those screens don't already show.
  useEffect(() => {
    let cancelled = false;
    if (!activeSocietyName) return undefined;
    (async () => {
      const [{ data: daily }, { data: csc }] = await Promise.all([
        getMpcsDailyTransactions(activeSocietyName),
        getMpcsCscTransactions(activeSocietyName),
      ]);
      if (cancelled) return;
      setCashBookStats({
        count: daily.length,
        total: daily.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
      });
      setCscStats({
        count: csc.length,
        commission: csc.reduce((s, t) => s + (parseFloat(t.commission) || 0), 0),
      });
    })();
    return () => { cancelled = true; };
  }, [activeSocietyName]);

  const nextAction = (!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid'))
    ? { icon: 'camera-outline', title: 'Digital Evidence', desc: 'Live photo and GPS fix, captured at the premises.', screen: 'MPCS_EVIDENCE', id: 'MPCS_EVIDENCE' }
    : !salesStatus?.startsWith('COMPLETED')
      ? { icon: 'wallet-outline', title: 'Monthly Sales / Deposit', desc: 'Record daily sales and verify bank deposits.', screen: 'MPCS_SALES', id: 'MPCS_SALES' }
      : !businessStatus?.startsWith('COMPLETED')
        ? { icon: 'chart-bar', title: 'Business Performance', desc: 'Record gross income and operational expenditure.', screen: 'MPCS_BUSINESS', id: 'MPCS_BUSINESS' }
        : { icon: 'file-check-outline', title: 'Review & Submit Return', desc: 'All monthly parameters are ready for final submission.', screen: 'MPCS_REVIEW', id: 'MPCS_REVIEW' };
  const nextActionStyle = PARAM_STYLE[nextAction.id] || { bg: COLORS.pillBg, fg: COLORS.maroon };

  const monthlyParams = [
    { id: 'MPCS_EVIDENCE', title: 'Digital Evidence', desc: 'Photo & geolocation', done: isEvidenceCaptured(evidenceStatus), na: false },
    { id: 'MPCS_SALES', title: 'Sales & Deposit', desc: 'Ledger & accounts reconciled', done: salesStatus?.startsWith('COMPLETED'), na: false },
    { id: 'MPCS_BUSINESS', title: 'Business Performance', desc: 'Gross income & expenditure', done: businessStatus?.startsWith('COMPLETED'), na: false },
    { id: 'MPCS_LOAN_STATUS', title: 'Loan Status', desc: loanIsActive ? 'Awaiting credit sign-off' : 'No active loan', done: loanIsActive && loanStatus?.startsWith('COMPLETED'), na: !loanIsActive },
  ];

  // All 8 records now live on one screen (MpcsMasterDataListScreen), so
  // every row here just opens it.
  const masterRecords = [
    { id: 'MPCS_MASTER_DATA', title: 'Institutional Profile', updated: masterDataUpdated.instProfile },
    { id: 'MPCS_MASTER_DATA', title: 'Registered Demographics', updated: masterDataUpdated.demographics },
    { id: 'MPCS_MASTER_DATA', title: 'Loan Details', updated: masterDataUpdated.loan },
    { id: 'MPCS_MASTER_DATA', title: 'Compliance Audit', updated: masterDataUpdated.compliance },
    { id: 'MPCS_MASTER_DATA', title: 'Financial Performance', updated: masterDataUpdated.financials },
    { id: 'MPCS_MASTER_DATA', title: 'Dividend Details', updated: masterDataUpdated.dividend },
    { id: 'MPCS_MASTER_DATA', title: 'Share Capital', updated: masterDataUpdated.shareCapital },
    { id: 'MPCS_MASTER_DATA', title: 'CSC Details', updated: masterDataUpdated.csc },
  ];
  const masterNeedsUpdate = masterRecords.filter((r) => !r.updated);

  const roleInitials = (role || 'CI').slice(0, 2).toUpperCase();

  const cashBookSub = cashBookStats
    ? `${cashBookStats.count} ${cashBookStats.count === 1 ? 'entry' : 'entries'} · ₹${formatWhole(cashBookStats.total)}`
    : 'Tap to open';
  const cscSub = cscStats
    ? `${cscStats.count} ${cscStats.count === 1 ? 'entry' : 'entries'} · ₹${formatWhole(cscStats.commission)} commission`
    : 'Tap to open';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroonDark} />

      <LinearGradient
        colors={[COLORS.maroon, '#5C1313', COLORS.maroonDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerBlobTop} pointerEvents="none" />
        <View style={styles.headerBlobBottom} pointerEvents="none" />

        <View style={styles.headerTopRow}>
          <Pressable onPress={onManageInstitutions} hitSlop={8}>
            <Text style={styles.headerWordmark}>CORE</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={onNotifyPress} hitSlop={8} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#ffffff" />
              {activeAlert ? <View style={styles.headerDot} /> : null}
            </Pressable>
            <Pressable onPress={onProfilePress} hitSlop={8} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{roleInitials}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedSociety?.name || societyName || 'Society Name Missing'}
        </Text>
        <View style={styles.headerMetaRow}>
          <View style={styles.headerMetaChip}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.amber50} />
            <Text style={styles.headerMetaChipText}>{formatGpuLabel(district) || 'Location Not Set'}</Text>
          </View>
          <Text style={styles.headerMetaDot}>•</Text>
          <Text style={styles.headerMetaStatus}>{reportStatus}</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabBar}>
        {[
          { key: 'monthly', label: 'Monthly' },
          { key: 'master', label: 'Master' },
          { key: 'member', label: 'Member' },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, internalTab === t.key && styles.tabBtnActive]}
            onPress={() => setInternalTab(t.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, internalTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            {internalTab === t.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>

        {alertVisible && activeAlert ? (
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <MaterialCommunityIcons name="alert-outline" size={18} color={COLORS.amber700} />
            </View>
            <Text style={styles.alertText}>{activeAlert?.message || activeAlert?.text}</Text>
            <TouchableOpacity onPress={() => setAlertVisible(false)} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={16} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
        ) : null}

        {internalTab === 'monthly' && (
          <>
            <View style={styles.card}>
              <View style={styles.progressHeaderRow}>
                <View>
                  <Text style={styles.progressLabel}>Audit Cycle</Text>
                  <Text style={styles.progressMonth}>{reportingMonth || 'Current Month'}</Text>
                </View>
                <Text style={styles.progressFraction}>{completedCount}<Text style={styles.progressFractionSlash}> / {totalCount}</Text></Text>
              </View>
              <View style={styles.segmentRow}>
                {Array.from({ length: totalCount }).map((_, i) => (
                  <View key={i} style={[styles.segment, i < completedCount && styles.segmentDone]} />
                ))}
              </View>
              {totalCount > 0 && (
                <Text style={styles.progressFootnote}>
                  {completedCount === totalCount
                    ? 'All parameters ready'
                    : `${totalCount - completedCount} parameter${totalCount - completedCount === 1 ? '' : 's'} pending`}
                </Text>
              )}
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>ON SITE NOW</Text>
            </View>
            <View style={styles.onSiteCard}>
              <View style={styles.onSiteTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onSiteTitle}>{nextAction.title}</Text>
                  <Text style={styles.onSiteDesc}>{nextAction.desc}</Text>
                </View>
                <View style={[styles.onSiteIconBox, { backgroundColor: nextActionStyle.bg }]}>
                  <MaterialCommunityIcons name={nextAction.icon} size={20} color={nextActionStyle.fg} />
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [styles.onSiteBtn, pressed && { opacity: 0.9 }]}
                onPress={() => onNavigateScreen && onNavigateScreen(nextAction.screen)}
              >
                <Text style={styles.onSiteBtnText}>{NEXT_ACTION_BUTTON_LABEL[nextAction.icon] || 'Open'}</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>PARAMETERS</Text>
              <Text style={styles.sectionCount}>{monthlyParams.length} items</Text>
            </View>
            <View style={styles.listCard}>
              {monthlyParams.map((p, i) => {
                const style = PARAM_STYLE[p.id] || { icon: 'circle-outline', bg: COLORS.slateBg, fg: COLORS.slate500 };
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.listRow, i === monthlyParams.length - 1 && styles.listRowLast]}
                    onPress={() => onNavigateScreen && onNavigateScreen(p.id)}
                  >
                    <View style={[styles.paramIconBox, { backgroundColor: style.bg }]}>
                      <MaterialCommunityIcons name={style.icon} size={19} color={style.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{p.title}</Text>
                      <Text style={styles.listRowDesc}>{p.desc}</Text>
                    </View>
                    {p.na ? (
                      <Text style={styles.listRowDash}>—</Text>
                    ) : p.done ? (
                      <View style={styles.doneBadge}>
                        <MaterialCommunityIcons name="check" size={12} color={COLORS.emerald600} />
                        <Text style={styles.doneBadgeText}>Done</Text>
                      </View>
                    ) : (
                      <View style={styles.openPill}>
                        <Text style={styles.openPillText}>OPEN</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
                  </Pressable>
                );
              })}
            </View>

            {/* Cash Book / CSC Transactions are day-to-day ledgers with no
                fixed spot in the monthly wizard above — the highest-frequency
                data entry in the app, previously reachable only two taps deep
                via More. Shortcut here on the tab actually opened most often,
                full entry still also lives in More as a fallback path. Stat
                lines are real counts/totals from the same tables those
                screens read, not placeholder numbers. */}
            <Text style={styles.sectionLabel}>DAILY LEDGERS</Text>
            <View style={styles.ledgerGrid}>
              <Pressable style={styles.ledgerCard} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_DAILY_TRANS')}>
                <View style={styles.ledgerCardTopRow}>
                  <View style={[styles.ledgerIconBox, { backgroundColor: COLORS.rose50 }]}>
                    <MaterialCommunityIcons name="notebook-outline" size={19} color={COLORS.maroon} />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                </View>
                <Text style={styles.ledgerCardTitle}>Cash Book</Text>
                <Text style={styles.ledgerCardSub}>{cashBookSub}</Text>
              </Pressable>
              <Pressable style={styles.ledgerCard} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_CSC_TRANS')}>
                <View style={styles.ledgerCardTopRow}>
                  <View style={[styles.ledgerIconBox, { backgroundColor: COLORS.sky50 }]}>
                    <MaterialCommunityIcons name="laptop" size={19} color={COLORS.sky700} />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                </View>
                <Text style={styles.ledgerCardTitle}>CSC Transactions</Text>
                <Text style={styles.ledgerCardSub}>{cscSub}</Text>
              </Pressable>
            </View>
          </>
        )}

        {internalTab === 'master' && (
          <>
            <Pressable
              style={styles.card}
              onPress={() => onNavigateScreen && onNavigateScreen('MPCS_MASTER_DATA')}
            >
              <View style={styles.masterSummaryRow}>
                <Text style={styles.masterSummaryCount}>{masterRecords.length} master records</Text>
                {masterNeedsUpdate.length > 0 && (
                  <Text style={styles.masterSummaryNeed}>{masterNeedsUpdate.length} need update</Text>
                )}
              </View>
            </Pressable>

            {masterNeedsUpdate.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>NEEDS UPDATE</Text>
                <View style={styles.listCard}>
                  {masterNeedsUpdate.map((r, i) => (
                    <Pressable
                      key={r.title}
                      style={[styles.listRow, i === masterNeedsUpdate.length - 1 && styles.listRowLast]}
                      onPress={() => onNavigateScreen && onNavigateScreen(r.id)}
                    >
                      <Text style={[styles.listRowTitle, { flex: 1 }]}>{r.title}</Text>
                      <View style={styles.openPill}>
                        <Text style={styles.openPillText}>UPDATE</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {internalTab === 'member' && (
          <Pressable
            style={styles.card}
            onPress={() => onNavigateScreen && onNavigateScreen('MPCS_MEMBERS')}
          >
            <View style={styles.masterSummaryRow}>
              <Text style={styles.masterSummaryCount}>Registered members</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
            </View>
          </Pressable>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    overflow: 'hidden',
  },
  headerBlobTop: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerBlobBottom: {
    position: 'absolute',
    bottom: -50,
    left: '20%',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(225,29,72,0.08)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerWordmark: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5B93D',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerMetaChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  headerMetaDot: {
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '300',
  },
  headerMetaStatus: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.track,
    margin: 16,
    marginBottom: 8,
    padding: 4,
    borderRadius: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  tabTextActive: {
    color: COLORS.maroon,
  },
  tabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.maroon,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.amber50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE7C8',
    padding: 12,
  },
  alertIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.amber700,
    lineHeight: 17,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  progressMonth: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  progressFraction: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.maroon,
  },
  progressFractionSlash: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.track,
  },
  segmentDone: {
    backgroundColor: COLORS.maroon,
  },
  progressFootnote: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: -2,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: -2,
  },
  sectionCount: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  onSiteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.maroon,
    padding: 16,
  },
  onSiteTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  onSiteIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onSiteTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },
  onSiteDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate600,
    lineHeight: 18,
  },
  onSiteBtn: {
    backgroundColor: COLORS.maroon,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  onSiteBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  paramIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRowTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listRowDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },
  listRowDash: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  doneBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.emerald600,
  },
  ledgerGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  ledgerCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  ledgerCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  ledgerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerCardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  ledgerCardSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    marginTop: 6,
  },
  openPill: {
    backgroundColor: COLORS.pillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  openPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.maroon,
    letterSpacing: 0.4,
  },
  masterSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  masterSummaryCount: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  masterSummaryNeed: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.maroon,
  },
});
