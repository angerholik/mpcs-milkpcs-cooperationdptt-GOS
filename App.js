import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Login from './src/components/Login';
import ErrorBoundary from './src/components/ErrorBoundary';
import HomeScreen from './src/components/HomeScreen';
import DigitalEvidenceScreen from './src/components/DigitalEvidenceScreen';
import OperationsScreen from './src/components/OperationsScreen';
import ActivitiesScreen from './src/components/ActivitiesScreen';
import InstitutionalProfileScreen from './src/components/InstitutionalProfileScreen';
import ComplianceAuditScreen from './src/components/ComplianceAuditScreen';
import LoanSetupScreen from './src/components/LoanSetupScreen';
import DemographicsScreen from './src/components/DemographicsScreen';
import ComplianceScreen from './src/components/ComplianceScreen';
import ReviewSubmitScreen from './src/components/ReviewSubmitScreen';
import RecordsScreen from './src/components/RecordsScreen';
import MoreScreen from './src/components/MoreScreen';
import SyncStatusScreen from './src/components/SyncStatusScreen';
import MyInstitutionsScreen from './src/components/MyInstitutionsScreen';
import MemberDataScreen from './src/components/MemberDataScreen';

// MPCS Module Screen Components
import MpcsHomeScreen from './src/components/mpcs/MpcsHomeScreen';
import MpcsDigitalEvidenceScreen from './src/components/mpcs/MpcsDigitalEvidenceScreen';
import MpcsSalesDepositScreen from './src/components/mpcs/MpcsSalesDepositScreen';
import MpcsBusinessPerformanceScreen from './src/components/mpcs/MpcsBusinessPerformanceScreen';
import MpcsCscTransactionsScreen from './src/components/mpcs/MpcsCscTransactionsScreen';
import MpcsActivitiesLogScreen from './src/components/mpcs/MpcsActivitiesLogScreen';
import MpcsInstitutionalProfileScreen from './src/components/mpcs/MpcsInstitutionalProfileScreen';
import MpcsRegisteredDemographicsScreen from './src/components/mpcs/MpcsRegisteredDemographicsScreen';
import MpcsComplianceAuditScreen from './src/components/mpcs/MpcsComplianceAuditScreen';
import MpcsFinancialPerformanceScreen from './src/components/mpcs/MpcsFinancialPerformanceScreen';
import MpcsDividendDetailsScreen from './src/components/mpcs/MpcsDividendDetailsScreen';
import MpcsShareCapitalScreen from './src/components/mpcs/MpcsShareCapitalScreen';
import MpcsCscDetailsScreen from './src/components/mpcs/MpcsCscDetailsScreen';
import MpcsLoanSetupScreen from './src/components/mpcs/MpcsLoanSetupScreen';
import MpcsLoanStatusScreen from './src/components/mpcs/MpcsLoanStatusScreen';
import MpcsReviewSubmitScreen from './src/components/mpcs/MpcsReviewSubmitScreen';

import { supabase, saveMilkPcsSubmission, saveMpcsSubmission, uploadPhoto } from './src/supabase';
import { saveMilkPcsProfile, loadMilkPcsProfileByName, loadMilkCenters, addMilkCenter } from './src/utils/storage';
import { queueSubmission, processQueue, getQueueStatus } from './src/utils/syncManager';
import { isMonthlyParamsCompleted, saveMonthlyParams, getMonthlyParams, saveSectionStates, getSectionStates, getMilkSectionData, clearMilkSectionData } from './src/utils/monthlySyncManager';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

const { width } = Dimensions.get('window');

// iOS Safari zooms the whole page in whenever a focused input's font-size is
// under 16px, then leaves the viewport at that zoom level after blur — every
// text field in this app renders well under that (11-13px design sizes), so
// without this override, tapping into ANY field on an iPhone browser zooms
// and misaligns the entire screen until the user manually pinches back out.
// Native builds are unaffected (no browser, no zoom-on-focus behavior), so
// this only needs to run on web.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      input, textarea, select { font-size: 16px !important; }
    }
  `;
  document.head.appendChild(style);

  // Expo's generated index.html ships `initial-scale=1` with no max/min and
  // pinch-zoom left on, so once anything nudges the page's zoom level away
  // from 1 — the input-focus bug above, or the user pinching manually — the
  // browser has no bound to snap back to and the layout is left rendered at
  // that stale scale (visible as dead space on the right/bottom, content
  // anchored top-left). This is installable as a standalone app (Add to Home
  // Screen), and a real app doesn't let its whole UI get pinch-zoomed, so
  // zoom is locked outright rather than just bounded.
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, shrink-to-fit=no'
    );
  }

  // Registers the offline cache-fallback worker (public/sw.js). Runs after
  // 'load' per the standard recommendation, so it doesn't compete with the
  // initial page/bundle fetch for bandwidth on a slow connection.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing (e.g. unsupported browser, blocked by a
        // privacy setting) shouldn't break the app — it just means no
        // offline support this session.
      });
    });
  }

  // iOS Safari sizes the page to the viewport height AT THE TIME the
  // on-screen keyboard was last open, and doesn't reliably relayout once it
  // closes — the app is left shifted up with a blank gap at the bottom
  // where the keyboard used to be, until something else forces a reflow.
  // `100dvh` (set in public/index.html) fixes this on iOS 15.4+, but the
  // app needs to keep working on much older iOS releases too, so this pins
  // #root's actual pixel height to the real visible viewport on every
  // resize — covering iOS 13+ via the standard `visualViewport` API, and
  // falling back to plain `window.innerHeight` + resize/orientationchange
  // for iOS 11-12, which predate visualViewport entirely.
  const applyViewportHeight = () => {
    const root = document.getElementById('root');
    if (!root) return;
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.height = `${height}px`;
    document.body.style.height = `${height}px`;
    root.style.height = `${height}px`;
  };
  applyViewportHeight();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', applyViewportHeight);
  } else {
    window.addEventListener('resize', applyViewportHeight);
    window.addEventListener('orientationchange', applyViewportHeight);
  }
}

// The sealed-return certificate interpolates officer/center names straight into
// HTML — escape them so a name containing `<`/`&` can't break the markup.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const SyncBanner = ({ count, syncing }) => (
  <View style={styles.syncBanner}>
    <LinearGradient colors={['#7C1C1C', '#991B1B']} style={styles.syncBannerInner}>
       <MaterialIcons name={syncing ? "sync" : "cloud-off"} size={16} color={COLORS.gold} />
       <Text style={styles.syncBannerText}>
         {syncing ? `SYNCING ${count} RECORDS...` : `${count} PENDING SUBMISSIONS (OFFLINE)`}
       </Text>
    </LinearGradient>
  </View>
);

const BroadcastBanner = ({ alert, onDismiss }) => (
  <View style={styles.broadcastBannerWrapper}>
    <View style={styles.broadcastNoticeCard}>
      <View style={styles.broadcastNoticeHeaderRow}>
        <View style={styles.broadcastIconBox}>
          <MaterialIcons name="campaign" size={26} color="#F59E0B" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.broadcastNoticeTitle}>Important Notice</Text>
          <Text style={styles.broadcastNoticeBody}>{alert?.message || alert?.text || 'AGM for all MPCS societies must be completed by 30th June 2026.'}</Text>
        </View>
        <TouchableOpacity
          style={styles.broadcastCloseBtn}
          onPress={() => onDismiss(alert?.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={16} color="#78350F" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Premium Gold and Emerald Palette
const COLORS = {
  emerald: '#7C1C1C',
  emeraldLight: '#991B1B',
  gold: '#B45309',
  goldLight: '#D97706',
  textHeader: '#F3F4F6',
  textPrimary: '#450A0A',
  textSecondary: '#7F1D1D',
  surface: '#FFFFFF',
  surfaceBlur: 'rgba(255, 255, 255, 0.55)',
  background: '#F8F5F2',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981'
};

// Canonical current-month label used as the single source of truth for
// every "reporting month" fallback in this file. Using one shared helper
// (instead of a hardcoded past month, or ad-hoc Date.toLocaleString calls
// with differing formats) prevents the same submission from being written
// under two different month strings and creating duplicate Supabase rows.
const getCurrentMonthLabel = () =>
  new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

// Every screen's Save/Save & Next fires an unawaited cloud sync to Supabase
// (see saveMasterStateToStorage below). Each sync independently looks up
// "does a row for this center+month already exist?" and then inserts or
// updates. On a slow connection several of these end up in flight at once,
// and without serialization an earlier-triggered-but-slower-to-resolve sync
// can land AFTER a later, more complete one and overwrite it with its own
// stale snapshot — e.g. Activities entries appearing to vanish from the
// admin panel until some later screen's save re-syncs everything. Chaining
// every cloud sync through this single promise forces them to run one at a
// time, in the order they were triggered, so a later sync can never be
// clobbered by an earlier one that just happened to finish later.
let cloudSyncQueue = Promise.resolve();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope: Manrope_400Regular,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // Inspector & User Profile State — populated after login
  const [userProfile, setUserProfile] = useState(null);

  // Multiple Managed Institutions List (MPCS & Milk PCS)
  const [institutionsList, setInstitutionsList] = useState([]);

  const [selectedSociety, setSelectedSociety] = useState(null);

  // Navigation State — default to MY_INSTITUTIONS so user selects a society on first login
  const [activeView, setActiveView] = useState('MPCS');
  const [currentMobileScreen, setCurrentMobileScreen] = useState('MY_INSTITUTIONS');
  const [returnMobileScreen, setReturnMobileScreen] = useState('HOME');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  // Which bottom tab a standalone "_VIEW" master data screen (opened to
  // check/edit one section, not to progress the wizard) should return to —
  // 'home' when opened from the Home tab's Master Data Directory, 'more'
  // when opened from the More menu's equivalent list.
  const [masterDataViewReturnTab, setMasterDataViewReturnTab] = useState('more');
  // DEMOGRAPHICS and MPCS_LOAN are each the terminal step of two separate
  // chains — the real onboarding wizard, and the Master Data view chain —
  // but only ever had one hardcoded onBack target (the real chain's
  // previous screen), so arriving from the view chain and hitting Back
  // dropped the user into the wrong screen instead of returning to the
  // view step they actually came from. Track which one to return to.
  const [demographicsBackTarget, setDemographicsBackTarget] = useState('LOAN_SETUP');
  const [mpcsLoanBackTarget, setMpcsLoanBackTarget] = useState('MPCS_CSC_DETAILS');
  const [activityItems, setActivityItems] = useState([]);

  // Evidence States
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [location, setLocation] = useState(null);

  // General & Center Profile — all empty, populated via society selection
  const [centerName, setCenterName] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [presidentName, setPresidentName] = useState('');
  const [presidentMobile, setPresidentMobile] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerMobile, setManagerMobile] = useState('');
  const [milkCenters, setMilkCenters] = useState([]);
  const [district, setDistrict] = useState('');
  const [panCard, setPanCard] = useState('');
  const [regDate, setRegDate] = useState('');

  // Milk PCS Master Data — Audit, AGM & Loan Setup (done once/year or once per loan,
  // not monthly — lives on the Institutional Profile screen, not Compliance).
  const [masterAuditDate, setMasterAuditDate] = useState('');
  const [masterAuditYear, setMasterAuditYear] = useState('');
  const [masterAuditStatus, setMasterAuditStatus] = useState('Pending');
  const [masterAgmDate, setMasterAgmDate] = useState('');
  const [masterAgmYear, setMasterAgmYear] = useState('');
  const [masterAgmStatus, setMasterAgmStatus] = useState('Pending');
  const [masterHasLoan, setMasterHasLoan] = useState(false);
  const [masterLoanType, setMasterLoanType] = useState('');
  const [masterLoanSanctionDate, setMasterLoanSanctionDate] = useState('');
  const [masterLoanBeneficiaries, setMasterLoanBeneficiaries] = useState('');
  const [masterLoanExtended, setMasterLoanExtended] = useState('');
  const [masterLoanCleared, setMasterLoanCleared] = useState(false);

  // Persistent MPCS Section Data States
  const [demographicsData, setDemographicsData] = useState([]);
  const [complianceData, setComplianceData] = useState({});
  const [financialsData, setFinancialsData] = useState({});
  const [supplementalData, setSupplementalData] = useState({});
  const [dividendData, setDividendData] = useState({});
  const [bankData, setBankData] = useState({});
  const [shareCapitalData, setShareCapitalData] = useState({});
  const [cscDetailsData, setCscDetailsData] = useState({});
  const [businessPerformanceData, setBusinessPerformanceData] = useState({});
  // Master Data: does this MPCS society have a loan on record, and its
  // type/sanction date/amount extended. Monthly recovery status is tracked
  // separately per-society-per-month via getMilkSectionData(..., 'mpcs_loan'),
  // the same split already used for Milk PCS loan tracking.
  const [loanData, setLoanData] = useState({});

  // The MPCS Master Data Directory list ("Last updated: 12 Aug 2024" etc.)
  // used to show hardcoded placeholder dates that never reflected an actual
  // save — none of the Master Data sections tracked a timestamp at all.
  // This records one per section, stamped whenever that section is saved.
  const [masterDataTimestamps, setMasterDataTimestamps] = useState({});

  // CSC Monthly Transactions State
  const [cscTransData, setCscTransData] = useState({
    isCscActive: false,
    transactions: [],
  });

  // Track if monthly parameters have been completed for current society & reporting month
  const [hasSubmittedMonthlyParams, setHasSubmittedMonthlyParams] = useState(false);

  // Independent Section States Tracking
  const [sectionStates, setSectionStates] = useState({
    evidence: { status: 'NOT CAPTURED', updatedAt: null, validUntil: null },
    sales: { status: 'NOT COMPLETED', updatedAt: null },
    business: { status: 'NOT COMPLETED', updatedAt: null },
    csc: { status: 'NOT COMPLETED', updatedAt: null },
    activities: { status: '0 ENTRIES', updatedAt: null }
  });

  const [milkSectionStates, setMilkSectionStates] = useState({
    evidence: { status: 'NOT CAPTURED', updatedAt: null, validUntil: null },
    operations: { status: 'NOT STARTED', updatedAt: null },
    activities: { status: 'NOT STARTED', updatedAt: null },
    compliance: { status: 'NOT STARTED', updatedAt: null }
  });

  const refreshMilkSectionStatuses = async () => {
    const socName = selectedSociety?.name || centerName?.trim() || '';
    const repMonth = reportingMonth || getCurrentMonthLabel();
    if (!socName) {
      setMilkSectionStates({
        evidence: { status: 'NOT CAPTURED', updatedAt: null, validUntil: null },
        operations: { status: 'NOT STARTED', updatedAt: null },
        activities: { status: 'NOT STARTED', updatedAt: null },
        compliance: { status: 'NOT STARTED', updatedAt: null }
      });
      return;
    }

    const evidenceData = await getMilkSectionData(socName, repMonth, 'evidence');
    const opsData = await getMilkSectionData(socName, repMonth, 'operations');
    const actData = await getMilkSectionData(socName, repMonth, 'activities');
    const compData = await getMilkSectionData(socName, repMonth, 'compliance');

    // Evidence Logic
    let evidenceStatus = 'NOT CAPTURED';
    let validUntil = null;
    if (evidenceData && (evidenceData.imageUri || evidenceData.imageBase64)) {
      evidenceStatus = 'CAPTURED ✓';
      validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    // Operations Logic
    let opsStatus = 'NOT STARTED';
    if (opsData && (
      (opsData.litres && opsData.litres.toString().trim() !== '') ||
      (opsData.withdrawal && opsData.withdrawal.toString().trim() !== '') ||
      (opsData.balance && opsData.balance.toString().trim() !== '')
    )) {
      opsStatus = 'COMPLETED ✓';
    }

    // Activities Logic
    let actStatus = 'NOT STARTED';
    if (actData?.activityList && actData.activityList.length > 0) {
      actStatus = `${actData.activityList.length} ENTRIES ✓`;
    } else if (actData?.isCompleted) {
      actStatus = '0 ENTRIES ✓';
    }

    // Compliance Logic — now only tracks the MONTHLY loan repayment status.
    // Audit/AGM moved to Master Data (Institutional Profile) since they're annual, not monthly.
    // If there's no active loan (or it was already cleared), there's nothing to fill in
    // this month, so the section is trivially complete.
    const loanIsActive = masterHasLoan && !masterLoanCleared;
    let compStatus = 'COMPLETED ✓';
    if (loanIsActive) {
      compStatus = (compData && compData.loanRecovered && compData.loanOutstanding) ? 'COMPLETED ✓' : 'NOT STARTED';
    }

    setMilkSectionStates({
      evidence: { status: evidenceStatus, updatedAt: evidenceStatus === 'CAPTURED ✓' ? new Date().toISOString() : null, validUntil },
      operations: { status: opsStatus, updatedAt: opsStatus === 'COMPLETED ✓' ? new Date().toISOString() : null },
      activities: { status: actStatus, updatedAt: actStatus.includes('ENTRIES') ? new Date().toISOString() : null },
      compliance: { status: compStatus, updatedAt: compStatus === 'COMPLETED ✓' ? new Date().toISOString() : null }
    });
  };


  // Auth & Session State
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync & Network State
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // UI State
  const [isSealing, setIsSealing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  // Operational Ledger States
  const [reportingMonth, setReportingMonth] = useState(getCurrentMonthLabel());
  const [litres, setLitres] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [balance, setBalance] = useState('');

  // Member Demographics Legacy States
  const [mSc, setMSc] = useState('');
  const [fSc, setFSc] = useState('');
  const [mSt, setMSt] = useState('');
  const [fSt, setFSt] = useState('');
  const [mObc, setMObc] = useState('');
  const [fObc, setFObc] = useState('');
  const [mGen, setMGen] = useState('');
  const [fGen, setFGen] = useState('');
  const [totalMale, setTotalMale] = useState('0');
  const [totalFemale, setTotalFemale] = useState('0');
  const [totalMembers, setTotalMembers] = useState('0');

  // Loan States
  const [hasLoan, setHasLoan] = useState(false);
  const [loanType, setLoanType] = useState('');
  const [loanSanctionDate, setLoanSanctionDate] = useState('');
  const [loanBeneficiaries, setLoanBeneficiaries] = useState('');
  const [loanExtended, setLoanExtended] = useState('');
  const [loanRecovered, setLoanRecovered] = useState('');
  const [loanOutstanding, setLoanOutstanding] = useState('');
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingDue, setRemainingDue] = useState('0');

  // Toast helper
  const showToast = (msg, isError = false) => {
    setToastMsg({ text: msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Compliance Audit & AGM States
  const [auditDate, setAuditDate] = useState('');
  const [auditYear, setAuditYear] = useState('');
  const [agmDate, setAgmDate] = useState('');
  const [agmYear, setAgmYear] = useState('');

  // Modal State
  const [showHistory, setShowHistory] = useState(false);
  // Web-only in-app PDF preview: a window.open() print tab in an installed
  // iOS/Android standalone PWA has no browser chrome (no address bar, no
  // close/back button), leaving the user stuck on the printed certificate
  // with no way back into the app. Rendering it inside our own Modal gives
  // us a visible Close button regardless of standalone/browser context.
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState(null);

  const resetAllFormFields = () => {
    setCenterName('');
    setRegistrationNumber('');
    setPanCard('');
    setRegDate('');
    setPresidentName('');
    setPresidentMobile('');
    setManagerName('');
    setManagerMobile('');

    // Clear all 9 section master data stores
    setDemographicsData([]);
    setComplianceData({});
    setFinancialsData({});
    setSupplementalData({});
    setDividendData({});
    setBankData({});
    setShareCapitalData({});
    setCscDetailsData({});
    setLoanData({});
    setMasterDataTimestamps({});
    setBusinessPerformanceData({});
    setCscTransData({
      isCscActive: false,
      transactions: [],
    });

    // Clear operational ledgers
    setReportingMonth(getCurrentMonthLabel());
    setLitres('');
    setWithdrawal('');
    setBalance('');

    // Clear member demographics legacy states
    setMSc(''); setFSc(''); setMSt(''); setFSt('');
    setMObc(''); setFObc(''); setMGen(''); setFGen('');
    setTotalMale('0'); setTotalFemale('0'); setTotalMembers('0');

    // Clear active loan
    setHasLoan(false);
    setLoanType('');
    setLoanSanctionDate('');
    setLoanBeneficiaries('');
    setLoanExtended('');
    setLoanRecovered('');
    setLoanOutstanding('');
    setLoanName('');
    setLoanAmount('');
    setPaidAmount('');
    setRemainingDue('0');

    // Clear audit & AGM compliance fields
    setAuditDate('');
    setAuditYear('');
    setAgmDate('');
    setAgmYear('');

    // Clear Milk PCS Master Data — Audit, AGM & Loan Setup
    setMasterAuditDate('');
    setMasterAuditYear('');
    setMasterAuditStatus('Pending');
    setMasterAgmDate('');
    setMasterAgmYear('');
    setMasterAgmStatus('Pending');
    setMasterHasLoan(false);
    setMasterLoanType('');
    setMasterLoanSanctionDate('');
    setMasterLoanBeneficiaries('');
    setMasterLoanExtended('');
    setMasterLoanCleared(false);

    // Clear evidence & activities
    setImageUri(null);
    setImageBase64(null);
    setTimestamp('');
    setLocation(null);
    setActivityItems([]);
  };

  // Auto-check if monthly parameters exist for current society & reporting month
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const socName = selectedSociety?.name || centerName?.trim() || '';
      const repMonth = reportingMonth || getCurrentMonthLabel();
      if (socName) {
        const storedParams = await getMonthlyParams(socName, repMonth);
        const sStates = await getSectionStates(socName, repMonth);
        if (isMounted) {
          if (sStates) {
            setSectionStates(sStates);
          } else {
            // Reset to defaults if not found
            setSectionStates({
              evidence: { status: 'NOT CAPTURED', updatedAt: null, validUntil: null },
              sales: { status: 'NOT COMPLETED', updatedAt: null },
              business: { status: 'NOT COMPLETED', updatedAt: null },
              csc: { status: 'NOT COMPLETED', updatedAt: null },
              activities: { status: '0 ENTRIES', updatedAt: null }
            });
          }
          
          // Refresh Milk PCS states based on real data
          await refreshMilkSectionStatuses();
          
          if (storedParams && storedParams.paramsData) {
            setHasSubmittedMonthlyParams(true);
            if (!withdrawal && storedParams.paramsData.withdrawal) setWithdrawal(storedParams.paramsData.withdrawal);
            if (!balance && storedParams.paramsData.balance) setBalance(storedParams.paramsData.balance);
          } else {
            setHasSubmittedMonthlyParams(false);
          }
        }
      }
    })();
    return () => { isMounted = false; };
  }, [selectedSociety, centerName, reportingMonth]);

  const getUserEmail = (overrideEmail = null) => {
    return overrideEmail || session?.user?.email || userProfile?.email || null;
  };

  // userProfile is the raw Supabase auth user object — it has no top-level
  // `.name`, the display name only lives under user_metadata. Reading
  // `userProfile?.name` (as the institution-registration code used to)
  // always resolves to undefined and silently falls back to a generic
  // placeholder, which then can never match this officer's real name in
  // reconstructInstitutionsFromCloud's name-based lookup.
  const getUserDisplayName = () => {
    return userProfile?.user_metadata?.fullName || userProfile?.user_metadata?.inspectorName || userProfile?.fullName || '';
  };

  const getSocietyStorageKey = (socName, userEmail = null) => {
    const activeEmail = getUserEmail(userEmail) || 'guest';
    const emailSafe = activeEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const nameStr = typeof socName === 'string' ? socName : (socName?.name || '');
    if (!nameStr || !nameStr.trim()) return `@mpcs_master_state_${emailSafe}_default`;
    return `@mpcs_master_state_${emailSafe}_${nameStr.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  };

  const getLastSelectedSocietyKey = (userEmail = null) => {
    const activeEmail = getUserEmail(userEmail) || 'guest';
    const emailSafe = activeEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `@mpcs_last_selected_society_${emailSafe}`;
  };

  // The last-selected-society pointer is stored as {name, type} JSON so an
  // MPCS and a Milk PCS society with the same name can be told apart —
  // older stored values are a bare name string, handled here for backward
  // compatibility with whatever's already sitting in an inspector's device.
  const parseLastSelectedSociety = (rawStored) => {
    if (!rawStored) return { name: '', type: null };
    try {
      const parsed = JSON.parse(rawStored);
      if (parsed && typeof parsed === 'object') return { name: parsed.name || '', type: parsed.type || null };
    } catch (e) {}
    return { name: rawStored, type: null };
  };

  // ─── Per-user institutions list storage ───────────────────────────────────
  const getUserInstitutionsKey = (email = null) => {
    const activeEmail = getUserEmail(email);
    if (!activeEmail) return null;
    const safe = activeEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `@mpcs_institutions_${safe}`;
  };

  const saveInstitutionsForUser = async (list, email = null) => {
    try {
      const activeEmail = getUserEmail(email);
      const key = getUserInstitutionsKey(activeEmail);
      if (!key) return;
      await AsyncStorage.setItem(key, JSON.stringify(list));
    } catch (e) { console.warn('saveInstitutionsForUser error:', e); }
  };

  const updateSectionState = async (sectionKey, updates) => {
    const newState = {
      ...sectionStates,
      [sectionKey]: {
        ...sectionStates[sectionKey],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };
    setSectionStates(newState);
    const socName = selectedSociety?.name || centerName?.trim() || '';
    const repMonth = reportingMonth || getCurrentMonthLabel();
    if (socName) {
      await saveSectionStates(socName, repMonth, newState);
    }
  };



  // AsyncStorage (localStorage on web) is device-local — an inspector who
  // logs in from a different browser, a different device, or after their
  // cache/site data was cleared finds "Registered Institutions" completely
  // empty, as if everything was deleted, even though every real submission
  // they made is still safely in Supabase. Rebuild the institutions list
  // from their own mpcs_submissions/milk_pcs_submissions rows (every
  // registered institution has at least the zero-value placeholder row
  // written when it was first added — see onAddInstitution) using the same
  // officer-isolation match RecordsScreen uses, so this can't leak another
  // officer's institutions.
  const reconstructInstitutionsFromCloud = async (email, name) => {
    const userEmail = (email || '').trim().toLowerCase();
    const userName = (name || '').trim().toLowerCase();
    if (!userEmail && !userName) return [];

    try {
      const [resMpcs, resMilk] = await Promise.all([
        supabase.from('mpcs_submissions').select('society_name, registration_number, form_data, created_at').order('created_at', { ascending: false }),
        supabase.from('milk_pcs_submissions').select('center_name, registration_number, district, reported_by, created_at').order('created_at', { ascending: false }),
      ]);

      const found = new Map();

      (resMpcs.data || []).forEach(r => {
        let fd = r.form_data;
        if (typeof fd === 'string') {
          try { fd = JSON.parse(fd); } catch (e) { fd = null; }
        }
        const officerEmail = (fd?.inspectorEmail || '').trim().toLowerCase();
        const officerName = (fd?.reportedBy || '').trim().toLowerCase();
        const matchEmail = userEmail && officerEmail && officerEmail === userEmail;
        const matchName = userName && officerName && officerName.includes(userName);
        if (!matchEmail && !matchName) return;
        const key = `MPCS_${(r.society_name || '').trim().toLowerCase()}`;
        if (!r.society_name || found.has(key)) return;
        found.set(key, {
          id: key,
          name: r.society_name,
          type: 'MPCS',
          regNo: r.registration_number || '',
          gpu: fd?.district || fd?.gpu || '',
          district: fd?.district || fd?.gpu || '',
        });
      });

      (resMilk.data || []).forEach(r => {
        // milk_pcs_submissions has no inspector email column, so this table
        // can only ever be matched by officer name.
        const officerName = (r.reported_by || '').trim().toLowerCase();
        const matchName = userName && officerName && officerName.includes(userName);
        if (!matchName) return;
        const key = `MILK_${(r.center_name || '').trim().toLowerCase()}`;
        if (!r.center_name || found.has(key)) return;
        found.set(key, {
          id: key,
          name: r.center_name,
          type: 'MILK',
          regNo: r.registration_number || '',
          gpu: r.district || '',
          district: r.district || '',
        });
      });

      return Array.from(found.values());
    } catch (e) {
      console.warn('reconstructInstitutionsFromCloud error:', e);
      return [];
    }
  };

  const loadInstitutionsForUser = async (email = null, userObj = null) => {
    // No fallback demo institutions here: a fresh inspector account starts
    // with zero registered institutions, and adds real ones via "Add New
    // Institution". This used to silently seed and persist two fake
    // societies ("Dentam MPCS" / "Gyalshing Milk Center") into every new
    // user's own storage, making a brand-new inspector look like they were
    // already managing two real cooperatives.
    try {
      const activeEmail = getUserEmail(email);
      const key = getUserInstitutionsKey(activeEmail);
      if (!key) { setInstitutionsList([]); return []; }
      const raw = await AsyncStorage.getItem(key);
      let list = raw ? JSON.parse(raw) : [];

      // Always reconcile with the cloud, not just when the local cache is
      // empty — an institution registered on a different device writes its
      // placeholder submission row straight to Supabase, but this device's
      // own AsyncStorage has no idea it exists until it's merged in here.
      // Gating this on "local list is empty" meant a device that already
      // had ANY institutions cached would never pick up new ones added
      // elsewhere, no matter how many times the user logged back in.
      //
      // Read the officer's display name straight off the auth user object
      // passed in by the caller rather than the userProfile state variable
      // — right after login, userProfile's setState hasn't been applied
      // to this closure yet (same stale-closure trap documented above for
      // the cloud master-state fallback), so it would always read as
      // blank here and this recovery path could never actually match.
      const u = userObj || userProfile;
      const fullName = u?.user_metadata?.fullName || u?.user_metadata?.inspectorName || u?.fullName || '';
      const cloudList = await reconstructInstitutionsFromCloud(activeEmail, fullName);
      if (cloudList.length > 0) {
        const known = new Set(list.map(i => `${i.type}_${(i.name || '').trim().toLowerCase()}`));
        const additions = cloudList.filter(c => !known.has(`${c.type}_${(c.name || '').trim().toLowerCase()}`));
        if (additions.length > 0) {
          list = [...list, ...additions];
          await AsyncStorage.setItem(key, JSON.stringify(list));
        }
      }

      setInstitutionsList(list);
      return list;
    } catch (e) {
      console.warn('loadInstitutionsForUser error:', e);
      setInstitutionsList([]);
      return [];
    }
  };

  // Handle Dynamic Society Selection from Dropdown or Setup
  const handleSelectSociety = async (soc, isNewRegistration = false) => {
    setSelectedSociety(soc);
    setDistrict(soc?.district || '');
    setActiveView(soc?.type === 'MPCS' ? 'MPCS' : 'MAIN');
    setCurrentMobileScreen('HOME');
    setActiveBottomTab('home');

    // This is the one place "the inspector is now working on this society"
    // gets recorded — deliberately NOT inside saveMasterStateToStorage (see
    // its comment). A slow autosave from whichever society was open before
    // this selection can still resolve after this point; if it also wrote
    // this pointer, it could silently overwrite it back, and reopening the
    // app (e.g. after a browser tab was backgrounded and reloaded) would
    // restore the wrong one — confirmed happening with two same-inspector
    // societies named "Bermiok" (MPCS and Milk PCS).
    if (soc?.name) {
      try {
        await AsyncStorage.setItem(getLastSelectedSocietyKey(getUserEmail()), JSON.stringify({ name: soc.name, type: soc.type || null }));
      } catch (e) {}
    }

    if (isNewRegistration) {
      // NEW REGISTRATION: Wipe all fields & 9 sections so new society starts 100% BLANK
      resetAllFormFields();
      setCenterName(soc?.name || '');
      setRegistrationNumber(soc?.code || soc?.regNo || '');
      setDistrict(soc?.district || '');
      await clearMilkSectionData(soc?.name, reportingMonth || getCurrentMonthLabel());
      await saveMasterStateToStorage({
        type: soc?.type,
        centerName: soc?.name || '',
        registrationNumber: soc?.code || soc?.regNo || '',
        demographicsData: [],
        complianceData: {},
        financialsData: {},
        supplementalData: {},
        dividendData: {},
        bankData: {},
        shareCapitalData: {},
        cscDetailsData: {},
        loanData: {}
      }, soc?.name || '');
      await refreshMilkSectionStatuses();
    } else {
      // EXISTING SOCIETY: Load saved data for this specific society only
      await loadMasterStateFromStorage(soc?.name);
      await fetchCloudSocietyData(soc?.name, getUserEmail(), soc?.type);
      await refreshMilkSectionStatuses();
    }
  };


  // Master State Persistence Handlers (Keyed per Society & User Email)
  const saveMasterStateToStorage = async (overrides = {}, targetSocName = null, explicitEmail = null) => {
    try {
      const userEmail = getUserEmail(explicitEmail);
      const rawSocName = targetSocName || selectedSociety?.name || centerName?.trim();
      const activeSocName = typeof rawSocName === 'string' ? rawSocName : (rawSocName?.name || '');
      if (!activeSocName || !activeSocName.trim()) return;

      const key = getSocietyStorageKey(activeSocName, userEmail);
      const stateObj = {
        societyName: activeSocName,
        centerName: overrides.centerName !== undefined ? overrides.centerName : centerName,
        registrationNumber: overrides.registrationNumber !== undefined ? overrides.registrationNumber : registrationNumber,
        panCard: overrides.panCard !== undefined ? overrides.panCard : panCard,
        regDate: overrides.regDate !== undefined ? overrides.regDate : regDate,
        presidentName: overrides.presidentName !== undefined ? overrides.presidentName : presidentName,
        presidentMobile: overrides.presidentMobile !== undefined ? overrides.presidentMobile : presidentMobile,
        managerName: overrides.managerName !== undefined ? overrides.managerName : managerName,
        managerMobile: overrides.managerMobile !== undefined ? overrides.managerMobile : managerMobile,
        masterAuditDate: overrides.masterAuditDate !== undefined ? overrides.masterAuditDate : masterAuditDate,
        masterAuditYear: overrides.masterAuditYear !== undefined ? overrides.masterAuditYear : masterAuditYear,
        masterAuditStatus: overrides.masterAuditStatus !== undefined ? overrides.masterAuditStatus : masterAuditStatus,
        masterAgmDate: overrides.masterAgmDate !== undefined ? overrides.masterAgmDate : masterAgmDate,
        masterAgmYear: overrides.masterAgmYear !== undefined ? overrides.masterAgmYear : masterAgmYear,
        masterAgmStatus: overrides.masterAgmStatus !== undefined ? overrides.masterAgmStatus : masterAgmStatus,
        masterHasLoan: overrides.masterHasLoan !== undefined ? overrides.masterHasLoan : masterHasLoan,
        masterLoanType: overrides.masterLoanType !== undefined ? overrides.masterLoanType : masterLoanType,
        masterLoanSanctionDate: overrides.masterLoanSanctionDate !== undefined ? overrides.masterLoanSanctionDate : masterLoanSanctionDate,
        masterLoanBeneficiaries: overrides.masterLoanBeneficiaries !== undefined ? overrides.masterLoanBeneficiaries : masterLoanBeneficiaries,
        masterLoanExtended: overrides.masterLoanExtended !== undefined ? overrides.masterLoanExtended : masterLoanExtended,
        masterLoanCleared: overrides.masterLoanCleared !== undefined ? overrides.masterLoanCleared : masterLoanCleared,
        mSc: overrides.mSc !== undefined ? overrides.mSc : mSc,
        fSc: overrides.fSc !== undefined ? overrides.fSc : fSc,
        mSt: overrides.mSt !== undefined ? overrides.mSt : mSt,
        fSt: overrides.fSt !== undefined ? overrides.fSt : fSt,
        mObc: overrides.mObc !== undefined ? overrides.mObc : mObc,
        fObc: overrides.fObc !== undefined ? overrides.fObc : fObc,
        mGen: overrides.mGen !== undefined ? overrides.mGen : mGen,
        fGen: overrides.fGen !== undefined ? overrides.fGen : fGen,
        demographicsData: overrides.demographicsData !== undefined ? overrides.demographicsData : demographicsData,
        complianceData: overrides.complianceData !== undefined ? overrides.complianceData : complianceData,
        financialsData: overrides.financialsData !== undefined ? overrides.financialsData : financialsData,
        supplementalData: overrides.supplementalData !== undefined ? overrides.supplementalData : supplementalData,
        dividendData: overrides.dividendData !== undefined ? overrides.dividendData : dividendData,
        bankData: overrides.bankData !== undefined ? overrides.bankData : bankData,
        shareCapitalData: overrides.shareCapitalData !== undefined ? overrides.shareCapitalData : shareCapitalData,
        cscDetailsData: overrides.cscDetailsData !== undefined ? overrides.cscDetailsData : cscDetailsData,
        loanData: overrides.loanData !== undefined ? overrides.loanData : loanData,
        masterDataTimestamps: overrides.masterDataTimestamps !== undefined ? overrides.masterDataTimestamps : masterDataTimestamps,
        businessPerformanceData: overrides.businessPerformanceData !== undefined ? overrides.businessPerformanceData : businessPerformanceData,
        sales: overrides.sales !== undefined ? overrides.sales : (withdrawal || ''),
        deposit: overrides.deposit !== undefined ? overrides.deposit : (balance || ''),
        withdrawal: overrides.withdrawal !== undefined ? overrides.withdrawal : (withdrawal || ''),
        balance: overrides.balance !== undefined ? overrides.balance : (balance || ''),
        totalTurnover: overrides.totalTurnover !== undefined ? overrides.totalTurnover : (withdrawal || ''),
        totalIncome: overrides.totalIncome !== undefined ? overrides.totalIncome : (businessPerformanceData?.totalIncome || ''),
        totalExpenses: overrides.totalExpenses !== undefined ? overrides.totalExpenses : (businessPerformanceData?.totalExpenses || ''),
        netSurplusDeficit: overrides.netSurplusDeficit !== undefined ? overrides.netSurplusDeficit : (businessPerformanceData?.netSurplusDeficit || ''),
        reportingMonth: overrides.reportingMonth !== undefined ? overrides.reportingMonth : reportingMonth,
        selectedSociety: overrides.selectedSociety !== undefined ? overrides.selectedSociety : selectedSociety,
        activityItems: overrides.activityItems !== undefined ? overrides.activityItems : activityItems,
        type: overrides.type !== undefined ? overrides.type : selectedSociety?.type
      };
      await AsyncStorage.setItem(key, JSON.stringify(stateObj));
      // The "last selected society" pointer is deliberately NOT written here.
      // This function runs on every field save from every screen, including
      // ones that can resolve late (after the inspector has already switched
      // to a different society) — writing the pointer on every call let a
      // slow save from the PREVIOUS society silently overwrite which one is
      // "active" after the switch. It's written once, explicitly, in
      // handleSelectSociety instead — the one place that actually reflects
      // the inspector's deliberate choice.

      // ── Cloud Sync to Backend on Every Master Data Save ──
      // Queued so concurrent saves from different screens can't race each
      // other's Supabase find-existing-then-insert/update calls and let an
      // earlier-triggered-but-slower-to-resolve sync clobber a later, more
      // complete one with stale data (see cloudSyncQueue comment above).
      cloudSyncQueue = cloudSyncQueue.then(async () => {
      try {
        const gpuVal = selectedSociety?.gpu || selectedSociety?.district || '';
        let calcMembers = 0;
        if (stateObj.demographicsData) {
          if (Array.isArray(stateObj.demographicsData)) {
            calcMembers = stateObj.demographicsData.reduce((s, d) => s + (parseInt(d.male || 0) + parseInt(d.female || 0)), 0);
          } else if (typeof stateObj.demographicsData === 'object') {
            calcMembers = Object.values(stateObj.demographicsData).reduce((s, v) => s + (parseInt(v) || 0), 0);
          }
        }

        if (stateObj.type === 'MILK') {
          const repMonth = stateObj.reportingMonth || getCurrentMonthLabel();
          const opsData = await getMilkSectionData(activeSocName, repMonth, 'operations');
          const compData = await getMilkSectionData(activeSocName, repMonth, 'compliance');
          const actsData = await getMilkSectionData(activeSocName, repMonth, 'activities');
          const loanIsActive = !!stateObj.masterHasLoan && !stateObj.masterLoanCleared;

          await saveMilkPcsSubmission({
            centerName: activeSocName,
            centerId: stateObj.registrationNumber || selectedSociety?.regNo || '',
            district: gpuVal,
            presidentName: stateObj.presidentName,
            presidentMobile: stateObj.presidentMobile,
            managerName: stateObj.managerName,
            managerMobile: stateObj.managerMobile,
            reportedBy: getUserDisplayName() || 'Cooperative Inspector',
            inspectorEmail: userEmail,
            activities: actsData ? JSON.stringify(actsData) : '',
            // Loan setup (type, who sanctioned it, total amount) is Master Data — set once.
            // Only the monthly recovered/outstanding progress comes from the monthly section.
            hasLoan: loanIsActive,
            loanName: stateObj.masterLoanType,
            loanAmount: stateObj.masterLoanExtended,
            paidAmount: loanIsActive ? (compData?.loanRecovered || '0') : '',
            remainingDue: loanIsActive ? (compData?.loanOutstanding || stateObj.masterLoanExtended || '0') : '',
            // Audit & AGM are Master Data now (done once/year, not monthly).
            auditDone: stateObj.masterAuditDate ? `Yes (${stateObj.masterAuditDate})` : 'No',
            auditYear: stateObj.masterAuditYear,
            agmDone: stateObj.masterAgmDate ? `Yes (${stateObj.masterAgmDate})` : 'No',
            agmYear: stateObj.masterAgmYear,
            // GPS/timestamp evidence is captured once on the Digital Evidence screen and
            // otherwise sits in local state — include it here too so a later silent sync
            // (triggered by saving any other section) doesn't wipe it back to null. Photo
            // upload itself stays Compile & Seal-only since it's an actual file upload,
            // not cheap to repeat on every background sync.
            gpsLat: location?.latitude ?? null,
            gpsLng: location?.longitude ?? null,
            capturedAt: timestamp || undefined,
            ...stateObj,
            litres: opsData?.litres || '',
            balance: opsData?.balance || '',
            withdrawal: opsData?.withdrawal || ''
          });
        } else {
          await saveMpcsSubmission({
            societyName: activeSocName,
            registrationNumber: stateObj.registrationNumber || selectedSociety?.regNo || '',
            gpu: gpuVal,
            district: gpuVal,
            presidentName: stateObj.presidentName,
            presidentMobile: stateObj.presidentMobile,
            managerName: stateObj.managerName,
            managerMobile: stateObj.managerMobile,
            // complianceData holds { auditStatus: 'Completed'|'Pending', auditDate, auditYear, ... }
            // from MpcsComplianceAuditScreen — there is no auditDone/auditGrade field.
            auditDone: stateObj.complianceData?.auditStatus === 'Completed'
              ? `Yes${stateObj.complianceData?.auditDate ? ` (${stateObj.complianceData.auditDate})` : ''}`
              : 'No',
            auditYear: stateObj.complianceData?.auditYear,
            annualTurnover: stateObj.financialsData?.annualTurnover,
            profitOrLoss: stateObj.financialsData?.profitOrLoss || null,
            netProfit: stateObj.financialsData?.netProfit,
            // Same reasoning as auditDone above: without this, has_loan would
            // silently flip back to false on every autosave after the loan was
            // actually set up, since formData.hasLoan is otherwise never set here.
            hasLoan: !!(stateObj.loanData?.hasLoan && !stateObj.loanData?.loanCleared),
            totalMembers: calcMembers,
            reportedBy: getUserDisplayName() || 'Cooperative Inspector',
            inspectorEmail: userEmail,
            ...stateObj
          });
        }
      } catch (cloudErr) {
        console.warn('Auto cloud sync exception:', cloudErr);
      }
      });
    } catch (e) {
      console.warn('Failed to save master state locally:', e);
    }
  };

  // Records when an MPCS Master Data section (Institutional Profile,
  // Demographics, Compliance, Financials, Dividend, Share Capital, CSC,
  // Loan) was actually last saved, so the Master Data Directory list can
  // show a real "Last updated" date instead of a hardcoded placeholder.
  const stampMasterDataUpdated = (sectionKey) => {
    setMasterDataTimestamps(prev => {
      const updated = { ...prev, [sectionKey]: new Date().toISOString() };
      saveMasterStateToStorage({ masterDataTimestamps: updated });
      return updated;
    });
  };

  const loadMasterStateFromStorage = async (targetSocName = null, explicitEmail = null) => {
    try {
      const userEmail = getUserEmail(explicitEmail);
      const lastSocKey = getLastSelectedSocietyKey(userEmail);
      const rawTargetSocName = targetSocName
        ? (typeof targetSocName === 'string' ? targetSocName : (targetSocName?.name || ''))
        : '';
      const activeSocName = rawTargetSocName
        || parseLastSelectedSociety(await AsyncStorage.getItem(lastSocKey)).name
        || selectedSociety?.name || centerName?.trim() || '';
      if (!activeSocName || !activeSocName.trim()) {
        resetAllFormFields();
        return false;
      }

      const key = getSocietyStorageKey(activeSocName, userEmail);
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        setCenterName(saved.centerName || activeSocName);
        setRegistrationNumber(saved.registrationNumber || '');
        setPanCard(saved.panCard || '');
        setRegDate(saved.regDate || '');
        setPresidentName(saved.presidentName || '');
        setPresidentMobile(saved.presidentMobile || '');
        setManagerName(saved.managerName || '');
        setManagerMobile(saved.managerMobile || '');
        setMasterAuditDate(saved.masterAuditDate || '');
        setMasterAuditYear(saved.masterAuditYear || '');
        setMasterAuditStatus(saved.masterAuditStatus || 'Pending');
        setMasterAgmDate(saved.masterAgmDate || '');
        setMasterAgmYear(saved.masterAgmYear || '');
        setMasterAgmStatus(saved.masterAgmStatus || 'Pending');
        setMasterHasLoan(saved.masterHasLoan || false);
        setMasterLoanType(saved.masterLoanType || '');
        setMasterLoanSanctionDate(saved.masterLoanSanctionDate || '');
        setMasterLoanBeneficiaries(saved.masterLoanBeneficiaries || '');
        setMasterLoanExtended(saved.masterLoanExtended || '');
        setMasterLoanCleared(saved.masterLoanCleared || false);
        setMSc(saved.mSc || '');
        setFSc(saved.fSc || '');
        setMSt(saved.mSt || '');
        setFSt(saved.fSt || '');
        setMObc(saved.mObc || '');
        setFObc(saved.fObc || '');
        setMGen(saved.mGen || '');
        setFGen(saved.fGen || '');
        setDemographicsData(saved.demographicsData || []);
        setComplianceData(saved.complianceData || {});
        setFinancialsData(saved.financialsData || {});
        setSupplementalData(saved.supplementalData || {});
        setDividendData(saved.dividendData || {});
        setBankData(saved.bankData || {});
        setShareCapitalData(saved.shareCapitalData || {});
        setCscDetailsData(saved.cscDetailsData || {});
        setLoanData(saved.loanData || {});
        setMasterDataTimestamps(saved.masterDataTimestamps || {});
        setBusinessPerformanceData(saved.businessPerformanceData || {});
        if (saved.selectedSociety) setSelectedSociety(saved.selectedSociety);

        if (saved.reportingMonth) setReportingMonth(saved.reportingMonth);
        if (saved.withdrawal !== undefined) setWithdrawal(saved.withdrawal);
        if (saved.balance !== undefined) setBalance(saved.balance);
        if (saved.sales !== undefined && !saved.withdrawal) setWithdrawal(saved.sales);
        if (saved.deposit !== undefined && !saved.balance) setBalance(saved.deposit);
        if (saved.activityItems) setActivityItems(saved.activityItems);

        return true;
      } else {
        // Society has no saved state yet -> Reset to clean blank fields
        resetAllFormFields();
        setCenterName(activeSocName);
        return false;
      }
    } catch (e) {
      console.warn('Failed to load master state locally:', e);
      return false;
    }
  };

  const fetchCloudSocietyData = async (socName, userEmail, societyType) => {
    const nameStr = typeof socName === 'string' ? socName : (socName?.name || '');
    if (!nameStr || !nameStr.trim()) return;
    // Prefer the type passed explicitly by the caller over selectedSociety —
    // callers that just called setSelectedSociety(soc) moments earlier in
    // the same function see the pre-update value here (React state updates
    // don't apply mid-function), which silently queried the wrong table
    // (mpcs_submissions instead of milk_pcs_submissions) and found no match.
    const isMilk = (societyType || selectedSociety?.type) === 'MILK';
    try {
      let rows = [];
      // Exact (case-insensitive) match, not a substring search — `%name%`
      // matched ANY row whose name merely contained this one (e.g. opening
      // "Bermiok" matched the unrelated existing "Bermiok Milk Pcs" row),
      // pulling a different institution's data into this one's display.
      if (isMilk) {
        const res = await supabase
          .from('milk_pcs_submissions')
          .select('*')
          .ilike('center_name', nameStr.trim())
          .order('created_at', { ascending: false })
          .limit(1);
        rows = res.data || [];
      } else {
        const res = await supabase
          .from('mpcs_submissions')
          .select('*')
          .ilike('society_name', nameStr.trim())
          .order('created_at', { ascending: false })
          .limit(1);
        rows = res.data || [];
      }

      if (rows && rows.length > 0) {
        const row = rows[0];
        let fd = row.form_data || {};
        if (typeof fd === 'string') {
          try { fd = JSON.parse(fd); } catch(e) {}
        }
        
        const soc_name = row.society_name || row.center_name;
        const reg_number = row.registration_number || row.center_id;

        if (soc_name) setCenterName(soc_name);
        if (reg_number) setRegistrationNumber(reg_number);
        if (fd['1.8'] || fd.panCard) setPanCard(fd['1.8'] || fd.panCard);
        if (fd['1.6'] || fd.regDate) setRegDate(fd['1.6'] || fd.regDate);
        if (row.president_name || fd['2.1']) setPresidentName(row.president_name || fd['2.1']);
        if (row.president_mobile) setPresidentMobile(row.president_mobile);
        if (row.manager_mobile) setManagerMobile(row.manager_mobile);
        // mpcs_submissions has no manager_name column (unlike milk_pcs_submissions,
        // which does) — it only ever lands in form_data.managerName/secretaryName.
        // Every other field here falls back to its form_data equivalent when the
        // top-level column is empty; this one didn't, so a transient local blank
        // (e.g. mid-reload, before AsyncStorage restore resolves) had nothing to
        // self-heal from and could stick permanently.
        if (row.manager_name || fd.managerName || fd.secretaryName) {
          setManagerName(row.manager_name || fd.managerName || fd.secretaryName);
        }

        // Milk PCS stores demographics as flat columns (not inside a
        // form_data JSON blob like MPCS), and audit/AGM inside the
        // `activities` JSON column rather than as their own columns —
        // pull both into local display state the same way the admin
        // dashboard already parses them (getMilkAuditAgm).
        if (isMilk) {
          if (row.m_sc !== null && row.m_sc !== undefined) setMSc(String(row.m_sc));
          if (row.f_sc !== null && row.f_sc !== undefined) setFSc(String(row.f_sc));
          if (row.m_st !== null && row.m_st !== undefined) setMSt(String(row.m_st));
          if (row.f_st !== null && row.f_st !== undefined) setFSt(String(row.f_st));
          if (row.m_obc !== null && row.m_obc !== undefined) setMObc(String(row.m_obc));
          if (row.f_obc !== null && row.f_obc !== undefined) setFObc(String(row.f_obc));
          if (row.m_gen !== null && row.m_gen !== undefined) setMGen(String(row.m_gen));
          if (row.f_gen !== null && row.f_gen !== undefined) setFGen(String(row.f_gen));

          if (row.activities && typeof row.activities === 'string' && row.activities.trim().startsWith('{')) {
            try {
              const parsedActs = JSON.parse(row.activities);
              if (parsedActs.audit_done) {
                const isYes = String(parsedActs.audit_done).trim().toLowerCase().startsWith('yes');
                setMasterAuditStatus(isYes ? 'Completed' : 'Pending');
                const dateMatch = String(parsedActs.audit_done).match(/\(([^)]+)\)/);
                if (dateMatch) setMasterAuditDate(dateMatch[1]);
              }
              if (parsedActs.audit_year) setMasterAuditYear(parsedActs.audit_year);
              if (parsedActs.agm_done) {
                const isYes = String(parsedActs.agm_done).trim().toLowerCase().startsWith('yes');
                setMasterAgmStatus(isYes ? 'Completed' : 'Pending');
                const dateMatch = String(parsedActs.agm_done).match(/\(([^)]+)\)/);
                if (dateMatch) setMasterAgmDate(dateMatch[1]);
              }
              if (parsedActs.agm_year) setMasterAgmYear(parsedActs.agm_year);
            } catch (e) {}
          }
        }

        if (fd.demographicsData) setDemographicsData(fd.demographicsData);
        if (fd.complianceData) setComplianceData(fd.complianceData);
        if (fd.financialsData) setFinancialsData(fd.financialsData);
        if (fd.supplementalData) setSupplementalData(fd.supplementalData);
        if (fd.dividendData) setDividendData(fd.dividendData);
        if (fd.bankData) setBankData(fd.bankData);
        if (fd.shareCapitalData) setShareCapitalData(fd.shareCapitalData);
        if (fd.cscDetailsData) setCscDetailsData(fd.cscDetailsData);
        if (fd.loanData) setLoanData(fd.loanData);
        if (fd.masterDataTimestamps) setMasterDataTimestamps(fd.masterDataTimestamps);
        const loadedBizPerf = fd.businessPerformanceData || {
          totalIncome: fd.totalIncome || fd.financialsData?.totalIncome || fd['5.1'] || '',
          totalExpenses: fd.totalExpenses || fd.financialsData?.totalExpenses || '',
          netSurplusDeficit: fd.netSurplusDeficit || fd.financialsData?.netProfit || row.net_profit_loss || '',
          totalMembers: fd.totalMembers || row.total_members || '',
          remarks: fd.remarks || ''
        };
        setBusinessPerformanceData(loadedBizPerf);

        // No write-back to saveMasterStateToStorage here. This function's
        // job is to pull cloud data into local React state as a fallback
        // display (e.g. a fresh device with no local cache yet) — the data
        // just came FROM Supabase, so re-pushing it is redundant. Worse: it
        // used to build an overrides object missing managerName, the Milk
        // PCS demographics fields (mSc/fSc/mSt/fSt/mObc/fObc/mGen/fGen —
        // this function was written for MPCS's form_data shape and never
        // adapted for Milk PCS's flat columns), and audit/AGM entirely.
        // Since this runs inside the same handleUserAuthSuccess call chain
        // that just triggered loadMasterStateFromStorage's setState calls,
        // any field missing from the overrides fell back to those React
        // state variables' STALE pre-load closure values (empty, since the
        // setState calls from moments earlier in the same synchronous
        // chain hadn't been applied to this closure yet) — and pushed that
        // blank data back to Supabase on every login/refresh/reconnect,
        // silently wiping out exactly those three field groups.
      }
    } catch (e) {
      console.warn('Cloud fetch error:', e);
    }
  };

  // Unified Auth Success & Logout Handlers
  const handleUserAuthSuccess = async (usr) => {
    if (!usr) return;
    const activeEmail = usr.email || getUserEmail();
    setUserProfile(usr);
    setSession({ user: usr });
    if (activeEmail) {
      const institutions = await loadInstitutionsForUser(activeEmail, usr);
      // Resolve the society to restore from persistent storage rather than
      // the selectedSociety/centerName React state — those still hold their
      // pre-login (blank, post-logout) values in this closure, since the
      // setState calls a few lines below don't retroactively update
      // variables already captured here. On a device with no local cache
      // (fresh install, cleared app data), that blank name made the cloud
      // fallback below silently no-op, so a real submission already in
      // Supabase never made it back to the screen.
      const storedLastSelected = parseLastSelectedSociety(await AsyncStorage.getItem(getLastSelectedSocietyKey(activeEmail)));
      const lastSocName = storedLastSelected.name || selectedSociety?.name || centerName?.trim();
      const lastSocType = storedLastSelected.name ? storedLastSelected.type : selectedSociety?.type;
      // Match on type too, not just name — an inspector can register an
      // MPCS and a Milk PCS society with the same name (e.g. "Bermiok"),
      // and a name-only match could restore the wrong one's dashboard.
      const matchedInstitution = institutions.find(i => i.name === lastSocName && (!lastSocType || i.type === lastSocType))
        || institutions.find(i => i.name === lastSocName);
      if (matchedInstitution) {
        // This whole function re-runs from scratch on every mount of the
        // effect that calls supabase.auth.getSession() — which includes a
        // full page reload, not just a fresh sign-in. On web, backgrounding
        // the browser tab for a while and switching back can make Chrome
        // discard and reload it, re-running this exact path with a still-
        // valid persisted session. Landing on "Add New Institution" every
        // time that happens (the old unconditional behavior below) forced
        // the user to re-select a society they never actually left — restore
        // straight back into their dashboard instead, the same way tapping
        // "Select & Open Dashboard" would.
        await handleSelectSociety(matchedInstitution, false);
        return;
      }
      await loadMasterStateFromStorage(lastSocName, activeEmail);
      await fetchCloudSocietyData(lastSocName, activeEmail);
    }
    setCurrentMobileScreen('MY_INSTITUTIONS');
  };

  const handleUserLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch(e) {}
    setSession(null);
    setUserProfile(null);
    setInstitutionsList([]);
    setSelectedSociety(null);
    resetAllFormFields();
    setCurrentMobileScreen('MY_INSTITUTIONS');
  };

  useEffect(() => {
    // 1. Handle Authentication with safety timeout
    const authTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 2500);

    supabase.auth.getSession()
      .then(({ data: { session: sbSession } }) => {
        clearTimeout(authTimeout);
        if (sbSession?.user) {
          handleUserAuthSuccess(sbSession.user);
        }
        setAuthLoading(false);
      })
      .catch(() => {
        clearTimeout(authTimeout);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sbSession) => {
      // Only re-run the full auth-success flow (which navigates to
      // MY_INSTITUTIONS) on a genuine new sign-in. Supabase fires this same
      // listener with a valid session for TOKEN_REFRESHED too — which
      // happens silently whenever the tab/app regains focus — and without
      // this guard every tab switch was yanking the user back to "Add New
      // Institution" mid-task, regardless of what screen they were on.
      if (sbSession?.user && event === 'SIGNED_IN') {
        handleUserAuthSuccess(sbSession.user);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUserProfile(null);
        setInstitutionsList([]);
        setSelectedSociety(null);
        resetAllFormFields();
        setCurrentMobileScreen('MY_INSTITUTIONS');
      }
    });

    // 2. Handle Permissions (Native Mobile only)
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
          const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
          if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
            Alert.alert('Permissions Required', 'Camera and Location are strictly enforced for official verification.');
          }
        } catch (e) {
          console.warn('Permissions error:', e);
        }
      })();
    }

    // 3. Load Centers
    (async () => {
      const centers = await loadMilkCenters();
      setMilkCenters(centers);
    })();

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // 4. Handle Offline Sync Polling & Network Changes + Broadcast Sync
  useEffect(() => {
    getQueueStatus().then(setPendingSyncCount);

    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from('broadcast_alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (data && data.length > 0) {
                setAlertHistory(data);
                // Check if the latest alert is unread
                const lastId = await AsyncStorage.getItem('@last_read_alert');
                if (data[0].id !== lastId) {
                    setActiveAlert(data[0]);
                }
            }
        } catch(e) {}
    };

    fetchAlerts();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state && state.isConnected) {
        // Sync Data
        if (!isSyncing) {
            setIsSyncing(true);
            processQueue(({ pending }) => {
                setPendingSyncCount(pending);
            }).finally(() => setIsSyncing(false));
        }
        // Sync Broadcasts
        fetchAlerts();
      }
    });

    const interval = setInterval(() => {
        getQueueStatus().then(setPendingSyncCount);
        fetchAlerts();
    }, 30000);

    // Real-time subscription
    const channel = supabase
      .channel('broadcast-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_alerts' }, payload => {
          setActiveAlert(payload.new);
          setAlertHistory(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
        unsubscribe();
        clearInterval(interval);
        supabase.removeChannel(channel);
    };
  }, [isSyncing]);

  const dismissAlert = async (id) => {
      await AsyncStorage.setItem('@last_read_alert', id);
      setActiveAlert(null);
  };

  const captureImage = async () => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64);

        const now = new Date();
        const formattedTime = now.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        setTimestamp(formattedTime);

        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Verification capture failed. Please try again.');
    }
  };

  const showValidationAlert = (items) => {
    const message = "Please address the following items before sealing:\n\n• " + items.join("\n• ");
    if (Platform.OS === 'web') {
      alert("Validation Required\n\n" + message);
    } else {
      Alert.alert("Validation Required", message, [{ text: "Fix Errors" }]);
    }
  };

  const generatePDF = async (recordOverride = null) => {
    if (isSealing && !recordOverride) return;

    const recordItem = recordOverride?.rawData || recordOverride;
    const socName = recordItem?.society_name || recordItem?.center_name || recordItem?.center || selectedSociety?.name || centerName?.trim() || 'Institution Name Not Set';
    const repMonth = recordItem?.reporting_month || recordItem?.month || reportingMonth?.trim() || getCurrentMonthLabel();

    // --- DECLARE activeCenterName & activeReportingMonth BEFORE use (TDZ fix) ---
    const activeCenterName = socName;
    const activeReportingMonth = repMonth;

    // Collate Latest Valid Saved Data dynamically for MILK PCS
    let opsData = null;
    let evData = null;
    let actsData = null;
    let compData = null;
    let mpcsLoanMonthlyData = null;
    if (!recordOverride && selectedSociety?.type === 'MPCS') {
      mpcsLoanMonthlyData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'mpcs_loan');
    }
    if (!recordOverride) {
      // Digital Evidence uses the same 'evidence' section key for both MPCS
      // and Milk PCS societies, so this must be fetched for both types —
      // gating it to MILK-only left MPCS certificates with a blank photo.
      evData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'evidence');
    }
    if (!recordOverride && selectedSociety?.type === 'MILK') {
       console.log('[CORE DEBUG] getMilkSectionData keys:', { activeCenterName, activeReportingMonth });
       opsData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'operations');
       actsData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'activities');
       compData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'compliance');
       console.log('[CORE DEBUG] OPERATIONS DATA', opsData);
       console.log('[CORE DEBUG] EVIDENCE DATA', evData);
       console.log('[CORE DEBUG] ACTIVITIES DATA', actsData);
       console.log('[CORE DEBUG] COMPLIANCE DATA', compData);
    }
    const activeLitres = opsData?.litres ? String(opsData.litres) : (recordItem?.litres ? String(recordItem.litres) : (litres && !isNaN(parseFloat(litres)) ? litres : '0'));
    const activeBalance = opsData?.balance ? String(opsData.balance) : (recordItem?.bank_balance || recordItem?.balance ? String(recordItem.bank_balance || recordItem.balance) : (balance && !isNaN(parseFloat(balance)) ? balance : '0'));
    const activeWithdrawal = opsData?.withdrawal ? String(opsData.withdrawal) : (recordItem?.annual_turnover || recordItem?.withdrawal ? String(recordItem.annual_turnover || recordItem.withdrawal) : (withdrawal || '0'));
    const activeReportedBy = evData?.reportedBy ? evData.reportedBy : (recordItem?.reported_by || recordItem?.officer || userProfile?.fullName || reportedBy?.trim() || 'Cooperative Inspector');

    // form_data is only populated for MPCS rows, and Supabase can return it
    // either as a parsed object or (depending on the query path) a raw JSON
    // string — mirror the safe-parse RecordsScreen already does before reading it.
    let recordFormData = recordItem?.form_data;
    if (typeof recordFormData === 'string') {
      try { recordFormData = JSON.parse(recordFormData); } catch (e) { recordFormData = null; }
    }

    const activeDistrict = recordOverride
      ? (recordItem?.district || recordFormData?.district || recordFormData?.gpu || 'Sikkim')
      : (selectedSociety?.district || userProfile?.district || district?.trim() || 'Sikkim');
    const activeRegistrationNumber = recordOverride
      ? (recordItem?.registration_number || recordItem?.center_id || 'N/A')
      : (registrationNumber?.trim() || 'N/A');
    const activePresidentName = recordOverride ? (recordItem?.president_name || '') : (presidentName?.trim() || '');
    const activePresidentMobile = recordOverride ? (recordItem?.president_mobile || '') : (presidentMobile?.trim() || '');
    const activeManagerName = recordOverride
      ? (recordItem?.manager_name || recordFormData?.managerName || '')
      : (managerName?.trim() || '');
    const activeManagerMobile = recordOverride
      ? (recordItem?.manager_mobile || recordFormData?.managerMobile || '')
      : (managerMobile?.trim() || '');
    const pdfDateOfReport = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Derive activities text (printed on the PDF only — human-readable, flattened)
    let activities = '';
    if (actsData && actsData.activityList) {
      activities = actsData.activityList.length > 0
        ? actsData.activityList.map((a, i) => `${i + 1}. ${a.title || JSON.stringify(a)}`).join('\n')
        : '';
    } else if (recordItem?.activities) {
      activities = typeof recordItem.activities === 'string' ? recordItem.activities : JSON.stringify(recordItem.activities);
    } else {
      activities = activityItems.length > 0
        ? activityItems.map((a, i) => `${i + 1}. ${a.text || a.description || a.title || JSON.stringify(a)}`).join('\n')
        : '';
    }

    // Separate value for what actually gets sent to Supabase. The flattened
    // text above is fine for the printed PDF, but sending it as `activities`
    // used to silently overwrite the structured activityList JSON that the
    // routine background sync (saveMasterStateToStorage) already wrote for
    // this same submission — Compile & Seal running after those saves would
    // downgrade "3 activities logged with full detail" to a single flat
    // line. Preserve the structured shape here the same way that sync does.
    const activitiesForSubmission = actsData
      ? JSON.stringify(actsData)
      : (recordItem?.activities
          ? (typeof recordItem.activities === 'string' ? recordItem.activities : JSON.stringify(recordItem.activities))
          : '');

    if (!recordOverride) setIsSealing(true);

    // Certificate evidence (photo/timestamp/coordinates) must come from the
    // record actually being viewed, not from whatever live capture session
    // happens to be in component state — otherwise viewing an old sealed
    // return from Records shows this session's (usually empty) evidence,
    // producing broken images and blank timestamps on someone else's record.
    let activeLocation = evData?.location ? evData.location : location;
    const locText = recordOverride
      ? (recordItem?.gps_lat != null && recordItem?.gps_lng != null
          ? `${Number(recordItem.gps_lat).toFixed(6)}° N, ${Number(recordItem.gps_lng).toFixed(6)}° E`
          : (recordItem?.district ? `${recordItem.district} District` : 'N/A'))
      : (activeLocation ? `${activeLocation.latitude?.toFixed(6) || ''}° N, ${activeLocation.longitude?.toFixed(6) || ''}° E` : 'Gyalshing District GPS');

    const pdfTimestamp = recordOverride
      ? (recordItem?.captured_at || (recordItem?.created_at ? new Date(recordItem.created_at).toLocaleString('en-IN') : 'N/A'))
      : timestamp;

    const pdfImageSrc = recordOverride
      ? (recordItem?.photo_url || null)
      : (evData?.imageBase64
          ? `data:image/jpeg;base64,${evData.imageBase64}`
          : (evData?.imageUri || (imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null)));

    // Robust internal calculation for totals
    const pdfMSc = parseInt(mSc) || 0;
    const pdfFSc = parseInt(fSc) || 0;
    const pdfMSt = parseInt(mSt) || 0;
    const pdfFSt = parseInt(fSt) || 0;
    const pdfMObc = parseInt(mObc) || 0;
    const pdfFObc = parseInt(fObc) || 0;
    const pdfMGen = parseInt(mGen) || 0;
    const pdfFGen = parseInt(fGen) || 0;

    const pdfTotalMale = pdfMSc + pdfMSt + pdfMObc + pdfMGen;
    const pdfTotalFemale = pdfFSc + pdfFSt + pdfFObc + pdfFGen;
    const pdfGrandTotal = pdfTotalMale + pdfTotalFemale;

    const isMilk = selectedSociety?.type === 'MILK' || recordItem?.society_type === 'MILK';

    // Values printed on the sealed document. For Milk PCS, Audit/AGM/loan-setup are
    // now Master Data (set once on Institutional Profile) rather than monthly entries,
    // so pull them from master state here — same source used for the Supabase submission
    // above — instead of the legacy top-level auditDate/agmDate/hasLoan variables (which
    // are only ever populated for the MPCS flow). When viewing a historical record instead,
    // none of that live state belongs to the record being viewed — read the submission's
    // own stored columns (falling back to form_data for the MPCS fields that only ever
    // got persisted there) so the certificate reflects what was true for that submission.
    const pdfLoanIsActive = recordOverride
      ? !!recordItem?.has_loan
      : (isMilk ? (masterHasLoan && !masterLoanCleared) : hasLoan);
    const pdfLoanName = recordOverride
      ? (recordItem?.loan_name || recordFormData?.loanName || '')
      : (isMilk ? masterLoanType : loanName);
    const pdfLoanAmount = recordOverride
      ? (recordItem?.loan_amount || recordFormData?.loanAmount || 0)
      : (isMilk ? masterLoanExtended : loanAmount);
    const pdfRemainingDue = recordOverride
      ? (recordItem?.remaining_due || recordFormData?.remainingDue || 0)
      : (isMilk ? (compData?.loanOutstanding || '') : remainingDue);
    const pdfAuditDate = recordOverride
      ? (isMilk ? 'N/A' : (recordItem?.audit_done || 'N/A'))
      : (isMilk ? masterAuditDate : auditDate);
    const pdfAuditYear = recordOverride
      ? (isMilk ? '' : (recordItem?.audit_year || ''))
      : (isMilk ? masterAuditYear : auditYear);
    const pdfAgmDate = recordOverride
      ? (isMilk ? 'N/A' : (recordFormData?.agmDate || recordFormData?.agmDone || 'N/A'))
      : (isMilk ? masterAgmDate : agmDate);

    // ─── Row data for the report tables (built once, rendered via .map below) ───
    const generalInfoRows = [
      { label: isMilk ? 'Name of Milk PCS' : 'Name of MPCS', value: activeCenterName || 'N/A' },
      { label: isMilk ? 'Milk PCS Code' : 'MPCS Code', value: activeRegistrationNumber },
      { label: 'District / GPU', value: activeDistrict },
      activePresidentName ? { label: 'President Name', value: activePresidentName } : null,
      activePresidentMobile ? { label: 'President Mobile', value: activePresidentMobile } : null,
      activeManagerName ? { label: isMilk ? 'Manager Name' : 'Secretary / Manager Name', value: activeManagerName } : null,
      activeManagerMobile ? { label: 'Manager Mobile', value: activeManagerMobile } : null,
      { label: 'Reporting Month', value: activeReportingMonth || 'N/A' },
    ].filter(Boolean);

    const financialRows = isMilk
      ? [
          { label: 'Litres Collected', value: `${activeLitres} L` },
          { label: 'Total Withdrawal', value: `₹ ${parseFloat(activeWithdrawal || 0).toLocaleString('en-IN')}` },
          { label: 'Closing Balance', value: `₹ ${parseFloat(activeBalance || 0).toLocaleString('en-IN')}` },
        ]
      : [
          { label: 'Annual Turnover', value: `₹ ${parseFloat(activeWithdrawal || 0).toLocaleString('en-IN')}` },
          { label: 'Bank Balance', value: `₹ ${parseFloat(activeBalance || 0).toLocaleString('en-IN')}` },
        ];
    financialRows.push({ label: 'Audit Conducted', value: `${pdfAuditDate || 'N/A'}${pdfAuditYear ? ` (Year: ${pdfAuditYear})` : ''}` });
    financialRows.push({ label: 'AGM Conducted', value: pdfAgmDate || 'N/A' });
    if (pdfLoanIsActive) {
      financialRows.push({ label: 'Loan Scheme', value: pdfLoanName || 'N/A' });
      financialRows.push({ label: 'Loan Disbursed', value: `₹ ${parseFloat(pdfLoanAmount || 0).toLocaleString('en-IN')}` });
      financialRows.push({ label: 'Outstanding Loan', value: `₹ ${parseFloat(pdfRemainingDue || 0).toLocaleString('en-IN')}` });
    }

    const renderInfoRows = (rows) => rows.map(r => `<tr class="data-row"><td class="data-label">${escapeHtml(r.label)}</td><td class="data-value">${escapeHtml(r.value)}</td></tr>`).join('');

    const reportTypeLabel = isMilk ? 'MILK PCS' : 'MPCS';
    const evidenceCaption = [activeDistrict, 'Sikkim, India'].filter(Boolean).join(', ');

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 12mm;
            }

            * { box-sizing: border-box; }

            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 0;
              margin: 0;
              background-color: #FFFFFF;
              color: #1F2937;
              line-height: 1.3;
              font-size: 10px;
            }

            .page-container {
              width: 100%;
              position: relative;
              border: 1px solid #CBD5E1;
              padding: 10px 14px;
            }

            .gov-header {
              text-align: center;
              margin-bottom: 8px;
            }
            .gov-name {
              font-size: 19px;
              font-weight: 800;
              color: #14235C;
              letter-spacing: 0.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .dept-name {
              font-size: 10.5px;
              font-weight: 600;
              color: #374151;
              letter-spacing: 1.2px;
              margin-top: 2px;
              text-transform: uppercase;
            }
            .doc-title {
              font-size: 16px;
              font-weight: 900;
              color: #111827;
              letter-spacing: 0.8px;
              margin-top: 6px;
              text-transform: uppercase;
            }
            .title-divider {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-top: 6px;
            }
            .title-divider .line { flex: 1; height: 2px; background: #14235C; }
            .title-divider .dot { width: 5px; height: 5px; border-radius: 50%; background: #14235C; }

            .info-bar {
              display: flex;
              background: #14235C;
              color: #FFFFFF;
              margin-top: 8px;
              border-radius: 2px;
              overflow: hidden;
            }
            .info-bar + .info-bar { margin-top: 1px; }
            .info-bar > div {
              flex: 1;
              padding: 5px 12px;
              font-size: 9.5px;
              border-right: 1px solid rgba(255,255,255,0.25);
            }
            .info-bar > div:last-child { border-right: none; }
            .info-bar b { font-weight: 700; }

            .section-title {
              font-size: 11px;
              font-weight: 800;
              color: #14235C;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              margin: 10px 0 5px;
              padding-bottom: 3px;
              border-bottom: 2px solid #14235C;
            }

            .grid-2 { display: flex; gap: 14px; }
            .grid-2 > div { flex: 1; }

            .evidence-photo {
              position: relative;
              width: 100%;
              height: 130px;
              border-radius: 4px;
              border: 1px solid #CBD5E1;
              overflow: hidden;
              background: #F1F5F9;
            }
            .evidence-photo img {
              width: 100%; height: 100%; object-fit: cover; display: block;
            }
            .evidence-photo .no-photo {
              width: 100%; height: 100%;
              display: flex; align-items: center; justify-content: center;
              color: #94A3B8; font-size: 9px;
            }
            .evidence-stamp {
              position: absolute;
              left: 0; right: 0; bottom: 0;
              background: linear-gradient(0deg, rgba(11,23,57,0.92) 0%, rgba(11,23,57,0.72) 70%, transparent 100%);
              color: #FFFFFF;
              padding: 16px 8px 6px;
              font-size: 8px;
            }
            .evidence-stamp .place { font-size: 10px; font-weight: 700; margin-bottom: 1px; }
            .evidence-stamp .meta { opacity: 0.9; }
            .evidence-badge {
              position: absolute;
              top: 6px; left: 6px;
              background: rgba(255,255,255,0.92);
              color: #14235C;
              font-size: 7.5px;
              font-weight: 800;
              padding: 2px 7px;
              border-radius: 3px;
              letter-spacing: 0.3px;
            }

            .data-table { width: 100%; border-collapse: collapse; }
            .data-row { border-bottom: 1px solid #E5E7EB; }
            .data-row:last-child { border-bottom: none; }
            .data-label { padding: 4px 4px; font-size: 9px; font-weight: 600; color: #4B5563; }
            .data-value { padding: 4px 4px; font-size: 9.5px; font-weight: 700; color: #111827; text-align: right; }

            .stat-row { display: flex; gap: 8px; margin-bottom: 6px; }
            .stat-box {
              flex: 1;
              background: #F1F5FB;
              border: 1px solid #DCE4F5;
              border-radius: 4px;
              padding: 6px 8px;
              text-align: center;
            }
            .stat-box .num { font-size: 15px; font-weight: 800; color: #14235C; }
            .stat-box .lbl { font-size: 7.5px; color: #4B5563; text-transform: uppercase; margin-top: 1px; letter-spacing: 0.3px; }

            .census-table { width: 100%; border-collapse: collapse; }
            .census-table th { background: #14235C; color: #FFFFFF; font-size: 8px; text-align: center; padding: 4px 4px; text-transform: uppercase; }
            .census-table th:first-child { text-align: left; padding-left: 8px; }
            .census-row td { padding: 3.5px 4px; border-bottom: 0.5px solid #E5E7EB; font-size: 9px; font-weight: 600; color: #334155; text-align: center; }
            .census-row td:first-child { text-align: left; padding-left: 8px; }
            .census-total-row td { background: #EEF2FB; padding: 4.5px 4px; font-weight: 800; color: #14235C; border-top: 1.5px solid #14235C; text-align: center; }
            .census-total-row td:first-child { text-align: left; padding-left: 8px; }

            .remarks-box {
              border: 1px solid #E5E7EB;
              border-radius: 4px;
              padding: 6px 10px;
              font-size: 9px;
              color: #374151;
              white-space: pre-line;
              min-height: 20px;
            }

            .footer-authority {
              margin-top: 12px;
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }
            .sign-col { flex: 1; font-size: 9px; }
            .sign-col .row { display: flex; margin-bottom: 2px; }
            .sign-col .k { width: 64px; color: #6B7280; }
            .sign-col .v { font-weight: 700; color: #111827; }
            .sign-col .heading { font-size: 8.5px; font-weight: 800; color: #14235C; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }

            .closing-divider { border-top: 2px solid #14235C; margin-top: 10px; padding-top: 5px; display: flex; justify-content: space-between; }
            .closing-divider .stamp { text-align: center; font-size: 8px; color: #4B5563; }
            .closing-divider .stamp b { display: block; font-size: 9px; color: #14235C; }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="gov-header">
              <h1 class="gov-name">Government of Sikkim</h1>
              <div class="dept-name">Department of Cooperation</div>
              <div class="doc-title">${reportTypeLabel} Monthly Data Report</div>
              <div class="title-divider"><span class="line"></span><span class="dot"></span><span class="line"></span></div>
            </div>

            <div class="info-bar">
              <div><b>Reporting Month</b> &nbsp;:&nbsp; ${escapeHtml(activeReportingMonth || 'N/A')}</div>
              <div><b>Date of Report</b> &nbsp;:&nbsp; ${escapeHtml(pdfDateOfReport)}</div>
            </div>
            <div class="info-bar">
              <div><b>Name of ${reportTypeLabel}</b> &nbsp;:&nbsp; ${escapeHtml(activeCenterName || 'N/A')}</div>
              <div><b>${reportTypeLabel} Code</b> &nbsp;:&nbsp; ${escapeHtml(activeRegistrationNumber)}</div>
            </div>

            <div class="section-title">1. Digital Evidence (Geotagged Photo)</div>
            <div class="grid-2">
              <div>
                <div class="evidence-photo">
                  ${pdfImageSrc
                    ? `<img src="${pdfImageSrc}" />`
                    : `<div class="no-photo">No evidence photo on record</div>`
                  }
                  <div class="evidence-badge">GPS VERIFIED</div>
                  <div class="evidence-stamp">
                    <div class="place">${escapeHtml(evidenceCaption || 'Location not recorded')}</div>
                    <div class="meta">${escapeHtml(locText)}</div>
                    <div class="meta">${escapeHtml(pdfTimestamp)}</div>
                  </div>
                </div>
              </div>
              <div>
                <div class="section-title" style="margin-top:0;">2. General Information</div>
                <table class="data-table">${renderInfoRows(generalInfoRows)}</table>
              </div>
            </div>

            ${isMilk ? '' : `
            <div class="section-title">3. Membership &amp; Governance</div>
            <div class="stat-row">
              <div class="stat-box"><div class="num">${pdfGrandTotal}</div><div class="lbl">Total Members</div></div>
              <div class="stat-box"><div class="num">${pdfTotalMale}</div><div class="lbl">Male</div></div>
              <div class="stat-box"><div class="num">${pdfTotalFemale}</div><div class="lbl">Female</div></div>
            </div>
            <table class="census-table">
              <tr><th style="width: 40%;">Category</th><th>Male</th><th>Female</th><th>Total</th></tr>
              <tr class="census-row"><td>SC Members</td><td>${pdfMSc}</td><td>${pdfFSc}</td><td>${pdfMSc + pdfFSc}</td></tr>
              <tr class="census-row"><td>ST Members</td><td>${pdfMSt}</td><td>${pdfFSt}</td><td>${pdfMSt + pdfFSt}</td></tr>
              <tr class="census-row"><td>OBC Members</td><td>${pdfMObc}</td><td>${pdfFObc}</td><td>${pdfMObc + pdfFObc}</td></tr>
              <tr class="census-row"><td>GEN Members</td><td>${pdfMGen}</td><td>${pdfFGen}</td><td>${pdfMGen + pdfFGen}</td></tr>
              <tr class="census-total-row"><td>Grand Total</td><td>${pdfTotalMale}</td><td>${pdfTotalFemale}</td><td>${pdfGrandTotal}</td></tr>
            </table>
            `}

            <div class="section-title">${isMilk ? '3' : '4'}. Financial Summary (This Month)</div>
            <table class="data-table">${renderInfoRows(financialRows)}</table>

            <div class="section-title">${isMilk ? '4' : '5'}. Activities &amp; Remarks</div>
            <div class="remarks-box">${escapeHtml(activities) || 'No special activities recorded for this period.'}</div>

            <div class="footer-authority">
              <div class="sign-col">
                <div class="heading">Reported By</div>
                <div class="row"><div class="k">Name</div><div class="v">:&nbsp; ${escapeHtml(activeReportedBy)}</div></div>
                <div class="row"><div class="k">Designation</div><div class="v">:&nbsp; Cooperative Inspector (CI)</div></div>
                <div class="row"><div class="k">Date &amp; Time</div><div class="v">:&nbsp; ${escapeHtml(pdfTimestamp)}</div></div>
              </div>
              <div class="sign-col">
                <div class="heading">Verified By</div>
                <div class="row"><div class="k">Name</div><div class="v">:&nbsp; ARCS Official</div></div>
                <div class="row"><div class="k">Designation</div><div class="v">:&nbsp; Assistant Registrar, Coop. Societies</div></div>
                <div class="row"><div class="k">Date &amp; Time</div><div class="v">:&nbsp; &nbsp;</div></div>
              </div>
            </div>

            <div class="closing-divider">
              <div class="stamp"><b>Signed by ARCS</b>Department of Cooperation<br/>Government of Sikkim</div>
              <div class="stamp"><b>Signed by CI</b>Department of Cooperation<br/>Government of Sikkim</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // --- If viewing historical record PDF from RecordsScreen ---
    if (recordOverride) {
      if (Platform.OS === 'web') {
        setPdfPreviewHtml(htmlContent);
      } else {
        try {
          const printResult = await Print.printToFileAsync({ html: htmlContent });
          if (printResult?.uri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(printResult.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
          }
        } catch(e) {
          console.warn('Mobile PDF exception:', e);
        }
      }
      return;
    }

    // ─── Step 1: Prepare Submission Data ───────────────────────────
    const totalMaleCalc = [mSc, mSt, mObc, mGen].reduce((s, v) => s + (parseInt(v) || 0), 0);
    const totalFemaleCalc = [fSc, fSt, fObc, fGen].reduce((s, v) => s + (parseInt(v) || 0), 0);
    const totalMembersCalc = totalMaleCalc + totalFemaleCalc;

    const submissionData = {
      centerName: activeCenterName, 
      centerId: activeCenterName, 
      registrationNumber, 
      presidentName: presidentName || selectedSociety?.presidentName || '', 
      presidentMobile: presidentMobile || selectedSociety?.presidentMobile || '', 
      managerName: managerName || selectedSociety?.managerName || '', 
      managerMobile: managerMobile || selectedSociety?.managerMobile || '', 
      reportingMonth: activeReportingMonth, 
      reportedBy: activeReportedBy, 
      litres: activeLitres || '0', 
      sales: activeWithdrawal || '0',
      withdrawal: activeWithdrawal || '0', 
      deposit: activeBalance || '0',
      balance: activeBalance || '0',
      totalTurnover: activeWithdrawal || '0',
      totalIncome: businessPerformanceData?.totalIncome || '',
      totalExpenses: businessPerformanceData?.totalExpenses || '',
      netSurplusDeficit: businessPerformanceData?.netSurplusDeficit || '',
      mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen,
      totalMale: String(totalMaleCalc), totalFemale: String(totalFemaleCalc), totalMembers: String(totalMembersCalc),
      // Same dead-state bug as audit/agm/profit below: compData is only ever
      // populated for Milk PCS, and the local hasLoan/loanName/loanAmount/
      // paidAmount/remainingDue state is never set by any MPCS screen. Read
      // the actual Loan Details Master Data (loanData) and its monthly
      // recovery record (mpcsLoanMonthlyData) instead.
      hasLoan: isMilk ? (masterHasLoan && !masterLoanCleared) : (loanData?.hasLoan && !loanData?.loanCleared),
      loanName: isMilk ? masterLoanType : (loanData?.loanType || ''),
      loanAmount: isMilk ? masterLoanExtended : (loanData?.loanExtended || ''),
      paidAmount: isMilk
        ? ((masterHasLoan && !masterLoanCleared) ? (compData?.loanRecovered || '0') : '')
        : ((loanData?.hasLoan && !loanData?.loanCleared) ? (mpcsLoanMonthlyData?.loanRecovered || '0') : ''),
      remainingDue: isMilk
        ? ((masterHasLoan && !masterLoanCleared) ? (compData?.loanOutstanding || masterLoanExtended || '0') : '')
        : ((loanData?.hasLoan && !loanData?.loanCleared) ? (mpcsLoanMonthlyData?.loanOutstanding || loanData?.loanExtended || '0') : ''),
      loanData,
      // saveMpcsSubmission's update path replaces form_data wholesale with
      // whatever's in this object rather than merging with the existing DB
      // row — same class of bug the activitiesForSubmission comment above
      // already describes for the flattened `activities` string, except
      // this field (the actual structured array MpcsActivitiesLogScreen
      // writes to and the admin dashboard reads from) was missing entirely,
      // so logging an activity then submitting the return silently wiped it.
      activityItems,
      activities: activitiesForSubmission,
      // compData comes from getMilkSectionData(..., 'compliance'), which only the
      // Milk PCS ComplianceScreen ever writes (via saveMilkSectionData) — for MPCS
      // it is always null, and the local auditDate/agmDate state below it is never
      // set by any screen either. Both fallbacks always resolved to 'No', silently
      // overwriting whatever audit/AGM status the MPCS Compliance & Audit screen
      // had just saved into the live complianceData master state moments earlier
      // (the actual source of truth — same one MpcsComplianceAuditScreen writes to).
      auditDone: isMilk ? (masterAuditDate ? `Yes (${masterAuditDate})` : 'No') : (complianceData?.auditStatus === 'Completed' ? `Yes${complianceData?.auditDate ? ` (${complianceData.auditDate})` : ''}` : 'No'),
      auditDate: isMilk ? masterAuditDate : (complianceData?.auditDate || auditDate),
      auditYear: isMilk ? masterAuditYear : (complianceData?.auditYear || auditYear),
      agmDone: isMilk ? (masterAgmDate ? `Yes (${masterAgmDate})` : 'No') : (complianceData?.agmStatus === 'Completed' ? `Yes${complianceData?.agmDate ? ` (${complianceData.agmDate})` : ''}` : 'No'),
      agmDate: isMilk ? masterAgmDate : (complianceData?.agmDate || agmDate),
      agmYear: isMilk ? masterAgmYear : (complianceData?.agmYear || agmYear),
      // financialsData.profitOrLoss/netProfit were never threaded into this payload,
      // so saveMpcsSubmission's is_profit column always fell back to its hardcoded
      // 'PROFIT' default regardless of what was actually selected on the Financial
      // Performance screen.
      profitOrLoss: financialsData?.profitOrLoss || null,
      netProfit: financialsData?.netProfit,
      // location/timestamp/imageBase64 top-level state is never set by
      // DigitalEvidenceScreen (it manages its own local state and persists
      // via saveMilkSectionData) — evData, fetched above, is the real source.
      gpsLat: evData?.location?.latitude ?? location?.latitude ?? null,
      gpsLng: evData?.location?.longitude ?? location?.longitude ?? null,
      capturedAt: evData?.timestamp || timestamp || new Date().toISOString(),
      // Append all data sets to ensure they are captured in offline queue and cloud DB
      demographicsData,
      complianceData,
      financialsData,
      supplementalData,
      dividendData,
      bankData,
      shareCapitalData,
      cscDetailsData,
      cscTransData,
      businessPerformanceData,
      remarks: businessPerformanceData?.remarks || ''
    };

    try {
      // Save monthly parameters persistently so subsequent visits in same month show 80% completion
      await saveMonthlyParams(activeCenterName, activeReportingMonth, submissionData);
      setHasSubmittedMonthlyParams(true);

      // ─── Step 2: Handle Offline/Online Submission ─────────────────
      let isConnected = true;
      try {
        if (Platform.OS === 'web') {
          isConnected = typeof navigator !== 'undefined' ? navigator.onLine : true;
        } else {
          const netState = await NetInfo.fetch();
          isConnected = !!netState?.isConnected;
        }
      } catch(e) {
        isConnected = true;
      }

      let isOfflineSaved = false;
      let isCloudSaved = false;
      let sbError = null;

      if (!isConnected) {
          const queued = await queueSubmission(activeView === 'MPCS' ? 'MPCS' : 'MILK_PCS', submissionData);
          if (queued) {
              setPendingSyncCount(prev => prev + 1);
              isOfflineSaved = true;
          }
      } else {
          let uploadedPhotoUrl = null;
          const submitPhotoBase64 = evData?.imageBase64 || imageBase64;
          if (submitPhotoBase64) {
            try {
              uploadedPhotoUrl = await uploadPhoto(submitPhotoBase64);
            } catch(e) {
              console.warn('Photo upload exception:', e);
            }
          }
          
          if (activeView === 'MPCS') {
            const res = await saveMpcsSubmission({
              ...submissionData,
              societyName: activeCenterName,
              registrationNumber: selectedSociety?.regNo || registrationNumber,
              district: activeDistrict,
              reportedBy: activeReportedBy,
              inspectorEmail: userProfile?.email,
              photoUrl: uploadedPhotoUrl,
              latitude: evData?.location?.latitude ?? location?.latitude,
              longitude: evData?.location?.longitude ?? location?.longitude,
              panCard: panCard || selectedSociety?.panCard || '',
              regDate: regDate || selectedSociety?.regDate || '',
              '1.8': panCard || selectedSociety?.panCard || '',
              '1.6': regDate || selectedSociety?.regDate || ''
            });
            sbError = res.error;
          } else {
            console.log('[CORE DEBUG] OPERATIONS DATA', opsData);
            console.log('[CORE DEBUG] EVIDENCE DATA', evData);
            console.log('[CORE DEBUG] ACTIVITIES DATA', actsData);
            console.log('[CORE DEBUG] COMPLIANCE DATA', compData);
            
            const finalPayload = {
              ...submissionData,
              centerName: activeCenterName,
              centerId: activeCenterName,
              district: activeDistrict,
              reportedBy: activeReportedBy,
              photoUrl: uploadedPhotoUrl
            };
            
            console.log('[CORE DEBUG] COMPILE & SEAL FINAL PAYLOAD', {
              society: finalPayload.centerName,
              reportingMonth: finalPayload.reportingMonth,
              litres: finalPayload.litres,
              withdrawal: finalPayload.withdrawal,
              balance: finalPayload.balance,
              presidentName: finalPayload.presidentName,
              managerName: finalPayload.managerName,
              reportedBy: finalPayload.reportedBy,
              hasLoan: finalPayload.hasLoan,
              loanName: finalPayload.loanName,
              loanAmount: finalPayload.loanAmount,
              paidAmount: finalPayload.paidAmount,
              remainingDue: finalPayload.remainingDue,
              activities: finalPayload.activities,
              gpsLat: finalPayload.gpsLat,
              gpsLng: finalPayload.gpsLng,
              capturedAt: finalPayload.capturedAt
            });

            const res = await saveMilkPcsSubmission(finalPayload);
            
            console.log('[CORE DEBUG] SUPABASE RESULT', {
              operation: 'UPSERT',
              error: res.error,
              returned_row: res.data ? res.data[0] : null
            });
            sbError = res.error;
          }

          if (sbError) {
             console.error('Submission error:', sbError);
             showToast(`⚠️ Error: ${sbError.message || 'Supabase insert failed'}`, true);
             await queueSubmission(activeView === 'MPCS' ? 'MPCS' : 'MILK_PCS', submissionData);
             setPendingSyncCount(prev => prev + 1);
             isOfflineSaved = true;
          } else {
             isCloudSaved = true;
             showToast('✅ Submission successfully inserted to Admin database!');
          }
      }

      const profileData = { centerName, district, reportedBy, mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen, hasLoan, loanName, loanAmount };
      saveMilkPcsProfile('last_used', profileData);
      if (centerName?.trim()) {
          saveMilkPcsProfile(centerName.trim(), profileData);
          addMilkCenter(centerName.trim(), district).then(updated => { if (updated) setMilkCenters(updated); });
      }

      // Only auto-open/share the PDF when this is an explicit "View PDF" request from
      // Records (recordOverride is set). A fresh Compile & Seal just saves silently —
      // the record is immediately available in Records, and "View PDF" there triggers
      // this same function with the saved data to regenerate and open the PDF on demand.
      if (recordOverride) {
        if (Platform.OS === 'web') {
          setPdfPreviewHtml(htmlContent);
        } else {
          try {
            const printResult = await Print.printToFileAsync({ html: htmlContent });
            if (printResult?.uri && await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(printResult.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
          } catch (err) {
            console.warn('PDF Error:', err);
          }
        }
      }

      // Clear only live visit fields after successful seal (retaining monthly params for baseline 80%)
      setImageUri(null);
      setImageBase64(null);
      setTimestamp('');
      setLocation(null);
      setActivityItems([]);
      setIsSealing(false);

      if (isCloudSaved) {
        Alert.alert('Success', '✅ Submission successfully uploaded to the Admin Database.');
      } else if (isOfflineSaved) {
        Alert.alert('Offline Mode', '⚠️ Saved Offline: Data cached locally. Will sync later.');
      }

      return { success: isCloudSaved || isOfflineSaved, error: sbError };

    } catch (err) {
      console.error('handleSealRecord execution error:', err);
      setIsSealing(false);
      showToast('⚠️ Submission Error: Saved to offline queue.', true);
      return { success: false, error: err };
    }
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fcf8fa', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7a1a1f" />
      </View>
    );
  }

  if (authLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.mobileShellWrapper}>
        <View style={styles.mobileDeviceFrame}>
          <Login
            onLoginSuccess={(usr) => handleUserAuthSuccess(usr)}
            onRegisterSuccess={(usr) => handleUserAuthSuccess(usr)}
          />
        </View>
      </View>
    );
  }


  return (
    <View style={styles.root}>
       {toastMsg && (
         <View style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 99999, backgroundColor: toastMsg.isError ? '#7F1D1D' : '#065F46', borderLeftWidth: 5, borderLeftColor: toastMsg.isError ? '#EF4444' : '#10B981', padding: 14, borderRadius: 8, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 }}>
           <Text style={{ color: '#FFFFFF', fontWeight: '800', textAlign: 'center', fontSize: 13, letterSpacing: 0.3 }}>
             {toastMsg.text}
           </Text>
         </View>
       )}
       {pendingSyncCount > 0 && !isSealing && <SyncBanner count={pendingSyncCount} syncing={isSyncing} />}
      <StatusBar barStyle="light-content" backgroundColor={COLORS.emerald} />

      <View style={styles.bgBlobLeft} pointerEvents="none" />
      <View style={styles.bgBlobRight} pointerEvents="none" />

      {Platform.OS === 'web' && (
        <style>{`
          input, textarea, select {
            outline: none !important;
            box-shadow: none !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          }
          input:focus, textarea:focus, select:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          input[type="date"] {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            cursor: pointer !important;
            outline: none !important;
            box-shadow: none !important;
          }
          input[type="date"]::-webkit-calendar-picker-indicator:focus,
          input[type="date"]::-webkit-calendar-picker-indicator:active {
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>

          {/* Fix #9: Single shared MyInstitutionsScreen — shown regardless of activeView */}
          {currentMobileScreen === 'MY_INSTITUTIONS' ? (
            <View style={styles.mobileShellWrapper}>
              <View style={styles.mobileDeviceFrame}>
                <MyInstitutionsScreen
                  user={userProfile}
                  institutions={institutionsList}
                  onAddInstitution={async (newInst) => {
                    const updated = [...institutionsList, newInst];
                    setInstitutionsList(updated);
                    saveInstitutionsForUser(updated, session?.user?.email);
                    
                    // Persist new institution record to Supabase backend immediately
                    try {
                      if (newInst.type === 'MPCS') {
                        await saveMpcsSubmission({
                          societyName: newInst.name,
                          registrationNumber: newInst.regNo,
                          gpu: newInst.gpu || newInst.district || '',
                          district: newInst.gpu || newInst.district || '',
                          reportedBy: getUserDisplayName() || 'Cooperative Inspector',
                          inspectorEmail: session?.user?.email,
                          totalMembers: 0,
                          annualTurnover: 0
                        });
                      } else {
                        await saveMilkPcsSubmission({
                          centerName: newInst.name,
                          centerId: newInst.name,
                          registrationNumber: newInst.regNo,
                          district: newInst.gpu || newInst.district || '',
                          reportedBy: getUserDisplayName() || 'Cooperative Inspector'
                        });
                      }
                    } catch (e) {
                      console.warn('Initial cloud registration warning:', e);
                    }

                    handleSelectSociety(newInst, true);
                  }}
                  onRemoveInstitution={async (id) => {
                    const removedInst = institutionsList.find(i => i.id === id);
                    const updated = institutionsList.filter(i => i.id !== id);
                    setInstitutionsList(updated);
                    saveInstitutionsForUser(updated, session?.user?.email);

                    // Also remove the submitted data from Supabase — an
                    // institution deleted from the device shouldn't linger
                    // in the database as an orphaned record that a later
                    // exact-name match could still surface.
                    if (removedInst?.name) {
                      try {
                        if (removedInst.type === 'MPCS') {
                          await supabase.from('mpcs_submissions').delete().ilike('society_name', removedInst.name);
                        } else {
                          await supabase.from('milk_pcs_submissions').delete().ilike('center_name', removedInst.name);
                        }
                      } catch (e) {
                        console.warn('Failed to delete institution from database:', e);
                      }
                    }
                  }}
                  onSelectSociety={(soc) => handleSelectSociety(soc, false)}
                  onProceedToDashboard={() => {
                    if (!selectedSociety && institutionsList.length > 0) {
                      handleSelectSociety(institutionsList[0], false);
                    } else {
                      setCurrentMobileScreen('HOME');
                    }
                  }}
                  onLogout={handleUserLogout}
                />
              </View>
            </View>
          ) : activeView === 'MAIN' ? (
            <View style={styles.mobileShellWrapper}>
              <View style={styles.mobileDeviceFrame}>
                {activeBottomTab === 'records' ? (
                  <RecordsScreen
                    activeTab="records"
                    userProfile={userProfile}
                    reportType="MILK"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onViewPdf={generatePDF}
                  />
                ) : activeBottomTab === 'more' ? (
                  <MoreScreen
                    module="MILK"
                    activeTab="more"
                    user={userProfile}
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onNavigateScreen={(scr) => {
                      setMasterDataViewReturnTab('more');
                      setCurrentMobileScreen(scr);
                      setActiveBottomTab('home');
                    }}
                    onOpenBulletins={() => setShowHistory(true)}
                    onSignOut={handleUserLogout}
                  />
                ) : activeBottomTab === 'profile' ? (
                  <InstitutionalProfileScreen
                    centerName={centerName}
                    setCenterName={setCenterName}
                    centerId={registrationNumber}
                    regNo={registrationNumber}
                    setRegNo={setRegistrationNumber}
                    presidentName={presidentName}
                    setPresidentName={setPresidentName}
                    presidentMobile={presidentMobile}
                    setPresidentMobile={setPresidentMobile}
                    managerName={managerName}
                    setManagerName={setManagerName}
                    managerMobile={managerMobile}
                    setManagerMobile={setManagerMobile}
                    lastUpdated=""
                    onSave={(data) => {
                      if (data) saveMasterStateToStorage(data);
                      stampMasterDataUpdated('instProfile');
                    }}
                    onNext={() => {
                      setCurrentMobileScreen('COMPLIANCE_AUDIT');
                      setActiveBottomTab('home');
                    }}
                    onBack={() => {
                      setCurrentMobileScreen('HOME');
                      setActiveBottomTab('home');
                    }}
                    activeTab="profile"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                  />
                ) : (
                  <>
                    {(currentMobileScreen === 'HOME' || !currentMobileScreen) && (
                      <HomeScreen
                        activeModule="MILK"
                        onSwitchModule={(mod) => {
                          if (mod === 'MPCS') setActiveView('MPCS');
                        }}
                        societyName={selectedSociety?.type === 'MILK' ? selectedSociety.name : centerName || ''}
                        centerId={selectedSociety?.type === 'MILK' ? selectedSociety.code : registrationNumber || ''}
                        district={selectedSociety?.type === 'MILK' ? selectedSociety.district : district || ''}
                        selectedSociety={selectedSociety}
                        reportingMonth={reportingMonth || ''}
                        reportStatus={((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) && milkSectionStates?.operations?.status?.includes('COMPLETED') && (milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) && (!(masterHasLoan && !masterLoanCleared) || milkSectionStates?.compliance?.status?.includes('COMPLETED'))) ? 'MONTHLY PARAMS OK' : 'DRAFT'}
                        progressPercent={
                          Math.round(
                            ((((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) || milkSectionStates?.evidence?.status?.includes('Valid')) ? 25 : 0) +
                            (milkSectionStates?.operations?.status?.includes('COMPLETED') ? 25 : 0) +
                            ((milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) ? 25 : 0) +
                            (!(masterHasLoan && !masterLoanCleared) || milkSectionStates?.compliance?.status?.includes('COMPLETED') ? 25 : 0))
                          )
                        }
                        completedCount={
                          (((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) || milkSectionStates?.evidence?.status?.includes('Valid')) ? 1 : 0) +
                          (milkSectionStates?.operations?.status?.includes('COMPLETED') ? 1 : 0) +
                          ((milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) ? 1 : 0) +
                          ((!(masterHasLoan && !masterLoanCleared) || milkSectionStates?.compliance?.status?.includes('COMPLETED')) ? 1 : 0)
                        }
                        totalCount={4}
                        evidenceStatus={(milkSectionStates?.evidence?.validUntil && new Date() >= new Date(milkSectionStates.evidence.validUntil)) ? 'EXPIRED' : (milkSectionStates?.evidence?.status || 'NOT CAPTURED')}
                        operationsStatus={milkSectionStates?.operations?.status || 'NOT STARTED'}
                        activitiesStatus={milkSectionStates?.activities?.status || 'NOT STARTED'}
                        complianceStatus={milkSectionStates?.compliance?.status || 'NOT STARTED'}
                        loanIsActive={!!(masterHasLoan && !masterLoanCleared)}
                        masterDataUpdated={masterDataTimestamps}
                        lastUpdated=""
                        activeAlert={activeAlert}
                        onDismissAlert={dismissAlert}
                        selectedSociety={selectedSociety}
                        institutionsList={institutionsList}
                        onSelectSociety={handleSelectSociety}
                        onManageInstitutions={() => setCurrentMobileScreen('MY_INSTITUTIONS')}
                        onNavigateScreen={(scr) => {
                          setReturnMobileScreen('HOME');
                          setMasterDataViewReturnTab('home');
                          setCurrentMobileScreen(scr);
                        }}
                        onReviewSubmit={() => {
                          setReturnMobileScreen('HOME');
                          setCurrentMobileScreen('REVIEW');
                        }}
                        activeTab={activeBottomTab}
                        onTabPress={(tab) => setActiveBottomTab(tab)}
                      />
                    )}

                    {currentMobileScreen === 'EVIDENCE' && (
                      <DigitalEvidenceScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        reportingMonth={reportingMonth}
                        onSave={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                        }}
                        onSaveNext={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                          if (returnMobileScreen === 'REVIEW') {
                            setCurrentMobileScreen('REVIEW');
                          } else {
                            setCurrentMobileScreen('OPERATIONS');
                          }
                        }}
                        onBack={() => setCurrentMobileScreen(returnMobileScreen === 'REVIEW' ? 'REVIEW' : 'HOME')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'OPERATIONS' && (
                      <OperationsScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        reportingMonth={reportingMonth}
                        onSave={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                        }}
                        onSaveNext={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                          if (returnMobileScreen === 'REVIEW') {
                            setCurrentMobileScreen('REVIEW');
                          } else {
                            setCurrentMobileScreen('ACTIVITIES');
                          }
                        }}
                        onBack={() => setCurrentMobileScreen(returnMobileScreen === 'REVIEW' ? 'REVIEW' : 'EVIDENCE')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'ACTIVITIES' && (
                      <ActivitiesScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        reportingMonth={reportingMonth}
                        onSave={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                        }}
                        onSaveNext={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                          if (returnMobileScreen === 'REVIEW') {
                            setCurrentMobileScreen('REVIEW');
                          } else {
                            setCurrentMobileScreen('COMPLIANCE');
                          }
                        }}
                        onBack={() => setCurrentMobileScreen(returnMobileScreen === 'REVIEW' ? 'REVIEW' : 'OPERATIONS')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'PROFILE' && (
                      <InstitutionalProfileScreen
                        centerName={centerName}
                        setCenterName={setCenterName}
                        centerId={registrationNumber}
                        regNo={registrationNumber}
                        setRegNo={setRegistrationNumber}
                        presidentName={presidentName}
                        setPresidentName={setPresidentName}
                        presidentMobile={presidentMobile}
                        setPresidentMobile={setPresidentMobile}
                        managerName={managerName}
                        setManagerName={setManagerName}
                        managerMobile={managerMobile}
                        setManagerMobile={setManagerMobile}
                        lastUpdated=""
                        onSave={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          stampMasterDataUpdated('instProfile');
                        }}
                        onSaveNext={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          stampMasterDataUpdated('instProfile');
                          setCurrentMobileScreen('COMPLIANCE_AUDIT');
                        }}
                        onBack={() => setCurrentMobileScreen('HOME')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {/* Opened from the More menu to check/edit just this section —
                        no Save & Continue, Back returns to the More menu instead of
                        chaining into Compliance & Audit. */}
                    {currentMobileScreen === 'PROFILE_VIEW' && (
                      <InstitutionalProfileScreen
                        centerName={centerName}
                        setCenterName={setCenterName}
                        centerId={registrationNumber}
                        regNo={registrationNumber}
                        setRegNo={setRegistrationNumber}
                        presidentName={presidentName}
                        setPresidentName={setPresidentName}
                        presidentMobile={presidentMobile}
                        setPresidentMobile={setPresidentMobile}
                        managerName={managerName}
                        setManagerName={setManagerName}
                        managerMobile={managerMobile}
                        setManagerMobile={setManagerMobile}
                        lastUpdated=""
                        onSave={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          stampMasterDataUpdated('instProfile');
                        }}
                        onNext={() => setCurrentMobileScreen('COMPLIANCE_VIEW')}
                        onBack={() => { setCurrentMobileScreen('HOME'); setActiveBottomTab(masterDataViewReturnTab); }}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'COMPLIANCE_AUDIT' && (
                      <ComplianceAuditScreen
                        lastVerified=""
                        initialAuditYear={masterAuditYear}
                        initialAuditDate={masterAuditDate}
                        initialAuditStatus={masterAuditStatus}
                        initialAgmYear={masterAgmYear}
                        initialAgmDate={masterAgmDate}
                        initialAgmStatus={masterAgmStatus}
                        onSaveCompliance={(data) => {
                          if (data) {
                            setMasterAuditYear(data.auditYear);
                            setMasterAuditDate(data.auditDate);
                            setMasterAuditStatus(data.auditStatus);
                            setMasterAgmYear(data.agmYear);
                            setMasterAgmDate(data.agmDate);
                            setMasterAgmStatus(data.agmStatus);
                            saveMasterStateToStorage({
                              masterAuditYear: data.auditYear,
                              masterAuditDate: data.auditDate,
                              masterAuditStatus: data.auditStatus,
                              masterAgmYear: data.agmYear,
                              masterAgmDate: data.agmDate,
                              masterAgmStatus: data.agmStatus,
                            });
                          }
                          stampMasterDataUpdated('complianceAudit');
                        }}
                        onNext={() => setCurrentMobileScreen('LOAN_SETUP')}
                        onBack={() => setCurrentMobileScreen('PROFILE')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'COMPLIANCE_VIEW' && (
                      <ComplianceAuditScreen
                        lastVerified=""
                        initialAuditYear={masterAuditYear}
                        initialAuditDate={masterAuditDate}
                        initialAuditStatus={masterAuditStatus}
                        initialAgmYear={masterAgmYear}
                        initialAgmDate={masterAgmDate}
                        initialAgmStatus={masterAgmStatus}
                        onSaveCompliance={(data) => {
                          if (data) {
                            setMasterAuditYear(data.auditYear);
                            setMasterAuditDate(data.auditDate);
                            setMasterAuditStatus(data.auditStatus);
                            setMasterAgmYear(data.agmYear);
                            setMasterAgmDate(data.agmDate);
                            setMasterAgmStatus(data.agmStatus);
                            saveMasterStateToStorage({
                              masterAuditYear: data.auditYear,
                              masterAuditDate: data.auditDate,
                              masterAuditStatus: data.auditStatus,
                              masterAgmYear: data.agmYear,
                              masterAgmDate: data.agmDate,
                              masterAgmStatus: data.agmStatus,
                            });
                          }
                          stampMasterDataUpdated('complianceAudit');
                        }}
                        onNext={() => setCurrentMobileScreen('LOAN_SETUP_VIEW')}
                        onBack={() => setCurrentMobileScreen('PROFILE_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'LOAN_SETUP' && (
                      <LoanSetupScreen
                        lastVerified=""
                        initialHasLoan={masterHasLoan}
                        initialLoanType={masterLoanType}
                        initialSanctionDate={masterLoanSanctionDate}
                        initialBeneficiaries={masterLoanBeneficiaries}
                        initialLoanExtended={masterLoanExtended}
                        initialLoanCleared={masterLoanCleared}
                        onSaveLoan={(data) => {
                          if (data) {
                            setMasterHasLoan(data.hasLoan);
                            setMasterLoanType(data.loanType);
                            setMasterLoanSanctionDate(data.sanctionDate);
                            setMasterLoanBeneficiaries(data.beneficiaries);
                            setMasterLoanExtended(data.loanExtended);
                            saveMasterStateToStorage({
                              masterHasLoan: data.hasLoan,
                              masterLoanType: data.loanType,
                              masterLoanSanctionDate: data.sanctionDate,
                              masterLoanBeneficiaries: data.beneficiaries,
                              masterLoanExtended: data.loanExtended,
                            });
                          }
                          stampMasterDataUpdated('loanSetup');
                        }}
                        onNext={() => { setDemographicsBackTarget('LOAN_SETUP'); setCurrentMobileScreen('DEMOGRAPHICS'); }}
                        onBack={() => setCurrentMobileScreen('COMPLIANCE_AUDIT')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'LOAN_SETUP_VIEW' && (
                      <LoanSetupScreen
                        lastVerified=""
                        initialHasLoan={masterHasLoan}
                        initialLoanType={masterLoanType}
                        initialSanctionDate={masterLoanSanctionDate}
                        initialBeneficiaries={masterLoanBeneficiaries}
                        initialLoanExtended={masterLoanExtended}
                        initialLoanCleared={masterLoanCleared}
                        onSaveLoan={(data) => {
                          if (data) {
                            setMasterHasLoan(data.hasLoan);
                            setMasterLoanType(data.loanType);
                            setMasterLoanSanctionDate(data.sanctionDate);
                            setMasterLoanBeneficiaries(data.beneficiaries);
                            setMasterLoanExtended(data.loanExtended);
                            saveMasterStateToStorage({
                              masterHasLoan: data.hasLoan,
                              masterLoanType: data.loanType,
                              masterLoanSanctionDate: data.sanctionDate,
                              masterLoanBeneficiaries: data.beneficiaries,
                              masterLoanExtended: data.loanExtended,
                            });
                          }
                          stampMasterDataUpdated('loanSetup');
                        }}
                        onNext={() => { setDemographicsBackTarget('LOAN_SETUP_VIEW'); setCurrentMobileScreen('DEMOGRAPHICS'); }}
                        onBack={() => setCurrentMobileScreen('COMPLIANCE_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'DEMOGRAPHICS' && (
                      <DemographicsScreen
                        mSc={mSc} setMSc={setMSc} fSc={fSc} setFSc={setFSc}
                        mSt={mSt} setMSt={setMSt} fSt={fSt} setFSt={setFSt}
                        mObc={mObc} setMObc={setMObc} fObc={fObc} setFObc={setFObc}
                        mGen={mGen} setMGen={setMGen} fGen={fGen} setFGen={setFGen}
                        lastUpdated=""
                        onSave={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          stampMasterDataUpdated('demographics');
                        }}
                        onSaveNext={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          stampMasterDataUpdated('demographics');
                          setCurrentMobileScreen('HOME');
                        }}
                        onBack={() => setCurrentMobileScreen(demographicsBackTarget)}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'SYNC_STATUS' && (
                      <SyncStatusScreen
                        pendingCount={pendingSyncCount}
                        syncing={isSyncing}
                        onRetrySync={() => {
                          setIsSyncing(true);
                          processQueue(({ pending }) => setPendingSyncCount(pending)).finally(() => setIsSyncing(false));
                        }}
                        onBack={() => setCurrentMobileScreen('HOME')}
                        activeTab="home"
                        onTabPress={(tab) => {
                          setActiveBottomTab(tab);
                          if (tab === 'home') setCurrentMobileScreen('HOME');
                        }}
                      />
                    )}

                    {currentMobileScreen === 'MEMBERS' && (
                      <MemberDataScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        societyType="MILK"
                        inspectorEmail={userProfile?.email}
                        onBack={() => setCurrentMobileScreen('HOME')}
                        onMemberDataChanged={() => stampMasterDataUpdated('members')}
                      />
                    )}

                    {currentMobileScreen === 'COMPLIANCE' && (
                      <ComplianceScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        reportingMonth={reportingMonth}
                        masterHasLoan={masterHasLoan}
                        masterLoanCleared={masterLoanCleared}
                        masterLoanType={masterLoanType}
                        masterLoanExtended={masterLoanExtended}
                        onLoanCleared={() => {
                          setMasterLoanCleared(true);
                          saveMasterStateToStorage({ masterLoanCleared: true });
                        }}
                        onSave={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                        }}
                        onSaveNext={() => {
                          refreshMilkSectionStatuses();
                          saveMasterStateToStorage({});
                          setCurrentMobileScreen('REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen(returnMobileScreen === 'REVIEW' ? 'REVIEW' : 'ACTIVITIES')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'REVIEW' && (
                      <ReviewSubmitScreen
                        reportingMonth={reportingMonth || ''}
                        milkSectionStates={milkSectionStates}
                        loanIsActive={!!(masterHasLoan && !masterLoanCleared)}
                        onNavigateScreen={(screenName) => {
                          setReturnMobileScreen('REVIEW');
                          setCurrentMobileScreen(screenName);
                        }}
                        isSealing={isSealing}
                        onCompileAndSeal={() => generatePDF(null)}
                        onBack={() => setCurrentMobileScreen('HOME')}
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.mobileShellWrapper}>
              <View style={styles.mobileDeviceFrame}>
                {activeBottomTab === 'records' ? (
                  <RecordsScreen
                    activeTab="records"
                    userProfile={userProfile}
                    reportType="MPCS"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onViewPdf={generatePDF}
                  />
                ) : activeBottomTab === 'profile' ? (
                  <MpcsInstitutionalProfileScreen
                    societyName={selectedSociety?.name || centerName?.trim() || ''}
                    panCard={panCard || selectedSociety?.panCard || ''}
                    regNumber={selectedSociety?.regNo || registrationNumber || ''}
                    regDate={regDate || selectedSociety?.regDate || ''}
                    presidentName={presidentName || ''}
                    presidentMobile={presidentMobile || ''}
                    secretaryName={managerName || ''}
                    secretaryMobile={managerMobile || ''}
                    onSaveProfile={(data) => {
                      if (data.societyName !== undefined) setCenterName(data.societyName);
                      if (data.panCard !== undefined) setPanCard(data.panCard);
                      if (data.regDate !== undefined) setRegDate(data.regDate);
                      if (data.regNumber !== undefined) setRegistrationNumber(data.regNumber);
                      if (data.presidentName !== undefined) setPresidentName(data.presidentName);
                      if (data.presidentMobile !== undefined) setPresidentMobile(data.presidentMobile);
                      if (data.secretaryName !== undefined) setManagerName(data.secretaryName);
                      if (data.secretaryMobile !== undefined) setManagerMobile(data.secretaryMobile);

                      if (selectedSociety) {
                        setSelectedSociety(prev => ({
                          ...prev,
                          name: data.societyName || prev?.name,
                          regNo: data.regNumber || prev?.regNo,
                          panCard: data.panCard || prev?.panCard,
                          regDate: data.regDate || prev?.regDate
                        }));
                      }
                      if (institutionsList && institutionsList.length > 0 && selectedSociety?.id) {
                        setInstitutionsList(prev => prev.map(inst => 
                          inst.id === selectedSociety.id
                            ? { ...inst, name: data.societyName || inst.name, regNo: data.regNumber || inst.regNo, panCard: data.panCard || inst.panCard, regDate: data.regDate || inst.regDate }
                            : inst
                        ));
                      }
                      saveMasterStateToStorage({
                        centerName: data.societyName,
                        panCard: data.panCard,
                        regDate: data.regDate,
                        registrationNumber: data.regNumber,
                        presidentName: data.presidentName,
                        presidentMobile: data.presidentMobile,
                        managerName: data.secretaryName,
                        managerMobile: data.secretaryMobile
                      });
                      stampMasterDataUpdated('instProfile');
                    }}
                    onNext={() => {
                      setCurrentMobileScreen('MPCS_DEMOGRAPHICS');
                      setActiveBottomTab('home');
                    }}
                    onBack={() => {
                      setCurrentMobileScreen('HOME');
                      setActiveBottomTab('home');
                    }}
                    activeTab="profile"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                  />
                ) : activeBottomTab === 'more' ? (
                  <MoreScreen
                    module="MPCS"
                    activeTab="more"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onNavigateScreen={(scr) => {
                      setMasterDataViewReturnTab('more');
                      setCurrentMobileScreen(scr);
                      setActiveBottomTab('home');
                    }}
                    onOpenBulletins={() => setShowHistory(true)}
                    onSignOut={handleUserLogout}
                  />
                ) : (
                  <>
                    {(currentMobileScreen === 'HOME' || !currentMobileScreen) && (
                      <MpcsHomeScreen
                        activeModule="MPCS"
                        onSwitchModule={(mod) => {
                          if (mod === 'MILK') setActiveView('MAIN');
                        }}
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        centerId={selectedSociety?.code || registrationNumber || ''}
                        district={selectedSociety?.district || district || ''}
                        reportingMonth={reportingMonth || ''}
                        reportStatus={((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) && sectionStates?.sales?.status?.startsWith('COMPLETED') && sectionStates?.business?.status?.startsWith('COMPLETED')) ? 'MONTHLY PARAMS OK' : 'DRAFT'}
                        progressPercent={
                          Math.round(
                            (((((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) || sectionStates?.evidence?.status?.includes('Valid')) ? 1 : 0) +
                            (sectionStates?.sales?.status?.startsWith('COMPLETED') ? 1 : 0) +
                            (sectionStates?.business?.status?.startsWith('COMPLETED') ? 1 : 0) +
                            (!cscDetailsData?.isCscActive || sectionStates?.csc?.status?.startsWith('COMPLETED') ? 1 : 0) +
                            (!(loanData?.hasLoan && !loanData?.loanCleared) || sectionStates?.loan?.status?.startsWith('COMPLETED') ? 1 : 0) +
                            (activityItems.length > 0 ? 1 : 0)) / 6) * 100
                          )
                        }
                        hasSubmittedMonthlyParams={false} // Disable global lock
                        completedCount={
                          (((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) || sectionStates?.evidence?.status?.includes('Valid')) ? 1 : 0) +
                          (sectionStates?.sales?.status?.startsWith('COMPLETED') ? 1 : 0) +
                          (sectionStates?.business?.status?.startsWith('COMPLETED') ? 1 : 0) +
                          ((!cscDetailsData?.isCscActive || sectionStates?.csc?.status?.startsWith('COMPLETED')) ? 1 : 0) +
                          ((!(loanData?.hasLoan && !loanData?.loanCleared) || sectionStates?.loan?.status?.startsWith('COMPLETED')) ? 1 : 0) +
                          (activityItems.length > 0 ? 1 : 0)
                        }
                        totalCount={6}
                        evidenceStatus={
                          (sectionStates?.evidence?.validUntil && new Date() >= new Date(sectionStates.evidence.validUntil)) ? 'EXPIRED' : (sectionStates?.evidence?.status || 'NOT CAPTURED')
                        }
                        salesStatus={sectionStates?.sales?.status || 'NOT COMPLETED'}
                        businessStatus={sectionStates?.business?.status || 'NOT COMPLETED'}
                        cscTransStatus={sectionStates?.csc?.status || 'NOT COMPLETED'}
                        activitiesStatus={`${activityItems.length} ENTRIES`}
                        loanIsActive={!!(loanData?.hasLoan && !loanData?.loanCleared)}
                        loanStatus={sectionStates?.loan?.status || 'NOT COMPLETED'}
                        cscIsActive={!!cscDetailsData?.isCscActive}
                        masterDataUpdated={masterDataTimestamps}
                        lastUpdated=""
                        activeAlert={activeAlert}
                        onDismissAlert={dismissAlert}
                        selectedSociety={selectedSociety}
                        institutionsList={institutionsList}
                        onSelectSociety={handleSelectSociety}
                        onManageInstitutions={() => setCurrentMobileScreen('MY_INSTITUTIONS')}
                        onNavigateScreen={(scr) => { setMasterDataViewReturnTab('home'); setCurrentMobileScreen(scr); }}
                        onReviewSubmit={() => setCurrentMobileScreen('MPCS_REVIEW')}
                        activeTab={activeBottomTab}
                        onTabPress={(tab) => setActiveBottomTab(tab)}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_EVIDENCE' && (
                      <MpcsDigitalEvidenceScreen
                        reportingMonth={reportingMonth || ''}
                        imageUri={imageUri}
                        setImageUri={setImageUri}
                        timestamp={timestamp}
                        setTimestamp={setTimestamp}
                        latitude={location?.latitude ? String(location.latitude) : ""}
                        setLatitude={(val) => setLocation(prev => ({ ...prev, latitude: parseFloat(val) }))}
                        longitude={location?.longitude ? String(location.longitude) : ""}
                        setLongitude={(val) => setLocation(prev => ({ ...prev, longitude: parseFloat(val) }))}
                        onSaveNext={(validUntil) => {
                          saveMasterStateToStorage({
                            evidence: { status: 'CAPTURED ✓', validUntil, timestamp, location }
                          });
                          updateSectionState('evidence', { status: 'CAPTURED ✓', validUntil });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_SALES' && (
                      <MpcsSalesDepositScreen
                        reportingMonth={reportingMonth || ''}
                        sales={withdrawal}
                        setSales={setWithdrawal}
                        deposit={balance}
                        setDeposit={setBalance}
                        totalMembers={totalMembers}
                        setTotalMembers={setTotalMembers}
                        onSaveNext={() => {
                          saveMasterStateToStorage({
                            sales: withdrawal,
                            withdrawal,
                            deposit: balance,
                            balance,
                            totalMembers
                          });
                          updateSectionState('sales', { status: 'COMPLETED ✓' });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_BUSINESS' && (
                      <MpcsBusinessPerformanceScreen
                        reportingMonth={reportingMonth || ''}
                        totalIncome={businessPerformanceData?.totalIncome || ''}
                        setTotalIncome={(val) => {
                          setBusinessPerformanceData(prev => ({ ...prev, totalIncome: val }));
                        }}
                        totalExpenses={businessPerformanceData?.totalExpenses || ''}
                        setTotalExpenses={(val) => {
                          setBusinessPerformanceData(prev => ({ ...prev, totalExpenses: val }));
                        }}
                        totalMembers={businessPerformanceData?.totalMembers || totalMembers || ''}
                        setTotalMembers={(val) => {
                          setTotalMembers(val);
                          setBusinessPerformanceData(prev => ({ ...prev, totalMembers: val }));
                        }}
                        remarks={businessPerformanceData?.remarks || ''}
                        setRemarks={(val) => {
                          setBusinessPerformanceData(prev => ({ ...prev, remarks: val }));
                        }}
                        onSaveNext={() => {
                          const inc = parseFloat((businessPerformanceData?.totalIncome || '0').replace(/,/g, '')) || 0;
                          const exp = parseFloat((businessPerformanceData?.totalExpenses || '0').replace(/,/g, '')) || 0;
                          const diff = (inc - exp).toString();
                          const updated = {
                            ...businessPerformanceData,
                            netSurplusDeficit: diff,
                            totalMembers: businessPerformanceData?.totalMembers || totalMembers
                          };
                          setBusinessPerformanceData(updated);
                          saveMasterStateToStorage({
                            businessPerformanceData: updated,
                            totalIncome: businessPerformanceData?.totalIncome,
                            totalExpenses: businessPerformanceData?.totalExpenses,
                            netSurplusDeficit: diff,
                            totalMembers: updated.totalMembers
                          });
                          updateSectionState('business', { status: 'COMPLETED ✓' });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_CSC_TRANS' && (
                      <MpcsCscTransactionsScreen
                        reportingMonth={reportingMonth || "August 2026"}
                        cscTransData={cscTransData}
                        onChangeCscTrans={(data) => {
                          setCscTransData(data);
                        }}
                        onSaveNext={() => {
                          updateSectionState('csc', { status: 'COMPLETED ✓' });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_ACTIVITIES' && (
                      <MpcsActivitiesLogScreen
                        reportingMonth={reportingMonth || "August 2026"}
                        activityItems={activityItems}
                        setActivityItems={setActivityItems}
                        onSaveNext={() => {
                          saveMasterStateToStorage({ activityItems });
                          updateSectionState('activities', { status: 'COMPLETED ✓' });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_INST_PROFILE' && (
                      <MpcsInstitutionalProfileScreen
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        panCard={panCard || selectedSociety?.panCard || ''}
                        regNumber={selectedSociety?.regNo || registrationNumber || ''}
                        regDate={regDate || selectedSociety?.regDate || ''}
                        presidentName={presidentName || ''}
                        presidentMobile={presidentMobile || ''}
                        secretaryName={managerName || ''}
                        secretaryMobile={managerMobile || ''}
                        onSaveProfile={(data) => {
                          if (data.societyName !== undefined) setCenterName(data.societyName);
                          if (data.panCard !== undefined) setPanCard(data.panCard);
                          if (data.regDate !== undefined) setRegDate(data.regDate);
                          if (data.regNumber !== undefined) setRegistrationNumber(data.regNumber);
                          if (data.presidentName !== undefined) setPresidentName(data.presidentName);
                          if (data.presidentMobile !== undefined) setPresidentMobile(data.presidentMobile);
                          if (data.secretaryName !== undefined) setManagerName(data.secretaryName);
                          if (data.secretaryMobile !== undefined) setManagerMobile(data.secretaryMobile);

                          if (selectedSociety) {
                            setSelectedSociety(prev => ({
                              ...prev,
                              name: data.societyName || prev?.name,
                              regNo: data.regNumber || prev?.regNo,
                              panCard: data.panCard || prev?.panCard,
                              regDate: data.regDate || prev?.regDate
                            }));
                          }
                          if (institutionsList && institutionsList.length > 0 && selectedSociety?.id) {
                            setInstitutionsList(prev => prev.map(inst => 
                              inst.id === selectedSociety.id
                                ? { ...inst, name: data.societyName || inst.name, regNo: data.regNumber || inst.regNo, panCard: data.panCard || inst.panCard, regDate: data.regDate || inst.regDate }
                                : inst
                            ));
                          }
                          saveMasterStateToStorage({
                            centerName: data.societyName,
                            panCard: data.panCard,
                            regDate: data.regDate,
                            registrationNumber: data.regNumber,
                            presidentName: data.presidentName,
                            presidentMobile: data.presidentMobile,
                            managerName: data.secretaryName,
                            managerMobile: data.secretaryMobile
                          });
                          stampMasterDataUpdated('instProfile');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS')}
                        onBack={() => setCurrentMobileScreen('HOME')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {/* Opened from the More menu to check/edit just this section —
                        no Save & Continue, Back returns to the More menu instead of
                        chaining into Registered Demographics. */}
                    {currentMobileScreen === 'MPCS_PROFILE_VIEW' && (
                      <MpcsInstitutionalProfileScreen
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        panCard={panCard || selectedSociety?.panCard || ''}
                        regNumber={selectedSociety?.regNo || registrationNumber || ''}
                        regDate={regDate || selectedSociety?.regDate || ''}
                        presidentName={presidentName || ''}
                        presidentMobile={presidentMobile || ''}
                        secretaryName={managerName || ''}
                        secretaryMobile={managerMobile || ''}
                        onSaveProfile={(data) => {
                          if (data.societyName !== undefined) setCenterName(data.societyName);
                          if (data.panCard !== undefined) setPanCard(data.panCard);
                          if (data.regDate !== undefined) setRegDate(data.regDate);
                          if (data.regNumber !== undefined) setRegistrationNumber(data.regNumber);
                          if (data.presidentName !== undefined) setPresidentName(data.presidentName);
                          if (data.presidentMobile !== undefined) setPresidentMobile(data.presidentMobile);
                          if (data.secretaryName !== undefined) setManagerName(data.secretaryName);
                          if (data.secretaryMobile !== undefined) setManagerMobile(data.secretaryMobile);

                          if (selectedSociety) {
                            setSelectedSociety(prev => ({
                              ...prev,
                              name: data.societyName || prev?.name,
                              regNo: data.regNumber || prev?.regNo,
                              panCard: data.panCard || prev?.panCard,
                              regDate: data.regDate || prev?.regDate
                            }));
                          }
                          if (institutionsList && institutionsList.length > 0 && selectedSociety?.id) {
                            setInstitutionsList(prev => prev.map(inst =>
                              inst.id === selectedSociety.id
                                ? { ...inst, name: data.societyName || inst.name, regNo: data.regNumber || inst.regNo, panCard: data.panCard || inst.panCard, regDate: data.regDate || inst.regDate }
                                : inst
                            ));
                          }
                          saveMasterStateToStorage({
                            centerName: data.societyName,
                            panCard: data.panCard,
                            regDate: data.regDate,
                            registrationNumber: data.regNumber,
                            presidentName: data.presidentName,
                            presidentMobile: data.presidentMobile,
                            managerName: data.secretaryName,
                            managerMobile: data.secretaryMobile
                          });
                          stampMasterDataUpdated('instProfile');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS_VIEW')}
                        onBack={() => { setCurrentMobileScreen('HOME'); setActiveBottomTab(masterDataViewReturnTab); }}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_DEMOGRAPHICS' && (
                      <MpcsRegisteredDemographicsScreen
                        initialDemographics={demographicsData.length > 0 ? demographicsData : undefined}
                        onSaveDemographics={(data) => {
                          setDemographicsData(data);
                          saveMasterStateToStorage({ demographicsData: data });
                          stampMasterDataUpdated('demographics');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_COMPLIANCE')}
                        onBack={() => setCurrentMobileScreen('MPCS_INST_PROFILE')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {/* Opened from the More menu — no Save & Continue, Back
                        returns to the More menu instead of chaining onward. */}
                    {currentMobileScreen === 'MPCS_DEMOGRAPHICS_VIEW' && (
                      <MpcsRegisteredDemographicsScreen
                        initialDemographics={demographicsData.length > 0 ? demographicsData : undefined}
                        onSaveDemographics={(data) => {
                          setDemographicsData(data);
                          saveMasterStateToStorage({ demographicsData: data });
                          stampMasterDataUpdated('demographics');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_COMPLIANCE_VIEW')}
                        onBack={() => setCurrentMobileScreen('MPCS_PROFILE_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_COMPLIANCE' && (
                      <MpcsComplianceAuditScreen
                        initialAuditYear={complianceData?.auditYear || ''}
                        initialAuditDate={complianceData?.auditDate || ''}
                        initialAuditStatus={complianceData?.auditStatus || 'Pending'}
                        initialAgmYear={complianceData?.agmYear || ''}
                        initialAgmDate={complianceData?.agmDate || ''}
                        initialAgmStatus={complianceData?.agmStatus || 'Pending'}
                        onSaveCompliance={(data) => {
                          setComplianceData(data);
                          saveMasterStateToStorage({ complianceData: data });
                          stampMasterDataUpdated('compliance');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_FINANCIALS')}
                        onBack={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_COMPLIANCE_VIEW' && (
                      <MpcsComplianceAuditScreen
                        initialAuditYear={complianceData?.auditYear || ''}
                        initialAuditDate={complianceData?.auditDate || ''}
                        initialAuditStatus={complianceData?.auditStatus || 'Pending'}
                        initialAgmYear={complianceData?.agmYear || ''}
                        initialAgmDate={complianceData?.agmDate || ''}
                        initialAgmStatus={complianceData?.agmStatus || 'Pending'}
                        onSaveCompliance={(data) => {
                          setComplianceData(data);
                          saveMasterStateToStorage({ complianceData: data });
                          stampMasterDataUpdated('compliance');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_FINANCIALS_VIEW')}
                        onBack={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_FINANCIALS' && (
                      <MpcsFinancialPerformanceScreen
                        initialTurnover={financialsData?.annualTurnover || ''}
                        initialIncome={financialsData?.totalIncome || ''}
                        initialExpenses={financialsData?.totalExpenses || ''}
                        initialNetProfit={financialsData?.netProfit || ''}
                        initialProfitability={financialsData?.profitability || ''}
                        initialProfitOrLoss={financialsData?.profitOrLoss || ''}
                        onSaveFinancials={(data) => {
                          setFinancialsData(data);
                          saveMasterStateToStorage({ financialsData: data });
                          stampMasterDataUpdated('financials');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DIVIDEND')}
                        onBack={() => setCurrentMobileScreen('MPCS_COMPLIANCE')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_FINANCIALS_VIEW' && (
                      <MpcsFinancialPerformanceScreen
                        initialTurnover={financialsData?.annualTurnover || ''}
                        initialIncome={financialsData?.totalIncome || ''}
                        initialExpenses={financialsData?.totalExpenses || ''}
                        initialNetProfit={financialsData?.netProfit || ''}
                        initialProfitability={financialsData?.profitability || ''}
                        initialProfitOrLoss={financialsData?.profitOrLoss || ''}
                        onSaveFinancials={(data) => {
                          setFinancialsData(data);
                          saveMasterStateToStorage({ financialsData: data });
                          stampMasterDataUpdated('financials');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DIVIDEND_VIEW')}
                        onBack={() => setCurrentMobileScreen('MPCS_COMPLIANCE_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_DIVIDEND' && (
                      <MpcsDividendDetailsScreen
                        initialPolicy={dividendData?.dividendPolicy || ''}
                        initialAnnounced={dividendData?.dividendAnnounced || ''}
                        initialRate={dividendData?.dividendRate || ''}
                        initialAmount={dividendData?.dividendAmount || ''}
                        initialDate={dividendData?.distributionDate || ''}
                        onSaveDividend={(data) => {
                          setDividendData(data);
                          saveMasterStateToStorage({ dividendData: data });
                          stampMasterDataUpdated('dividend');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL')}
                        onBack={() => setCurrentMobileScreen('MPCS_FINANCIALS')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_DIVIDEND_VIEW' && (
                      <MpcsDividendDetailsScreen
                        initialPolicy={dividendData?.dividendPolicy || ''}
                        initialAnnounced={dividendData?.dividendAnnounced || ''}
                        initialRate={dividendData?.dividendRate || ''}
                        initialAmount={dividendData?.dividendAmount || ''}
                        initialDate={dividendData?.distributionDate || ''}
                        onSaveDividend={(data) => {
                          setDividendData(data);
                          saveMasterStateToStorage({ dividendData: data });
                          stampMasterDataUpdated('dividend');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL_VIEW')}
                        onBack={() => setCurrentMobileScreen('MPCS_FINANCIALS_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_SHARE_CAPITAL' && (
                      <MpcsShareCapitalScreen
                        initialAuthorized={shareCapitalData?.authorizedCapital || ''}
                        initialPaidUp={shareCapitalData?.paidUpCapital || ''}
                        initialDeposits={shareCapitalData?.totalDeposits || ''}
                        initialDate={shareCapitalData?.asOfDate || ''}
                        onSaveShareCapital={(data) => {
                          setShareCapitalData(data);
                          saveMasterStateToStorage({ shareCapitalData: data });
                          stampMasterDataUpdated('shareCapital');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_CSC_DETAILS')}
                        onBack={() => setCurrentMobileScreen('MPCS_DIVIDEND')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_SHARE_CAPITAL_VIEW' && (
                      <MpcsShareCapitalScreen
                        initialAuthorized={shareCapitalData?.authorizedCapital || ''}
                        initialPaidUp={shareCapitalData?.paidUpCapital || ''}
                        initialDeposits={shareCapitalData?.totalDeposits || ''}
                        initialDate={shareCapitalData?.asOfDate || ''}
                        onSaveShareCapital={(data) => {
                          setShareCapitalData(data);
                          saveMasterStateToStorage({ shareCapitalData: data });
                          stampMasterDataUpdated('shareCapital');
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_CSC_DETAILS_VIEW')}
                        onBack={() => setCurrentMobileScreen('MPCS_DIVIDEND_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_CSC_DETAILS' && (
                      <MpcsCscDetailsScreen
                        initialOperator={cscDetailsData?.cscOperatorName || ''}
                        initialCscId={cscDetailsData?.cscId || ''}
                        initialCenterName={cscDetailsData?.cscCenterName || ''}
                        initialMobile={cscDetailsData?.mobileNumber || ''}
                        initialEmail={cscDetailsData?.emailId || ''}
                        initialActiveServices={cscDetailsData?.activeServicesCount || ''}
                        initialIsCscActive={!!cscDetailsData?.isCscActive}
                        onSaveCscDetails={(data) => {
                          setCscDetailsData(data);
                          saveMasterStateToStorage({ cscDetailsData: data });
                          stampMasterDataUpdated('csc');
                        }}
                        onNext={() => { setMpcsLoanBackTarget('MPCS_CSC_DETAILS'); setCurrentMobileScreen('MPCS_LOAN'); }}
                        onBack={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_CSC_DETAILS_VIEW' && (
                      <MpcsCscDetailsScreen
                        initialOperator={cscDetailsData?.cscOperatorName || ''}
                        initialCscId={cscDetailsData?.cscId || ''}
                        initialCenterName={cscDetailsData?.cscCenterName || ''}
                        initialMobile={cscDetailsData?.mobileNumber || ''}
                        initialEmail={cscDetailsData?.emailId || ''}
                        initialActiveServices={cscDetailsData?.activeServicesCount || ''}
                        initialIsCscActive={!!cscDetailsData?.isCscActive}
                        onSaveCscDetails={(data) => {
                          setCscDetailsData(data);
                          saveMasterStateToStorage({ cscDetailsData: data });
                          stampMasterDataUpdated('csc');
                        }}
                        onNext={() => { setMpcsLoanBackTarget('MPCS_CSC_DETAILS_VIEW'); setCurrentMobileScreen('MPCS_LOAN'); }}
                        onBack={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL_VIEW')}
                      activeTab={masterDataViewReturnTab}
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_LOAN' && (
                      <MpcsLoanSetupScreen
                        initialHasLoan={loanData?.hasLoan || false}
                        initialLoanType={loanData?.loanType || ''}
                        initialSanctionDate={loanData?.sanctionDate || ''}
                        initialBeneficiaries={loanData?.beneficiaries || ''}
                        initialLoanExtended={loanData?.loanExtended || ''}
                        initialLoanCleared={loanData?.loanCleared || false}
                        onSaveLoan={(data) => {
                          setLoanData(data);
                          saveMasterStateToStorage({ loanData: data });
                          stampMasterDataUpdated('loan');
                        }}
                        onNext={() => {
                          showToast('✅ Master Data Saved Successfully!');
                          setCurrentMobileScreen('HOME');
                        }}
                        onBack={() => setCurrentMobileScreen(mpcsLoanBackTarget)}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'SYNC_STATUS' && (
                      <SyncStatusScreen
                        pendingCount={pendingSyncCount}
                        syncing={isSyncing}
                        onRetrySync={() => {
                          setIsSyncing(true);
                          processQueue(({ pending }) => setPendingSyncCount(pending)).finally(() => setIsSyncing(false));
                        }}
                        onBack={() => setCurrentMobileScreen('HOME')}
                        activeTab="home"
                        onTabPress={(tab) => {
                          setActiveBottomTab(tab);
                          if (tab === 'home') setCurrentMobileScreen('HOME');
                        }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_MEMBERS' && (
                      <MemberDataScreen
                        societyName={selectedSociety?.name || centerName?.trim()}
                        societyType="MPCS"
                        inspectorEmail={userProfile?.email}
                        onBack={() => setCurrentMobileScreen('HOME')}
                        onMemberDataChanged={() => stampMasterDataUpdated('members')}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_LOAN_STATUS' && (
                      <MpcsLoanStatusScreen
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        reportingMonth={reportingMonth || ''}
                        masterHasLoan={loanData?.hasLoan || false}
                        masterLoanCleared={loanData?.loanCleared || false}
                        masterLoanType={loanData?.loanType || ''}
                        masterLoanExtended={loanData?.loanExtended || ''}
                        onLoanCleared={() => {
                          const updated = { ...loanData, loanCleared: true };
                          setLoanData(updated);
                          saveMasterStateToStorage({ loanData: updated });
                          updateSectionState('loan', { status: 'COMPLETED ✓' });
                        }}
                        onSaveNext={() => {
                          updateSectionState('loan', { status: 'COMPLETED ✓' });
                          setCurrentMobileScreen('MPCS_REVIEW');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_REVIEW')}
                      activeTab="home"
                      onTabPress={(tab) => {
                        setActiveBottomTab(tab);
                        if (tab === 'home') setCurrentMobileScreen('HOME');
                      }}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_REVIEW' && (
                      <MpcsReviewSubmitScreen
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        reportingMonth={reportingMonth || ''}
                        sectionStates={sectionStates}
                        // cscDetailsData.isCscActive is the authoritative flag set on the
                        // CSC Details Master Data screen — cscTransData carries its own,
                        // separate (and never actually kept in sync) isCscActive, which
                        // showed "CSC Services Not Available" here even when CSC Details
                        // said Active.
                        cscIsActive={!!cscDetailsData?.isCscActive}
                        loanIsActive={!!(loanData?.hasLoan && !loanData?.loanCleared)}
                        activitiesCount={activityItems.length}
                        onNavigateSection={(screenKey) => setCurrentMobileScreen(screenKey)}
                        onSubmitReturn={() => generatePDF(null)}
                        onBack={() => setCurrentMobileScreen('HOME')}
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bulletin Board Modal */}
      {showHistory && (
        <Modal visible={true} transparent={true} animationType="slide" onRequestClose={() => setShowHistory(false)}>
           <View style={styles.modalOverlay}>
              <View style={styles.bulletinBoard}>
                 <View style={styles.bulletinHeader}>
                    <View>
                      <Text style={styles.bulletinTitle}>Station Bulletins</Text>
                      <Text style={styles.bulletinSub}>Official HQ Directives Log</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.modalCloseBtn}>
                       <MaterialIcons name="close" size={24} color={COLORS.emerald} />
                    </TouchableOpacity>
                 </View>
                 <ScrollView style={{padding: 20}} showsVerticalScrollIndicator={false}>
                    {alertHistory.length === 0 ? (
                      <View style={{alignItems:'center', marginTop:100}}>
                        <MaterialIcons name="inventory" size={48} color="#E2E8F0" />
                        <Text style={{textAlign:'center', color:'#94A3B8', marginTop:12, fontWeight:'600'}}>No departmental messages yet.</Text>
                      </View>
                    ) : (
                      alertHistory.map((item, idx) => (
                         <View key={idx} style={styles.bulletinItem}>
                            <View style={styles.bulletinMeta}>
                               <Text style={styles.bulletinTime}>{new Date(item.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</Text>
                               {idx === 0 && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                            </View>
                            <Text style={styles.bulletinMsg}>{item.message}</Text>
                         </View>
                      ))
                    )}
                    <View style={{height:40}} />
                 </ScrollView>
              </View>
           </View>
        </Modal>
      )}

      {/* PDF Preview Modal (web only) — see pdfPreviewHtml state comment */}
      {Platform.OS === 'web' && pdfPreviewHtml && (
        <Modal visible={true} transparent={false} animationType="slide" onRequestClose={() => setPdfPreviewHtml(null)}>
          <SafeAreaView style={styles.pdfPreviewContainer}>
            <View style={styles.pdfPreviewBar}>
              <Text style={styles.pdfPreviewTitle}>Sealed Certificate</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={styles.pdfPreviewPrintBtn}
                  onPress={() => {
                    const frame = document.getElementById('pdf-preview-frame');
                    if (frame?.contentWindow) frame.contentWindow.print();
                  }}
                >
                  <MaterialIcons name="print" size={18} color={COLORS.emerald} />
                  <Text style={styles.pdfPreviewPrintText}>Print / Save PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPdfPreviewHtml(null)} style={styles.modalCloseBtn}>
                  <MaterialIcons name="close" size={24} color={COLORS.emerald} />
                </TouchableOpacity>
              </View>
            </View>
            <iframe id="pdf-preview-frame" srcDoc={pdfPreviewHtml} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgBlobLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(124, 28, 28, 0.07)',
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(180, 83, 9, 0.07)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 120,
  },
  headerZone: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  headerTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  mobileShellWrapper: {
    flex: 1,
    backgroundColor: '#F8F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mobileDeviceFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F5F2',
    overflow: 'hidden',
  },
  govEmblem: {
    width: 60,
    height: 60,
    marginRight: 15,
    marginTop: -2,
  },
  headerTextGroup: {
    flexDirection: 'column',
  },
  govTitleSubtitle: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  govTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActionBox: {
    position: 'absolute',
    right: 0,
    top: -5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    backgroundColor: 'rgba(124, 28, 28, 0.08)',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 28, 28, 0.05)',
  },
  headerDivider: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 15,
    marginBottom: 15,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  segmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 26,
  },
  segmentActive: {
    backgroundColor: COLORS.emerald,
    shadowColor: COLORS.emeraldLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  segmentText: {
    color: COLORS.emeraldLight,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 6,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 21,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '900',
    color: COLORS.emerald,
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  evidenceDropzone: {
    borderWidth: 2,
    borderColor: 'rgba(124, 28, 28, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dropzoneTitle: {
    color: COLORS.emerald,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  dropzoneSub: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  evidenceSnapshotBox: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 260,
    backgroundColor: '#000',
    elevation: 5,
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  evidenceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: COLORS.gold,
  },
  metaBadgeText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 1,
  },
  metaTextLatLong: {
    color: COLORS.surface,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaTextTime: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '600',
  },
  recaptureBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  floatingInputWrapper: {
    marginBottom: 20,
  },
  floatingInputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 0,
  },
  floatingInputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  floatingIcon: {
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  inputPrefixText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginRight: 4,
  },
  floatingInputField: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    height: '100%',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' })
  },
  miniInputWrapper: {
    marginBottom: 15,
  },
  miniInputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    height: 44,
    paddingHorizontal: 0,
  },
  inputGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGridCol: {
    flex: 1,
  },
  pickerWrapperGold: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  pickerNative: {
    width: '100%',
    height: Platform.OS === 'web' ? '100%' : 50,
    color: COLORS.primary,
    fontWeight: '800',
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: 16,
    paddingLeft: 0,
    ...(Platform.OS === 'web' && { outlineStyle: 'none', appearance: 'none' })
  },
  pickerArrowOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F5F2',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    maxWidth: 200
  },
  loanDetailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  forgeButton: {
    borderRadius: 20,
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    padding: 3,
  },
  forgeInnerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 17,
  },
  forgeTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  forgeButtonMainText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  forgeButtonSubText: {
    color: COLORS.goldLight,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  legalFooter: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  // Ledger Styles (Modern Professional Table)
  ledgerContainer: {
    marginTop: 10,
    overflow: 'hidden',
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ledgerColumnHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginLeft: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F5F2',
  },
  categoryCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerCategoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ledgerCategoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputCell: {
    flex: 1,
    alignItems: 'center',
  },
   ledgerInput: {
    width: '90%',
    height: 38,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.emerald,
    paddingBottom: 2,
  },
  rowTotalCell: {
    width: 55,
    alignItems: 'flex-end',
  },
  rowTotalText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryLight,
    opacity: 0.5,
  },
  ledgerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  ledgerFooterLabel: {
    flex: 1.5,
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  footerValBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  footerValText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  grandTotalPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  grandTotalPillText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  // Ledger Refinements
  vDividerLight: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  vDividerFaint: {
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  footerLabelGroup: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerGoldTag: {
    width: 3,
    height: 14,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginRight: 6,
  },
  vDividerHair: {
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  footerValSubText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  // Premium Read-Only Summary Cards
  premiumReadOnlyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: COLORS.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 4,
  },
  premiumReadOnlyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  premiumReadOnlyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumReadOnlyContent: {
    flex: 1,
  },
  premiumReadOnlyValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  // New Features Styles
  syncBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    alignSelf: 'center',
    width: Platform.OS === 'web' ? 360 : '90%',
    zIndex: 99990,
    elevation: 10,
  },
  syncBannerInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  syncBannerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  evidenceVaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  evidenceVaultCount: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.emerald,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceMiniThumb: {
    width: (width - 100) / 3,
    height: (width - 100) / 3,
    borderRadius: 12,
    backgroundColor: '#F8F5F2',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  evidenceThumbImg: {
    width: '100%',
    height: '100%',
  },
  broadcastBannerWrapper: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 14 : 46,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: 14,
    zIndex: 99999,
    elevation: 12,
  },
  broadcastNoticeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    padding: 14,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  broadcastNoticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  broadcastIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  broadcastNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 4,
  },
  broadcastNoticeBody: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
  broadcastCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(120, 53, 15, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: '#F8F5F2',
  },
  pdfPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pdfPreviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pdfPreviewPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  pdfPreviewPrintText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.emerald,
  },
  bulletinBoard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  bulletinHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulletinTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.emerald,
  },
  bulletinSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  bulletinItem: {
    backgroundColor: '#F8F5F2',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletinMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletinTime: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
  },
  bulletinMsg: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1E293B',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
  },
  bulletinBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  bulletinIndicator: {
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
  }
});
