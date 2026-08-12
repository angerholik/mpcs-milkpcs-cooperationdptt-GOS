import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C1C1C',
  primaryLight: '#FEF2F2',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
};

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function DemographicsScreen({
  mSc = '', setMSc, fSc = '', setFSc,
  mSt = '', setMSt, fSt = '', setFSt,
  mObc = '', setMObc, fObc = '', setFObc,
  mGen = '', setMGen, fGen = '', setFGen,
  lastUpdated = "Not verified",
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);

  // Modal Temp State
  const [tMSc, setTMSc] = useState(mSc);
  const [tFSc, setTFSc] = useState(fSc);
  const [tMSt, setTMSt] = useState(mSt);
  const [tFSt, setTFSt] = useState(fSt);
  const [tMObc, setTMObc] = useState(mObc);
  const [tFObc, setTFObc] = useState(fObc);
  const [tMGen, setTMGen] = useState(mGen);
  const [tFGen, setTFGen] = useState(fGen);

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
  };

  const categories = [
    { label: 'SC Category', m: mSc, f: fSc, tot: scTotal },
    { label: 'ST Category', m: mSt, f: fSt, tot: stTotal },
    { label: 'OBC Category', m: mObc, f: fObc, tot: obcTotal },
    { label: 'General Category', m: mGen, f: fGen, tot: genTotal },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Society Demographics</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={styles.statusBanner}>
          <MaterialIcons name="info" size={18} color={COLORS.primary} />
          <Text style={styles.statusTitle}>Last updated: {lastUpdated}</Text>
        </View>

        {/* Demographics Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="groups" size={18} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Member Breakdown</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { flex: 1.2 }]}>Category</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Male</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Female</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Table Rows */}
          {categories.map((cat) => (
            <View style={styles.tableRow} key={cat.label}>
              <Text style={[styles.cellCategory, { flex: 1.2 }]}>{cat.label}</Text>
              <Text style={[styles.cellValue, { flex: 1, textAlign: 'center' }]}>{cat.m !== '' ? cat.m : '-'}</Text>
              <Text style={[styles.cellValue, { flex: 1, textAlign: 'center' }]}>{cat.f !== '' ? cat.f : '-'}</Text>
              <Text style={[styles.cellTotal, { flex: 1, textAlign: 'right' }]}>{cat.tot || '-'}</Text>
            </View>
          ))}

          {/* Grand Total */}
          <View style={styles.grandTotalRow}>
            <Text style={[styles.grandTotalLabel, { flex: 1.2 }]}>GRAND TOTAL</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'center' }]}>{maleSum || '-'}</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'center' }]}>{femaleSum || '-'}</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'right', color: COLORS.primary }]}>{grandTotal || '-'}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.editCtaBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.editCtaText}>VIEW / EDIT DEMOGRAPHICS</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Demographics</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* SC */}
              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalCategoryTitle}>SC Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMSc} onChangeText={setTMSc} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFSc} onChangeText={setTFSc} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
              </View>

              {/* ST */}
              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalCategoryTitle}>ST Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMSt} onChangeText={setTMSt} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFSt} onChangeText={setTFSt} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
              </View>

              {/* OBC */}
              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalCategoryTitle}>OBC Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMObc} onChangeText={setTMObc} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFObc} onChangeText={setTFObc} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
              </View>

              {/* General */}
              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalCategoryTitle}>General Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMGen} onChangeText={setTMGen} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFGen} onChangeText={setTFGen} placeholder="0" placeholderTextColor="#94A3B8" />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveModalText}>SAVE DEMOGRAPHICS RECORD</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, position: 'relative' },
  topBar: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
  },
  backBtn: { padding: 4 },
  moduleTag: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 14 },
  statusBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 14,
  },
  statusTitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, marginBottom: 6 },
  colHeader: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cellCategory: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  cellValue: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.textPrimary },
  cellTotal: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary },
  grandTotalRow: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6, marginTop: 8 },
  grandTotalLabel: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.primary },
  grandTotalVal: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  editCtaBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  editCtaText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },

  // In-App Slide-Up Sheet
  inAppModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    elevation: 25,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: { maxHeight: 420 },
  modalCategoryGroup: { marginBottom: 14 },
  modalCategoryTitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  modalInputRow: { flexDirection: 'row', gap: 10 },
  modalLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: '#FAFAFA',
    outlineStyle: 'none',
  },
  saveModalBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  saveModalText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700' },
});
