import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Switch } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAutosave } from '../hooks/useAutosave';

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

// Helpers for Date & Financial Year (same convention used previously in ComplianceScreen)
const deriveFinancialYear = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 4) {
    return `${year} - ${year + 1}`;
  } else {
    return `${year - 1} - ${year}`;
  }
};

const formatToIsoDate = (dStr) => {
  if (!dStr) return '';
  const parts = dStr.split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const months = { Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06', Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12' };
    const month = months[parts[1]] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dStr;
};

const formatFromIsoDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

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
  // Master Data: Audit & AGM (done once/year, not monthly)
  auditDate = "",
  setAuditDate,
  auditYear = "",
  setAuditYear,
  auditStatus = "Pending",
  setAuditStatus,
  agmDate = "",
  setAgmDate,
  agmYear = "",
  setAgmYear,
  agmStatus = "Pending",
  setAgmStatus,
  // Master Data: Loan setup (loan repayment tracking itself stays in the Monthly section)
  hasLoan = false,
  setHasLoan,
  loanType = "",
  setLoanType,
  loanSanctionDate = "",
  setLoanSanctionDate,
  loanBeneficiaries = "",
  setLoanBeneficiaries,
  loanExtended = "",
  setLoanExtended,
  loanCleared = false,
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

  const [editAuditDate, setEditAuditDate] = useState(auditDate);
  const [editAuditYear, setEditAuditYear] = useState(auditYear);
  const [editAuditStatus, setEditAuditStatus] = useState(auditStatus);
  const [editAgmDate, setEditAgmDate] = useState(agmDate);
  const [editAgmYear, setEditAgmYear] = useState(agmYear);
  const [editAgmStatus, setEditAgmStatus] = useState(agmStatus);

  const [editHasLoan, setEditHasLoan] = useState(hasLoan);
  const [editLoanType, setEditLoanType] = useState(loanType);
  const [editLoanSanctionDate, setEditLoanSanctionDate] = useState(loanSanctionDate);
  const [editLoanBeneficiaries, setEditLoanBeneficiaries] = useState(loanBeneficiaries);
  const [editLoanExtended, setEditLoanExtended] = useState(loanExtended);

  useEffect(() => {
    setEditCenter(centerName || '');
    setEditRegNo(regNo || '');
    setEditPresName(presidentName || '');
    setEditPresMob(presidentMobile || '');
    setEditMgrName(managerName || '');
    setEditMgrMob(managerMobile || '');
  }, [centerName, regNo, presidentName, presidentMobile, managerName, managerMobile]);

  useEffect(() => {
    setEditAuditDate(auditDate || '');
    setEditAuditYear(auditYear || '');
    setEditAuditStatus(auditStatus || 'Pending');
    setEditAgmDate(agmDate || '');
    setEditAgmYear(agmYear || '');
    setEditAgmStatus(agmStatus || 'Pending');
    setEditHasLoan(!!hasLoan);
    setEditLoanType(loanType || '');
    setEditLoanSanctionDate(loanSanctionDate || '');
    setEditLoanBeneficiaries(loanBeneficiaries || '');
    setEditLoanExtended(loanExtended || '');
  }, [auditDate, auditYear, auditStatus, agmDate, agmYear, agmStatus, hasLoan, loanType, loanSanctionDate, loanBeneficiaries, loanExtended]);

  const handleAuditDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setEditAuditDate(displayDate);
    setEditAuditYear(deriveFinancialYear(isoValue));
  };

  const handleAgmDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setEditAgmDate(displayDate);
    setEditAgmYear(deriveFinancialYear(isoValue));
  };

  const handleLoanDateSelect = (isoValue) => {
    setEditLoanSanctionDate(formatFromIsoDate(isoValue));
  };

  const persistProfile = () => {
    if (setCenterName) setCenterName(editCenter);
    if (setRegNo) setRegNo(editRegNo);
    if (setPresidentName) setPresidentName(editPresName);
    if (setPresidentMobile) setPresidentMobile(editPresMob);
    if (setManagerName) setManagerName(editMgrName);
    if (setManagerMobile) setManagerMobile(editMgrMob);

    if (setAuditDate) setAuditDate(editAuditDate);
    if (setAuditYear) setAuditYear(editAuditYear);
    if (setAuditStatus) setAuditStatus(editAuditStatus);
    if (setAgmDate) setAgmDate(editAgmDate);
    if (setAgmYear) setAgmYear(editAgmYear);
    if (setAgmStatus) setAgmStatus(editAgmStatus);

    if (setHasLoan) setHasLoan(editHasLoan);
    if (setLoanType) setLoanType(editLoanType);
    if (setLoanSanctionDate) setLoanSanctionDate(editLoanSanctionDate);
    if (setLoanBeneficiaries) setLoanBeneficiaries(editLoanBeneficiaries);
    if (setLoanExtended) setLoanExtended(editLoanExtended);

    if (onSave) {
      onSave({
        centerName: editCenter,
        registrationNumber: editRegNo,
        presidentName: editPresName,
        presidentMobile: editPresMob,
        managerName: editMgrName,
        managerMobile: editMgrMob,
        masterAuditDate: editAuditDate,
        masterAuditYear: editAuditYear,
        masterAuditStatus: editAuditStatus,
        masterAgmDate: editAgmDate,
        masterAgmYear: editAgmYear,
        masterAgmStatus: editAgmStatus,
        masterHasLoan: editHasLoan,
        masterLoanType: editLoanType,
        masterLoanSanctionDate: editLoanSanctionDate,
        masterLoanBeneficiaries: editLoanBeneficiaries,
        masterLoanExtended: editLoanExtended
      });
    }
  };

  // Persists edits to AsyncStorage shortly after typing stops, so a value
  // typed here survives even if the tab reloads before "Save Changes" is
  // tapped (see src/hooks/useAutosave.js).
  useAutosave(persistProfile, [
    editCenter, editRegNo, editPresName, editPresMob, editMgrName, editMgrMob,
    editAuditDate, editAuditYear, editAuditStatus, editAgmDate, editAgmYear, editAgmStatus,
    editHasLoan, editLoanType, editLoanSanctionDate, editLoanBeneficiaries, editLoanExtended
  ]);

  const handleSaveProfile = () => {
    persistProfile();
    setModalVisible(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSaveAndNext = () => {
    handleSaveProfile();
    if (onSaveNext) {
      onSaveNext();
    } else if (onNext) {
      onNext();
    }
  };

  const handleSaveAndExit = () => {
    handleSaveProfile();
    if (onBack) onBack();
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

      {/* Sticky Action Banner at Top — only the contextual edit action.
          "Save & Exit" / "Save & Next" are wizard navigation actions, so
          they live in a bottom footer after the reviewable content instead. */}
      <View style={styles.stickyActionBanner}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
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
              <Text style={styles.editCtaText}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Save Confirmation Toast */}
      {isSaved && (
        <View style={styles.toastBanner} pointerEvents="none">
          <MaterialCommunityIcons name="check-circle" size={16} color="#ffffff" />
          <Text style={styles.toastText}>Profile saved successfully</Text>
        </View>
      )}


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

        {/* Section 3: Latest Audit (Master Data - once/year) */}
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

        {/* Section 4: Latest AGM (Master Data - once/year) */}
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

        {/* Section 5: Loan Setup (Master Data) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="bank-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Loan Setup</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusBadgeText, { color: hasLoan ? (loanCleared ? COLORS.slate500 : COLORS.emerald700) : COLORS.slate500 }]}>
                {hasLoan ? (loanCleared ? 'CLEARED' : 'ON') : 'OFF'}
              </Text>
            </View>
          </View>

          {hasLoan ? (
            <>
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>LOAN TYPE</Text>
                  <Text style={styles.infoValue}>{loanType || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>SANCTION DATE</Text>
                  <Text style={styles.infoValue}>{loanSanctionDate || "-"}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>BENEFICIARIES</Text>
                  <Text style={styles.infoValue}>{loanBeneficiaries || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>AMOUNT EXTENDED (Rs.)</Text>
                  <Text style={styles.infoValue}>{loanExtended || "-"}</Text>
                </View>
              </View>
              {loanCleared && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.emptySubtitle}>This loan has been marked cleared from the Monthly section. Monthly repayment tracking is now hidden.</Text>
                </>
              )}
            </>
          ) : (
            <Text style={styles.emptySubtitle}>No active loan record. Enable edit to add loan details. Once enabled, this society's monthly Compliance section will show a loan repayment tracker until it's marked cleared.</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Footer: wizard navigation actions */}
      <View style={styles.bottomFooter}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.btnWrapper, { flex: 1 }]}>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.saveExitBtn,
                pressed && { transform: [{ scale: 0.98 }] }
              ]}
              onPress={handleSaveAndExit}
            >
              <MaterialCommunityIcons name="content-save-check-outline" size={16} color={COLORS.primary} />
              <Text style={styles.saveExitText}>Save & Exit</Text>
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

              {/* Audit Details */}
              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Latest Audit</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input type="date" value={formatToIsoDate(editAuditDate)} onChange={(e) => handleAuditDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={editAuditDate} onChangeText={(val) => { setEditAuditDate(val); setEditAuditYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Year</Text>
                <TextInput style={styles.modalInput} value={editAuditYear} onChangeText={setEditAuditYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity key={st} style={[styles.statusToggleChip, editAuditStatus === st && styles.statusToggleChipActive]} onPress={() => setEditAuditStatus(st)} activeOpacity={0.7}>
                      <Text style={[styles.statusToggleText, editAuditStatus === st && styles.statusToggleTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* AGM Details */}
              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>Latest AGM</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input type="date" value={formatToIsoDate(editAgmDate)} onChange={(e) => handleAgmDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={editAgmDate} onChangeText={(val) => { setEditAgmDate(val); setEditAgmYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Year</Text>
                <TextInput style={styles.modalInput} value={editAgmYear} onChangeText={setEditAgmYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity key={st} style={[styles.statusToggleChip, editAgmStatus === st && styles.statusToggleChipActive]} onPress={() => setEditAgmStatus(st)} activeOpacity={0.7}>
                      <Text style={[styles.statusToggleText, editAgmStatus === st && styles.statusToggleTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Loan Setup */}
              <View style={[styles.modalHeaderRow, { marginTop: 20, borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={[styles.modalSectionTitle, { marginBottom: 0 }]}>Loan Setup</Text>
                <Switch
                  value={editHasLoan}
                  onValueChange={setEditHasLoan}
                  trackColor={{ false: COLORS.slate300, true: COLORS.primary }}
                  thumbColor="#ffffff"
                  disabled={loanCleared}
                />
              </View>
              <Text style={styles.emptySubtitle}>
                {loanCleared
                  ? 'This loan was marked cleared from the Monthly section. To start a new loan, mark cleared status will need to be reset by an admin.'
                  : 'If ON, the monthly Compliance section will show a repayment tracker until marked cleared.'}
              </Text>

              {editHasLoan && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Loan Type</Text>
                    <TextInput style={styles.modalInput} value={editLoanType} onChangeText={setEditLoanType} placeholder="e.g. Working Capital" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Sanction Date</Text>
                    {Platform.OS === 'web' ? (
                      <View style={styles.datePickerWrapper}>
                        <input type="date" value={formatToIsoDate(editLoanSanctionDate)} onChange={(e) => handleLoanDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                      </View>
                    ) : (
                      <TextInput style={styles.modalInput} value={editLoanSanctionDate} onChangeText={setEditLoanSanctionDate} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                    )}
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Total Beneficiaries</Text>
                    <TextInput style={styles.modalInput} value={editLoanBeneficiaries} onChangeText={setEditLoanBeneficiaries} placeholder="e.g. 150" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Amount Extended (Rs.)</Text>
                    <TextInput style={styles.modalInput} value={editLoanExtended} onChangeText={setEditLoanExtended} placeholder="e.g. 500000" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              )}

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
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.slate100, marginLeft: 'auto',
  },
  statusBadgeText: {
    fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800',
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
  emptySubtitle: {
    fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate500,
    fontStyle: 'italic',
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
  saveExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  saveExitText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toastBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.emerald700,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10000,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '700',
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
  datePickerWrapper: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, height: 42,
    backgroundColor: COLORS.slate50, flexDirection: 'row', alignItems: 'center',
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
    flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.slate200, backgroundColor: COLORS.slate50, alignItems: 'center', justifyContent: 'center',
  },
  statusToggleChipActive: { borderColor: '#7a1a1f', backgroundColor: '#7a1a1f' },
  statusToggleText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.slate600 },
  statusToggleTextActive: { color: '#FFFFFF' },
});
