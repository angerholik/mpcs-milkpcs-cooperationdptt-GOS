import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, StatusBar, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';
import { getMpcsDailyTransactions, getMpcsCscTransactions } from '../../supabase';

// Redesign source: a reference mockup (code.html + screen.png) the user
// supplied directly — exact Tailwind "brand"/"surface" palette, spacing,
// and motion reproduced 1:1 below (pulsing notification dot, press-scale
// on the primary buttons, blurred ambient glow behind the header/on-site
// card). Deliberately kept scoped to Home — Master Data, Cash Book, CSC
// Transactions, Profile, and More all moved to a flat maroon/cream system
// earlier in this pass, and that decision stands; Home is the one screen
// where this richer treatment was explicitly requested.
//
// Two departures from the mockup's literal copy, both to avoid asserting
// something the app doesn't actually know:
//  - Daily Ledgers' stat lines are real counts/totals from the same
//    getMpcsDailyTransactions/getMpcsCscTransactions calls the Cash Book
//    and CSC Transactions screens themselves use, not the mockup's
//    fictional "Reconciled" / "Gateway Active" status words.
//  - The progress card's "next" segment gets the mockup's partial-fill
//    treatment as a pure style accent (it's not asserting a measured
//    percentage), same idea as a generic progress spinner's resting state.
const COLORS = {
  // Exact hex values from the reference's Tailwind config (brand.500-900,
  // surface.50-300) — note 500 is the lightest of the "dark" shades and
  // 900 the darkest, matching the reference's own scale rather than a
  // conventional 50(light)->900(dark) ramp.
  brand50: '#FDF2F2',
  brand100: '#FDE8E8',
  brand500: '#9B1C1C',
  brand600: '#771D1D',
  brand700: '#641B1B',
  brand800: '#4D1414',
  brand900: '#380F0F',
  surface50: '#FBFBFC',
  surface100: '#F4F5F7',
  surface200: '#E9EBEF',
  surface300: '#D7DAE2',
  ink: '#0F172A', // slate-900 equivalent
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  rose50: '#FFF1F2',
  rose200: '#FECDD3',
  rose500: '#F43F5E',
  rose700: '#BE123C',
  emerald50: '#ECFDF5',
  emerald200: '#A7F3D0',
  emerald600: '#059669',
  emerald700: '#047857',
  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber800: '#92400E',
  amber900: '#78350F',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  sky50: '#F0F9FF',
  sky100: '#E0F2FE',
  sky700: '#0369A1',
};

const FONT_FAMILY = 'Manrope';

// The header/on-site card ambient glow uses a real CSS blur on web (same
// conditional pattern already used elsewhere in this app for the
// Kanchenjunga photo filter) — React Native itself has no blur primitive,
// and on native the plain translucent circle underneath still reads fine
// without it.
const blurStyle = (px) => (Platform.OS === 'web' ? { filter: `blur(${px}px)` } : {});

// Approximates the reference's two-layer soft-card/shadow-sm boxShadow
// tokens using RN's own shadow* props — react-native-web translates these
// specific prop names to a real CSS box-shadow automatically, unlike an
// arbitrary `boxShadow` style key (which RN-Web silently drops; only a
// fixed set of style props, e.g. `filter`, pass through unrecognized).
// RN only renders one shadow layer, so this is a single-layer stand-in
// for the reference's two-layer shadow, tuned to read the same at a
// glance; `elevation` covers the Android native equivalent.
const softCardShadow = { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 };
const lightShadow = { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 };

// Smooth press depth (scale) used on every tappable card/row/button below —
// matches the reference's blanket `transition duration-150` on interactive
// elements instead of an instant style swap. Drop-in for a plain
// `<Pressable style={({pressed}) => [...]}>` — `style` carries the full
// visual style (static + pressed-state) exactly as it would on Pressable
// itself; this just also animates a scale transform smoothly on press.
function PressScale({ style, children, scaleTo = 0.97, onPress, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} {...rest}>
      {(state) => (
        <Animated.View style={[typeof style === 'function' ? style(state) : style, { transform: [{ scale }] }]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

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
  'camera-outline': 'Open Camera',
  'file-check-outline': 'Review',
};

// Fixed icon/color per parameter type (not per completion state) — matches
// the reference's per-row identity (Digital Evidence stays rose whether
// open or done; Loan Status stays slate when not applicable).
const PARAM_STYLE = {
  MPCS_EVIDENCE: { icon: 'image-outline', bg: COLORS.rose50, border: 'rgba(254,205,213,0.6)', fg: COLORS.rose500 },
  MPCS_SALES: { icon: 'chart-donut', bg: COLORS.emerald50, border: COLORS.emerald200, fg: COLORS.emerald600 },
  MPCS_BUSINESS: { icon: 'chart-bar', bg: COLORS.emerald50, border: COLORS.emerald200, fg: COLORS.emerald600 },
  MPCS_LOAN_STATUS: { icon: 'file-document-outline', bg: COLORS.slate100, border: 'rgba(226,232,240,0.8)', fg: COLORS.slate500 },
};

// Same 2.5s ease-in-out pulse as the reference's `animate-pulse-subtle`
// keyframe (opacity 1<->0.6, scale 1<->0.92) — loops for as long as the
// screen is mounted and there's an unread alert to draw attention to.
function usePulse(active) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { pulse.setValue(0); return undefined; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1250, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1250, easing: Easing.bezier(0.4, 0, 0.6, 1), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);
  return {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }],
  };
}

// The segmented Monthly/Master/Member switcher's active pill fades/scales
// in smoothly instead of snapping, matching the reference's blanket
// `transition duration-150` on interactive chrome.
function TabButton({ label, active, onPress }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: active ? 1 : 0, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
  }, [active]);
  const bgColor = progress.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0)', '#ffffff'] });
  const textColor = progress.interpolate({ inputRange: [0, 1], outputRange: [COLORS.slate600, COLORS.brand700] });
  const dotScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Animated.View style={[styles.tabBtn, { backgroundColor: bgColor }]}>
        <Animated.Text style={[styles.tabText, { color: textColor, fontWeight: active ? '700' : '600' }]}>{label}</Animated.Text>
        <Animated.View style={[styles.tabDot, { transform: [{ scale: dotScale }] }]} />
      </Animated.View>
    </Pressable>
  );
}

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
  const [ledgersRefreshing, setLedgersRefreshing] = useState(false);

  const activeSocietyName = selectedSociety?.name || societyName;
  const bellPulse = usePulse(!!activeAlert);

  const loadLedgerStats = async () => {
    if (!activeSocietyName) return;
    const [{ data: daily }, { data: csc }] = await Promise.all([
      getMpcsDailyTransactions(activeSocietyName),
      getMpcsCscTransactions(activeSocietyName),
    ]);
    setCashBookStats({
      count: daily.length,
      total: daily.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
    });
    setCscStats({
      count: csc.length,
      commission: csc.reduce((s, t) => s + (parseFloat(t.commission) || 0), 0),
    });
  };

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
      setCashBookStats({ count: daily.length, total: daily.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0) });
      setCscStats({ count: csc.length, commission: csc.reduce((s, t) => s + (parseFloat(t.commission) || 0), 0) });
    })();
    return () => { cancelled = true; };
  }, [activeSocietyName]);

  const handleSyncToday = async () => {
    setLedgersRefreshing(true);
    await loadLedgerStats();
    setLedgersRefreshing(false);
  };

  const nextAction = (!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid'))
    ? { icon: 'camera-outline', title: 'Digital Evidence', desc: 'Capture geo-tagged live photo & premises snapshot required for physical verification.', screen: 'MPCS_EVIDENCE', id: 'MPCS_EVIDENCE' }
    : !salesStatus?.startsWith('COMPLETED')
      ? { icon: 'wallet-outline', title: 'Monthly Sales / Deposit', desc: 'Record daily sales and verify bank deposits.', screen: 'MPCS_SALES', id: 'MPCS_SALES' }
      : !businessStatus?.startsWith('COMPLETED')
        ? { icon: 'chart-bar', title: 'Business Performance', desc: 'Record gross income and operational expenditure.', screen: 'MPCS_BUSINESS', id: 'MPCS_BUSINESS' }
        : { icon: 'file-check-outline', title: 'Review & Submit Return', desc: 'All monthly parameters are ready for final submission.', screen: 'MPCS_REVIEW', id: 'MPCS_REVIEW' };
  const nextActionStyle = PARAM_STYLE[nextAction.id] || { bg: COLORS.brand50, border: COLORS.brand100, fg: COLORS.brand700 };

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
  const readyPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pendingCount = totalCount - completedCount;

  const cashBookSub = cashBookStats
    ? `${cashBookStats.count} ${cashBookStats.count === 1 ? 'entry' : 'entries'} · ₹${formatWhole(cashBookStats.total)}`
    : 'Tap to open';
  const cscSub = cscStats
    ? `${cscStats.count} ${cscStats.count === 1 ? 'entry' : 'entries'} · ₹${formatWhole(cscStats.commission)} commission`
    : 'Tap to open';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand900} />

      <LinearGradient
        colors={['#6E1818', '#5C1313', '#4F1111']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerBlobTop, blurStyle(28)]} pointerEvents="none" />
        <View style={[styles.headerBlobBottom, blurStyle(20)]} pointerEvents="none" />

        <View style={styles.headerTopRow}>
          <Pressable onPress={onManageInstitutions} hitSlop={8} style={styles.headerBrandGroup}>
            <View style={styles.headerBrandBox} />
            <Text style={styles.headerWordmark}>CORE</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <PressScale onPress={onNotifyPress} hitSlop={8} scaleTo={0.88} style={({ pressed }) => [styles.headerIconBtn, pressed && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name="bell-outline" size={18} color="rgba(255,255,255,0.9)" />
              {activeAlert ? <Animated.View style={[styles.headerDot, bellPulse]} /> : null}
            </PressScale>
            <PressScale onPress={onProfilePress} hitSlop={8} scaleTo={0.9}>
              <LinearGradient colors={[COLORS.amber200, '#FB7185']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{roleInitials}</Text>
              </LinearGradient>
            </PressScale>
          </View>
        </View>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {selectedSociety?.name || societyName || 'Society Name Missing'}
        </Text>
        <View style={styles.headerMetaRow}>
          <View style={styles.headerMetaChip}>
            <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.amber200} />
            <Text style={styles.headerMetaChipText}>{formatGpuLabel(district) || 'Location Pending'}</Text>
          </View>
          <Text style={styles.headerMetaDot}>•</Text>
          <Text style={styles.headerMetaStatus}>
            {pendingCount === 0 ? 'MONTHLY PARAMS READY' : `${completedCount}/${totalCount} MONTHLY PARAMS READY`}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>

        <View style={styles.tabBar}>
          {[
            { key: 'monthly', label: 'Monthly' },
            { key: 'master', label: 'Master' },
            { key: 'member', label: 'Member' },
          ].map((t) => (
            <TabButton key={t.key} label={t.label} active={internalTab === t.key} onPress={() => setInternalTab(t.key)} />
          ))}
        </View>

        {alertVisible && activeAlert ? (
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <MaterialCommunityIcons name="alert-outline" size={16} color={COLORS.amber800} />
            </View>
            <Text style={styles.alertText}>{activeAlert?.message || activeAlert?.text}</Text>
            <Pressable onPress={() => setAlertVisible(false)} hitSlop={8} style={styles.alertCloseBtn}>
              <MaterialCommunityIcons name="close" size={16} color={COLORS.amber800} />
            </Pressable>
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
                <View style={styles.progressFractionRow}>
                  <Text style={styles.progressFraction}>{completedCount}</Text>
                  <Text style={styles.progressFractionSlash}> / {totalCount}</Text>
                </View>
              </View>
              <View style={styles.segmentRow}>
                {Array.from({ length: totalCount }).map((_, i) => {
                  const isNext = i === completedCount && pendingCount > 0;
                  return (
                    <View key={i} style={[styles.segment, i < completedCount && styles.segmentDone]}>
                      {isNext && <View style={styles.segmentNextFill} />}
                    </View>
                  );
                })}
              </View>
              <View style={styles.progressFootRow}>
                <View style={styles.progressFootReady}>
                  <MaterialCommunityIcons name="check" size={12} color={COLORS.emerald600} />
                  <Text style={styles.progressFootReadyText}>{readyPercent}% Ready</Text>
                </View>
                <Text style={styles.progressFootPending}>
                  {pendingCount > 0 ? `${pendingCount} pending task${pendingCount === 1 ? '' : 's'}` : 'All parameters ready'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>On Site Now</Text>
            </View>
            <View style={styles.onSiteCard}>
              <View style={[styles.onSiteBlob, blurStyle(24)]} pointerEvents="none" />
              <View style={styles.onSiteTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.onSiteTitle}>{nextAction.title}</Text>
                  <Text style={styles.onSiteDesc}>{nextAction.desc}</Text>
                </View>
                <View style={[styles.onSiteIconBox, { backgroundColor: nextActionStyle.bg, borderColor: nextActionStyle.border }]}>
                  <MaterialCommunityIcons name={nextAction.icon} size={20} color={nextActionStyle.fg} />
                </View>
              </View>
              <PressScale
                style={({ pressed }) => [styles.onSiteBtn, pressed && { opacity: 0.92 }]}
                scaleTo={0.98}
                onPress={() => onNavigateScreen && onNavigateScreen(nextAction.screen)}
              >
                <MaterialCommunityIcons name={nextAction.icon} size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.onSiteBtnText}>{NEXT_ACTION_BUTTON_LABEL[nextAction.icon] || 'Open'}</Text>
              </PressScale>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Parameters</Text>
              <Text style={styles.sectionCount}>{monthlyParams.length} Items</Text>
            </View>
            <View style={styles.listCard}>
              {monthlyParams.map((p, i) => {
                const style = PARAM_STYLE[p.id] || { icon: 'circle-outline', bg: COLORS.slate100, border: COLORS.slate200, fg: COLORS.slate500 };
                return (
                  <PressScale
                    key={p.id}
                    scaleTo={0.985}
                    style={({ pressed }) => [
                      styles.listRow,
                      i === monthlyParams.length - 1 && styles.listRowLast,
                      pressed && { backgroundColor: COLORS.slate100 },
                    ]}
                    onPress={() => onNavigateScreen && onNavigateScreen(p.id)}
                  >
                    <View style={[styles.paramIconBox, { backgroundColor: style.bg, borderColor: style.border }]}>
                      <MaterialCommunityIcons name={style.icon} size={19} color={style.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{p.title}</Text>
                      <Text style={styles.listRowDesc}>{p.desc}</Text>
                    </View>
                    {p.na ? (
                      <View style={styles.dashPill}>
                        <Text style={styles.dashPillText}>—</Text>
                      </View>
                    ) : p.done ? (
                      <View style={styles.doneBadge}>
                        <MaterialCommunityIcons name="check" size={11} color={COLORS.emerald700} />
                        <Text style={styles.doneBadgeText}>Done</Text>
                      </View>
                    ) : (
                      <View style={styles.openPill}>
                        <Text style={styles.openPillText}>OPEN</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                  </PressScale>
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Daily Ledgers</Text>
              <PressScale onPress={handleSyncToday} hitSlop={8} scaleTo={0.92} style={styles.syncBtn}>
                <Text style={styles.syncBtnText}>{ledgersRefreshing ? 'Syncing…' : 'Sync Today'}</Text>
                <MaterialCommunityIcons name="sync" size={12} color={COLORS.brand700} />
              </PressScale>
            </View>
            <View style={styles.ledgerGrid}>
              <PressScale scaleTo={0.97} style={({ pressed }) => [styles.ledgerCard, pressed && { backgroundColor: COLORS.slate50 }]} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_DAILY_TRANS')}>
                <View style={styles.ledgerCardTopRow}>
                  <View style={[styles.ledgerIconBox, { backgroundColor: COLORS.rose50, borderColor: 'rgba(254,205,213,0.6)' }]}>
                    <MaterialCommunityIcons name="book-open-variant" size={19} color={COLORS.brand700} />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                </View>
                <Text style={styles.ledgerCardTitle}>Cash Book</Text>
                <Text style={styles.ledgerCardSub}>{cashBookSub}</Text>
              </PressScale>
              <PressScale scaleTo={0.97} style={({ pressed }) => [styles.ledgerCard, pressed && { backgroundColor: COLORS.slate50 }]} onPress={() => onNavigateScreen && onNavigateScreen('MPCS_CSC_TRANS')}>
                <View style={styles.ledgerCardTopRow}>
                  <View style={[styles.ledgerIconBox, { backgroundColor: COLORS.sky50, borderColor: COLORS.sky100 }]}>
                    <MaterialCommunityIcons name="laptop" size={19} color={COLORS.sky700} />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                </View>
                <Text style={styles.ledgerCardTitle}>CSC Transactions</Text>
                <Text style={styles.ledgerCardSub}>{cscSub}</Text>
              </PressScale>
            </View>
          </>
        )}

        {internalTab === 'master' && (
          <>
            <PressScale
              scaleTo={0.98}
              style={({ pressed }) => [styles.card, pressed && { backgroundColor: COLORS.slate50 }]}
              onPress={() => onNavigateScreen && onNavigateScreen('MPCS_MASTER_DATA')}
            >
              <View style={styles.masterSummaryRow}>
                <Text style={styles.masterSummaryCount}>{masterRecords.length} master records</Text>
                {masterNeedsUpdate.length > 0 && (
                  <Text style={styles.masterSummaryNeed}>{masterNeedsUpdate.length} need update</Text>
                )}
              </View>
            </PressScale>

            {masterNeedsUpdate.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Needs Update</Text>
                </View>
                <View style={styles.listCard}>
                  {masterNeedsUpdate.map((r, i) => (
                    <PressScale
                      key={r.title}
                      scaleTo={0.985}
                      style={({ pressed }) => [
                        styles.listRow,
                        i === masterNeedsUpdate.length - 1 && styles.listRowLast,
                        pressed && { backgroundColor: COLORS.slate100 },
                      ]}
                      onPress={() => onNavigateScreen && onNavigateScreen(r.id)}
                    >
                      <Text style={[styles.listRowTitle, { flex: 1 }]}>{r.title}</Text>
                      <View style={styles.openPill}>
                        <Text style={styles.openPillText}>UPDATE</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
                    </PressScale>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {internalTab === 'member' && (
          <PressScale
            scaleTo={0.98}
            style={({ pressed }) => [styles.card, pressed && { backgroundColor: COLORS.slate50 }]}
            onPress={() => onNavigateScreen && onNavigateScreen('MPCS_MEMBERS')}
          >
            <View style={styles.masterSummaryRow}>
              <Text style={styles.masterSummaryCount}>Registered members</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.slate400} />
            </View>
          </PressScale>
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
    backgroundColor: COLORS.surface100,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerBlobTop: {
    position: 'absolute',
    top: -80,
    right: -64,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerBlobBottom: {
    position: 'absolute',
    bottom: -48,
    left: '22%',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(244,63,94,0.1)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBrandBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerWordmark: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber200,
    borderWidth: 2,
    borderColor: '#5C1313',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  headerAvatarText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
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
    flexWrap: 'wrap',
  },
  headerMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerMetaChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  headerMetaDot: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '300',
  },
  headerMetaStatus: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226,232,240,0.8)',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate600,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.brand600,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,251,235,0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.8)',
    padding: 14,
    ...lightShadow,
  },
  alertIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(254,243,199,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.amber900,
    lineHeight: 17,
    paddingRight: 16,
  },
  alertCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    padding: 16,
    ...softCardShadow,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  progressMonth: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  progressFractionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressFraction: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.brand700,
    letterSpacing: -0.4,
  },
  progressFractionSlash: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate400,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.slate200,
    overflow: 'hidden',
  },
  segmentDone: {
    backgroundColor: COLORS.brand700,
  },
  segmentNextFill: {
    height: '100%',
    width: '33%',
    borderRadius: 4,
    backgroundColor: COLORS.slate300,
  },
  progressFootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  progressFootReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressFootReadyText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.emerald600,
  },
  progressFootPending: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.brand700,
  },
  onSiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(100,27,27,0.25)',
    padding: 16,
    overflow: 'hidden',
    ...softCardShadow,
  },
  onSiteBlob: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: COLORS.brand50,
  },
  onSiteTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  onSiteIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onSiteTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  onSiteDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    lineHeight: 17,
  },
  onSiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand700,
    borderRadius: 12,
    paddingVertical: 14,
  },
  onSiteBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    overflow: 'hidden',
    ...softCardShadow,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  paramIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRowTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  listRowDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.slate400,
    marginTop: 2,
  },
  dashPill: {
    width: 36,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dashPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate400,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: COLORS.emerald200,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 4,
  },
  doneBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.emerald700,
  },
  ledgerGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  ledgerCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    padding: 16,
    ...lightShadow,
  },
  ledgerCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ledgerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerCardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  ledgerCardSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 12,
    lineHeight: 17,
  },
  openPill: {
    backgroundColor: COLORS.rose50,
    borderWidth: 1,
    borderColor: 'rgba(254,205,213,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 4,
  },
  openPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.rose700,
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
    color: COLORS.brand700,
  },
});
