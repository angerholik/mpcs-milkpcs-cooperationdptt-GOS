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

function deriveFinancialYear(dateStr) {
  if (!dateStr) return '';
  let year, month;
  if (dateStr.includes('-') && dateStr.length === 10) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      year = parseInt(parts[2], 10);
      month = parseInt(monthMap[parts[1]] || '01', 10);
    } else {
      return '';
    }
  }

  if (isNaN(year) || isNaN(month)) return '';

  if (month >= 4) {
    return `${year} - ${year + 1}`;
  } else {
    return `${year - 1} - ${year}`;
  }
}

// Master Data: Audit + AGM, split out of InstitutionalProfileScreen into its
// own wizard step to match the MPCS master data chain (see
// MpcsComplianceAuditScreen) instead of stacking every section onto one
// long profile screen.
export default function ComplianceAuditScreen({
  lastVerified = "Not verified",
  initialAuditYear = "",
  initialAuditDate = "",
  initialAuditStatus = "Pending",
  initialAgmYear = "",
  initialAgmDate = "",
  initialAgmStatus = "Pending",
  onSaveCompliance,
  onNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [auditDate, setAuditDate] = useState(initialAuditDate);
  const [auditYear, setAuditYear] = useState(initialAuditYear || deriveFinancialYear(initialAuditDate));
  const [auditStatus, setAuditStatus] = useState(initialAuditStatus || 'Pending');

  const [agmDate, setAgmDate] = useState(initialAgmDate);
  const [agmYear, setAgmYear] = useState(initialAgmYear || deriveFinancialYear(initialAgmDate));
  const [agmStatus, setAgmStatus] = useState(initialAgmStatus || 'Pending');

  React.useEffect(() => {
    if (initialAuditDate) setAuditDate(initialAuditDate);
    if (initialAuditYear) setAuditYear(initialAuditYear);
    if (initialAuditStatus) setAuditStatus(initialAuditStatus);
    if (initialAgmDate) setAgmDate(initialAgmDate);
    if (initialAgmYear) setAgmYear(initialAgmYear);
    if (initialAgmStatus) setAgmStatus(initialAgmStatus);
  }, [initialAuditYear, initialAuditDate, initialAuditStatus, initialAgmYear, initialAgmDate, initialAgmStatus]);

  const handleAuditDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setAuditDate(displayDate);
    setAuditYear(deriveFinancialYear(isoValue));
  };

  const handleAgmDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setAgmDate(displayDate);
    setAgmYear(deriveFinancialYear(isoValue));
  };

  const persistCompliance = () => {
    if (onSaveCompliance) {
      onSaveCompliance({ auditYear, auditDate, auditStatus, agmYear, agmDate, agmStatus });
    }
  };

  // Persists edits shortly after they change, so a value entered here
  // survives even if the tab reloads before "Save" is tapped.
  useAutosave(persistCompliance, [auditYear, auditDate, auditStatus, agmYear, agmDate, agmStatus]);

  const handleSave = () => {
    persistCompliance();
    setModalVisible(false);
  };

  const statusColor = (st) => (st === 'Completed' ? '#047857' : '#B45309');
  return (
    <View style={masterStyles.container}>
      <ScreenHeader title="Compliance & Audit" subtitle="MILK PCS" onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />
      <ScrollView style={masterStyles.scrollContent} contentContainerStyle={[masterStyles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {modalVisible ? (
          <>
            <DateField label="Audit date" valueIso={formatToIsoDate(auditDate)} onChangeIso={handleAuditDateSelect} TextInput={TextInput} />
            <ChipSelect label="Audit status" options={['Pending', 'Completed']} value={auditStatus} onChange={setAuditStatus} />
            <DateField label="AGM date" valueIso={formatToIsoDate(agmDate)} onChangeIso={handleAgmDateSelect} TextInput={TextInput} />
            <ChipSelect label="AGM status" options={['Pending', 'Completed']} value={agmStatus} onChange={setAgmStatus} />
            <EditFooter onCancel={() => setModalVisible(false)} onSave={handleSave} />
          </>
        ) : (
          <>
            <ReadCard title="Latest audit" icon="gavel" rows={[
              { label: 'Audit year', value: auditYear },
              { label: 'Audit date', value: auditDate },
              { label: 'Audit status', value: auditStatus || 'Pending', color: statusColor(auditStatus) },
            ]} />
            <ReadCard title="Latest AGM" icon="account-group-outline" rows={[
              { label: 'AGM year', value: agmYear },
              { label: 'AGM date', value: agmDate },
              { label: 'AGM status', value: agmStatus || 'Pending', color: statusColor(agmStatus) },
            ]} />
            <ViewFooter onUpdate={() => setModalVisible(true)} onBack={onBack} onNext={onNext ? () => { handleSave(); onNext(); } : undefined} />
          </>
        )}
      </ScrollView>
      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}
