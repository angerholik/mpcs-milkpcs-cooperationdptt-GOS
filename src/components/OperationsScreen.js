import React, { useState, useEffect, useRef } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Pressable, Image } from 'react-native';
import MpcsWizardHeader from './mpcs/MpcsWizardHeader';
import WizardFooter from './WizardFooter';
import { WizardField } from './WizardField';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from './BottomNav';
import { webCapWidth } from '../utils/webStyles';
import { useAutosave } from '../hooks/useAutosave';

// Same subtle Kanchenjunga treatment used on every header across the app.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

const COLORS = {
  surface: '#ffffff',
  bg: '#F4F5F7',
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
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
};

const FONT_FAMILY = 'Manrope';

export default function OperationsScreen({
  societyName = "",
  reportingMonth = "",
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
  const [litres, setLitres] = useState("");
  const [withdrawal, setWithdrawal] = useState("");
  const [balance, setBalance] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  // Last persisted values; null until the saved copy has loaded, so opening the
  // screen never counts as an edit.
  const loadedSigRef = useRef(null);

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'operations');
      if (data) {
        setLitres(data.litres || "");
        setWithdrawal(data.withdrawal || "");
        setBalance(data.balance || "");
      }
      loadedSigRef.current = JSON.stringify([data?.litres || '', data?.withdrawal || '', data?.balance || '']);
    })();
  }, [societyName, reportingMonth]);

  // Every edit is persisted (and synced to the cloud) shortly after it is made,
  // not only when Save is tapped.
  useAutosave(async () => {
    const sig = JSON.stringify([litres, withdrawal, balance]);
    if (loadedSigRef.current === null || sig === loadedSigRef.current) return;
    loadedSigRef.current = sig;
    await saveMilkSectionData(societyName, reportingMonth, 'operations', { litres, withdrawal, balance });
    if (onSave) onSave();
  }, [litres, withdrawal, balance]);

  const handleSave = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'operations', { litres, withdrawal, balance });
    loadedSigRef.current = JSON.stringify([litres, withdrawal, balance]);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onSave) onSave();
  };

  const handleSaveAndNext = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'operations', { litres, withdrawal, balance });
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const parseNum = (val) => {
    if (!val) return 0;
    const clean = val.toString().replace(/,/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Reformatting the value with comma grouping on every keystroke (the old
  // formatCurrency-on-change approach) resets the text input's cursor position
  // to the start after each render on web, which corrupts continued typing —
  // this is what caused values to appear truncated/scrambled. Keep the raw
  // digits in state while typing; comma formatting is only for display
  // elsewhere (PDF, admin dashboard), not for this input's own value.
  const sanitizeNumeric = (text) => {
    let cleaned = (text || '').replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    return cleaned;
  };

  const handleWithdrawalChange = (text) => {
    setWithdrawal(sanitizeNumeric(text));
  };

  const handleBalanceChange = (text) => {
    setBalance(sanitizeNumeric(text));
  };

  const handleLitresChange = (text) => {
    setLitres(sanitizeNumeric(text));
  };
  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        module="MILK PCS"
        total={4}
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Collection & Deposit"
        step={2}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WizardField label="Total litres collected" suffix="L" value={litres} onChangeText={handleLitresChange} keyboardType="numeric" />
        <WizardField label="Total withdrawal" prefix="₹" value={withdrawal} onChangeText={handleWithdrawalChange} keyboardType="numeric" helper="Whole rupees. For example 1,25,000." />
        <WizardField label="Closing balance" prefix="₹" value={balance} onChangeText={handleBalanceChange} keyboardType="numeric" />

        <WizardFooter onBack={onBack} onSaveNext={handleSaveAndNext} onDraft={async () => { await handleSave(); onBack && onBack(); }} />
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },
});
