import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '../BottomNav';

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

export default function HomeScreen({
  activeModule = 'MILK',
  onSwitchModule,
  societyName = "Khorong",
  centerId = "SOC-492-X",
  district = "District 4, Sector B",
  reportingMonth = "AUG 2024",
  reportStatus = "DRAFT",
  progressPercent = 20,
  completedCount = 0,
  totalCount = 5,
  evidenceStatus = "NOT CAPTURED",
  salesStatus = "NOT COMPLETED",
  businessStatus = "NOT COMPLETED",
  cscTransStatus = "NOT COMPLETED",
  activitiesStatus = "0 ENTRIES",
  loanIsActive = false,
  loanStatus = "NOT APPLICABLE",
  lastUpdated = "",
  activeAlert,
  onDismissAlert,
  selectedSociety,
  institutionsList,
  onSelectSociety,
  onManageInstitutions,
  onNavigateScreen,
  hasSubmittedMonthlyParams = false,
  activeTab = 'home',
  onTabPress
}) {
  const [internalTab, setInternalTab] = useState('monthly');
  const [alertVisible, setAlertVisible] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={onManageInstitutions}>
            <MaterialCommunityIcons name="menu" size={24} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>CORE</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.societySelector} onPress={onManageInstitutions}>
            <Text style={styles.societySelectorText}>{selectedSociety?.name || societyName || 'KHORONG'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifyBtn}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="rgba(255,255,255,0.9)" />
            <View style={styles.notifyDot} />
          </TouchableOpacity>
        </View>
      </View>

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

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>


        {/* Society Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={{flex: 1}}>
              <Text style={styles.societyTitle}>{selectedSociety?.name || societyName}</Text>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.slate400} />
                <Text style={styles.societyLocation}>{formatGpuLabel(district) || "Ranchi, Jharkhand"}</Text>
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
            <Text style={styles.reportTitle}>Current Reporting Period</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{reportingMonth || "AUG 2024"}</Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {reportStatus === 'MONTHLY PARAMS OK' ? 'MONTHLY PARAMS SUBMITTED (80% BASE)' : 'OVERALL COMPLETION'}
              </Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill, 
                { width: `${progressPercent}%`, backgroundColor: '#dc2626' },
                Platform.OS === 'web' && { filter: 'drop-shadow(0 0 8px rgba(122,26,31,0.5))', backgroundImage: 'linear-gradient(to right, #dc2626, #be123c, #7a1a1f)' }
              ]} />
            </View>
          </View>
        </View>

        <Pressable 
          style={({ hovered, pressed }) => [
            styles.nextStepBtnWrapper,
            pressed && { transform: [{ scale: 0.98 }] },
            hovered && { opacity: 0.95 }
          ]}
          onPress={() => {
            if (!onNavigateScreen) return;
            if (!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid')) {
              onNavigateScreen('MPCS_EVIDENCE');
            } else if (!salesStatus?.startsWith('COMPLETED')) {
              onNavigateScreen('MPCS_SALES');
            } else if (activitiesStatus === '0 ENTRIES' || activitiesStatus === 'NOT COMPLETED') {
              onNavigateScreen('MPCS_ACTIVITIES');
            } else {
              onNavigateScreen('MPCS_REVIEW');
            }
          }}
        >
          {({ hovered }) => (
            <LinearGradient
              colors={['#7a1a1f', '#4a1017']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.nextStepBtn,
                hovered && { shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }
              ]}
            >
              <Text style={styles.nextStepBtnText}>
                {(!isEvidenceCaptured(evidenceStatus) && !evidenceStatus?.includes('Valid'))
                  ? 'Next Step: Digital Evidence (Live Visit)'
                  : !salesStatus?.startsWith('COMPLETED')
                    ? 'Next Step: Monthly Sales / Deposit'
                    : activitiesStatus === '0 ENTRIES' || activitiesStatus === 'NOT COMPLETED'
                      ? 'Next Step: Activities & Events Log (Live Visit)'
                      : 'Next Step: Review & Submit Return'}
              </Text>
              <MaterialCommunityIcons 
                name="arrow-right" 
                size={18} 
                color="#ffffff" 
                style={hovered && { transform: [{ translateX: 4 }] }} 
              />
            </LinearGradient>
          )}
        </Pressable>

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
        </View>

        {/* Monthly Data Section */}
        {internalTab === 'monthly' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Monthly Data Entries</Text>
            
            <View style={styles.monthlyGrid}>
              {/* Digital Evidence */}
              <Pressable 
                style={({ hovered }) => [
                  styles.moduleCard,
                  Platform.OS === 'web' && { transition: 'all 0.3s' },
                  hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                ]}
                onPress={() => onNavigateScreen && onNavigateScreen('MPCS_EVIDENCE')}
              >
                {({ hovered }) => (
                  <>
                    <View style={styles.moduleCardHeader}>
                      <View style={[
                        styles.moduleIconBox, 
                        {backgroundColor: isEvidenceCaptured(evidenceStatus) ? COLORS.emerald50 : COLORS.slate50, borderColor: isEvidenceCaptured(evidenceStatus) ? '#a7f3d0' : COLORS.slate100},
                        Platform.OS === 'web' && { transition: 'all 0.3s' },
                        hovered && { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }
                      ]}>
                        <MaterialCommunityIcons name="image-outline" size={24} color={isEvidenceCaptured(evidenceStatus) ? COLORS.emerald700 : hovered ? '#7a1a1f' : COLORS.slate400} />
                      </View>
                      <View style={[styles.statusPill, {backgroundColor: isEvidenceCaptured(evidenceStatus) ? COLORS.emerald50 : COLORS.slate100, borderColor: isEvidenceCaptured(evidenceStatus) ? 'rgba(16,185,129,0.3)' : 'rgba(226,232,240,0.5)'}]}>
                        <Text style={[styles.statusPillText, {color: isEvidenceCaptured(evidenceStatus) ? COLORS.emerald700 : COLORS.slate500}]}>
                          {evidenceStatus || 'NOT CAPTURED'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.moduleCardTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>Digital Evidence</Text>
                    <Text style={styles.moduleCardDesc}>Live visit evidence: photo &amp; GPS coordinates.</Text>
                  </>
                )}
              </Pressable>

              {/* Sales & Deposit */}
              <Pressable 
                style={({ hovered }) => [
                  styles.moduleCard,
                  Platform.OS === 'web' && { transition: 'all 0.3s' },
                  hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                ]}
                onPress={() => onNavigateScreen && onNavigateScreen('MPCS_SALES')}
              >
                {({ hovered }) => (
                  <>
                    <View style={styles.moduleCardHeader}>
                      <View style={[
                        styles.moduleIconBox, 
                        {backgroundColor: salesStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.amber50, borderColor: salesStatus?.startsWith('COMPLETED') ? '#a7f3d0' : 'rgba(254,243,199,0.5)'},
                        Platform.OS === 'web' && { transition: 'all 0.3s' },
                        hovered && { backgroundColor: '#fef3c7', borderColor: '#fde68a' }
                      ]}>
                        <MaterialCommunityIcons name="wallet-outline" size={24} color={salesStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : COLORS.amber600} />
                      </View>
                      <View style={[styles.statusPill, {backgroundColor: salesStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.amber50, borderColor: salesStatus?.startsWith('COMPLETED') ? 'rgba(16,185,129,0.3)' : 'rgba(254,243,199,0.5)'}]}>
                        <Text style={[styles.statusPillText, {color: salesStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : COLORS.amber700}]}>
                          {salesStatus}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.moduleCardTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>Sales &amp; Deposit</Text>
                    <Text style={styles.moduleCardDesc}>
                      {salesStatus?.startsWith('COMPLETED') ? 'Monthly parameter saved.' : 'Record daily sales and verify bank deposits.'}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Business Performance */}
              <Pressable 
                style={({ hovered }) => [
                  styles.moduleCard,
                  Platform.OS === 'web' && { transition: 'all 0.3s' },
                  hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                ]}
                onPress={() => onNavigateScreen && onNavigateScreen('MPCS_BUSINESS')}
              >
                {({ hovered }) => (
                  <>
                    <View style={styles.moduleCardHeader}>
                      <View style={[
                        styles.moduleIconBox, 
                        {backgroundColor: businessStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.slate50, borderColor: businessStatus?.startsWith('COMPLETED') ? '#a7f3d0' : COLORS.slate100},
                        Platform.OS === 'web' && { transition: 'all 0.3s' },
                        hovered && { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }
                      ]}>
                        <MaterialCommunityIcons name="chart-bar" size={24} color={businessStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : hovered ? '#7a1a1f' : COLORS.slate400} />
                      </View>
                      <View style={[styles.statusPill, {backgroundColor: businessStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.slate100, borderColor: businessStatus?.startsWith('COMPLETED') ? 'rgba(16,185,129,0.3)' : 'rgba(226,232,240,0.5)'}]}>
                        <Text style={[styles.statusPillText, {color: businessStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : COLORS.slate500}]}>
                          {businessStatus}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.moduleCardTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>Business Performance</Text>
                    <Text style={styles.moduleCardDesc}>
                      {businessStatus?.startsWith('COMPLETED') ? 'P&L metrics saved.' : 'KPI metrics and overall performance assessment.'}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Loan Status */}
              <Pressable
                style={({ hovered }) => [
                  styles.moduleCard,
                  Platform.OS === 'web' && { transition: 'all 0.3s' },
                  hovered && { borderColor: '#cbd5e1', shadowOpacity: 0.08, elevation: 4 }
                ]}
                onPress={() => onNavigateScreen && onNavigateScreen('MPCS_LOAN_STATUS')}
              >
                {({ hovered }) => (
                  <>
                    <View style={styles.moduleCardHeader}>
                      <View style={[
                        styles.moduleIconBox,
                        {backgroundColor: !loanIsActive ? COLORS.slate50 : loanStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.amber50, borderColor: !loanIsActive ? COLORS.slate100 : loanStatus?.startsWith('COMPLETED') ? '#a7f3d0' : 'rgba(254,243,199,0.5)'},
                        Platform.OS === 'web' && { transition: 'all 0.3s' },
                        hovered && { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }
                      ]}>
                        <MaterialCommunityIcons name="bank-outline" size={24} color={!loanIsActive ? COLORS.slate400 : loanStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : COLORS.amber600} />
                      </View>
                      <View style={[styles.statusPill, {backgroundColor: !loanIsActive ? COLORS.slate100 : loanStatus?.startsWith('COMPLETED') ? COLORS.emerald50 : COLORS.amber50, borderColor: !loanIsActive ? 'rgba(226,232,240,0.5)' : loanStatus?.startsWith('COMPLETED') ? 'rgba(16,185,129,0.3)' : 'rgba(254,243,199,0.5)'}]}>
                        <Text style={[styles.statusPillText, {color: !loanIsActive ? COLORS.slate500 : loanStatus?.startsWith('COMPLETED') ? COLORS.emerald700 : COLORS.amber700}]}>
                          {loanIsActive ? loanStatus : 'NOT APPLICABLE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.moduleCardTitle, Platform.OS === 'web' && { transition: 'all 0.3s' }, hovered && { color: '#7a1a1f' }]}>Loan Status</Text>
                    <Text style={styles.moduleCardDesc}>
                      {loanIsActive ? 'Report this month\'s loan recovery.' : 'No active loan on record for this society.'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Master Data Section */}
        {internalTab === 'master' && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Master Data Directory</Text>
            <View style={styles.masterListContainer}>
              {[
                { id: 'MPCS_INST_PROFILE', title: 'Institutional Profile', icon: 'office-building-outline', updated: '12 Aug 2024' },
                { id: 'MPCS_DEMOGRAPHICS', title: 'Registered Demographics', icon: 'account-group-outline', updated: '01 Jan 2024' },
                { id: 'MPCS_COMPLIANCE', title: 'Compliance Audit', icon: 'file-document-check-outline', updated: 'Needs update' },
                { id: 'MPCS_FINANCIALS', title: 'Financial Performance', icon: 'chart-line', updated: 'Needs update' },
                { id: 'MPCS_DIVIDEND', title: 'Dividend Details', icon: 'cash-multiple', updated: 'Needs update' },
                { id: 'MPCS_SHARE_CAPITAL', title: 'Share Capital', icon: 'chart-pie', updated: 'Needs update' },
                { id: 'MPCS_CSC_DETAILS', title: 'CSC Details', icon: 'laptop', updated: 'Needs update' },
                { id: 'MPCS_LOAN', title: 'Loan Details', icon: 'bank-outline', updated: 'Needs update' }
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  societySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  societySelectorText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1.2,
  },
  notifyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
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
  monthBadge: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate600,
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
  nextStepBtnWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  nextStepBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
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
