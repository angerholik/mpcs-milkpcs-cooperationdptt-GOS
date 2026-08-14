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
  onBack
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

  const handleSaveProfile = () => {
    if (setCenterName) setCenterName(editCenter);
    if (setRegNo) setRegNo(editRegNo);
    if (setPresidentName) setPresidentName(editPresName);
    if (setPresidentMobile) setPresidentMobile(editPresMob);
    if (setManagerName) setManagerName(editMgrName);
    if (setManagerMobile) setManagerMobile(editMgrMob);
    setModalVisible(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    if (onSave) {
      onSave({
        centerName: editCenter,
        regNo: editRegNo,
        presidentName: editPresName,
        presidentMobile: editPresMob,
        managerName: editMgrName,
        managerMobile: editMgrMob
      });
    }
  };

  const handleSaveAndNext = () => {
    handleSaveProfile();
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

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
          <Text style={styles.screenTitleHeader}>Institutional Profile</Text>
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
              <Text style={styles.editCtaText}>Edit Profile</Text>
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
            <MaterialCommunityIcons name="office-building-outline" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Society Information</Text>
            <Text style={styles.alertText}>Last updated: {lastUpdated}</Text>
          </View>
        </View>

        {/* Section 1: Society Identification */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Society Identification</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>MILK CENTER NAME</Text>
              <Text style={styles.infoValue}>{centerName || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>REGISTRATION NUMBER</Text>
              <Text style={styles.infoValue}>{regNo || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Key Personnel Contacts */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Key Personnel Contacts</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PRESIDENT NAME</Text>
              <Text style={styles.infoValue}>{presidentName || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PRESIDENT MOBILE</Text>
              <Text style={styles.infoValue}>{presidentMobile || "-"}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>MANAGER NAME</Text>
              <Text style={styles.infoValue}>{managerName || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>MANAGER MOBILE</Text>
              <Text style={styles.infoValue}>{managerMobile || "-"}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Institutional Profile</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Society Identification</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Milk Center Name</Text>
                <TextInput style={styles.modalInput} value={editCenter} onChangeText={setEditCenter} placeholder="Enter center name" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Registration Number</Text>
                <TextInput style={styles.modalInput} value={editRegNo} onChangeText={setEditRegNo} placeholder="Enter registration number" placeholderTextColor={COLORS.slate400} />
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Key Personnel Contacts</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>President Name</Text>
                <TextInput style={styles.modalInput} value={editPresName} onChangeText={setEditPresName} placeholder="Enter president name" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>President Mobile</Text>
                <TextInput style={styles.modalInput} value={editPresMob} onChangeText={setEditPresMob} keyboardType="phone-pad" placeholder="Enter president mobile" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Manager Name</Text>
                <TextInput style={styles.modalInput} value={editMgrName} onChangeText={setEditMgrName} placeholder="Enter manager name" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Manager Mobile</Text>
                <TextInput style={styles.modalInput} value={editMgrMob} onChangeText={setEditMgrMob} keyboardType="phone-pad" placeholder="Enter manager mobile" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={[styles.btnWrapper, { marginTop: 16, marginBottom: 20 }]}>
                <Pressable 
                  style={({ hovered, pressed }) => [
                    styles.saveModalBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={handleSaveProfile}
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
  divider: {
    height: 1,
    backgroundColor: COLORS.slate100,
    marginVertical: 12,
  },
  infoGrid: { 
    flexDirection: 'row', 
    gap: 12 
  },
  infoCol: { 
    flex: 1 
  },
  infoLabel: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 8, 
    fontWeight: '800', 
    color: COLORS.slate400,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  infoValue: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 13, 
    fontWeight: '600', 
    color: COLORS.slate800,
  },
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
  modalSectionTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 12, 
    fontWeight: '800', 
    color: COLORS.slate800, 
    marginBottom: 12 
  },
  modalFormGroup: { 
    marginBottom: 12, 
    gap: 6 
  },
  modalLabel: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 9, 
    fontWeight: '800', 
    color: COLORS.slate500,
    letterSpacing: 1.2,
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
