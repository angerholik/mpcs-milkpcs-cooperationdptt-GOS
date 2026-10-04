import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Platform, Pressable } from 'react-native';
import ScreenHeader from './ScreenHeader';
import { ReadCard, ViewFooter, EditFooter, masterStyles } from './MasterRecord';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../utils/webStyles';
import BottomNav from './BottomNav';
import { WizardField } from './WizardField';

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

// Master Data: Society Identification + Key Personnel Contacts only. Audit,
// AGM, and Loan Setup were split into their own wizard steps (see
// ComplianceAuditScreen and LoanSetupScreen) to match the MPCS master data
// chain instead of stacking every section onto one long profile screen.
export default function InstitutionalProfileScreen({
  centerName = "",
  setCenterName,
  centerId = "",
  setCenterId,
  regNo = "",
  setRegNo,
  presidentName = "",
  setPresidentName,
  presidentMobile = "",
  setPresidentMobile,
  managerName = "",
  setManagerName,
  managerMobile = "",
  setManagerMobile,
  lastUpdated = "Not verified",
  onSave,
  onSaveNext,
  onNext,
  onBack,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State inside Modal
  const [editCenter, setEditCenter] = useState(centerName);
  const [editRegNo, setEditRegNo] = useState(regNo);
  const [editPresName, setEditPresName] = useState(presidentName);
  const [editPresMob, setEditPresMob] = useState(presidentMobile);
  const [editMgrName, setEditMgrName] = useState(managerName);
  const [editMgrMob, setEditMgrMob] = useState(managerMobile);

  useEffect(() => {
    setEditCenter(centerName || '');
    setEditRegNo(regNo || '');
    setEditPresName(presidentName || '');
    setEditPresMob(presidentMobile || '');
    setEditMgrName(managerName || '');
    setEditMgrMob(managerMobile || '');
  }, [centerName, regNo, presidentName, presidentMobile, managerName, managerMobile]);

  const persistProfile = () => {
    if (setCenterName) setCenterName(editCenter);
    if (setRegNo) setRegNo(editRegNo);
    if (setPresidentName) setPresidentName(editPresName);
    if (setPresidentMobile) setPresidentMobile(editPresMob);
    if (setManagerName) setManagerName(editMgrName);
    if (setManagerMobile) setManagerMobile(editMgrMob);

    if (onSave) {
      onSave({
        centerName: editCenter,
        registrationNumber: editRegNo,
        presidentName: editPresName,
        presidentMobile: editPresMob,
        managerName: editMgrName,
        managerMobile: editMgrMob,
      });
    }
  };

  const handleSaveProfile = () => {
    persistProfile();
    setModalVisible(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveAndNext = () => {
    handleSaveProfile();
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const field = (label, value, setter, extra = {}) => (
    <WizardField label={label} value={value} onChangeText={setter} placeholder="" {...extra} />
  );
  return (
    <View style={masterStyles.container}>
      <ScreenHeader title="Institutional Profile" subtitle="MILK PCS" onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />
      <ScrollView style={masterStyles.scrollContent} contentContainerStyle={[masterStyles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isSaved ? (
          <View style={masterStyles.toast}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#15803D" />
            <Text style={masterStyles.toastText}>Profile saved</Text>
          </View>
        ) : null}
        {modalVisible ? (
          <>
            {field('Milk center name', editCenter, setEditCenter)}
            {field('Registration number', editRegNo, setEditRegNo)}
            {field('President name', editPresName, setEditPresName)}
            {field('President mobile', editPresMob, setEditPresMob, { keyboardType: 'phone-pad' })}
            {field('Manager name', editMgrName, setEditMgrName)}
            {field('Manager mobile', editMgrMob, setEditMgrMob, { keyboardType: 'phone-pad' })}
            <EditFooter onCancel={() => setModalVisible(false)} onSave={handleSaveProfile} />
          </>
        ) : (
          <>
            <ReadCard title="Society identification" icon="office-building-outline" rows={[
              { label: 'Milk center name', value: centerName },
              { label: 'Registration number', value: regNo },
            ]} />
            <ReadCard title="Key personnel" icon="account-group-outline" rows={[
              { label: 'President', value: [presidentName, presidentMobile].filter(Boolean).join(' · ') },
              { label: 'Manager', value: [managerName, managerMobile].filter(Boolean).join(' · ') },
            ]} />
            <ViewFooter onUpdate={() => setModalVisible(true)} onBack={onBack} onNext={(onNext || onSaveNext) ? handleSaveAndNext : undefined} />
          </>
        )}
      </ScrollView>
      {onTabPress && <BottomNav activeTab={activeTab || 'profile'} onTabPress={onTabPress} />}
    </View>
  );
}
