import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';

// Redesign source: Claude Design canvas "Design improvements for task
// dashboard" (https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx), section
// "1 · Home" (screens 4a/4b/4c). Design tokens from that canvas's own notes:
// maroon #7B1420 for identity/selection/primary action, green only for a
// real surplus, amber only for a blocked state, derived values grey; 1px
// borders, 18px radii, no shadows; "Pending"/"Done" language, em dash for
// no value.
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

// "Needs update" is the same fallback formatLastUpdated already used before
// this redesign — reused here to decide which Master Data rows surface in
// the new "NEEDS UPDATE" list, instead of threading a new prop through.
const formatLastUpdated = (isoString) => {
  if (!isoString) return 'Needs update';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Needs update';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const NEXT_ACTION_BUTTON_LABEL = {
  'image-outline': 'Open camera',
  'file-check-outline': 'Review',
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

  const nextAction = (!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid'))
    ? { icon: 'image-outline', title: 'Digital Evidence', desc: 'Live photo and GPS fix, captured at the premises.', screen: 'MPCS_EVIDENCE' }
    : !salesStatus?.startsWith('COMPLETED')
      ? { icon: 'wallet-outline', title: 'Monthly Sales / Deposit', desc: 'Record daily sales and verify bank deposits.', screen: 'MPCS_SALES' }
      : !businessStatus?.startsWith('COMPLETED')
        ? { icon: 'chart-bar', title: 'Business Performance', desc: 'Record gross income and operational expenditure.', screen: 'MPCS_BUSINESS' }
        : { icon: 'file-check-outline', title: 'Review & Submit Return', desc: 'All monthly parameters are ready for final submission.', screen: 'MPCS_REVIEW' };

  const monthlyParams = [
    { id: 'MPCS_EVIDENCE', title: 'Digital Evidence', done: isEvidenceCaptured(evidenceStatus), na: false },
    { id: 'MPCS_SALES', title: 'Sales & Deposit', done: salesStatus?.startsWith('COMPLETED'), na: false },
    { id: 'MPCS_BUSINESS', title: 'Business Performance', done: businessStatus?.startsWith('COMPLETED'), na: false },
    { id: 'MPCS_LOAN_STATUS', title: 'Loan Status', done: loanIsActive && loanStatus?.startsWith('COMPLETED'), na: !loanIsActive },
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroon} />

      <View style={styles.header}>
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
        <Text style={styles.headerSubtitle}>
          {formatGpuLabel(district) || 'Location Not Set'} · {reportStatus}
        </Text>
      </View>

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
                <Text style={styles.progressMonth}>{reportingMonth || 'Current Month'}</Text>
                <Text style={styles.progressFraction}>{completedCount}/{totalCount}</Text>
              </View>
              <View style={styles.segmentRow}>
                {Array.from({ length: totalCount }).map((_, i) => (
                  <View key={i} style={[styles.segment, i < completedCount && styles.segmentDone]} />
                ))}
              </View>
            </View>

            <Text style={styles.sectionLabel}>ON SITE NOW</Text>
            <View style={styles.onSiteCard}>
              <Text style={styles.onSiteTitle}>{nextAction.title}</Text>
              <Text style={styles.onSiteDesc}>{nextAction.desc}</Text>
              <Pressable
                style={({ pressed }) => [styles.onSiteBtn, pressed && { opacity: 0.9 }]}
                onPress={() => onNavigateScreen && onNavigateScreen(nextAction.screen)}
              >
                <Text style={styles.onSiteBtnText}>{NEXT_ACTION_BUTTON_LABEL[nextAction.icon] || 'Open'}</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>PARAMETERS</Text>
            <View style={styles.listCard}>
              {monthlyParams.map((p, i) => (
                <Pressable
                  key={p.id}
                  style={[styles.listRow, i === monthlyParams.length - 1 && styles.listRowLast]}
                  onPress={() => onNavigateScreen && onNavigateScreen(p.id)}
                >
                  <Text style={styles.listRowTitle}>{p.title}</Text>
                  {p.na ? (
                    <Text style={styles.listRowDash}>—</Text>
                  ) : p.done ? (
                    <Text style={styles.listRowDone}>Done</Text>
                  ) : (
                    <View style={styles.openPill}>
                      <Text style={styles.openPillText}>OPEN</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
                </Pressable>
              ))}
            </View>

            {/* Cash Book / CSC Transactions are day-to-day ledgers with no
                fixed spot in the monthly wizard above — the highest-frequency
                data entry in the app, previously reachable only two taps deep
                via More. Shortcut here on the tab actually opened most often,
                full entry still also lives in More as a fallback path. */}
            <Text style={styles.sectionLabel}>DAILY LEDGERS</Text>
            <View style={styles.listCard}>
              <Pressable style={styles.listRow} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_DAILY_TRANS')}>
                <View style={styles.ledgerIconBox}>
                  <MaterialCommunityIcons name="notebook-outline" size={18} color={COLORS.maroon} />
                </View>
                <Text style={styles.listRowTitle}>Cash Book</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
              </Pressable>
              <Pressable style={[styles.listRow, styles.listRowLast]} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_CSC_TRANS')}>
                <View style={[styles.ledgerIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="laptop" size={18} color="#0369A1" />
                </View>
                <Text style={styles.listRowTitle}>CSC Transactions</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
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
                      <Text style={styles.listRowTitle}>{r.title}</Text>
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
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
    paddingVertical: 10,
    alignItems: 'center',
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
    alignItems: 'center',
    marginBottom: 14,
  },
  progressMonth: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  progressFraction: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.maroon,
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
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: -2,
  },
  onSiteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.maroon,
    padding: 16,
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
    marginBottom: 14,
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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listRowTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  listRowDone: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  listRowDash: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  ledgerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.amber50,
    alignItems: 'center',
    justifyContent: 'center',
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
