import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Image, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';
import HeaderNav from '../HeaderNav';

// Same Kanchenjunga photo used in every header, at a much lower opacity so
// it reads as a faint page watermark behind the (mostly white/card-covered)
// scroll content rather than competing with it.
const pageBgPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.05, filter: 'grayscale(1) contrast(1.1)' }
  : { opacity: 0.035 };

// STITCH Design Tokens (New Iteration)
const COLORS = {
  background: "#fcf8fa",
  surface: "#ffffff",
  primary: "#7a1a1f",
  primaryDark: "#4a1017",
  onSurface: "#1b1b1d",
  slate800: "#1e293b",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  amber50: "#fffbeb",
  amber100: "#fef3c7",
  amber600: "#d97706",
  amber700: "#b45309",
  amber800: "#92400e",
  amber900: "#78350f",
  emerald50: "#ecfdf5",
  emerald100: "#d1fae5",
  emerald500: "#10b981",
  emerald700: "#047857",
  red50: "#fef2f2",
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

// Master Data Directory "Last updated" — previously hardcoded per-item
// placeholder strings that never reflected an actual save.
const formatLastUpdated = (isoString) => {
  if (!isoString) return 'Needs update';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Needs update';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function HomeScreen({
  activeModule = 'MILK',
  onSwitchModule,
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
  cscTransStatus = "NOT COMPLETED",
  activitiesStatus = "0 ENTRIES",
  loanIsActive = false,
  loanStatus = "NOT APPLICABLE",
  cscIsActive = false,
  masterDataUpdated = {},
  lastUpdated = "",
  activeAlert,
  onDismissAlert,
  selectedSociety,
  institutionsList,
  onSelectSociety,
  onManageInstitutions,
  onNavigateScreen,
  hasSubmittedMonthlyParams = false,
  onNotifyPress,
  onProfilePress,
  role,
  activeTab = 'home',
  onTabPress
}) {
  const [internalTab, setInternalTab] = useState('monthly');
  const [alertVisible, setAlertVisible] = useState(true);

  const nextAction = (!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid'))
    ? { icon: 'image-outline', title: 'Digital Evidence (Live Visit)', desc: 'Capture a live visit photo & GPS coordinates.', screen: 'MPCS_EVIDENCE' }
    : !salesStatus?.startsWith('COMPLETED')
      ? { icon: 'wallet-outline', title: 'Monthly Sales / Deposit', desc: 'Record daily sales and verify bank deposits.', screen: 'MPCS_SALES' }
      : (activitiesStatus === '0 ENTRIES' || activitiesStatus === 'NOT COMPLETED')
        ? { icon: 'calendar-check-outline', title: 'Activities & Events Log (Live Visit)', desc: 'Record your field visit and activities for today.', screen: 'MPCS_ACTIVITIES' }
        : { icon: 'file-check-outline', title: 'Review & Submit Return', desc: 'All monthly parameters are ready for final submission.', screen: 'MPCS_REVIEW' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <Image
        source={require('../../../assets/core/kanchenjunga.jpg')}
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, pageBgPhotoFilter]}
        resizeMode="cover"
        pointerEvents="none"
      />

      <HeaderNav
        activeModule={activeModule}
        selectedSociety={selectedSociety}
        institutionsList={institutionsList}
        onSelectSociety={onSelectSociety}
        onManageInstitutions={onManageInstitutions}
        onSwitchModule={onSwitchModule}
        onMenuPress={onManageInstitutions}
        onNotifyPress={onNotifyPress}
        onProfilePress={onProfilePress}
        unreadCount={activeAlert ? 1 : 0}
        role={role}
      />

      {/* Sticky Action Banner at Top */}
      {alertVisible && (
        <View style={styles.stickyActionBanner}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
              <MaterialCommunityIcons name="alert-outline" size={20} color={COLORS.amber700} />
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>Action Required</Text>
              <Text style={styles.alertText}>
                {activeAlert?.message || activeAlert?.text || 'Please review pending monthly submissions before the 15th to avoid operational flags.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.alertCloseBtn} onPress={() => setAlertVisible(false)}>
              <MaterialCommunityIcons name="close" size={18} color="rgba(180, 83, 9, 0.6)" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>


        {/* Society Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.societyTitle}>{selectedSociety?.name || societyName || 'Society Name Missing'}</Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.slate400} />
                <Text style={styles.societyLocation}>{formatGpuLabel(district) || 'Location Not Set'}</Text>
              </View>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewGridItem}>
              <Text style={styles.gridLabel}>REGISTRATION NUMBER</Text>
              <Text style={styles.gridValue}>{selectedSociety?.regNo || centerId || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Current Reporting Period */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.reportTitle}>Current Reporting Period</Text>
              <Text style={styles.reportSubtitle}>{reportingMonth || 'Current Month'}</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {reportStatus === 'MONTHLY PARAMS OK'
                  ? `MONTHLY PARAMETERS SUBMITTED (${progressPercent}% OF BASE)`
                  : 'OVERALL COMPLETION'}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: '#dc2626' },
                Platform.OS === 'web' && { filter: 'drop-shadow(0 0 8px rgba(122,26,31,0.5))', backgroundImage: 'linear-gradient(to right, #dc2626, #be123c, #7a1a1f)' }
              ]} />
            </View>
            <View style={styles.progressFooterRow}>
              <Text style={styles.progressFooterText}>{completedCount} of {totalCount} parameters submitted</Text>
              <Text style={styles.progressFooterText}>{Math.max(totalCount - completedCount, 0)} pending</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ hovered, pressed }) => [
            styles.nextActionWrapper,
            pressed && { transform: [{ scale: 0.98 }] },
            hovered && { opacity: 0.95 }
          ]}
          onPress={() => onNavigateScreen && onNavigateScreen(nextAction.screen)}
        >
          {({ hovered }) => (
            <LinearGradient
              colors={['#7a1a1f', '#4a1017']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.nextActionCard,
                hovered && { shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }
              ]}
            >
              <Text style={styles.nextActionLabel}>NEXT REQUIRED ACTION</Text>
              <View style={styles.nextActionRow}>
                <View style={styles.nextActionIconBox}>
                  <MaterialCommunityIcons name={nextAction.icon} size={22} color="#ffffff" />
                </View>
                <View style={styles.nextActionTextCol}>
                  <Text style={styles.nextActionTitle}>{nextAction.title}</Text>
                  <Text style={styles.nextActionDesc}>{nextAction.desc}</Text>
                </View>
                <View style={[styles.nextActionArrowBtn, hovered && { transform: [{ translateX: 2 }] }]}>
                  <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
                </View>
              </View>
            </LinearGradient>
          )}
        </Pressable>

        {/* Quick Actions — surfaces the two anytime ledgers (CSC / Daily
            Transactions), which have no fixed home in the monthly wizard
            since they can be logged any day. Sits above the tab switcher so
            it stays visible regardless of which tab is selected, rather
            than disappearing when the user switches to Master/Member Data. */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Get started with your most common tasks</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={({ hovered }) => [
                styles.quickActionCard,
                Platform.OS === 'web' && { transition: 'all 0.3s' },
                hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
              ]}
              onPress={() => onNavigateScreen && onNavigateScreen('MPCS_DAILY_TRANS')}
            >
              <View style={styles.quickActionTopRow}>
                <View style={[styles.quickActionIconBox, { backgroundColor: COLORS.red50 }]}>
                  <MaterialCommunityIcons name="notebook-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.quickActionArrowBtn}>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.slate800} />
                </View>
              </View>
              <Text style={styles.quickActionTitle}>MPCS Daily Transactions</Text>
              <Text style={styles.quickActionDesc}>Record today's cash-book entries as they happen.</Text>
            </Pressable>

            <Pressable
              style={({ hovered }) => [
                styles.quickActionCard,
                Platform.OS === 'web' && { transition: 'all 0.3s' },
                hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
              ]}
              onPress={() => onNavigateScreen && onNavigateScreen('MPCS_CSC_TRANS')}
            >
              <View style={styles.quickActionTopRow}>
                <View style={[styles.quickActionIconBox, { backgroundColor: '#e0f2fe' }]}>
                  <MaterialCommunityIcons name="laptop" size={22} color="#0369a1" />
                </View>
                <View style={styles.quickActionArrowBtn}>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.slate800} />
                </View>
              </View>
              <Text style={styles.quickActionTitle}>CSC Transactions</Text>
              <Text style={styles.quickActionDesc}>
                {cscIsActive ? 'Record and review CSC service transactions.' : 'No active CSC on record for this society.'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs Grid */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, internalTab === 'monthly' && styles.tabBtnActive]}
            onPress={() => setInternalTab('monthly')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, internalTab === 'monthly' && styles.tabTextActive]}>Monthly Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, internalTab === 'master' && styles.tabBtnActive]}
            onPress={() => setInternalTab('master')}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabText, internalTab === 'master' && styles.tabTextActive]}>Master Data</Text>
          </TouchableOpacity>
          {/* Member Data is a standalone roster, not one of the Master Data
              tiles — tapping it navigates straight to the screen rather than
              switching internalTab, since there's nothing to show inline here. */}
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => onNavigateScreen && onNavigateScreen('MPCS_MEMBERS')}
            activeOpacity={0.9}
          >
            <Text style={styles.tabText}>Member Data</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Data Section */}
        {internalTab === 'monthly' && (
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Monthly Data Entries</Text>
              <Text style={styles.sectionSubtitle}>Track the status of your monthly submissions</Text>

              <View style={styles.masterListContainer}>
                {[
                  { id: 'MPCS_EVIDENCE', title: 'Digital Evidence', icon: 'image-outline', desc: 'Live visit evidence: photo & GPS coordinates.', status: evidenceStatus || 'NOT CAPTURED', done: isEvidenceCaptured(evidenceStatus) },
                  { id: 'MPCS_SALES', title: 'Sales & Deposit', icon: 'wallet-outline', desc: salesStatus?.startsWith('COMPLETED') ? 'Monthly parameter saved.' : 'Record daily sales and verify bank deposits.', status: salesStatus, done: salesStatus?.startsWith('COMPLETED') },
                  { id: 'MPCS_BUSINESS', title: 'Business Performance', icon: 'chart-bar', desc: businessStatus?.startsWith('COMPLETED') ? 'P&L metrics saved.' : 'KPI metrics and overall performance assessment.', status: businessStatus, done: businessStatus?.startsWith('COMPLETED') },
                  { id: 'MPCS_LOAN_STATUS', title: 'Loan Status', icon: 'bank-outline', desc: loanIsActive ? "Report this month's loan recovery." : 'No active loan on record for this society.', status: loanIsActive ? loanStatus : 'NOT APPLICABLE', done: loanIsActive && loanStatus?.startsWith('COMPLETED'), na: !loanIsActive },
                ].map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ hovered }) => [
                      styles.masterListItem,
                      Platform.OS === 'web' && { transition: 'all 0.3s' },
                      hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                    ]}
                    onPress={() => onNavigateScreen && onNavigateScreen(item.id)}
                  >
                    {({ hovered }) => (
                      <>
                        <View style={styles.masterListLeft}>
                          <View style={[
                            styles.masterListIcon,
                            { backgroundColor: item.done ? COLORS.emerald50 : item.na ? COLORS.slate50 : COLORS.amber50, borderColor: item.done ? '#a7f3d0' : item.na ? COLORS.slate100 : 'rgba(254,243,199,0.5)' },
                            Platform.OS === 'web' && { transition: 'all 0.3s' },
                          ]}>
                            <MaterialCommunityIcons name={item.icon} size={20} color={item.done ? COLORS.emerald700 : item.na ? COLORS.slate400 : COLORS.amber600} />
                          </View>
                          <View style={{flex: 1}}>
                            <Text style={[styles.masterListTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>{item.title}</Text>
                            <View style={styles.masterListSubRow}>
                              <Text style={styles.masterListSub}>{item.desc}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.statusPill, {backgroundColor: item.done ? COLORS.emerald50 : item.na ? COLORS.slate100 : COLORS.amber50, borderColor: item.done ? 'rgba(16,185,129,0.3)' : item.na ? 'rgba(226,232,240,0.5)' : 'rgba(254,243,199,0.5)', flexDirection: 'row', alignItems: 'center', gap: 4}]}>
                          <Text style={[styles.statusPillText, {color: item.done ? COLORS.emerald700 : item.na ? COLORS.slate500 : COLORS.amber700}]}>
                            {item.status}
                          </Text>
                          {item.done && <MaterialCommunityIcons name="check" size={11} color={COLORS.emerald700} />}
                        </View>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Master Data Section */}
        {internalTab === 'master' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Master Data Directory</Text>
            <View style={styles.masterListContainer}>
              {[
                // _VIEW ids open the screen standalone — no Save & Continue /
                // Previous chevron pulling the user into an adjacent section.
                // MPCS_LOAN is the terminal step (Save Master Data is its own
                // legitimate action, not a hop to somewhere else), so it
                // keeps the plain key.
                { id: 'MPCS_PROFILE_VIEW', title: 'Institutional Profile', icon: 'office-building-outline', updated: formatLastUpdated(masterDataUpdated.instProfile) },
                { id: 'MPCS_DEMOGRAPHICS_VIEW', title: 'Registered Demographics', icon: 'account-group-outline', updated: formatLastUpdated(masterDataUpdated.demographics) },
                { id: 'MPCS_COMPLIANCE_VIEW', title: 'Compliance Audit', icon: 'file-document-check-outline', updated: formatLastUpdated(masterDataUpdated.compliance) },
                { id: 'MPCS_FINANCIALS_VIEW', title: 'Financial Performance', icon: 'chart-line', updated: formatLastUpdated(masterDataUpdated.financials) },
                { id: 'MPCS_DIVIDEND_VIEW', title: 'Dividend Details', icon: 'cash-multiple', updated: formatLastUpdated(masterDataUpdated.dividend) },
                { id: 'MPCS_SHARE_CAPITAL_VIEW', title: 'Share Capital', icon: 'chart-pie', updated: formatLastUpdated(masterDataUpdated.shareCapital) },
                { id: 'MPCS_CSC_DETAILS_VIEW', title: 'CSC Details', icon: 'laptop', updated: formatLastUpdated(masterDataUpdated.csc) },
                { id: 'MPCS_LOAN', title: 'Loan Details', icon: 'bank-outline', updated: formatLastUpdated(masterDataUpdated.loan) }
              ].map((item, index) => (
                <Pressable 
                  key={item.id}
                  style={({ hovered }) => [
                    styles.masterListItem,
                    Platform.OS === 'web' && { transition: 'all 0.3s' },
                    hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                  ]}
                  onPress={() => onNavigateScreen && onNavigateScreen(item.id)}
                >
                  {({ hovered }) => (
                    <>
                      <View style={styles.masterListLeft}>
                        <View style={[
                          styles.masterListIcon,
                          Platform.OS === 'web' && { transition: 'all 0.3s' },
                          hovered && { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }
                        ]}>
                          <MaterialCommunityIcons name={item.icon} size={20} color={hovered ? '#7a1a1f' : COLORS.slate600} />
                        </View>
                        <View style={{flex: 1}}>
                          <Text style={[styles.masterListTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>{item.title}</Text>
                          <View style={styles.masterListSubRow}>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={12} color={COLORS.slate400} />
                            <Text style={styles.masterListSub}>Last updated: {item.updated}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.masterListRight}>
                        <View style={[
                          {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.slate50, borderWidth: 1, borderColor: COLORS.slate100},
                          Platform.OS === 'web' && { transition: 'all 0.3s' },
                          hovered && { backgroundColor: '#7a1a1f', borderColor: 'transparent' }
                        ]}>
                          <MaterialCommunityIcons 
                            name="arrow-right" 
                            size={18} 
                            color={hovered ? '#ffffff' : COLORS.slate400} 
                            style={[Platform.OS === 'web' && { transition: 'transform 0.3s' }, hovered && { transform: [{ translateX: 2 }] }]} 
                          />
                        </View>
                      </View>
                    </>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
        
        {/* Extra padding for bottom nav */}
        <View style={{height: 60}} />
      </ScrollView>

      <BottomNav activeTab={activeTab} onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  stickyActionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bgBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(122, 26, 31, 0.08)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(180, 83, 9, 0.06)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    top: '40%',
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(122, 26, 31, 0.05)',
    zIndex: -1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 12,
    gap: 12,
    paddingTop: 12,
    paddingBottom: 100, // Prevent BottomNav overlap
  },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.9)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.8)',
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    paddingRight: 8,
  },
  alertTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.amber900,
    marginBottom: 4,
  },
  alertText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(146, 64, 14, 0.9)',
    lineHeight: 20,
  },
  alertCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 2,
  },
  societyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.slate800,
    marginBottom: 2,
    letterSpacing: -0.18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  societyLocation: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(209,250,229,0.5)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald500,
  },
  activeBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.emerald700,
    letterSpacing: 1.2,
  },
  overviewGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 12,
    paddingLeft: 2,
    gap: 12,
  },
  overviewGridItem: {
    flex: 1,
  },
  gridLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  gridValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slate800,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate800,
    letterSpacing: -0.14,
  },
  reportSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate500,
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: COLORS.red50,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate500,
    letterSpacing: 1.2,
  },
  progressPercent: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.44,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressFooterText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  nextActionWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextActionCard: {
    borderRadius: 16,
    padding: 16,
  },
  nextActionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  nextActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextActionTextCol: {
    flex: 1,
  },
  nextActionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  nextActionDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 17,
  },
  nextActionArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(241,245,249,0.8)', // slate-100/80
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontWeight: '700',
    color: COLORS.slate800,
  },
  sectionContainer: {
    gap: 12, // gap-sm roughly
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
    paddingHorizontal: 8,
    marginBottom: 8,
    letterSpacing: -0.16,
  },
  sectionSubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  quickActionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.slate800,
    marginBottom: 4,
  },
  quickActionDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
    lineHeight: 15,
  },
  monthlyGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  moduleCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.0,
  },
  moduleCardTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
    marginBottom: 4,
  },
  moduleCardDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
    lineHeight: 18,
  },
  masterListContainer: {
    gap: 12,
  },
  masterListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  masterListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  masterListIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    backgroundColor: COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterListTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    marginBottom: 2,
  },
  masterListSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  masterListSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.slate500,
  },
  masterListRight: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
