import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B1212',
  primaryLight: '#FEF2F2',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function MpcsActivitiesLogScreen({
  reportingMonth = "",
  activityItems = [],
  setActivityItems,
  onSaveNext,
  onBack
}) {
  const [activeCategory, setActiveCategory] = useState('Meetings');
  const [meetingsCount, setMeetingsCount] = useState('2');
  const [participantsCount, setParticipantsCount] = useState('84');
  const [summary, setSummary] = useState('Monthly committee meeting conducted and decisions passed.');

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
    if (setActivityItems) {
      setActivityItems([newItem, ...activityItems]);
    }
    setSummary('');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Activities / Events Log</Text>
        </View>
        <Text style={styles.stepIndicator}>5 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Month & Year</Text>
            <Text style={styles.monthTitleText}>{reportingMonth}</Text>
          </View>
          <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
        </View>

        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tabChip, isActive && styles.activeTabChip]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabChipText, isActive && styles.activeTabChipText]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Activity Entry Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="edit-calendar" size={18} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Add {activeCategory} Record</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Total {activeCategory}</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={meetingsCount}
                  onChangeText={setMeetingsCount}
                  placeholder="e.g. 2"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Total Participants</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={participantsCount}
                  onChangeText={setParticipantsCount}
                  placeholder="e.g. 84"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brief Summary</Text>
            <TextInput
              style={styles.summaryInput}
              value={summary}
              onChangeText={setSummary}
              placeholder="Enter activity description..."
              placeholderTextColor="#94A3B8"
              multiline
            />
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAddActivity} activeOpacity={0.8}>
            <MaterialIcons name="add-circle" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>ADD TO LOG</Text>
          </TouchableOpacity>
        </View>

        {/* Activity List Section */}
        <Text style={styles.sectionTitle}>Recorded Activities ({activityItems.length})</Text>

        {activityItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="event-note" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>No activities logged for {reportingMonth} yet.</Text>
          </View>
        ) : (
          activityItems.map((item) => (
            <View key={item.id} style={styles.activityRowCard}>
              <View style={styles.activityHeaderRow}>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>{item.type}</Text>
                </View>
                <Text style={styles.metaBadge}>{item.participants} Participants</Text>
              </View>
              <Text style={styles.activityDesc}>{item.desc}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Bar Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onSaveNext} activeOpacity={0.85}>
          <Text style={styles.buttonTextPrimary}>SAVE & FINISH</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backBtn: { padding: 4 },
  moduleTag: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  stepIndicator: { color: 'rgba(255,255,255,0.85)', fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14 },
  monthCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  fieldLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  monthTitleText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  tabsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tabChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E2E8F0', alignItems: 'center' },
  activeTabChip: { backgroundColor: COLORS.primary },
  tabChipText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  activeTabChipText: { color: '#FFFFFF' },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputItem: { flex: 1, gap: 4 },
  inputGroup: { gap: 4 },
  inputLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    justifyContent: 'center',
  },
  textInput: { fontFamily: FONT_FAMILY, fontSize: 13, color: COLORS.textPrimary, outlineStyle: 'none' },
  summaryInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    height: 54,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.textPrimary,
    outlineStyle: 'none',
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  addBtnText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  emptyCard: { backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  emptyText: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  activityRowCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    gap: 6,
  },
  activityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  activityBadgeText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '700', color: COLORS.primary },
  metaBadge: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  activityDesc: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.textPrimary, lineHeight: 16 },
  bottomBar: { flexDirection: 'row', padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: COLORS.border, gap: 10 },
  navBackBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  buttonTextSecondary: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
  navNextBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center' },
  buttonTextPrimary: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
});
