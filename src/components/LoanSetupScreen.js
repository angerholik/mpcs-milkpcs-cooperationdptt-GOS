import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Image } from 'react-native';
import ScreenHeader from './ScreenHeader';
import { ReadCard, ChipSelect, DateField, ViewFooter, EditFooter, masterStyles } from './MasterRecord';
import { WizardField } from './WizardField';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAutosave } from '../hooks/useAutosave';
import BottomNav from './BottomNav';
import { webCapWidth } from '../utils/webStyles';

// Same subtle Kanchenjunga treatment used on every header across the app.
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
  amber900: '#78350f',
  amber100: '#fef3c7',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
};

const FONT_FAMILY = 'Manrope';

const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatToIsoDate(displayStr) {
  if (!displayStr) return '';
  if (displayStr.includes('-') && displayStr.length === 10) return displayStr;
  const parts = displayStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

function formatFromIsoDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = monthNames[monthIdx] || 'Jan';
    return `${day} ${monthName} ${year}`;
  }
  return isoStr;
}

// Master Data: the one-time (or once-per-loan) loan setup — whether this
// society currently has a loan on record, and its type/sanction date/amount.
// The MONTHLY repayment tracking (amount recovered, outstanding balance) is
// a separate screen (ComplianceScreen) that reads masterHasLoan/
// masterLoanExtended/masterLoanCleared from here rather than duplicating them.
// Split out of InstitutionalProfileScreen into its own wizard step to match
// the MPCS master data chain (see MpcsLoanSetupScreen).
export default function LoanSetupScreen({
  lastVerified = "Not verified",
  initialHasLoan = false,
  initialLoanType = "",
  initialSanctionDate = "",
  initialBeneficiaries = "",
  initialLoanExtended = "",
  initialLoanCleared = false,
  onSaveLoan,
  onNext,
  onBack,
  onManageBeneficiaries,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [hasLoan, setHasLoan] = useState(initialHasLoan);
  const [loanType, setLoanType] = useState(initialLoanType);
  const [sanctionDate, setSanctionDate] = useState(initialSanctionDate);
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);
  const [loanExtended, setLoanExtended] = useState(initialLoanExtended);
  const [loanCleared, setLoanCleared] = useState(initialLoanCleared);

  React.useEffect(() => {
    setHasLoan(initialHasLoan);
    if (initialLoanType) setLoanType(initialLoanType);
    if (initialSanctionDate) setSanctionDate(initialSanctionDate);
    if (initialBeneficiaries) setBeneficiaries(initialBeneficiaries);
    if (initialLoanExtended) setLoanExtended(initialLoanExtended);
    setLoanCleared(initialLoanCleared);
  }, [initialHasLoan, initialLoanType, initialSanctionDate, initialBeneficiaries, initialLoanExtended, initialLoanCleared]);

  const persistLoan = (overrides = {}) => {
    const data = { hasLoan, loanType, sanctionDate, beneficiaries, loanExtended, loanCleared, ...overrides };
    if (onSaveLoan) onSaveLoan(data);
  };

  // Persists edits shortly after they change, so a value entered here
  // survives even if the tab reloads before "Save" is tapped.
  useAutosave(() => persistLoan(), [hasLoan, loanType, sanctionDate, beneficiaries, loanExtended, loanCleared]);

  const handleSave = (overrides = {}) => {
    persistLoan(overrides);
    setModalVisible(false);
  };

  return (
    <View style={masterStyles.container}>
      <ScreenHeader title="Loan Details" subtitle="MILK PCS" onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />
      <ScrollView style={masterStyles.scrollContent} contentContainerStyle={[masterStyles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {modalVisible ? (
          <>
            <ChipSelect label="Loan on record" options={['Active loan', 'No active loan']} value={hasLoan ? 'Active loan' : 'No active loan'} onChange={(v) => setHasLoan(v === 'Active loan')} />
            {hasLoan ? (
              <>
                <WizardField label="Loan type" value={loanType} onChangeText={setLoanType} placeholder="e.g. Cash Credit Limit" />
                <DateField label="Sanction date" valueIso={formatToIsoDate(sanctionDate)} onChangeIso={(v) => setSanctionDate(formatFromIsoDate(v))} TextInput={TextInput} />
                <WizardField label="No. of beneficiaries" value={beneficiaries} onChangeText={setBeneficiaries} keyboardType="numeric" />
                <WizardField label="Amount extended" prefix="₹" value={loanExtended} onChangeText={setLoanExtended} keyboardType="numeric" />
              </>
            ) : null}
            <EditFooter onCancel={() => setModalVisible(false)} onSave={() => handleSave()} />
          </>
        ) : (
          <>
            <ReadCard
              title="Loan record"
              icon="bank-outline"
              rows={hasLoan ? [
                { label: 'Status', value: loanCleared ? 'Cleared' : 'Active', color: loanCleared ? '#78716C' : '#047857' },
                { label: 'Loan type', value: loanType },
                { label: 'Sanction date', value: sanctionDate },
                { label: 'Beneficiaries', value: beneficiaries },
                { label: 'Amount extended', value: loanExtended ? `₹${loanExtended}` : '' },
              ] : [{ label: 'Status', value: 'No active loan' }]}
            />
            {hasLoan && onManageBeneficiaries ? (
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', padding: 16 }} onPress={() => { handleSave(); onManageBeneficiaries(); }}>
                <MaterialCommunityIcons name="account-cash-outline" size={20} color="#7B1420" />
                <Text style={{ flex: 1, fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>Manage beneficiaries</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#A8A29E" />
              </Pressable>
            ) : null}
            <ViewFooter onUpdate={() => setModalVisible(true)} onBack={onBack} onNext={onNext ? () => { handleSave(); onNext(); } : undefined} />
          </>
        )}
      </ScrollView>
      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}
