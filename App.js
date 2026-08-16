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
import DemographicsScreen from './src/components/DemographicsScreen';
import ComplianceScreen from './src/components/ComplianceScreen';
import ReviewSubmitScreen from './src/components/ReviewSubmitScreen';
import RecordsScreen from './src/components/RecordsScreen';
import MoreScreen from './src/components/MoreScreen';
import MyInstitutionsScreen from './src/components/MyInstitutionsScreen';

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
import MpcsReviewSubmitScreen from './src/components/mpcs/MpcsReviewSubmitScreen';

import { supabase, saveMilkPcsSubmission, saveMpcsSubmission, uploadPhoto } from './src/supabase';
import { saveMilkPcsProfile, loadMilkPcsProfileByName, loadMilkCenters, addMilkCenter } from './src/utils/storage';
import { queueSubmission, processQueue, getQueueStatus } from './src/utils/syncManager';
import { isMonthlyParamsCompleted, saveMonthlyParams, getMonthlyParams, saveSectionStates, getSectionStates, getMilkSectionData, clearMilkSectionData } from './src/utils/monthlySyncManager';
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';

const { width } = Dimensions.get('window');

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
    const socName = selectedSociety?.name || centerName || '';
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
      evidence: { status: evidenceStatus, updatedAt: new Date().toISOString(), validUntil },
      operations: { status: opsStatus, updatedAt: new Date().toISOString() },
      activities: { status: actStatus, updatedAt: new Date().toISOString() },
      compliance: { status: compStatus, updatedAt: new Date().toISOString() }
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
      const socName = selectedSociety?.name || centerName || '';
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
    const socName = selectedSociety?.name || centerName || '';
    const repMonth = reportingMonth || getCurrentMonthLabel();
    if (socName) {
      await saveSectionStates(socName, repMonth, newState);
    }
  };



  const loadInstitutionsForUser = async (email = null) => {
    try {
      const activeEmail = getUserEmail(email);
      const key = getUserInstitutionsKey(activeEmail);
      const defaultList = [
        { id: 'inst-default-1', name: 'Dentam MPCS', type: 'MPCS', gpu: 'Dentam GPU', regNo: 'SIK/MPCS/2024/01' },
        { id: 'inst-default-2', name: 'Gyalshing Milk Center', type: 'MILK', gpu: 'Gyalshing GPU', regNo: 'SIK/MILK/2024/02' }
      ];
      if (!key) { setInstitutionsList(defaultList); return defaultList; }
      const raw = await AsyncStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : null;
      const initialList = (list && list.length > 0) ? list : defaultList;
      setInstitutionsList(initialList);
      if (!list || list.length === 0) {
        saveInstitutionsForUser(initialList, activeEmail);
      }
      return initialList;
    } catch (e) {
      console.warn('loadInstitutionsForUser error:', e);
      const defaultList = [
        { id: 'inst-default-1', name: 'Dentam MPCS', type: 'MPCS', gpu: 'Dentam GPU', regNo: 'SIK/MPCS/2024/01' },
        { id: 'inst-default-2', name: 'Gyalshing Milk Center', type: 'MILK', gpu: 'Gyalshing GPU', regNo: 'SIK/MILK/2024/02' }
      ];
      setInstitutionsList(defaultList);
      return defaultList;
    }
  };

  // Handle Dynamic Society Selection from Dropdown or Setup
  const handleSelectSociety = async (soc, isNewRegistration = false) => {
    setSelectedSociety(soc);
    setDistrict(soc?.district || '');
    setActiveView(soc?.type === 'MPCS' ? 'MPCS' : 'MAIN');
    setCurrentMobileScreen('HOME');
    setActiveBottomTab('home');

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
        cscDetailsData: {}
      }, soc?.name || '');
      await refreshMilkSectionStatuses();
    } else {
      // EXISTING SOCIETY: Load saved data for this specific society only
      await loadMasterStateFromStorage(soc?.name);
      await fetchCloudSocietyData(soc?.name, getUserEmail());
      await refreshMilkSectionStatuses();
    }
  };


  // Master State Persistence Handlers (Keyed per Society & User Email)
  const saveMasterStateToStorage = async (overrides = {}, targetSocName = null, explicitEmail = null) => {
    try {
      const userEmail = getUserEmail(explicitEmail);
      const rawSocName = targetSocName || selectedSociety?.name || centerName;
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
        demographicsData: overrides.demographicsData !== undefined ? overrides.demographicsData : demographicsData,
        complianceData: overrides.complianceData !== undefined ? overrides.complianceData : complianceData,
        financialsData: overrides.financialsData !== undefined ? overrides.financialsData : financialsData,
        supplementalData: overrides.supplementalData !== undefined ? overrides.supplementalData : supplementalData,
        dividendData: overrides.dividendData !== undefined ? overrides.dividendData : dividendData,
        bankData: overrides.bankData !== undefined ? overrides.bankData : bankData,
        shareCapitalData: overrides.shareCapitalData !== undefined ? overrides.shareCapitalData : shareCapitalData,
        cscDetailsData: overrides.cscDetailsData !== undefined ? overrides.cscDetailsData : cscDetailsData,
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
      await AsyncStorage.setItem(getLastSelectedSocietyKey(userEmail), activeSocName);

      // ── Cloud Sync to Supabase Backend on Every Master Data Save ──
      try {
        const gpuVal = selectedSociety?.gpu || selectedSociety?.district || 'Dentam GPU';
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

          saveMilkPcsSubmission({
            centerName: activeSocName,
            centerId: stateObj.registrationNumber || selectedSociety?.regNo || 'MILK/2024/01',
            district: gpuVal,
            presidentName: stateObj.presidentName,
            presidentMobile: stateObj.presidentMobile,
            managerName: stateObj.managerName,
            managerMobile: stateObj.managerMobile,
            reportedBy: userProfile?.name || 'Cooperative Inspector',
            inspectorEmail: userEmail,
            activities: actsData ? JSON.stringify(actsData) : '',
            // Loan setup (type, who sanctioned it, total amount) is Master Data — set once.
            // Only the monthly recovered/outstanding progress comes from the monthly section.
            hasLoan: loanIsActive,
            loanName: stateObj.masterLoanType,
            loanAmount: stateObj.masterLoanExtended,
            paidAmount: loanIsActive ? (compData?.loanRecovered || '') : '',
            remainingDue: loanIsActive ? (compData?.loanOutstanding || '') : '',
            // Audit & AGM are Master Data now (done once/year, not monthly).
            auditDone: stateObj.masterAuditDate ? `Yes (${stateObj.masterAuditDate})` : 'No',
            auditYear: stateObj.masterAuditYear,
            agmDone: stateObj.masterAgmDate ? `Yes (${stateObj.masterAgmDate})` : 'No',
            ...stateObj,
            litres: opsData?.litres || '',
            balance: opsData?.balance || '',
            withdrawal: opsData?.withdrawal || ''
          });
        } else {
          saveMpcsSubmission({
            societyName: activeSocName,
            registrationNumber: stateObj.registrationNumber || selectedSociety?.regNo || 'SIK/MPCS/2024/01',
            gpu: gpuVal,
            district: gpuVal,
            presidentName: stateObj.presidentName,
            presidentMobile: stateObj.presidentMobile,
            managerName: stateObj.managerName,
            managerMobile: stateObj.managerMobile,
            auditDone: stateObj.complianceData?.auditDone,
            auditYear: stateObj.complianceData?.auditYear,
            auditCategory: stateObj.complianceData?.auditGrade,
            annualTurnover: stateObj.financialsData?.annualTurnover,
            profitOrLoss: stateObj.financialsData?.profitOrLoss || 'PROFIT',
            netProfit: stateObj.financialsData?.netProfit,
            totalMembers: calcMembers,
            reportedBy: userProfile?.name || 'Cooperative Inspector',
            inspectorEmail: userEmail,
            ...stateObj
          });
        }
      } catch (cloudErr) {
        console.warn('Auto cloud sync exception:', cloudErr);
      }
    } catch (e) {
      console.warn('Failed to save master state locally:', e);
    }
  };

  const loadMasterStateFromStorage = async (targetSocName = null, explicitEmail = null) => {
    try {
      const userEmail = getUserEmail(explicitEmail);
      const lastSocKey = getLastSelectedSocietyKey(userEmail);
      const rawSocName = targetSocName || (await AsyncStorage.getItem(lastSocKey)) || selectedSociety?.name || centerName;
      const activeSocName = typeof rawSocName === 'string' ? rawSocName : (rawSocName?.name || '');
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
        setDemographicsData(saved.demographicsData || []);
        setComplianceData(saved.complianceData || {});
        setFinancialsData(saved.financialsData || {});
        setSupplementalData(saved.supplementalData || {});
        setDividendData(saved.dividendData || {});
        setBankData(saved.bankData || {});
        setShareCapitalData(saved.shareCapitalData || {});
        setCscDetailsData(saved.cscDetailsData || {});
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

  const fetchCloudSocietyData = async (socName, userEmail) => {
    const nameStr = typeof socName === 'string' ? socName : (socName?.name || '');
    if (!nameStr || !nameStr.trim()) return;
    try {
      let rows = [];
      if (selectedSociety?.type === 'MILK') {
        const res = await supabase
          .from('milk_pcs_submissions')
          .select('*')
          .ilike('center_name', `%${nameStr.trim()}%`)
          .order('created_at', { ascending: false })
          .limit(1);
        rows = res.data || [];
      } else {
        const res = await supabase
          .from('mpcs_submissions')
          .select('*')
          .ilike('society_name', `%${nameStr.trim()}%`)
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

        if (fd.demographicsData) setDemographicsData(fd.demographicsData);
        if (fd.complianceData) setComplianceData(fd.complianceData);
        if (fd.financialsData) setFinancialsData(fd.financialsData);
        if (fd.supplementalData) setSupplementalData(fd.supplementalData);
        if (fd.dividendData) setDividendData(fd.dividendData);
        if (fd.bankData) setBankData(fd.bankData);
        if (fd.shareCapitalData) setShareCapitalData(fd.shareCapitalData);
        if (fd.cscDetailsData) setCscDetailsData(fd.cscDetailsData);
        const loadedBizPerf = fd.businessPerformanceData || {
          totalIncome: fd.totalIncome || fd.financialsData?.totalIncome || fd['5.1'] || '',
          totalExpenses: fd.totalExpenses || fd.financialsData?.totalExpenses || '',
          netSurplusDeficit: fd.netSurplusDeficit || fd.financialsData?.netProfit || row.net_profit_loss || '',
          totalMembers: fd.totalMembers || row.total_members || '',
          remarks: fd.remarks || ''
        };
        setBusinessPerformanceData(loadedBizPerf);

        // Sync to AsyncStorage under THIS society's key
        saveMasterStateToStorage({
          centerName: soc_name,
          registrationNumber: reg_number,
          panCard: fd['1.8'] || fd.panCard,
          regDate: fd['1.6'] || fd.regDate,
          presidentName: row.president_name || fd['2.1'],
          presidentMobile: row.president_mobile,
          managerMobile: row.manager_mobile,
          demographicsData: fd.demographicsData,
          complianceData: fd.complianceData,
          financialsData: fd.financialsData,
          supplementalData: fd.supplementalData,
          dividendData: fd.dividendData,
          bankData: fd.bankData,
          shareCapitalData: fd.shareCapitalData,
          cscDetailsData: fd.cscDetailsData,
          businessPerformanceData: loadedBizPerf
        }, soc_name);
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
      await loadInstitutionsForUser(activeEmail);
      await loadMasterStateFromStorage(null, activeEmail);
      await fetchCloudSocietyData(selectedSociety?.name || centerName, activeEmail);
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
      if (sbSession?.user) {
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
    const socName = recordItem?.society_name || recordItem?.center_name || recordItem?.center || selectedSociety?.name || centerName?.trim() || 'Cooperative Collection Center';
    const repMonth = recordItem?.reporting_month || recordItem?.month || reportingMonth?.trim() || getCurrentMonthLabel();

    // --- DECLARE activeCenterName & activeReportingMonth BEFORE use (TDZ fix) ---
    const activeCenterName = socName;
    const activeReportingMonth = repMonth;

    // Collate Latest Valid Saved Data dynamically for MILK PCS
    let opsData = null;
    let evData = null;
    let actsData = null;
    let compData = null;
    if (!recordOverride && selectedSociety?.type === 'MILK') {
       console.log('[CORE DEBUG] getMilkSectionData keys:', { activeCenterName, activeReportingMonth });
       opsData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'operations');
       evData = await getMilkSectionData(activeCenterName, activeReportingMonth, 'evidence');
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
    const activeDistrict = selectedSociety?.district || userProfile?.district || district?.trim() || 'Sikkim';
    
    // Derive activities text
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

    if (!recordOverride) setIsSealing(true);
    
    let activeLocation = evData?.location ? evData.location : location;
    const locText = activeLocation ? `${activeLocation.latitude?.toFixed(6) || ''}° N, ${activeLocation.longitude?.toFixed(6) || ''}° E` : 'Gyalshing District GPS';
    
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
    // are only ever populated for the MPCS flow).
    const pdfLoanIsActive = isMilk ? (masterHasLoan && !masterLoanCleared) : hasLoan;
    const pdfLoanName = isMilk ? masterLoanType : loanName;
    const pdfLoanAmount = isMilk ? masterLoanExtended : loanAmount;
    const pdfRemainingDue = isMilk ? (compData?.loanOutstanding || '') : remainingDue;
    const pdfAuditDate = isMilk ? masterAuditDate : auditDate;
    const pdfAuditYear = isMilk ? masterAuditYear : auditYear;
    const pdfAgmDate = isMilk ? masterAgmDate : agmDate;

    const htmlContent = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Inter:wght@400;500;600;700;800&display=swap');
            
            @page {
              size: A4;
              margin: 20mm;
            }

            * { box-sizing: border-box; }
            
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 0; 
              margin: 0;
              background-color: #FFFFFF;
              color: #450A0A;
              line-height: 1.4;
              font-size: 11px;
            }
            
            .page-container {
              width: 100%;
              position: relative;
            }

            .page-border {
              position: absolute;
              top: -10mm; left: -10mm; right: -10mm; bottom: -10mm;
              border: 1px solid #B45309;
              outline: 0.5px solid #7C1C1C;
              outline-offset: -6px;
              z-index: 1;
              pointer-events: none;
            }

            .content-layer { position: relative; z-index: 10; }

            .gov-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #B45309;
            }
            .emblem {
              width: 75px;
              height: 75px;
              margin-bottom: 10px;
            }
            .gov-name {
              font-family: 'Cinzel', serif;
              font-size: 24px;
              font-weight: 900;
              color: #7C1C1C;
              letter-spacing: 1.5px;
              margin: 0;
              text-transform: uppercase;
            }
            .dept-name {
              font-family: 'Cinzel', serif;
              font-size: 12px;
              font-weight: 700;
              color: #4B5563;
              letter-spacing: 3px;
              margin-top: 5px;
              text-transform: uppercase;
            }

            .doc-ref-bar {
              display: flex;
              justify-content: space-between;
              font-family: 'Courier New', monospace;
              font-size: 9px;
              color: #9CA3AF;
              margin-bottom: 20px;
              font-weight: bold;
              padding-top: 5px;
            }

            .grid { display: flex; gap: 25px; }
            .col-left { flex: 1.1; }
            .col-right { flex: 1; }

            .premium-card {
              background: #FFFFFF;
              border-radius: 8px;
              border: 1px solid #E5E7EB;
              margin-bottom: 20px;
              overflow: hidden;
            }
            .card-header {
              background: #F8F5F2;
              padding: 10px 15px;
              border-bottom: 1px solid #7C1C1C;
            }
            .card-title {
              font-family: 'Cinzel', serif;
              font-size: 11px;
              font-weight: 900;
              color: #7C1C1C;
              letter-spacing: 0.8px;
            }
            .card-body { padding: 15px; }

            .telemetry-img {
              width: 100%;
              height: 200px;
              object-fit: cover;
              border-radius: 6px;
              border: 1px solid #E5E7EB;
            }
            .telemetry-data {
              margin-top: -25px;
              background: rgba(124, 28, 28, 0.95);
              padding: 10px 15px;
              border-radius: 8px;
              color: #B45309;
              position: relative;
              font-size: 9px;
              border: 1px solid #B45309;
            }
            .tel-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .tel-val { font-family: 'Courier New', monospace; font-weight: bold; }

            .data-table { width: 100%; border-collapse: collapse; }
            .data-row { border-bottom: 1px solid #F1F5F9; }
            .data-row:last-child { border-bottom: none; }
            .data-label { padding: 8px 0; font-size: 9px; font-weight: 700; color: #7F1D1D; text-transform: uppercase; }
            .data-value { padding: 8px 0; font-size: 11px; font-weight: 800; color: #111827; text-align: right; }
            .financial-val { color: #7C1C1C; font-size: 12px; }

            .census-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .census-header th { font-size: 8px; color: #64748B; text-align: left; padding-bottom: 5px; border-bottom: 1px solid #E2E8F0; text-transform: uppercase; }
            .census-row td { padding: 8px 0; border-bottom: 0.5px solid #F1F5F9; font-size: 10px; font-weight: 700; color: #334155; }
            .census-val { font-family: 'Courier New', monospace; font-weight: 800; text-align: center; }
            .census-total-row td { background: #FEE2E2; padding: 10px 5px; font-weight: 900; color: #7C1C1C; border-bottom: 1.5px solid #7C1C1C; }

            .footer-authority {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 30px;
            }
            .sign-col { text-align: center; width: 200px; }
            .sign-line { border-top: 1.5px solid #111827; margin-bottom: 6px; }
            .sign-name { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #111827; }
            .sign-title { font-size: 9px; color: #7F1D1D; margin-top: 2px; font-weight: 600; }

            .qr-seal-box {
              display: flex;
              align-items: center;
              gap: 15px;
              background: #F8F5F2;
              padding: 10px;
              border-radius: 6px;
              border: 1px dashed #D1D5DB;
            }
            .qr-placeholder {
              width: 50px; height: 50px;
              border: 1px solid #E5E7EB;
              background: #FFFFFF;
              display: flex; align-items: center; justify-content: center;
              font-size: 5px; text-align: center; font-weight: 900; color: #94A3B8;
            }

            .watermark {
              position: absolute;
              top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-family: 'Cinzel', serif;
              font-size: 100px;
              color: rgba(124, 28, 28, 0.02);
              white-space: nowrap;
              z-index: 0;
              pointer-events: none;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="page-border"></div>
            <div class="watermark">Official Compliance Return</div>
            
            <div class="content-layer">
              <div class="doc-ref-bar">
                <span>VERIFIED AUTO-RECORD</span>
                <span>SYSTEM TIMESTAMP: ${timestamp}</span>
              </div>

              <div class="gov-header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_Sikkim_color.png" class="emblem" />
                <h1 class="gov-name">Government of Sikkim</h1>
                <span class="dept-name">Department of Cooperation</span>
                <div style="background: #7C1C1C; color: #B45309; padding: 4px 15px; border-radius: 20px; font-size: 9px; font-weight: 900; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Official Return Certificate</div>
              </div>

              <div class="grid">
                <div class="col-left">
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">I. Physical Verification Evidence</span></div>
                    <div class="card-body">
                      <img src="data:image/jpeg;base64,${imageBase64}" class="telemetry-img" />
                      <div class="telemetry-data">
                        <div class="tel-row"><span>CAPTURED AT:</span> <span class="tel-val">${timestamp}</span></div>
                        <div class="tel-row"><span>COORDINATES:</span> <span class="tel-val">${locText}</span></div>
                      </div>
                    </div>
                  </div>

                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">II. Institutional Profile</span></div>
                    <div class="card-body">
                      <table class="data-table">
                        <tr class="data-row"><td class="data-label">Center Name</td><td class="data-value">${centerName || 'N/A'}</td></tr>
                      </table>
                    </div>
                  </div>

                  ${pdfLoanIsActive ? `
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title" style="color: #B45309;">VI. Financial Liability Details</span></div>
                    <div class="card-body">
                      <table class="data-table">
                        <tr class="data-row"><td class="data-label">Scheme Name</td><td class="data-value">${pdfLoanName || 'N/A'}</td></tr>
                        <tr class="data-row"><td class="data-label">Total Disbursed</td><td class="data-value">₹ ${parseFloat(pdfLoanAmount || 0).toLocaleString('en-IN')}</td></tr>
                        <tr class="data-row"><td class="data-label">Current Liability</td><td class="data-value" style="color: #EF4444; font-weight: 900;">₹ ${parseFloat(pdfRemainingDue || 0).toLocaleString('en-IN')}</td></tr>
                      </table>
                    </div>
                  </div>
                  ` : ''}
                </div>

                <div class="col-right">
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">III. Audit & AGM Declaration</span></div>
                    <div class="card-body">
                      <table class="data-table">
                        <tr class="data-row"><td class="data-label">Reporting Month</td><td class="data-value">${reportingMonth || 'N/A'}</td></tr>
                        <tr class="data-row"><td class="data-label">Litres Collected</td><td class="data-value">${litres} L</td></tr>
                        <tr class="data-row"><td class="data-label">Bank Balance</td><td class="data-value financial-val">₹ ${parseFloat(balance || 0).toLocaleString('en-IN')}</td></tr>
                        <tr class="data-row"><td class="data-label">Audit Conducted Date</td><td class="data-value">${pdfAuditDate || 'N/A'} (Year: ${pdfAuditYear || 'N/A'})</td></tr>
                        <tr class="data-row"><td class="data-label">AGM Conducted Date</td><td class="data-value">${pdfAgmDate || 'N/A'}</td></tr>
                      </table>
                    </div>
                  </div>

                  ${isMilk ? '' : `
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">IV. Registered Member Category</span></div>
                    <div class="card-body" style="padding: 10px 15px;">
                      <table class="census-table">
                        <tr class="census-header">
                          <th style="width: 40%;">Category</th>
                          <th class="census-val">Male</th>
                          <th class="census-val">Female</th>
                          <th class="census-val">Total</th>
                        </tr>
                        <tr class="census-row"><td>SC Members</td><td class="census-val">${pdfMSc}</td><td class="census-val">${pdfFSc}</td><td class="census-val">${pdfMSc + pdfFSc}</td></tr>
                        <tr class="census-row"><td>ST Members</td><td class="census-val">${pdfMSt}</td><td class="census-val">${pdfFSt}</td><td class="census-val">${pdfMSt + pdfFSt}</td></tr>
                        <tr class="census-row"><td>OBC Members</td><td class="census-val">${pdfMObc}</td><td class="census-val">${pdfFObc}</td><td class="census-val">${pdfMObc + pdfFObc}</td></tr>
                        <tr class="census-row"><td>GEN Members</td><td class="census-val">${pdfMGen}</td><td class="census-val">${pdfFGen}</td><td class="census-val">${pdfMGen + pdfFGen}</td></tr>
                        <tr class="census-total-row">
                          <td>Grand Total</td>
                          <td class="census-val">${pdfTotalMale}</td>
                          <td class="census-val">${pdfTotalFemale}</td>
                          <td class="census-val">${pdfGrandTotal}</td>
                        </tr>
                      </table>
                    </div>
                  </div>
                  `}

                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">V. Operations & Events Log</span></div>
                    <div class="card-body" style="font-size: 10px; color: #4B5563; min-height: 50px;">
                      ${activities || 'No special activities for this period.'}
                    </div>
                  </div>
                </div>
              </div>

              <div class="footer-authority">
                <div class="sign-col"><div class="sign-line"></div><div class="sign-name">${activeReportedBy}</div><div class="sign-title">Officer Authorized Signatory</div></div>
                <div class="sign-col"><div class="sign-line"></div><div class="sign-name">Digitally Verified</div><div class="sign-title">ARCS / CI Authority</div></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // --- If viewing historical record PDF from RecordsScreen ---
    if (recordOverride) {
      if (Platform.OS === 'web') {
        try {
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.write(htmlContent);
            printWin.document.close();
            setTimeout(() => { printWin.focus(); printWin.print(); }, 300);
          }
        } catch(e) {
          console.warn('Web print exception:', e);
        }
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
      hasLoan: isMilk ? (masterHasLoan && !masterLoanCleared) : (compData?.hasLoan ?? hasLoan), 
      loanName: isMilk ? masterLoanType : (compData?.loanType ?? loanName), 
      loanAmount: isMilk ? masterLoanExtended : (compData?.loanAmount ?? loanAmount), 
      paidAmount: isMilk ? ((masterHasLoan && !masterLoanCleared) ? (compData?.loanRecovered || '') : '') : (compData?.loanRepaid ?? paidAmount), 
      remainingDue: isMilk ? ((masterHasLoan && !masterLoanCleared) ? (compData?.loanOutstanding || '') : '') : (compData?.loanDue ?? remainingDue), 
      activities,
      auditDone: isMilk ? (masterAuditDate ? `Yes (${masterAuditDate})` : 'No') : (compData?.auditDate ? `Yes (${compData.auditDate})` : (auditDate ? `Yes (${auditDate})` : 'No')),
      auditDate: isMilk ? masterAuditDate : (compData?.auditDate ?? auditDate), 
      auditYear: isMilk ? masterAuditYear : (compData?.auditYear ?? auditYear),
      agmDone: isMilk ? (masterAgmDate ? `Yes (${masterAgmDate})` : 'No') : (compData?.agmDate ? `Yes (${compData.agmDate})` : (agmDate ? `Yes (${agmDate})` : 'No')),
      agmDate: isMilk ? masterAgmDate : (compData?.agmDate ?? agmDate),
      gpsLat: location?.latitude ?? null, gpsLng: location?.longitude ?? null,
      capturedAt: timestamp || new Date().toISOString(),
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
          if (imageBase64) {
            try {
              uploadedPhotoUrl = await uploadPhoto(imageBase64);
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
              latitude: location?.latitude,
              longitude: location?.longitude,
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

      if (Platform.OS === 'web') {
        try {
          const printWin = window.open('', '_blank');
          if (printWin) {
            printWin.document.write(htmlContent);
            printWin.document.close();
            setTimeout(() => { printWin.focus(); printWin.print(); }, 300);
          }
        } catch(e) {
          console.warn('Web print error:', e);
        }
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
                          gpu: newInst.gpu || newInst.district || 'Dentam GPU',
                          district: newInst.gpu || newInst.district || 'Dentam GPU',
                          reportedBy: userProfile?.name || 'Cooperative Inspector',
                          inspectorEmail: session?.user?.email,
                          totalMembers: 0,
                          annualTurnover: 0,
                          isProfit: 'PROFIT'
                        });
                      } else {
                        await saveMilkPcsSubmission({
                          centerName: newInst.name,
                          centerId: newInst.name,
                          registrationNumber: newInst.regNo,
                          district: newInst.gpu || newInst.district || 'Dentam GPU',
                          reportedBy: userProfile?.name || 'Cooperative Inspector'
                        });
                      }
                    } catch (e) {
                      console.warn('Initial cloud registration warning:', e);
                    }

                    handleSelectSociety(newInst, true);
                  }}
                  onRemoveInstitution={(id) => {
                    const updated = institutionsList.filter(i => i.id !== id);
                    setInstitutionsList(updated);
                    saveInstitutionsForUser(updated, session?.user?.email);
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
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onViewPdf={generatePDF}
                  />
                ) : activeBottomTab === 'more' ? (
                  <MoreScreen
                    activeTab="more"
                    user={userProfile}
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onNavigateScreen={(scr) => {
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
                    auditDate={masterAuditDate}
                    setAuditDate={setMasterAuditDate}
                    auditYear={masterAuditYear}
                    setAuditYear={setMasterAuditYear}
                    auditStatus={masterAuditStatus}
                    setAuditStatus={setMasterAuditStatus}
                    agmDate={masterAgmDate}
                    setAgmDate={setMasterAgmDate}
                    agmYear={masterAgmYear}
                    setAgmYear={setMasterAgmYear}
                    agmStatus={masterAgmStatus}
                    setAgmStatus={setMasterAgmStatus}
                    hasLoan={masterHasLoan}
                    setHasLoan={setMasterHasLoan}
                    loanType={masterLoanType}
                    setLoanType={setMasterLoanType}
                    loanSanctionDate={masterLoanSanctionDate}
                    setLoanSanctionDate={setMasterLoanSanctionDate}
                    loanBeneficiaries={masterLoanBeneficiaries}
                    setLoanBeneficiaries={setMasterLoanBeneficiaries}
                    loanExtended={masterLoanExtended}
                    setLoanExtended={setMasterLoanExtended}
                    loanCleared={masterLoanCleared}
                    lastUpdated=""
                    onSave={(data) => {
                      if (data) saveMasterStateToStorage(data);
                    }}
                    onNext={() => {
                      setCurrentMobileScreen('DEMOGRAPHICS');
                      setActiveBottomTab('home');
                    }}
                    onBack={() => {
                      setCurrentMobileScreen('HOME');
                      setActiveBottomTab('home');
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
                        reportStatus={((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) && milkSectionStates?.operations?.status?.includes('COMPLETED') && (milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) && milkSectionStates?.compliance?.status?.includes('COMPLETED')) ? 'MONTHLY PARAMS OK' : 'DRAFT'}
                        progressPercent={
                          Math.round(
                            ((((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) || milkSectionStates?.evidence?.status?.includes('Valid')) ? 25 : 0) +
                            (milkSectionStates?.operations?.status?.includes('COMPLETED') ? 25 : 0) +
                            ((milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) ? 25 : 0) +
                            (milkSectionStates?.compliance?.status?.includes('COMPLETED') ? 25 : 0))
                          )
                        }
                        completedCount={
                          (((milkSectionStates?.evidence?.status?.includes('CAPTURED') && !milkSectionStates?.evidence?.status?.includes('NOT')) || milkSectionStates?.evidence?.status?.includes('Valid')) ? 1 : 0) +
                          (milkSectionStates?.operations?.status?.includes('COMPLETED') ? 1 : 0) +
                          ((milkSectionStates?.activities?.status?.includes('ENTRIES') || milkSectionStates?.activities?.status?.includes('COMPLETED')) ? 1 : 0) +
                          (milkSectionStates?.compliance?.status?.includes('COMPLETED') ? 1 : 0)
                        }
                        totalCount={4}
                        evidenceStatus={(milkSectionStates?.evidence?.validUntil && new Date() >= new Date(milkSectionStates.evidence.validUntil)) ? 'EXPIRED' : (milkSectionStates?.evidence?.status || 'NOT CAPTURED')}
                        operationsStatus={milkSectionStates?.operations?.status || 'NOT STARTED'}
                        activitiesStatus={milkSectionStates?.activities?.status || 'NOT STARTED'}
                        complianceStatus={milkSectionStates?.compliance?.status || 'NOT STARTED'}
                        lastUpdated=""
                        activeAlert={activeAlert}
                        onDismissAlert={dismissAlert}
                        selectedSociety={selectedSociety}
                        institutionsList={institutionsList}
                        onSelectSociety={handleSelectSociety}
                        onManageInstitutions={() => setCurrentMobileScreen('MY_INSTITUTIONS')}
                        onNavigateScreen={(scr) => {
                          setReturnMobileScreen('HOME');
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
                        onBack={() => setCurrentMobileScreen(returnMobileScreen || 'HOME')}
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
                        onBack={() => setCurrentMobileScreen(returnMobileScreen || 'HOME')}
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
                        onBack={() => setCurrentMobileScreen(returnMobileScreen || 'HOME')}
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
                        auditDate={masterAuditDate}
                        setAuditDate={setMasterAuditDate}
                        auditYear={masterAuditYear}
                        setAuditYear={setMasterAuditYear}
                        auditStatus={masterAuditStatus}
                        setAuditStatus={setMasterAuditStatus}
                        agmDate={masterAgmDate}
                        setAgmDate={setMasterAgmDate}
                        agmYear={masterAgmYear}
                        setAgmYear={setMasterAgmYear}
                        agmStatus={masterAgmStatus}
                        setAgmStatus={setMasterAgmStatus}
                        hasLoan={masterHasLoan}
                        setHasLoan={setMasterHasLoan}
                        loanType={masterLoanType}
                        setLoanType={setMasterLoanType}
                        loanSanctionDate={masterLoanSanctionDate}
                        setLoanSanctionDate={setMasterLoanSanctionDate}
                        loanBeneficiaries={masterLoanBeneficiaries}
                        setLoanBeneficiaries={setMasterLoanBeneficiaries}
                        loanExtended={masterLoanExtended}
                        setLoanExtended={setMasterLoanExtended}
                        loanCleared={masterLoanCleared}
                        lastUpdated=""
                        onSave={(data) => {
                          if (data) saveMasterStateToStorage(data);
                        }}
                        onSaveNext={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          setCurrentMobileScreen('DEMOGRAPHICS');
                        }}
                        onBack={() => setCurrentMobileScreen('HOME')}
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
                        }}
                        onSaveNext={(data) => {
                          if (data) saveMasterStateToStorage(data);
                          setCurrentMobileScreen('HOME');
                        }}
                        onBack={() => setCurrentMobileScreen('PROFILE')}
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
                        onBack={() => setCurrentMobileScreen(returnMobileScreen || 'HOME')}
                      />
                    )}

                    {currentMobileScreen === 'REVIEW' && (
                      <ReviewSubmitScreen
                        reportingMonth={reportingMonth || ''}
                        milkSectionStates={milkSectionStates}
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
                    }}
                    onNext={() => {
                      setCurrentMobileScreen('MPCS_DEMOGRAPHICS');
                      setActiveBottomTab('home');
                    }}
                    onBack={() => {
                      setCurrentMobileScreen('HOME');
                      setActiveBottomTab('home');
                    }}
                  />
                ) : activeBottomTab === 'more' ? (
                  <MoreScreen
                    activeTab="more"
                    onTabPress={(tab) => {
                      setActiveBottomTab(tab);
                      if (tab === 'home') setCurrentMobileScreen('HOME');
                    }}
                    onNavigateScreen={(scr) => {
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
                        reportStatus={((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) && sectionStates?.sales?.status?.includes('COMPLETED') && sectionStates?.business?.status?.includes('COMPLETED')) ? 'MONTHLY PARAMS OK' : 'DRAFT'}
                        progressPercent={
                          Math.round(
                            ((((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) || sectionStates?.evidence?.status?.includes('Valid')) ? 20 : 0) +
                            (sectionStates?.sales?.status?.includes('COMPLETED') ? 20 : 0) +
                            (sectionStates?.business?.status?.includes('COMPLETED') ? 20 : 0) +
                            (!cscTransData?.isCscActive || sectionStates?.csc?.status?.includes('COMPLETED') ? 20 : 0) +
                            (activityItems.length > 0 ? 20 : 0))
                          )
                        }
                        hasSubmittedMonthlyParams={false} // Disable global lock
                        completedCount={
                          (((sectionStates?.evidence?.status?.includes('CAPTURED') && !sectionStates?.evidence?.status?.includes('NOT')) || sectionStates?.evidence?.status?.includes('Valid')) ? 1 : 0) +
                          (sectionStates?.sales?.status?.includes('COMPLETED') ? 1 : 0) +
                          (sectionStates?.business?.status?.includes('COMPLETED') ? 1 : 0) +
                          ((!cscTransData?.isCscActive || sectionStates?.csc?.status?.includes('COMPLETED')) ? 1 : 0) +
                          (activityItems.length > 0 ? 1 : 0)
                        }
                        totalCount={5}
                        evidenceStatus={
                          (sectionStates?.evidence?.validUntil && new Date() >= new Date(sectionStates.evidence.validUntil)) ? 'EXPIRED' : (sectionStates?.evidence?.status || 'NOT CAPTURED')
                        }
                        salesStatus={sectionStates?.sales?.status || 'NOT COMPLETED'}
                        businessStatus={sectionStates?.business?.status || 'NOT COMPLETED'}
                        cscTransStatus={sectionStates?.csc?.status || 'NOT COMPLETED'}
                        activitiesStatus={`${activityItems.length} ENTRIES`}
                        lastUpdated=""
                        activeAlert={activeAlert}
                        onDismissAlert={dismissAlert}
                        selectedSociety={selectedSociety}
                        institutionsList={institutionsList}
                        onSelectSociety={handleSelectSociety}
                        onManageInstitutions={() => setCurrentMobileScreen('MY_INSTITUTIONS')}
                        onNavigateScreen={(scr) => setCurrentMobileScreen(scr)}
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
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS')}
                        onBack={() => setCurrentMobileScreen('HOME')}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_DEMOGRAPHICS' && (
                      <MpcsRegisteredDemographicsScreen
                        initialDemographics={demographicsData.length > 0 ? demographicsData : undefined}
                        onSaveDemographics={(data) => {
                          setDemographicsData(data);
                          saveMasterStateToStorage({ demographicsData: data });
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_COMPLIANCE')}
                        onBack={() => setCurrentMobileScreen('MPCS_INST_PROFILE')}
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
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_FINANCIALS')}
                        onBack={() => setCurrentMobileScreen('MPCS_DEMOGRAPHICS')}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_FINANCIALS' && (
                      <MpcsFinancialPerformanceScreen
                        initialTurnover={financialsData?.annualTurnover || ''}
                        initialIncome={financialsData?.totalIncome || ''}
                        initialExpenses={financialsData?.totalExpenses || ''}
                        initialNetProfit={financialsData?.netProfit || ''}
                        initialProfitability={financialsData?.profitability || ''}
                        onSaveFinancials={(data) => {
                          setFinancialsData(data);
                          saveMasterStateToStorage({ financialsData: data });
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_DIVIDEND')}
                        onBack={() => setCurrentMobileScreen('MPCS_COMPLIANCE')}
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
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL')}
                        onBack={() => setCurrentMobileScreen('MPCS_FINANCIALS')}
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
                        }}
                        onNext={() => setCurrentMobileScreen('MPCS_CSC_DETAILS')}
                        onBack={() => setCurrentMobileScreen('MPCS_DIVIDEND')}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_CSC_DETAILS' && (
                      <MpcsCscDetailsScreen
                        initialOperator={cscDetailsData?.cscOperatorName || ''}
                        initialMobile={cscDetailsData?.cscMobileNumber || ''}
                        initialDistrict={cscDetailsData?.cscDistrict || ''}
                        initialState={cscDetailsData?.cscState || ''}
                        initialVleId={cscDetailsData?.vleId || ''}
                        initialActive={cscDetailsData?.activeServices || []}
                        onSaveCscDetails={(data) => {
                          setCscDetailsData(data);
                          saveMasterStateToStorage({ cscDetailsData: data });
                        }}
                        onNext={() => {
                          showToast('✅ Master Data Saved Successfully!');
                          setCurrentMobileScreen('HOME');
                        }}
                        onBack={() => setCurrentMobileScreen('MPCS_SHARE_CAPITAL')}
                      />
                    )}

                    {currentMobileScreen === 'MPCS_REVIEW' && (
                      <MpcsReviewSubmitScreen
                        societyName={selectedSociety?.name || centerName?.trim() || ''}
                        reportingMonth={reportingMonth || ''}
                        sectionStates={sectionStates}
                        cscIsActive={cscTransData?.isCscActive || false}
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
  bulletinBoard: {
    width: '100%',
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
