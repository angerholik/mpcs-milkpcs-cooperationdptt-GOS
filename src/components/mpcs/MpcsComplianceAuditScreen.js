import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAutosave } from '../../hooks/useAutosave';
import BottomNav from '../BottomNav';
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

const monthMap = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatToIsoDate(displayStr) {
  if (!displayStr) return '';
  if (displayStr.includes('-') && displayStr.length === 10) return displayStr;
  const parts = displayStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

function formatFromIsoDate(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = monthNames[monthIdx] || 'Jan';
    return `${day} ${monthName} ${year}`;
  }
  return isoStr;
}

function deriveFinancialYear(dateStr) {
  if (!dateStr) return '';
  let year, month;
  if (dateStr.includes('-') && dateStr.length === 10) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else {
    const parts = dateStr.trim().split(' ');
    if (parts.length === 3) {
      year = parseInt(parts[2], 10);
      month = parseInt(monthMap[parts[1]] || '01', 10);
    } else {
      return '';
    }
  }

  if (isNaN(year) || isNaN(month)) return '';

  if (month >= 4) {
    return `${year} - ${year + 1}`;
  } else {
    return `${year - 1} - ${year}`;
  }
}

export default function MpcsComplianceAuditScreen({
  lastVerified = "Not verified",
  initialAuditYear = "",
  initialAuditDate = "",
  initialAuditStatus = "Pending",
  initialAgmYear = "",
  initialAgmDate = "",
  initialAgmStatus = "Pending",
  onSaveCompliance,
  onNext,
  onBack,
  activeTab,
  onTabPress
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const [auditDate, setAuditDate] = useState(initialAuditDate);
  const [auditYear, setAuditYear] = useState(initialAuditYear || deriveFinancialYear(initialAuditDate));
  const [auditStatus, setAuditStatus] = useState(initialAuditStatus || 'Pending');

  const [agmDate, setAgmDate] = useState(initialAgmDate);
  const [agmYear, setAgmYear] = useState(initialAgmYear || deriveFinancialYear(initialAgmDate));
  const [agmStatus, setAgmStatus] = useState(initialAgmStatus || 'Pending');

  React.useEffect(() => {
    if (initialAuditDate) setAuditDate(initialAuditDate);
    if (initialAuditYear) setAuditYear(initialAuditYear);
    if (initialAuditStatus) setAuditStatus(initialAuditStatus);
    if (initialAgmDate) setAgmDate(initialAgmDate);
    if (initialAgmYear) setAgmYear(initialAgmYear);
    if (initialAgmStatus) setAgmStatus(initialAgmStatus);
  }, [initialAuditYear, initialAuditDate, initialAuditStatus, initialAgmYear, initialAgmDate, initialAgmStatus]);

  const handleAuditDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setAuditDate(displayDate);
    const calculatedFy = deriveFinancialYear(isoValue);
    setAuditYear(calculatedFy);
  };

  const handleAgmDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setAgmDate(displayDate);
    const calculatedFy = deriveFinancialYear(isoValue);
    setAgmYear(calculatedFy);
  };

  const persistCompliance = () => {
    if (onSaveCompliance) {
      onSaveCompliance({ auditYear, auditDate, auditStatus, agmYear, agmDate, agmStatus });
    }
  };

  // Persists edits shortly after they change, so a value entered here
  // survives even if the tab reloads before "Save" is tapped.
  useAutosave(persistCompliance, [auditYear, auditDate, auditStatus, agmYear, agmDate, agmStatus]);

  const handleSave = () => {
    persistCompliance();
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
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Compliance & Audit</Text>
        </View>
      </View>

      {/* Sticky Action Banner at Top — only the contextual edit action.
          "Save & Next" is the wizard's forward-navigation action, so it
          lives in a bottom footer after the reviewable content instead. */}
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
              <Text style={styles.editCtaText}>Edit Compliance</Text>
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
            <MaterialCommunityIcons name="file-document-check-outline" size={20} color={COLORS.amber900} />
          </View>
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Compliance Record</Text>
            <Text style={styles.alertText}>Last verified: {lastVerified}</Text>
          </View>
        </View>

        {/* Section 1: Latest Audit */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="gavel" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Latest Audit</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AUDIT YEAR</Text>
              <Text style={styles.infoValue}>{auditYear || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AUDIT DATE</Text>
              <Text style={styles.infoValue}>{auditDate || "-"}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AUDIT STATUS</Text>
              <Text style={[
                styles.infoValue,
                { color: auditStatus === 'Completed' ? COLORS.emerald700 : COLORS.amber900, fontWeight: '800' }
              ]}>
                {auditStatus || "Pending"}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 2: Latest AGM */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="account-group" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>Latest AGM</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AGM YEAR</Text>
              <Text style={styles.infoValue}>{agmYear || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AGM DATE</Text>
              <Text style={styles.infoValue}>{agmDate || "-"}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>AGM STATUS</Text>
              <Text style={[
                styles.infoValue,
                { color: agmStatus === 'Completed' ? COLORS.emerald700 : COLORS.amber900, fontWeight: '800' }
              ]}>
                {agmStatus || "Pending"}
              </Text>
            </View>
          </View>
        </View>
      {/* Wizard forward-navigation action now scrolls with the content
          instead of sitting in a fixed footer, which competed with the
          floating BottomNav pill for the same strip at the bottom. */}
      {onNext && (
          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingTop: 16, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(226,232,240,0.8)' }, webCapWidth]}>
            <TouchableOpacity
              onPress={() => { handleSave(); if (onBack) onBack(); }}
              style={styles.prevCircleBtn}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.stepLabelText}>STEP 3 OF 8</Text>
            <Pressable
              onPress={() => { handleSave(); onNext(); }}
              style={({ pressed }) => [styles.nextCircleBtn, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#7a1a1f" />
            </Pressable>
          </View>
      )}

      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'home'} onTabPress={onTabPress} />}

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Compliance & Audit</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Latest Audit Details</Text>
              
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="date"
                      value={formatToIsoDate(auditDate)}
                      onChange={(e) => handleAuditDateSelect(e.target.value)}
                      style={{
                        width: '100%', height: '100%', border: 'none', outline: 'none',
                        background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px',
                        color: '#1e293b', fontWeight: '500', cursor: 'pointer',
                      }}
                    />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={auditDate} onChangeText={(val) => { setAuditDate(val); setAuditYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Year</Text>
                <TextInput style={styles.modalInput} value={auditYear} onChangeText={setAuditYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusToggleChip,
                        auditStatus === st && styles.statusToggleChipActive,
                      ]}
                      onPress={() => setAuditStatus(st)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.statusToggleText,
                        auditStatus === st && styles.statusToggleTextActive
                      ]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Latest AGM Details</Text>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input
                      type="date"
                      value={formatToIsoDate(agmDate)}
                      onChange={(e) => handleAgmDateSelect(e.target.value)}
                      style={{
                        width: '100%', height: '100%', border: 'none', outline: 'none',
                        background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px',
                        color: '#1e293b', fontWeight: '500', cursor: 'pointer',
                      }}
                    />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={agmDate} onChangeText={(val) => { setAgmDate(val); setAgmYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Year</Text>
                <TextInput style={styles.modalInput} value={agmYear} onChangeText={setAgmYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusToggleChip,
                        agmStatus === st && styles.statusToggleChipActive,
                      ]}
                      onPress={() => setAgmStatus(st)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.statusToggleText,
                        agmStatus === st && styles.statusToggleTextActive
                      ]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.btnWrapper, { marginTop: 24, marginBottom: 20 }]}>
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
    paddingBottom: 110, // clears the floating BottomNav pill,
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
  prevCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7a1a1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#7a1a1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabelText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.slate400,
    letterSpacing: 0.6,
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
  datePickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: COLORS.slate50,
    flexDirection: 'row',
    alignItems: 'center',
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
  statusToggleChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleChipActive: {
    borderColor: '#7a1a1f',
    backgroundColor: '#7a1a1f',
  },
  statusToggleText: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.slate600,
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },
});
