import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  onBack
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
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const demographicsData = [
    { category: 'SC', male: mSc, female: fSc, total: scTotal },
    { category: 'ST', male: mSt, female: fSt, total: stTotal },
    { category: 'OBC', male: mObc, female: fObc, total: obcTotal },
    { category: 'General', male: mGen, female: fGen, total: genTotal },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
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
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Registered Demographics</Text>
        </View>
      </View>

      {/* Sticky Action Banner at Top */}
      <View style={styles.stickyActionBanner}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.btnWrapper, { flex: 1 }]}>
            <Pressable 
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={() => setModalVisible(true)}
            >
              <LinearGradient
                colors={['#7a1a1f', '#4a1017']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <MaterialCommunityIcons name="pencil-outline" size={16} color="#ffffff" />
              <Text style={styles.editCtaText}>Edit Demographics</Text>
            </Pressable>
          </View>

          <View style={[styles.btnWrapper, { flex: 1 }]}>
            <Pressable 
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={handleSaveAndNext}
            >
              <LinearGradient
                colors={['#047857', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.editCtaText}>Save & Next</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>


      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Profile Status Banner */}
        <View style={styles.alertCard}>
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Demographics Data</Text>
            <Text style={styles.alertText}>Last updated: {lastUpdated}</Text>
          </View>
        </View>

        {/* Demographic Table Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="account-multiple" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Category-wise Member Breakdown</Text>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { flex: 1.2 }]}>Category</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Male</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>Female</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'right' }]}>Total</Text>
          </View>

          {/* Table Rows */}
          {demographicsData.map((row) => (
            <View style={styles.tableRow} key={row.category}>
              <Text style={[styles.cellCategory, { flex: 1.2 }]}>{row.category}</Text>
              <Text style={[styles.cellValue, { flex: 1, textAlign: 'center' }]}>{row.male !== '' ? row.male : '-'}</Text>
              <Text style={[styles.cellValue, { flex: 1, textAlign: 'center' }]}>{row.female !== '' ? row.female : '-'}</Text>
              <Text style={[styles.cellTotal, { flex: 1, textAlign: 'right' }]}>{row.total || '-'}</Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <View style={styles.grandTotalRow}>
            <Text style={[styles.grandTotalLabel, { flex: 1.2 }]}>GRAND TOTAL</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'center' }]}>{maleSum || '-'}</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'center' }]}>{femaleSum || '-'}</Text>
            <Text style={[styles.grandTotalVal, { flex: 1, textAlign: 'right', color: COLORS.primary }]}>{grandTotal || '-'}</Text>
          </View>
        </View>

      </ScrollView>

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Demographics</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              
              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalSectionTitle}>SC Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMSc} onChangeText={(val) => setTMSc(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFSc} onChangeText={(val) => setTFSc(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              </View>

              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalSectionTitle}>ST Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMSt} onChangeText={(val) => setTMSt(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFSt} onChangeText={(val) => setTFSt(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              </View>

              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalSectionTitle}>OBC Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMObc} onChangeText={(val) => setTMObc(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFObc} onChangeText={(val) => setTFObc(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              </View>

              <View style={styles.modalCategoryGroup}>
                <Text style={styles.modalSectionTitle}>General Category</Text>
                <View style={styles.modalInputRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Male Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tMGen} onChangeText={(val) => setTMGen(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalLabel}>Female Members</Text>
                    <TextInput style={styles.modalInput} keyboardType="numeric" value={tFGen} onChangeText={(val) => setTFGen(val.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              </View>

              <View style={[styles.btnWrapper, { marginTop: 16, marginBottom: 20 }]}>
                <Pressable 
                  style={({ hovered, pressed }) => [
                    styles.saveModalBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={['#7a1a1f', '#4a1017']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={styles.saveModalText}>Save Changes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.slate50, position: 'relative' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    overflow: 'hidden',
  },
  backBtn: { 
    padding: 8,
    marginRight: 8,
  },
  topBarTitleContainer: {
    flex: 1,
  },
  stickyActionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  bgBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(122, 26, 31, 0.08)',
    zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(180, 83, 9, 0.06)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    top: '40%',
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(122, 26, 31, 0.05)',
    zIndex: -1,
  },
  moduleTag: { 
    color: 'rgba(255,255,255,0.7)', 
    fontFamily: FONT_FAMILY,
    fontSize: 8, 
    fontWeight: '800', 
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  screenTitleHeader: { 
    color: '#FFFFFF', 
    fontFamily: FONT_FAMILY, 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: -0.16,
  },
  scrollContent: { flex: 1 },
  scrollInner: { 
    padding: 12,
    gap: 12,
    paddingBottom: 40,
  },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.8)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.5)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    paddingRight: 8,
  },
  alertTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.amber900,
    marginBottom: 2,
  },
  alertText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(146, 64, 14, 0.9)',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 12 
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.slate800,
    letterSpacing: -0.14,
  },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: COLORS.slate50, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 6, marginBottom: 6 },
  colHeader: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.slate500 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: COLORS.slate50 },
  cellCategory: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.slate800 },
  cellValue: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate700 },
  cellTotal: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary },
  grandTotalRow: { flexDirection: 'row', backgroundColor: 'rgba(122, 26, 31, 0.05)', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 6, marginTop: 8 },
  grandTotalLabel: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.primary },
  grandTotalVal: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate800 },

  btnWrapper: {
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  editCtaBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12, 
    paddingHorizontal: 16,
  },
  editCtaText: { 
    color: '#FFFFFF', 
    fontFamily: FONT_FAMILY, 
    fontSize: 13, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },

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
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 25,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    marginBottom: 16,
  },
  modalTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 16, 
    fontWeight: '800', 
    color: COLORS.slate800,
    letterSpacing: -0.16,
  },
  closeBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: { 
    maxHeight: 500 
  },
  modalCategoryGroup: { marginBottom: 14 },
  modalSectionTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 12, 
    fontWeight: '800', 
    color: COLORS.slate800, 
    marginBottom: 12 
  },
  modalInputRow: { flexDirection: 'row', gap: 10 },
  modalLabel: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 9, 
    fontWeight: '800', 
    color: COLORS.slate500,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.slate800,
    backgroundColor: COLORS.slate50,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  saveModalBtn: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 16,
  },
  saveModalText: { 
    color: '#FFFFFF', 
    fontFamily: FONT_FAMILY, 
    fontSize: 13, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
