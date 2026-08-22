import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAutosave } from '../../hooks/useAutosave';
import { webCapWidth } from '../../utils/webStyles';

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

export default function MpcsCscDetailsScreen({
  lastVerified = "Not verified",
  initialOperator = "",
  initialCscId = "",
  initialCenterName = "",
  initialMobile = "",
  initialEmail = "",
  initialActiveServices = "",
  initialIsCscActive = true,
  onSaveCscDetails,
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [isCscActive, setIsCscActive] = useState(initialIsCscActive);
  const [cscOperatorName, setCscOperatorName] = useState(initialOperator);
  const [cscId, setCscId] = useState(initialCscId);
  const [cscCenterName, setCscCenterName] = useState(initialCenterName);
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [emailId, setEmailId] = useState(initialEmail);
  const [activeServicesCount, setActiveServicesCount] = useState(initialActiveServices);

  React.useEffect(() => {
    if (initialOperator) setCscOperatorName(initialOperator);
    if (initialCscId) setCscId(initialCscId);
    if (initialCenterName) setCscCenterName(initialCenterName);
    if (initialMobile) setMobileNumber(initialMobile);
    if (initialEmail) setEmailId(initialEmail);
    if (initialActiveServices) setActiveServicesCount(initialActiveServices);
    setIsCscActive(initialIsCscActive);
  }, [initialOperator, initialCscId, initialCenterName, initialMobile, initialEmail, initialActiveServices, initialIsCscActive]);

  const persistCscDetails = () => {
    if (onSaveCscDetails) {
      onSaveCscDetails({ isCscActive, cscOperatorName, cscId, cscCenterName, mobileNumber, emailId, activeServicesCount });
    }
  };

  // Persists edits shortly after typing stops, so a value entered here
  // survives even if the tab reloads before "Save" is tapped.
  useAutosave(persistCscDetails, [isCscActive, cscOperatorName, cscId, cscCenterName, mobileNumber, emailId, activeServicesCount]);

  const handleSave = () => {
    persistCscDetails();
    setModalVisible(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => { handleSave(); if (onBack) onBack(); }} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MPCS MASTER DATA</Text>
          <Text style={styles.screenTitleHeader}>CSC Details</Text>
        </View>
      </View>

      {/* Sticky Action Banner at Top — only the contextual edit action.
          "Save Master Data" is the wizard's forward-navigation action, so
          it lives in a bottom footer after the reviewable content instead. */}
      <View style={styles.stickyActionBanner}>
        <View style={[{ flexDirection: 'row', gap: 8 }, webCapWidth]}>
          <View style={styles.btnWrapper}>
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
              <Text style={styles.editCtaText}>Edit CSC Details</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        {/* Profile Status Banner */}
        <View style={styles.alertCard}>
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="store-cog" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>CSC Operations Status</Text>
            <Text style={styles.alertText}>
              Status: {isCscActive ? "Active CSC Services" : "Inactive / CSC Not Available"}
            </Text>
          </View>
        </View>

        {/* Active / Inactive Selector — settable up front, without opening Edit */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: isCscActive ? COLORS.emerald700 : COLORS.slate200,
              backgroundColor: isCscActive ? COLORS.emerald50 : COLORS.surface
            }}
            onPress={() => {
              setIsCscActive(true);
              if (onSaveCscDetails) {
                onSaveCscDetails({ isCscActive: true, cscOperatorName, cscId, cscCenterName, mobileNumber, emailId, activeServicesCount });
              }
            }}
          >
            <Text style={{
              fontFamily: FONT_FAMILY,
              fontSize: 12,
              fontWeight: '800',
              color: isCscActive ? COLORS.emerald700 : COLORS.slate500
            }}>
              ✓ ACTIVE CSC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: !isCscActive ? COLORS.amber900 : COLORS.slate200,
              backgroundColor: !isCscActive ? COLORS.amber100 : COLORS.surface
            }}
            onPress={() => {
              setIsCscActive(false);
              if (onSaveCscDetails) {
                onSaveCscDetails({ isCscActive: false, cscOperatorName, cscId, cscCenterName, mobileNumber, emailId, activeServicesCount });
              }
            }}
          >
            <Text style={{
              fontFamily: FONT_FAMILY,
              fontSize: 12,
              fontWeight: '800',
              color: !isCscActive ? COLORS.amber900 : COLORS.slate500
            }}>
              ⚠ INACTIVE / NONE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={[styles.card, !isCscActive && { opacity: 0.75 }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="storefront" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>CSC Operator &amp; Center Info</Text>
            <View style={{
              marginLeft: 'auto',
              backgroundColor: isCscActive ? COLORS.emerald50 : COLORS.slate100,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isCscActive ? 'rgba(16,185,129,0.3)' : COLORS.slate200
            }}>
              <Text style={{
                fontFamily: FONT_FAMILY,
                fontSize: 10,
                fontWeight: '800',
                color: isCscActive ? COLORS.emerald700 : COLORS.slate500
              }}>
                {isCscActive ? '✓ CSC ACTIVE' : '⚠ CSC INACTIVE'}
              </Text>
            </View>
          </View>

          {isCscActive ? (
            <>
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>CSC OPERATOR NAME</Text>
                  <Text style={styles.infoValue}>{cscOperatorName || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>CSC ID / VLE ID</Text>
                  <Text style={styles.infoValue}>{cscId || "-"}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>CSC CENTER NAME</Text>
                  <Text style={styles.infoValue}>{cscCenterName || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>OPERATOR MOBILE</Text>
                  <Text style={styles.infoValue}>{mobileNumber || "-"}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>OPERATOR EMAIL ID</Text>
                  <Text style={styles.infoValue}>{emailId || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>ACTIVE SERVICES OFFERED</Text>
                  <Text style={styles.infoValue}>{activeServicesCount || "-"}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="office-building-remove-outline" size={32} color={COLORS.slate400} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 }}>
                CSC Services Not Available
              </Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                This society does not operate an active Common Service Center (CSC). Fields are non-mandatory.
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Bottom Footer: wizard forward-navigation action */}
      {onNext && (
        <View style={styles.bottomFooter}>
          <View style={[styles.btnWrapper, webCapWidth]}>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={() => { handleSave(); onNext(); }}
            >
              <LinearGradient
                colors={['#047857', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.editCtaText}>Save Master Data</Text>
              <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit CSC Details</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              
              {/* Active / Inactive Selector */}
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>CSC Status in this Society</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: isCscActive ? COLORS.emerald700 : COLORS.slate200,
                      backgroundColor: isCscActive ? COLORS.emerald50 : COLORS.slate50
                    }}
                    onPress={() => setIsCscActive(true)}
                  >
                    <Text style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 12,
                      fontWeight: '800',
                      color: isCscActive ? COLORS.emerald700 : COLORS.slate500
                    }}>
                      ✓ ACTIVE CSC
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: !isCscActive ? COLORS.amber900 : COLORS.slate200,
                      backgroundColor: !isCscActive ? COLORS.amber100 : COLORS.slate50
                    }}
                    onPress={() => setIsCscActive(false)}
                  >
                    <Text style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: 12,
                      fontWeight: '800',
                      color: !isCscActive ? COLORS.amber900 : COLORS.slate500
                    }}>
                      ⚠ INACTIVE / NONE
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>CSC Operator Name</Text>
                <TextInput style={styles.modalInput} value={cscOperatorName} onChangeText={setCscOperatorName} placeholder="Enter operator name" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>CSC ID / VLE ID</Text>
                <TextInput style={styles.modalInput} value={cscId} onChangeText={setCscId} placeholder="Enter CSC / VLE ID" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>CSC Center Name</Text>
                <TextInput style={styles.modalInput} value={cscCenterName} onChangeText={setCscCenterName} placeholder="Enter center name" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Operator Mobile</Text>
                <TextInput style={styles.modalInput} value={mobileNumber} onChangeText={setMobileNumber} placeholder="Enter mobile number" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Operator Email ID</Text>
                <TextInput style={styles.modalInput} value={emailId} onChangeText={setEmailId} placeholder="Enter email address" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Active Services Offered</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={activeServicesCount} onChangeText={setActiveServicesCount} placeholder="0" placeholderTextColor={COLORS.slate400} />
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
  bottomFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
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
    marginBottom: 2,
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
