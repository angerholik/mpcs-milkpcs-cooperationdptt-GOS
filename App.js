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
  Switch,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MPCSForm from './src/components/MPCSForm';
import ActivityEditor from './src/components/ActivityEditor';
import Login from './src/components/Login';
import { supabase, saveMilkPcsSubmission, uploadPhoto } from './src/supabase';
import { saveMilkPcsProfile, loadMilkPcsProfileByName, loadMilkCenters, addMilkCenter } from './src/utils/storage';

const { width } = Dimensions.get('window');

// Premium Gold and Emerald Palette
const COLORS = {
  emerald: '#064E3B',
  emeraldLight: '#047857',
  gold: '#D4AF37',
  goldLight: '#FBBF24',
  textHeader: '#F3F4F6',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  surface: '#FFFFFF',
  surfaceBlur: 'rgba(255, 255, 255, 0.55)',
  background: '#F8FAFC',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981'
};

const SIKKIM_EMBLEM_URL = 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Seal_of_Sikkim_color.png';
const SIKKIM_EMBLEM_LOCAL = require('./assets/sikkim-emblem.jpg');

const FloatingInput = ({ icon, label, value, onChangeText, keyboardType = 'default', prefix, readOnly, placeholder }) => (
  <View style={styles.floatingInputWrapper}>
    <Text style={styles.floatingInputLabel}>{label}</Text>
    {readOnly ? (
      <View style={styles.premiumReadOnlyCard}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.premiumReadOnlyInner}
        >
          <View style={styles.premiumReadOnlyIconBox}>
            <MaterialIcons name={icon === 'bank' ? 'account-balance' : (icon === 'cash' ? 'payments' : (icon === 'cash-check' ? 'price-check' : 'info'))} size={22} color={COLORS.emerald} />
          </View>
          <View style={styles.premiumReadOnlyContent}>
            <Text style={styles.premiumReadOnlyValue}>
              {prefix}{parseFloat(value || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </LinearGradient>
      </View>
    ) : (
      <View style={styles.floatingInputInner}>
        {icon && (
          <View style={styles.floatingIcon}>
            <MaterialIcons name={
              icon === 'store-marker' ? 'store' : 
              icon === 'domain' ? 'business' : 
              icon === 'book-open-variant' ? 'menu-book' : 
              icon === 'water-pump' ? 'opacity' : 
              icon === 'cash-minus' ? 'money-off' : 
              icon === 'safe' ? 'account-balance-wallet' : 
              icon === 'account-group' ? 'groups' : 
              icon === 'calendar-star' ? 'event-available' : 
              icon === 'text-box-check-outline' ? 'assignment-turned-in' : 
              icon === 'bank' ? 'account-balance' : 
              icon === 'cash' ? 'payments' : 
              icon === 'cash-check' ? 'price-check' : 
              icon === 'calculator-variant' ? 'calculate' : 
              icon === 'account-tie-hat' ? 'admin-panel-settings' :
              icon
            } size={20} color={COLORS.emerald} />
          </View>
        )}
        {prefix && <Text style={styles.inputPrefixText}>{prefix}</Text>}
        <TextInput
          style={styles.floatingInputField}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          selectionColor={COLORS.emerald}
          editable={!readOnly}
        />
      </View>
    )}
  </View>
);

const MiniInput = ({ label, value, onChangeText, placeholder }) => (
  <View style={styles.miniInputWrapper}>
    <Text style={styles.floatingInputLabel}>{label}</Text>
    <View style={styles.miniInputInner}>
      <TextInput
        style={styles.floatingInputField}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        selectionColor={COLORS.emerald}
      />
    </View>
  </View>
);

// Editor component is now imported from src/components/ActivityEditor.js
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState('MAIN'); // 'MAIN' or 'MPCS'

  // Evidence States
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [location, setLocation] = useState(null);

  // General & Center Profile
  const [centerName, setCenterName] = useState('');
  const [district, setDistrict] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [milkCenters, setMilkCenters] = useState([]);

  // Operational Ledgers
  const [reportingMonth, setReportingMonth] = useState('');
  const [litres, setLitres] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [balance, setBalance] = useState('');

  // Member Category
  const [mSc, setMSc] = useState('');
  const [fSc, setFSc] = useState('');
  const [mSt, setMSt] = useState('');
  const [fSt, setFSt] = useState('');
  const [mObc, setMObc] = useState('');
  const [fObc, setFObc] = useState('');
  const [mGen, setMGen] = useState('');
  const [fGen, setFGen] = useState('');
  const [totalMale, setTotalMale] = useState('');
  const [totalFemale, setTotalFemale] = useState('');
  const [totalMembers, setTotalMembers] = useState('');

  // Supplemental
  const [hasLoan, setHasLoan] = useState(false);
  const [loanName, setLoanName] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [remainingDue, setRemainingDue] = useState('');
  const [activities, setActivities] = useState('');

  const [isSealing, setIsSealing] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const clearForm = () => {
    // 1. Maintain General & Profile (Center Name / District)
    // These are kept persistent per user request to facilitate repeated entries
    // reportedBy is also kept persistent
    
    // 2. Clear Operational Ledgers
    setReportingMonth('');
    setLitres('');
    setWithdrawal('');
    setBalance('');
    setActivities('');
    
    // 3. Clear Demographic Data
    setMSc(''); setFSc(''); setMSt(''); setFSt('');
    setMObc(''); setFObc(''); setMGen(''); setFGen('');
    setTotalMale('0'); setTotalFemale('0'); setTotalMembers('0');

    // 4. Clear Geolocation & Photo
    setImageUri(null);
    setImageBase64(null);
    setTimestamp('');
    setLocation(null);

    // 5. Clear Supplemental / Loan Data
    setHasLoan(false);
    setLoanName('');
    setLoanAmount('');
    setPaidAmount('');
    setRemainingDue('0');
  };

  // Automatic Loan Calculation
  useEffect(() => {
    const lAmt = parseFloat(loanAmount) || 0;
    const pAmt = parseFloat(paidAmount) || 0;
    const due = Math.max(0, lAmt - pAmt);
    if (String(due) !== remainingDue) {
      setRemainingDue(due.toString());
    }
  }, [loanAmount, paidAmount]);

  useEffect(() => {
    // 1. Handle Authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // 2. Handle Permissions
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        Alert.alert('Permissions Required', 'Camera and Location are strictly enforced for official verification.');
      }
    })();

    // 3. Load Profile & Centers
    (async () => {
      const savedProfile = await loadMilkPcsProfileByName('last_used');
      if (savedProfile) {
        if (savedProfile.centerName) setCenterName(savedProfile.centerName);
        if (savedProfile.district) setDistrict(savedProfile.district);
        if (savedProfile.reportedBy) setReportedBy(savedProfile.reportedBy);
        if (savedProfile.mSc) setMSc(savedProfile.mSc);
        if (savedProfile.fSc) setFSc(savedProfile.fSc);
        if (savedProfile.mSt) setMSt(savedProfile.mSt);
        if (savedProfile.fSt) setFSt(savedProfile.fSt);
        if (savedProfile.mObc) setMObc(savedProfile.mObc);
        if (savedProfile.fObc) setFObc(savedProfile.fObc);
        if (savedProfile.mGen) setMGen(savedProfile.mGen);
        if (savedProfile.fGen) setFGen(savedProfile.fGen);
        if (savedProfile.hasLoan) setHasLoan(savedProfile.hasLoan);
        if (savedProfile.loanName) setLoanName(savedProfile.loanName);
        if (savedProfile.loanAmount) setLoanAmount(savedProfile.loanAmount);
      }
      const centers = await loadMilkCenters();
      setMilkCenters(centers);
    })();

    return () => subscription.unsubscribe();
  }, []);

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

  const generatePDF = async () => {
    if (isSealing) return;

    // --- VALIDATIONS ---
    const errors = [];
    if (!district) errors.push("District selection is required.");
    if (!centerName || !centerName.trim()) errors.push("Center Name or ID is required.");
    if (!reportingMonth) errors.push("Reporting Month is required.");
    if (!litres || isNaN(parseFloat(litres))) errors.push("Valid Litres amount is required.");
    if (!balance || isNaN(parseFloat(balance))) errors.push("Valid Bank Balance is required.");
    if (!reportedBy || !reportedBy.trim()) errors.push("Authorizing Officer name is mandatory.");
    if (!imageUri || !imageBase64) errors.push("A geolocation evidence photo must be attached.");

    if (errors.length > 0) {
      showValidationAlert(errors);
      return;
    }
    // -------------------

    setIsSealing(true);
    const locText = location ? `${location.latitude.toFixed(6)}° N, ${location.longitude.toFixed(6)}° E` : 'Pending GPS Sync';
    
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
              color: #1F2937;
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
              border: 1px solid #D4AF37;
              outline: 0.5px solid #064E3B;
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
              border-bottom: 2px solid #D4AF37;
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
              color: #064E3B;
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
              background: #F8FAFC;
              padding: 10px 15px;
              border-bottom: 1px solid #064E3B;
            }
            .card-title {
              font-family: 'Cinzel', serif;
              font-size: 11px;
              font-weight: 900;
              color: #064E3B;
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
              background: rgba(6, 78, 59, 0.95);
              padding: 10px 15px;
              border-radius: 8px;
              color: #D4AF37;
              position: relative;
              font-size: 9px;
              border: 1px solid #D4AF37;
            }
            .tel-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .tel-val { font-family: 'Courier New', monospace; font-weight: bold; }

            .data-table { width: 100%; border-collapse: collapse; }
            .data-row { border-bottom: 1px solid #F1F5F9; }
            .data-row:last-child { border-bottom: none; }
            .data-label { padding: 8px 0; font-size: 9px; font-weight: 700; color: #6B7280; text-transform: uppercase; }
            .data-value { padding: 8px 0; font-size: 11px; font-weight: 800; color: #111827; text-align: right; }
            .financial-val { color: #064E3B; font-size: 12px; }

            .census-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            .census-header th { font-size: 8px; color: #64748B; text-align: left; padding-bottom: 5px; border-bottom: 1px solid #E2E8F0; text-transform: uppercase; }
            .census-row td { padding: 8px 0; border-bottom: 0.5px solid #F1F5F9; font-size: 10px; font-weight: 700; color: #334155; }
            .census-val { font-family: 'Courier New', monospace; font-weight: 800; text-align: center; }
            .census-total-row td { background: #ECFDF5; padding: 10px 5px; font-weight: 900; color: #064E3B; border-bottom: 1.5px solid #064E3B; }

            .footer-authority {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 30px;
            }
            .sign-col { text-align: center; width: 200px; }
            .sign-line { border-top: 1.5px solid #111827; margin-bottom: 6px; }
            .sign-name { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #111827; }
            .sign-title { font-size: 9px; color: #6B7280; margin-top: 2px; font-weight: 600; }

            .qr-seal-box {
              display: flex;
              align-items: center;
              gap: 15px;
              background: #F8FAFC;
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
              color: rgba(6, 78, 59, 0.02);
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
                <div style="background: #064E3B; color: #D4AF37; padding: 4px 15px; border-radius: 20px; font-size: 9px; font-weight: 900; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;">Official Return Certificate</div>
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
                        <tr class="data-row"><td class="data-label">District</td><td class="data-value">${district || 'N/A'}</td></tr>
                        <tr class="data-row"><td class="data-label">Center Name</td><td class="data-value">${centerName || 'N/A'}</td></tr>
                      </table>
                    </div>
                  </div>

                  ${hasLoan ? `
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title" style="color: #B45309;">VI. Financial Liability Details</span></div>
                    <div class="card-body">
                      <table class="data-table">
                        <tr class="data-row"><td class="data-label">Scheme Name</td><td class="data-value">${loanName || 'N/A'}</td></tr>
                        <tr class="data-row"><td class="data-label">Total Disbursed</td><td class="data-value">₹ ${parseFloat(loanAmount || 0).toLocaleString('en-IN')}</td></tr>
                        <tr class="data-row"><td class="data-label">Current Liability</td><td class="data-value" style="color: #EF4444; font-weight: 900;">₹ ${parseFloat(remainingDue || 0).toLocaleString('en-IN')}</td></tr>
                      </table>
                    </div>
                  </div>
                  ` : ''}
                </div>

                <div class="col-right">
                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">III. Declaration Audit</span></div>
                    <div class="card-body">
                      <table class="data-table">
                        <tr class="data-row"><td class="data-label">Reporting Month</td><td class="data-value">${reportingMonth || 'N/A'}</td></tr>
                        <tr class="data-row"><td class="data-label">Litres Collected</td><td class="data-value">${litres} L</td></tr>
                        <tr class="data-row"><td class="data-label">Bank Balance</td><td class="data-value financial-val">₹ ${parseFloat(balance || 0).toLocaleString('en-IN')}</td></tr>
                      </table>
                    </div>
                  </div>

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

                  <div class="premium-card">
                    <div class="card-header"><span class="card-title">V. Operations & Events Log</span></div>
                    <div class="card-body" style="font-size: 10px; color: #4B5563; min-height: 50px;">
                      ${activities || 'No special activities for this period.'}
                    </div>
                  </div>
                </div>
              </div>

              <div class="footer-authority">
                <div class="sign-col"><div class="sign-line"></div><div class="sign-name">${reportedBy}</div><div class="sign-title">Officer Authorized Signatory</div></div>
                <div class="sign-col"><div class="sign-line"></div><div class="sign-name">Digitally Verified</div><div class="sign-title">ARCS / CI Authority</div></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // ─── Step 1: Upload photo to Supabase Storage ──────────────────────────────
    let uploadedPhotoUrl = null;
    if (imageBase64) {
      uploadedPhotoUrl = await uploadPhoto(imageBase64);
      console.log('Photo URL:', uploadedPhotoUrl);
    }

    // ─── Step 2: Save to Supabase FIRST (independent of PDF) ─────────────────
    const totalMaleCalc = [mSc, mSt, mObc, mGen].reduce((s, v) => s + (parseInt(v) || 0), 0);
    const totalFemaleCalc = [fSc, fSt, fObc, fGen].reduce((s, v) => s + (parseInt(v) || 0), 0);
    const totalMembersCalc = totalMaleCalc + totalFemaleCalc;

    try {
      const { data: sbData, error: sbError } = await saveMilkPcsSubmission({
        centerName,
        centerId: centerName, // Now unified: Name is the ID
        reportingMonth,
        reportedBy,
        litres,
        withdrawal,
        balance,
        mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen,
        totalMale: String(totalMaleCalc),
        totalFemale: String(totalFemaleCalc),
        totalMembers: String(totalMembersCalc),
        hasLoan,
        loanName,
        loanAmount,
        paidAmount,
        remainingDue,
        activities,
        gpsLat: location?.latitude ?? null,
        gpsLng: location?.longitude ?? null,
        capturedAt: timestamp,
        photoUrl: uploadedPhotoUrl,
        pdfUrl: null,
        district: district,
      });

      if (sbError) {
        console.error('❌ Supabase error:', JSON.stringify(sbError));
        const errMsg = `Error: ${sbError.message || sbError.code || 'Unknown'}\n\nCheck that RLS is disabled on the table in Supabase.`;
        if (Platform.OS === 'web') {
          alert('⚠️ Cloud Sync Failed\n\n' + errMsg);
        } else {
          Alert.alert('⚠️ Cloud Sync Failed', errMsg, [{ text: 'OK' }]);
        }
      } else {
        console.log('✅ Supabase save OK:', sbData);
        // Save as 'last_used' for convenience
        const profileData = {
          centerName: centerName,
          centerId: centerName, 
          district: district,
          reportedBy,
          mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen,
          hasLoan, loanName, loanAmount
        };
        saveMilkPcsProfile('last_used', profileData);

        // Save static profile for next time using the name as key
        if (centerName && centerName.trim()) {
          saveMilkPcsProfile(centerName.trim(), profileData);
          
          addMilkCenter(centerName.trim(), district).then(updated => {
            if (updated) setMilkCenters(updated);
          });
        }
      }
    } catch (sbEx) {
      console.error('❌ Supabase exception:', sbEx);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Step 2: Generate and share PDF ──────────────────────────────────────
    try {
      const printResult = await Print.printToFileAsync({ html: htmlContent });
      const uri = printResult?.uri;

      if (uri && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        const successMsg = 'Data successfully synced to admin server and PDF sealed.';
        if (Platform.OS === 'web') {
          alert('✅ Process Complete\n\n' + successMsg);
        } else {
          Alert.alert('✅ Process Complete', successMsg);
        }
      } else {
        const sealedMsg = 'Submission saved to the cloud dashboard.\n(PDF sharing is only available on mobile devices.)';
        if (Platform.OS === 'web') {
          alert('✅ Record Sealed\n\n' + sealedMsg);
        } else {
          Alert.alert('✅ Record Sealed', sealedMsg);
        }
      }
    } catch (err) {
      console.error('PDF error:', err);
      const errDetail = 'Data has been synced to the server, but the PDF preview could not be generated on this browser.';
      if (Platform.OS === 'web') {
        alert('✅ Save Successful\n\n' + errDetail);
      } else {
        Alert.alert('✅ Save Successful', errDetail);
      }
    } finally {
      // ONLY clear the form at the very end of everything
      clearForm();
      setIsSealing(false);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.emerald} />

      <View style={styles.bgBlobLeft} pointerEvents="none" />
      <View style={styles.bgBlobRight} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : null}>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* Header Area */}
            <View style={styles.headerZone}>
              <View style={styles.headerTopLine}>
                <Image
                  source={require('./assets/Seal_of_Sikkim_greyscale.png')}
                  style={styles.govEmblem}
                  resizeMode="contain"
                />
                <View style={styles.headerTextGroup}>
                  <Text style={styles.govTitle}>Government of Sikkim</Text>
                  <Text style={styles.govTitleSubtitle}>Department of Cooperation</Text>
                </View>
                {session && (
                  <TouchableOpacity 
                    onPress={() => supabase.auth.signOut()} 
                    style={styles.logoutBtn}
                  >
                    <MaterialIcons name="logout" size={20} color={COLORS.goldLight} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.headerDivider} />
              <View style={styles.headerBadgeContainer}>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[styles.segmentButton, activeView === 'MAIN' && styles.segmentActive]}
                    onPress={() => setActiveView('MAIN')}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="fact-check" size={16} color={activeView === 'MAIN' ? COLORS.gold : COLORS.emeraldLight} />
                    <Text style={[styles.segmentText, activeView === 'MAIN' && styles.segmentTextActive]}>MILK PCS</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.segmentButton, activeView === 'MPCS' && styles.segmentActive]}
                    onPress={() => setActiveView('MPCS')}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="corporate-fare" size={16} color={activeView === 'MPCS' ? COLORS.gold : COLORS.emeraldLight} />
                    <Text style={[styles.segmentText, activeView === 'MPCS' && styles.segmentTextActive]}>MPCS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {activeView === 'MPCS' ? (
              <MPCSForm onComplete={() => setActiveView('MAIN')} />
            ) : (
              <>
                {/* SECTION: Evidence */}
                <View style={styles.glassCard}>
                  <View style={styles.cardRibbon} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="camera-enhance" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section A: Digital Evidence</Text>
                  </View>

                  {!imageUri ? (
                    <TouchableOpacity style={styles.evidenceDropzone} onPress={captureImage} activeOpacity={0.7}>
                      <View style={styles.dropzoneCircle}>
                        <MaterialIcons name="add-a-photo" size={36} color={COLORS.emerald} />
                      </View>
                      <Text style={styles.dropzoneTitle}>Initialize Camera Sensor</Text>
                      <Text style={styles.dropzoneSub}>Secure GPS locking required upon capture</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.evidenceSnapshotBox}>
                      <Image source={{ uri: imageUri }} style={styles.evidenceImage} />
                      <LinearGradient colors={['transparent', 'rgba(6,78,59,0.9)']} style={styles.evidenceOverlay}>
                        <View style={styles.evidenceMetaData}>
                          <View style={styles.metaBadge}>
                            <MaterialIcons name="satellite" size={16} color={COLORS.gold} />
                            <Text style={styles.metaBadgeText}>GPS LOCKED</Text>
                          </View>
                          <Text style={styles.metaTextLatLong}>{location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : 'Computing...'}</Text>
                          <Text style={styles.metaTextTime}>{timestamp}</Text>
                        </View>
                        <TouchableOpacity style={styles.recaptureBtn} onPress={captureImage}>
                          <MaterialIcons name="refresh" size={20} color={COLORS.surface} />
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  )}
                </View>

                {/* SECTION: Profile */}
                <View style={styles.glassCard}>
                  <View style={[styles.cardRibbon, { backgroundColor: COLORS.gold }]} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="business" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section B: Institutional Profile</Text>
                  </View>

                  <Text style={styles.floatingInputLabel}>Select District</Text>
                  <View style={[styles.pickerWrapperGold, { marginBottom: 20 }]}>
                    <Picker
                      selectedValue={district}
                      onValueChange={(itemValue) => setDistrict(itemValue)}
                      style={styles.pickerNative}
                    >
                      <Picker.Item label="Select District..." value="" color={COLORS.textSecondary} />
                      <Picker.Item label="Gangtok" value="Gangtok" color={COLORS.emerald} />
                      <Picker.Item label="Geyzing" value="Geyzing" color={COLORS.emerald} />
                      <Picker.Item label="Mangan" value="Mangan" color={COLORS.emerald} />
                      <Picker.Item label="Namchi" value="Namchi" color={COLORS.emerald} />
                      <Picker.Item label="Pakyong" value="Pakyong" color={COLORS.emerald} />
                      <Picker.Item label="Soreng" value="Soreng" color={COLORS.emerald} />
                    </Picker>
                  </View>

                  <Text style={styles.floatingInputLabel}>Select Registered Center</Text>
                  <View style={[styles.pickerWrapperGold, { marginBottom: 20 }]}>
                    <Picker
                      selectedValue={centerName}
                      onValueChange={async (itemValue) => {
                        if (itemValue) {
                          setCenterName(itemValue);
                          // Load data for this specific center
                          const centerProfile = await loadMilkPcsProfileByName(itemValue);
                          if (centerProfile) {
                            if (centerProfile.district) setDistrict(centerProfile.district);
                            if (centerProfile.reportedBy) setReportedBy(centerProfile.reportedBy);
                            if (centerProfile.mSc) setMSc(centerProfile.mSc);
                            if (centerProfile.fSc) setFSc(centerProfile.fSc);
                            if (centerProfile.mSt) setMSt(centerProfile.mSt);
                            if (centerProfile.fSt) setFSt(centerProfile.fSt);
                            if (centerProfile.mObc) setMObc(centerProfile.mObc);
                            if (centerProfile.fObc) setFObc(centerProfile.fObc);
                            if (centerProfile.mGen) setMGen(centerProfile.mGen);
                            if (centerProfile.fGen) setFGen(centerProfile.fGen);
                            if (centerProfile.hasLoan) setHasLoan(centerProfile.hasLoan);
                            if (centerProfile.loanName) setLoanName(centerProfile.loanName);
                            if (centerProfile.loanAmount) setLoanAmount(centerProfile.loanAmount);
                          }
                        }
                      }}
                      style={styles.pickerNative}
                    >
                      <Picker.Item label={milkCenters.length > 0 ? (district ? `Centers in ${district}...` : "Select District First...") : "No Centers Saved Yet"} value="" color={COLORS.textSecondary} />
                      {milkCenters
                        .filter(center => !district || center.district === district || !center.district)
                        .map(center => (
                          <Picker.Item key={center.name} label={center.name} value={center.name} color={COLORS.emerald} />
                        ))}
                    </Picker>
                  </View>

                  <FloatingInput
                    icon="store-marker"
                    label="Center ID or Center Name"
                    placeholder="Enter Center Name (e.g. Namchi MPC)"
                    value={centerName}
                    onChangeText={setCenterName}
                  />
                </View>

                {/* SECTION: Ledger */}
                <View style={styles.glassCard}>
                  <View style={[styles.cardRibbon, { backgroundColor: '#1E3A8A' }]} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="menu-book" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section C: Operations Ledger</Text>
                  </View>

                  {/* Single shared Reporting Month picker */}
                  <Text style={styles.floatingInputLabel}>Reporting Month</Text>
                  <View style={[styles.pickerWrapperGold, { marginBottom: 20 }]}>
                    <Picker
                      selectedValue={reportingMonth}
                      onValueChange={(itemValue) => setReportingMonth(itemValue)}
                      style={styles.pickerNative}
                    >
                      <Picker.Item label="Select Month..." value="" color={COLORS.textSecondary} />
                      {months.map((m) => (<Picker.Item key={m} label={m} value={m} color={COLORS.emerald} />))}
                    </Picker>
                  </View>

                  {/* Litres: full width */}
                  <FloatingInput
                    icon="water-pump"
                    label="Litres Collected"
                    placeholder="0.00"
                    value={litres}
                    onChangeText={setLitres}
                    keyboardType="numeric"
                  />

                  {/* Withdrawal: full width */}
                  <FloatingInput
                    icon="cash-minus"
                    label="Total Withdrawal"
                    prefix="₹ "
                    placeholder="0.00"
                    value={withdrawal}
                    onChangeText={setWithdrawal}
                    keyboardType="numeric"
                  />

                  {/* Balance: full width */}
                  <FloatingInput
                    icon="safe"
                    label="Bank Balance"
                    prefix="₹ "
                    placeholder="0.00"
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="numeric"
                  />
                </View>

                {/* SECTION: Member Category */}
                <View style={styles.glassCard}>
                  <View style={[styles.cardRibbon, { backgroundColor: COLORS.emerald }]} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="groups" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section D: Registered Caste Demographics</Text>
                  </View>


                  <View style={styles.ledgerContainer}>
                    {/* Header: Zero-Weight Architectural */}
                    <View style={styles.ledgerHeader}>
                      <Text style={[styles.ledgerHeaderLabel, { flex: 1.5 }]}>REGISTRY</Text>
                      <View style={styles.ledgerColumnHeader}>
                        <MaterialIcons name="person" size={14} color="#94A3B8" />
                        <Text style={styles.ledgerHeaderLabel}>MALE</Text>
                      </View>
                      <View style={styles.ledgerColumnHeader}>
                        <MaterialIcons name="person" size={14} color="#94A3B8" />
                        <Text style={styles.ledgerHeaderLabel}>FEMALE</Text>
                      </View>
                      <Text style={[styles.ledgerHeaderLabel, { textAlign: 'right', width: 55 }]}>TOTAL</Text>
                    </View>

                    {[
                      { id: 'Sc', label: 'SC', color: '#3B82F6', icon: 'shield-account', mVal: mSc, fVal: fSc, setM: setMSc, setF: setFSc },
                      { id: 'St', label: 'ST', color: '#8B5CF6', icon: 'account-child', mVal: mSt, fVal: fSt, setM: setMSt, setF: setFSt },
                      { id: 'Obc', label: 'OBC', color: '#F59E0B', icon: 'account-star', mVal: mObc, fVal: fObc, setM: setMObc, setF: setFObc },
                      { id: 'Gen', label: 'GEN', color: '#10B981', icon: 'account-check', mVal: mGen, fVal: fGen, setM: setMGen, setF: setFGen },
                    ].map((row, idx, arr) => {
                      const rowTotal = (parseInt(row.mVal) || 0) + (parseInt(row.fVal) || 0);
                      return (
                        <View key={row.id} style={styles.ledgerRow}>
                          <View style={styles.categoryCell}>
                            <Text style={styles.ledgerCategoryText}>{row.label}</Text>
                          </View>
                          
                          <View style={[styles.inputCell, styles.vDividerHair]}>
                            <TextInput
                              style={styles.ledgerInput}
                              keyboardType="numeric"
                              value={row.mVal}
                              onChangeText={row.setM}
                              placeholder="0"
                              placeholderTextColor="#E2E8F0"
                              selectionColor={COLORS.emerald}
                            />
                          </View>
                          
                          <View style={[styles.inputCell, styles.vDividerHair]}>
                            <TextInput
                              style={styles.ledgerInput}
                              keyboardType="numeric"
                              value={row.fVal}
                              onChangeText={row.setF}
                              placeholder="0"
                              placeholderTextColor="#E2E8F0"
                              selectionColor={COLORS.emerald}
                            />
                          </View>

                          <View style={[styles.rowTotalCell, styles.vDividerHair]}>
                            <Text style={styles.rowTotalText}>{rowTotal || '0'}</Text>
                          </View>
                        </View>
                      );
                    })}

                    {/* Footer: Fluid Summary */}
                    <View style={styles.ledgerFooter}>
                      <Text style={styles.ledgerFooterLabel}>SUMMARY</Text>
                      <View style={[styles.footerValBox, styles.vDividerHair]}>
                        <Text style={styles.footerValText}>{[mSc, mSt, mObc, mGen].reduce((sum, v) => sum + (parseInt(v) || 0), 0)}</Text>
                      </View>
                      <View style={[styles.footerValBox, styles.vDividerHair]}>
                        <Text style={styles.footerValText}>{[fSc, fSt, fObc, fGen].reduce((sum, v) => sum + (parseInt(v) || 0), 0)}</Text>
                      </View>
                      <View style={[styles.grandTotalPill, { marginLeft: 15 }]}>
                        <Text style={styles.grandTotalPillText}>{[mSc, mSt, mObc, mGen, fSc, fSt, fObc, fGen].reduce((sum, v) => sum + (parseInt(v) || 0), 0)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* SECTION: Activities / Events Log */}
                <View style={styles.glassCard}>
                  <View style={[styles.cardRibbon, { backgroundColor: '#7C3AED' }]} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="event-available" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section E: Activities / Events Log</Text>
                  </View>

                  <ActivityEditor value={activities} onChange={setActivities} />
                </View>

                {/* SECTION: Supplemental */}
                <View style={styles.glassCard}>
                  <View style={[styles.cardRibbon, { backgroundColor: '#94A3B8' }]} />
                  <View style={styles.cardHeader}>
                    <MaterialIcons name="assignment-turned-in" size={24} color={COLORS.emerald} />
                    <Text style={styles.cardTitle}>Section F: Supplemental</Text>
                  </View>

                  <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => setHasLoan(!hasLoan)}
                    style={[
                      styles.toggleRow,
                      hasLoan && { 
                        borderColor: COLORS.emerald, 
                        borderWidth: 2,
                        shadowColor: COLORS.emerald,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                        elevation: 8,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        padding: 18,
                      }
                    ]}
                  >
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.toggleLabel, hasLoan && { fontWeight: '800' }]}>Active Loan Status</Text>
                      <Text style={styles.toggleSub}>Declare if the cooperative holds institutional debt</Text>
                    </View>
                    <View style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: hasLoan ? COLORS.emerald : '#E2E8F0',
                      padding: 2,
                      justifyContent: 'center',
                    }}>
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#FFF',
                        transform: [{ translateX: hasLoan ? 20 : 0 }],
                      }} />
                    </View>
                  </TouchableOpacity>

                  {hasLoan && (
                    <View style={styles.loanDetailsContainer}>
                      <FloatingInput
                        icon="bank"
                        label="Loan Name"
                        placeholder="Enter bank or scheme name"
                        value={loanName}
                        onChangeText={setLoanName}
                      />
                      <FloatingInput
                        icon="cash"
                        label="Loan Amount"
                        prefix="₹ "
                        placeholder="0.00"
                        value={loanAmount}
                        onChangeText={setLoanAmount}
                        keyboardType="numeric"
                      />
                      <FloatingInput
                        icon="cash-check"
                        label="Paid Amount"
                        prefix="₹ "
                        placeholder="0.00"
                        value={paidAmount}
                        onChangeText={setPaidAmount}
                        keyboardType="numeric"
                      />
                      <View style={{ width: '100%', marginTop: 5 }}>
                        <FloatingInput
                          icon="calculator-variant"
                          label="Remaining Due (Auto-calculated)"
                          prefix="₹ "
                          value={remainingDue}
                          readOnly={true}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  )}



                  <View style={{ marginTop: 5 }}>
                    <FloatingInput
                      icon="account-tie-hat"
                      label="Authorizing Officer Identity (Submitting Signatory) *"
                      placeholder="Enter full name of officer"
                      value={reportedBy}
                      onChangeText={setReportedBy}
                    />
                  </View>

                </View>

                {/* Submit Action */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity activeOpacity={0.9} onPress={generatePDF}>
                    <LinearGradient
                      colors={[COLORS.emeraldLight, COLORS.emerald]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={styles.forgeButton}
                    >
                      <View style={styles.forgeInnerBox}>
                        <MaterialIcons name="fingerprint" size={28} color={isSealing ? COLORS.surface : COLORS.goldLight} />
                        <View style={styles.forgeTextCol}>
                          <Text style={styles.forgeButtonMainText}>
                            {isSealing ? 'SEALING RECORD...' : 'COMPILE & SEAL RECORD'}
                          </Text>
                          <Text style={styles.forgeButtonSubText}>
                            {isSealing ? 'Uploading & Syncing Data...' : 'Cryptographically Signs PDF Document'}
                          </Text>
                        </View>
                        {isSealing ? (
                          <ActivityIndicator color={COLORS.surface} size="small" />
                        ) : (
                          <MaterialIcons name="chevron-right" size={24} color={COLORS.surface} opacity={0.5} />
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <Text style={styles.legalFooter}>
                  FOR OFFICIAL USE ONLY. UNAUTHORIZED ACCESS IS PROHIBITED.
                </Text>
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: 500,
      marginHorizontal: 'auto',
      minHeight: '100vh',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      overflow: 'hidden'
    }),
  },
  bgBlobLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(4, 120, 87, 0.07)',
  },
  bgBlobRight: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(212, 175, 55, 0.07)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 50,
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
    color: COLORS.emeraldLight,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  govTitle: {
    color: COLORS.emerald,
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    position: 'absolute',
    right: 0,
    top: -5,
    backgroundColor: 'rgba(6, 78, 59, 0.1)',
    padding: 10,
    borderRadius: 12,
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
    borderRadius: 24,
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
    borderColor: 'rgba(4, 120, 87, 0.2)',
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
    backgroundColor: '#ECFDF5',
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
    color: '#D1FAE5',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    marginLeft: 4,
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
    color: '#064E3B',
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
    backgroundColor: '#F8FAFC',
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
    borderBottomColor: '#F8FAFC',
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
    color: COLORS.emeraldLight,
    opacity: 0.5,
  },
  ledgerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECFDF5',
  },
  ledgerFooterLabel: {
    flex: 1.5,
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.emerald,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
  },
  grandTotalPillText: {
    color: COLORS.emerald,
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
    borderColor: '#BBF7D0',
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
    color: COLORS.emerald,
    letterSpacing: 0.5,
  }
});
