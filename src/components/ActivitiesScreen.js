import React, { useState, useEffect, useRef } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Pressable, Image, Alert } from 'react-native';
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
  amber900: '#78350f',
  amber50: '#fffbeb',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

const CATEGORY_ICONS = {
  Meetings: 'account-group-outline',
  Trainings: 'school-outline',
  Events: 'party-popper',
  Others: 'dots-horizontal-circle-outline',
};

export default function ActivitiesScreen({
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
  const [activityList, setActivityList] = useState([]);
  const loadedSigRef = useRef(null); // null until the saved list has loaded
  const completedRef = useRef(false);
  const [activeCategory, setActiveCategory] = useState('Meetings');
  const [meetingsCount, setMeetingsCount] = useState('');
  const [participantsCount, setParticipantsCount] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'activities');
      if (data && data.activityList) {
        setActivityList(data.activityList);
      }
      completedRef.current = !!data?.isCompleted;
      loadedSigRef.current = JSON.stringify(data?.activityList || []);
    })();
  }, [societyName, reportingMonth]);

  // Adding or deleting an entry is saved (and synced to the cloud) right away,
  // not only when "Save and continue" is tapped.
  useAutosave(async () => {
    const sig = JSON.stringify(activityList);
    if (loadedSigRef.current === null || sig === loadedSigRef.current) return;
    loadedSigRef.current = sig;
    await saveMilkSectionData(societyName, reportingMonth, 'activities', { activityList, isCompleted: completedRef.current || activityList.length > 0 });
    if (onSave) onSave(activityList.length);
  }, [activityList]);

  const categories = ['Meetings', 'Trainings', 'Events', 'Others'];

  const handleAddActivity = () => {
    if (!summary) return;
    const newItem = {
      id: Date.now().toString(),
      type: activeCategory,
      title: `${activeCategory} Session`,
      count: meetingsCount || '1',
      participants: participantsCount || '0',
      desc: summary,
    };
    
    setActivityList([newItem, ...activityList]);
    setSummary('');
  };

  const handleDeleteActivity = (id) => {
    const doDelete = () => setActivityList((prev) => prev.filter(item => item.id !== id));
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this activity entry?')) doDelete();
    } else {
      Alert.alert('Remove Activity', 'Remove this activity entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSaveAndNext = async () => {
    await saveMilkSectionData(societyName, reportingMonth, 'activities', { activityList, isCompleted: true });
    loadedSigRef.current = JSON.stringify(activityList);
    if (onSaveNext) {
      onSaveNext(activityList.length);
    } else if (onNext) {
      onNext(activityList.length);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <MpcsWizardHeader
        module="MILK PCS"
        total={4}
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Activities & Events"
        step={3}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.group}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Pressable key={cat} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setActiveCategory(cat)}>
                  <MaterialCommunityIcons name={CATEGORY_ICONS[cat] || 'calendar'} size={14} color={isActive ? '#ffffff' : '#78716C'} />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <WizardField label={`Total ${activeCategory.toLowerCase()}`} value={meetingsCount} onChangeText={setMeetingsCount} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <WizardField label="Participants" value={participantsCount} onChangeText={setParticipantsCount} keyboardType="numeric" />
          </View>
        </View>

        <WizardField
          label="Summary / resolutions"
          value={summary}
          onChangeText={setSummary}
          placeholder="Enter summary or decisions taken"
          multiline
        />

        <Pressable style={[styles.addBtn, !summary && styles.addBtnDisabled]} onPress={handleAddActivity} disabled={!summary}>
          <MaterialCommunityIcons name="plus" size={18} color={summary ? '#ffffff' : '#A8A29E'} />
          <Text style={[styles.addBtnText, !summary && { color: '#A8A29E' }]}>Add to log</Text>
        </Pressable>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Recorded activities</Text>
          <Text style={styles.sectionCount}>{activityList.length}</Text>
        </View>

        {activityList.length === 0 ? (
          <Text style={styles.empty}>Nothing logged yet. Pick a category, fill the details and tap Add to log.</Text>
        ) : (
          <View style={styles.listCard}>
            {activityList.map((item, idx) => (
              <View key={item.id} style={[styles.listRow, idx === activityList.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.listIcon}>
                  <MaterialCommunityIcons name={CATEGORY_ICONS[item.type] || 'calendar'} size={18} color="#7B1420" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.type} · {item.count}</Text>
                  <Text style={styles.listSub}>{item.participants} participants</Text>
                  <Text style={styles.listDesc}>{item.desc}</Text>
                </View>
                <Pressable onPress={() => handleDeleteActivity(item.id)} hitSlop={8}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

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
  group: { gap: 8 },
  label: { fontFamily: F, fontSize: 15, fontWeight: '700', color: '#1E1B18' },
  row: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#E7E2DA', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#7B1420', borderColor: '#7B1420' },
  chipText: { fontFamily: F, fontSize: 13, fontWeight: '700', color: '#57534E' },
  chipTextActive: { color: '#ffffff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7B1420' },
  addBtnDisabled: { backgroundColor: '#EDE8E0' },
  addBtnText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#ffffff' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontFamily: F, fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionCount: { fontFamily: F, fontSize: 11, fontWeight: '500', color: '#64748B' },
  empty: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#57534E', lineHeight: 18 },
  listCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F6E3E5', alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontFamily: F, fontSize: 15, fontWeight: '800', color: '#1E1B18' },
  listSub: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#78716C', marginTop: 2 },
  listDesc: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#57534E', marginTop: 6, lineHeight: 18 },
});
