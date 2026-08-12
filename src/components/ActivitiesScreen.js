import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C1C1C',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

export default function ActivitiesScreen({
  activityList = [],
  onAddActivity,
  onDeleteActivity,
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [actDate, setActDate] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');

  const displayList = activityList;

  const handleSaveNew = () => {
    if (actTitle.trim()) {
      onAddActivity({
        id: Date.now().toString(),
        date: actDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        title: actTitle.trim(),
        desc: actDesc.trim()
      });
      setActDate('');
      setActTitle('');
      setActDesc('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Activities</Text>
        <Text style={styles.stepIndicator}>3 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.sectionHeading}>Activities / Events</Text>
        <Text style={styles.sectionDesc}>
          Add activities, meetings, trainings or other notable events.
        </Text>

        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addBtnText}>ADD ACTIVITY</Text>
        </TouchableOpacity>

        {displayList.length === 0 ? (
          <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginVertical: 10 }}>
            <MaterialIcons name="event-note" size={36} color="#94A3B8" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 }}>No Activities Added Yet</Text>
            <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' }}>Tap "+ ADD ACTIVITY" above to record a meeting, training, or event.</Text>
          </View>
        ) : (
          displayList.map((item) => (
            <View key={item.id} style={styles.activityCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.dateBadge}>
                  <MaterialIcons name="calendar-today" size={14} color={COLORS.primary} />
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => onDeleteActivity && onDeleteActivity(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.activityTitle}>{item.title}</Text>
              {item.desc ? <Text style={styles.activityDesc}>{item.desc}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Activity / Event</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 15 Aug 2026"
              value={actDate}
              onChangeText={setActDate}
            />

            <Text style={styles.fieldLabel}>Activity Title</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Managing Committee Meeting"
              value={actTitle}
              onChangeText={setActTitle}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Brief details about the activity..."
              value={actDesc}
              onChangeText={setActDesc}
              multiline
            />

            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveNew}>
              <Text style={styles.saveModalBtnText}>SAVE ACTIVITY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Nav Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.navBackText}>BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navNextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.navNextText}>NEXT</Text>
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
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
  },
  backBtn: { padding: 4 },
  screenTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  stepIndicator: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 6,
  },
  addBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  activityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  activityTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  activityDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  navBackBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  navBackText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '800' },
  navNextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  navNextText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4, marginTop: 8 },
  fieldInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  saveModalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveModalBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
