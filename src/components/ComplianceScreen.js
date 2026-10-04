import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Alert, Image } from 'react-native';
import MpcsWizardHeader from './mpcs/MpcsWizardHeader';
import WizardFooter from './WizardFooter';
import { WizardField, CalcCard } from './WizardField';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import BottomNav from './BottomNav';

// Same subtle Kanchenjunga treatment used on every header across the app.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

const COLORS = {
  surface: '#ffffff',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
  amber100: '#fef3c7',
  amber900: '#78350f',
  emerald700: '#047857',
};

const FONT_FAMILY = 'Manrope';

// This screen now only tracks the MONTHLY loan repayment status.
// Audit, AGM, and one-time loan setup (type / sanction date / beneficiaries)
// live on the Institutional Profile (Master Data) screen instead, since
// those are recorded once a year (or once per loan), not every month.
//
// Props:
//   masterHasLoan     - from Master Data: does this society currently have a loan on record?
//   masterLoanCleared - from Master Data: has that loan already been marked cleared?
//   masterLoanType / masterLoanExtended - read-only reference, set on Master Data
//   onLoanCleared()   - called when the inspector marks the loan as cleared this month
export default function ComplianceScreen({
  societyName = "",
  reportingMonth = "",
  masterHasLoan = false,
  masterLoanCleared = false,
  masterLoanType = "",
  masterLoanExtended = "",
  onLoanCleared,
  onSave,
  onSaveNext,
  onNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [lastVerified, setLastVerified] = useState('Not verified');

  // Monthly loan repayment tracking
  const [loanRecovered, setLoanRecovered] = useState('');

  const loanIsActive = masterHasLoan && !masterLoanCleared;

  // Outstanding is derived, never entered directly: it's always
  // (amount extended at loan setup) - (recovered to date), so it can't
  // drift out of sync with what the inspector actually reports as recovered.
  const computeOutstanding = (recoveredValue) => {
    const extended = parseFloat(masterLoanExtended) || 0;
    const recovered = parseFloat(recoveredValue) || 0;
    const outstanding = extended - recovered;
    return Math.max(outstanding, 0).toString();
  };

  const loanOutstanding = computeOutstanding(loanRecovered);

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'compliance');
      if (data) {
        setLoanRecovered(data.loanRecovered || '');
        if (data.loanRecovered) {
          setLastVerified(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        }
      }
    })();
  }, [societyName, reportingMonth]);

  const saveToLocal = async (newData) => {
    const isCompleted = !loanIsActive || !!newData.loanRecovered;
    await saveMilkSectionData(societyName, reportingMonth, 'compliance', { ...newData, isCompleted });
    return isCompleted;
  };

  const handleSaveAndNext = async () => {
    await saveToLocal({ loanRecovered, loanOutstanding });
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const confirmMarkCleared = () => {
    const doClear = () => {
      if (onLoanCleared) onLoanCleared();
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Mark this loan as cleared? It will no longer appear in the monthly section for future months.')) {
        doClear();
      }
    } else {
      Alert.alert(
        'Mark Loan Cleared?',
        'This loan will no longer appear in the monthly section for future months.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Mark Cleared', style: 'destructive', onPress: doClear }
        ]
      );
    }
  };

  const fmt = (v) => (v ? `₹${Math.round(parseFloat(v) || 0).toLocaleString('en-IN')}` : '—');
  const recordText = !masterHasLoan ? 'No active loan' : masterLoanCleared ? 'Cleared' : `${masterLoanType || 'Loan'} · ${fmt(masterLoanExtended)} extended`;
  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        module="MILK PCS"
        total={4}
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Loan Status"
        step={4}
        onBack={onBack}
      />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.recordRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.recordLabel}>Loan on record</Text>
            <Text style={styles.recordValue}>{recordText}</Text>
          </View>
        </View>

        {!masterHasLoan ? (
          <Text style={styles.note}>To set up a loan, open Institutional Profile in Master Data and enable "Active Loan".</Text>
        ) : !masterLoanCleared ? (
          <>
            <WizardField label="Recovered to date" prefix="₹" value={loanRecovered} onChangeText={(t) => setLoanRecovered(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" helper="Total recovered since the loan was extended." />
            <CalcCard
              rows={[
                { label: 'Outstanding balance', value: masterLoanExtended ? fmt(loanOutstanding) : null, placeholder: 'Needs the loan amount' },
                { label: 'Amount extended', sub: 'From Master data', value: masterLoanExtended ? fmt(masterLoanExtended) : '—' },
              ]}
            />
            <Pressable style={styles.recordRow} onPress={confirmMarkCleared}>
              <MaterialCommunityIcons name="check-circle-outline" size={20} color="#047857" />
              <Text style={[styles.recordValue, { flex: 1, marginTop: 0, marginLeft: 10 }]}>Loan fully cleared</Text>
              <Text style={styles.recordLabel}>Closes the ledger</Text>
            </Pressable>
          </>
        ) : null}

        <WizardFooter onBack={onBack} onSaveNext={handleSaveAndNext} />
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },
  recordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', padding: 16 },
  recordLabel: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#78716C' },
  recordValue: { fontFamily: F, fontSize: 16, fontWeight: '700', color: '#1E1B18', marginTop: 2 },
  note: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#57534E', lineHeight: 18 },
});
