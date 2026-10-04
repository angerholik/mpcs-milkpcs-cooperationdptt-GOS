import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Image } from 'react-native';
import ScreenHeader from './ScreenHeader';
import { ReadCard, ChipSelect, DateField, ViewFooter, EditFooter, masterStyles } from './MasterRecord';
import { WizardField } from './WizardField';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../utils/webStyles';
import BottomNav from './BottomNav';

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

export default function DemographicsScreen({
  mSc = '', setMSc, fSc = '', setFSc,
  mSt = '', setMSt, fSt = '', setFSt,
  mObc = '', setMObc, fObc = '', setFObc,
  mGen = '', setMGen, fGen = '', setFGen,
  lastUpdated = "Not verified",
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
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Modal Temp State
  const [tMSc, setTMSc] = useState(mSc);
  const [tFSc, setTFSc] = useState(fSc);
  const [tMSt, setTMSt] = useState(mSt);
  const [tFSt, setTFSt] = useState(fSt);
  const [tMObc, setTMObc] = useState(mObc);
  const [tFObc, setTFObc] = useState(fObc);
  const [tMGen, setTMGen] = useState(mGen);
  const [tFGen, setTFGen] = useState(fGen);

  useEffect(() => {
    setTMSc(mSc || ''); setTFSc(fSc || '');
    setTMSt(mSt || ''); setTFSt(fSt || '');
    setTMObc(mObc || ''); setTFObc(fObc || '');
    setTMGen(mGen || ''); setTFGen(fGen || '');
  }, [mSc, fSc, mSt, fSt, mObc, fObc, mGen, fGen]);

  const calcTotal = (m, f) => (parseInt(m) || 0) + (parseInt(f) || 0);

  const scTotal = calcTotal(mSc, fSc);
  const stTotal = calcTotal(mSt, fSt);
  const obcTotal = calcTotal(mObc, fObc);
  const genTotal = calcTotal(mGen, fGen);

  const maleSum = (parseInt(mSc)||0) + (parseInt(mSt)||0) + (parseInt(mObc)||0) + (parseInt(mGen)||0);
  const femaleSum = (parseInt(fSc)||0) + (parseInt(fSt)||0) + (parseInt(fObc)||0) + (parseInt(fGen)||0);
  const grandTotal = maleSum + femaleSum;

  const handleSave = () => {
    if (setMSc) setMSc(tMSc);
    if (setFSc) setFSc(tFSc);
    if (setMSt) setMSt(tMSt);
    if (setFSt) setFSt(tFSt);
    if (setMObc) setMObc(tMObc);
    if (setFObc) setFObc(tFObc);
    if (setMGen) setMGen(tMGen);
    if (setFGen) setFGen(tFGen);
    setModalVisible(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onSave) {
      onSave({
        mSc: tMSc, fSc: tFSc,
        mSt: tMSt, fSt: tFSt,
        mObc: tMObc, fObc: tFObc,
        mGen: tMGen, fGen: tFGen
      });
    }
  };

  const handleSaveAndNext = () => {
    handleSave();
    // Brief pause so the "saved to database" acknowledgment is actually
    // visible before this screen navigates away — Demographics is the last
    // Master Data section, so this always returns to Home immediately.
    setTimeout(() => {
      if (onSaveNext) {
        onSaveNext();
      } else if (onNext) {
        onNext();
      }
    }, 1100);
  };

  const demographicsData = [
    { category: 'SC', male: mSc, female: fSc, total: scTotal },
    { category: 'ST', male: mSt, female: fSt, total: stTotal },
    { category: 'OBC', male: mObc, female: fObc, total: obcTotal },
    { category: 'General', male: mGen, female: fGen, total: genTotal },
  ];

  const num = (setter) => (v) => setter(v.replace(/[^0-9]/g, ''));
  const temps = [
    ['SC', tMSc, setTMSc, tFSc, setTFSc],
    ['ST', tMSt, setTMSt, tFSt, setTFSt],
    ['OBC', tMObc, setTMObc, tFObc, setTFObc],
    ['General', tMGen, setTMGen, tFGen, setTFGen],
  ];
  return (
    <View style={masterStyles.container}>
      <ScreenHeader title="Registered Demographics" subtitle="MILK PCS" onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />
      <ScrollView style={masterStyles.scrollContent} contentContainerStyle={[masterStyles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isSaved ? (
          <View style={masterStyles.toast}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#15803D" />
            <Text style={masterStyles.toastText}>Demographics saved</Text>
          </View>
        ) : null}
        {modalVisible ? (
          <>
            {temps.map(([cat, m, setM, f, setF]) => (
              <View key={cat} style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>{cat}</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><WizardField label="Male" value={m} onChangeText={num(setM)} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><WizardField label="Female" value={f} onChangeText={num(setF)} keyboardType="numeric" /></View>
                </View>
              </View>
            ))}
            <EditFooter onCancel={() => setModalVisible(false)} onSave={handleSave} />
          </>
        ) : (
          <>
            <View style={{ backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row' }}>
                {['CATEGORY', 'MALE', 'FEMALE', 'TOTAL'].map((h, i) => (
                  <Text key={h} style={{ flex: i === 0 ? 1.4 : 1, textAlign: i === 0 ? 'left' : 'center', fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', color: '#78716C', letterSpacing: 0.6 }}>{h}</Text>
                ))}
              </View>
              {demographicsData.map((row) => (
                <View key={row.category} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }}>
                  <Text style={{ flex: 1.4, fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>{row.category}</Text>
                  <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '600', color: '#1E1B18' }}>{row.male !== '' ? row.male : '—'}</Text>
                  <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '600', color: '#1E1B18' }}>{row.female !== '' ? row.female : '—'}</Text>
                  <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>{row.total || '—'}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', borderTopWidth: 1.5, borderTopColor: '#E7E2DA', paddingTop: 10 }}>
                <Text style={{ flex: 1.4, fontFamily: 'Manrope', fontSize: 13, fontWeight: '800', color: '#57534E' }}>TOTAL</Text>
                <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>{maleSum || '—'}</Text>
                <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#1E1B18' }}>{femaleSum || '—'}</Text>
                <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Manrope', fontSize: 15, fontWeight: '800', color: '#7B1420' }}>{grandTotal || '—'}</Text>
              </View>
            </View>
            <ViewFooter onUpdate={() => setModalVisible(true)} onBack={onBack} onNext={handleSaveAndNext} nextLabel="Submit" />
          </>
        )}
      </ScrollView>
      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}
    </View>
  );
}
