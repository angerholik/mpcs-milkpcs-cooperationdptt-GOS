import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Pressable
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  surface: '#ffffff',
  bg: '#F8F5F2',
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

  const handleDeleteActivity = (id) => {
    if (setActivityItems) {
      setActivityItems(activityItems.filter(item => item.id !== id));
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Header ── */}
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Activities &amp; Events Log</Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepIndicator}>5 of 5</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Month Indicator Card */}
        <View style={styles.monthCard}>
          <LinearGradient
            colors={['rgba(122,26,31,0.06)', 'rgba(122,26,31,0.02)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.monthIconBox}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.monthLabel}>Reporting Period</Text>
            <Text style={styles.monthValue}>{reportingMonth || 'Current Month'}</Text>
          </View>
          <View style={styles.draftChip}>
            <Text style={styles.draftChipText}>DRAFT</Text>
          </View>
        </View>

        {/* Category Chips */}
        <View style={styles.chipsContainer}>
          <Text style={styles.inputLabel}>Select Event Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveCategory(cat)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={CATEGORY_ICONS[cat] || 'calendar'}
                    size={14}
                    color={isActive ? COLORS.primary : COLORS.slate400}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Form Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="calendar-edit" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Add {activeCategory} Record</Text>
              <Text style={styles.cardHeaderSub}>Log meetings, awareness programs &amp; events</Text>
            </View>
          </View>

          <View style={styles.inputRowHalf}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Total {activeCategory}</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="counter" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={meetingsCount}
                  onChangeText={setMeetingsCount}
                  placeholder="e.g. 2"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Total Participants</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="account-group-outline" size={15} color={COLORS.slate400} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={participantsCount}
                  onChangeText={setParticipantsCount}
                  placeholder="e.g. 84"
                  placeholderTextColor={COLORS.slate300}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brief Summary / Resolutions</Text>
            <View style={[styles.inputBox, { height: 74, alignItems: 'flex-start', paddingTop: 10 }]}>
              <MaterialCommunityIcons name="notebook-outline" size={15} color={COLORS.slate400} style={{ marginRight: 6, marginTop: 2 }} />
              <TextInput
                style={[styles.textInput, { height: '100%' }]}
                value={summary}
                onChangeText={setSummary}
                placeholder="Enter summary or decisions taken..."
                placeholderTextColor={COLORS.slate300}
                multiline
              />
            </View>
          </View>

          <View style={styles.btnWrapper}>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                !summary && styles.addBtnDisabled,
                pressed && summary && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleAddActivity}
              disabled={!summary}
            >
              {summary && (
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <MaterialCommunityIcons
                name="plus-circle"
                size={17}
                color={summary ? '#ffffff' : COLORS.slate400}
              />
              <Text style={[styles.addBtnText, !summary && { color: COLORS.slate400 }]}>
                ADD TO LOG
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Recorded Activities Section ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recorded Activities</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{activityItems.length}</Text>
          </View>
        </View>

        {activityItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={COLORS.slate300} />
            <Text style={styles.emptyTitle}>No activities recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Select a category above, fill details and tap "ADD TO LOG" to record activities.
            </Text>
          </View>
        ) : (
          activityItems.map((item, idx) => (
            <View key={item.id} style={styles.actCard}>
              <View style={styles.actCardHeader}>
                <View style={styles.actTypeChip}>
                  <MaterialCommunityIcons
                    name={CATEGORY_ICONS[item.type] || 'calendar'}
                    size={13}
                    color={COLORS.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.actTypeText}>{item.type}</Text>
                </View>
                <Text style={styles.actCountText}>
                  {item.count} sessions • {item.participants} participants
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteActivity(item.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <View style={styles.actBody}>
                <Text style={styles.actDesc}>{item.desc}</Text>
              </View>

              <View style={styles.actSeqBar}>
                <Text style={styles.actSeqText}>Entry #{activityItems.length - idx}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Bottom Navigation Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.buttonTextSecondary}>BACK</Text>
        </TouchableOpacity>
        <Pressable
          style={({ pressed }) => [styles.navNextBtn, pressed && { transform: [{ scale: 0.98 }] }]}
          onPress={onSaveNext}
        >
          <LinearGradient
            colors={['#7a1a1f', '#4a1017']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.buttonTextPrimary}>REVIEW &amp; SUBMIT</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    overflow: 'hidden',
  },
  backBtn: { padding: 4, zIndex: 1 },
  topBarTitleContainer: { flex: 1, marginLeft: 12 },
  moduleTag: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  screenTitleHeader: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepIndicator: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
  },

  // Scroll
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 24, gap: 14 },

  // Month Card
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 14,
    overflow: 'hidden',
  },
  monthIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  draftChip: {
    backgroundColor: COLORS.amber50,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  draftChipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.amber900,
    letterSpacing: 0.5,
  },

  // Chips
  chipsContainer: { gap: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    marginBottom: 4,
  },
  chipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },

  // Inputs
  inputRowHalf: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1, gap: 5 },
  inputGroup: { gap: 5 },
  inputLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate500,
    letterSpacing: 0.2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.slate50,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
  },
  inputIcon: { marginRight: 6 },
  textInput: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  // Add Button
  btnWrapper: { borderRadius: 12, overflow: 'hidden' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.slate200,
  },
  addBtnDisabled: { backgroundColor: COLORS.slate100 },
  addBtnText: {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate500,
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // Activity Card
  actCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    overflow: 'hidden',
  },
  actCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  actTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actTypeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actCountText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.slate500,
    fontWeight: '600',
    textAlign: 'right',
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  actDesc: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.slate700,
    lineHeight: 19,
  },
  actSeqBar: {
    backgroundColor: COLORS.slate50,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  actSeqText: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.slate400,
    letterSpacing: 0.3,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    gap: 10,
  },
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.slate200,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    color: COLORS.slate500,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
