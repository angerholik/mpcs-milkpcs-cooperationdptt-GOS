import React, { useState, useEffect } from 'react';
import { getMilkSectionData, saveMilkSectionData } from '../utils/monthlySyncManager';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, Pressable, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  amber100: '#fef3c7',
  amber900: '#78350f',
  emerald700: '#047857',
};

const FONT_FAMILY = 'Manrope';

// Helpers for Date & Financial Year
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

export default function ComplianceScreen({
  societyName = "",
  reportingMonth = "",
  onSave,
  onSaveNext,
  onNext,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [lastVerified, setLastVerified] = useState('Not verified');

  // Audit State
  const [auditDate, setAuditDate] = useState('');
  const [auditYear, setAuditYear] = useState('');
  const [auditStatus, setAuditStatus] = useState('Pending');

  // AGM State
  const [agmDate, setAgmDate] = useState('');
  const [agmYear, setAgmYear] = useState('');
  const [agmStatus, setAgmStatus] = useState('Pending');

  // Loan State
  const [hasLoan, setHasLoan] = useState(false);
  const [loanType, setLoanType] = useState('');
  const [loanSanctionDate, setLoanSanctionDate] = useState('');
  const [loanBeneficiaries, setLoanBeneficiaries] = useState('');
  const [loanExtended, setLoanExtended] = useState('');
  const [loanRecovered, setLoanRecovered] = useState('');
  const [loanOutstanding, setLoanOutstanding] = useState('');

  // Temporary State for Modal
  const [tempAuditDate, setTempAuditDate] = useState('');
  const [tempAuditYear, setTempAuditYear] = useState('');
  const [tempAuditStatus, setTempAuditStatus] = useState('Pending');
  const [tempAgmDate, setTempAgmDate] = useState('');
  const [tempAgmYear, setTempAgmYear] = useState('');
  const [tempAgmStatus, setTempAgmStatus] = useState('Pending');
  
  const [tempHasLoan, setTempHasLoan] = useState(false);
  const [tempLoanType, setTempLoanType] = useState('');
  const [tempLoanSanctionDate, setTempLoanSanctionDate] = useState('');
  const [tempLoanBeneficiaries, setTempLoanBeneficiaries] = useState('');
  const [tempLoanExtended, setTempLoanExtended] = useState('');
  const [tempLoanRecovered, setTempLoanRecovered] = useState('');
  const [tempLoanOutstanding, setTempLoanOutstanding] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getMilkSectionData(societyName, reportingMonth, 'compliance');
      if (data) {
        setAuditDate(data.auditDate || '');
        setAuditYear(data.auditYear || '');
        setAuditStatus(data.auditStatus || 'Pending');
        setAgmDate(data.agmDate || '');
        setAgmYear(data.agmYear || '');
        setAgmStatus(data.agmStatus || 'Pending');

        setHasLoan(data.hasLoan || false);
        setLoanType(data.loanType || '');
        setLoanSanctionDate(data.loanSanctionDate || '');
        setLoanBeneficiaries(data.loanBeneficiaries || '');
        setLoanExtended(data.loanExtended || '');
        setLoanRecovered(data.loanRecovered || '');
        setLoanOutstanding(data.loanOutstanding || '');

        if (data.auditDate || data.agmDate) {
          setLastVerified(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        }
      }
    })();
  }, [societyName, reportingMonth]);

  const openModal = () => {
    setTempAuditDate(auditDate);
    setTempAuditYear(auditYear);
    setTempAuditStatus(auditStatus);
    setTempAgmDate(agmDate);
    setTempAgmYear(agmYear);
    setTempAgmStatus(agmStatus);
    setTempHasLoan(hasLoan);
    setTempLoanType(loanType);
    setTempLoanSanctionDate(loanSanctionDate);
    setTempLoanBeneficiaries(loanBeneficiaries);
    setTempLoanExtended(loanExtended);
    setTempLoanRecovered(loanRecovered);
    setTempLoanOutstanding(loanOutstanding);
    setModalVisible(true);
  };

  const handleTempAuditDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setTempAuditDate(displayDate);
    setTempAuditYear(deriveFinancialYear(isoValue));
  };

  const handleTempAgmDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setTempAgmDate(displayDate);
    setTempAgmYear(deriveFinancialYear(isoValue));
  };

  const handleTempLoanDateSelect = (isoValue) => {
    const displayDate = formatFromIsoDate(isoValue);
    setTempLoanSanctionDate(displayDate);
  };

  const saveToLocal = async (newData) => {
    let isCompleted = true;
    if (!newData.auditDate || !newData.agmDate) isCompleted = false;
    
    // Loan completion logic
    if (newData.hasLoan) {
      if (!newData.loanType || !newData.loanSanctionDate || !newData.loanBeneficiaries || 
          !newData.loanExtended || !newData.loanRecovered || !newData.loanOutstanding) {
        isCompleted = false;
      }
    }

    const payload = { ...newData, isCompleted };
    await saveMilkSectionData(societyName, reportingMonth, 'compliance', payload);
    return isCompleted;
  };

  const handleSaveModal = async () => {
    setAuditDate(tempAuditDate);
    setAuditYear(tempAuditYear);
    setAuditStatus(tempAuditStatus);
    setAgmDate(tempAgmDate);
    setAgmYear(tempAgmYear);
    setAgmStatus(tempAgmStatus);
    
    setHasLoan(tempHasLoan);
    setLoanType(tempLoanType);
    setLoanSanctionDate(tempLoanSanctionDate);
    setLoanBeneficiaries(tempLoanBeneficiaries);
    setLoanExtended(tempLoanExtended);
    setLoanRecovered(tempLoanRecovered);
    setLoanOutstanding(tempLoanOutstanding);

    setLastVerified(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setModalVisible(false);

    await saveToLocal({
      auditDate: tempAuditDate, auditYear: tempAuditYear, auditStatus: tempAuditStatus,
      agmDate: tempAgmDate, agmYear: tempAgmYear, agmStatus: tempAgmStatus,
      hasLoan: tempHasLoan, loanType: tempLoanType, loanSanctionDate: tempLoanSanctionDate,
      loanBeneficiaries: tempLoanBeneficiaries, loanExtended: tempLoanExtended,
      loanRecovered: tempLoanRecovered, loanOutstanding: tempLoanOutstanding
    });

    if (onSave) onSave();
  };

  const handleSaveAndNext = async () => {
    await saveToLocal({
      auditDate, auditYear, auditStatus,
      agmDate, agmYear, agmStatus,
      hasLoan, loanType, loanSanctionDate,
      loanBeneficiaries, loanExtended,
      loanRecovered, loanOutstanding
    });

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
          <Text style={styles.screenTitleHeader}>Compliance & Audit</Text>
        </View>
      </View>

      {/* Sticky Action Banner */}
      <View style={styles.stickyActionBanner}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.btnWrapper, { flex: 1 }]}>
            <Pressable 
              style={({ hovered, pressed }) => [
                styles.editCtaBtn,
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
              ]}
              onPress={openModal}
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

        {/* Section 3: Active Loan */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="bank-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Active Loan</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusBadgeText, { color: hasLoan ? COLORS.emerald700 : COLORS.slate500 }]}>
                {hasLoan ? 'ON' : 'OFF'}
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
                  <Text style={styles.infoLabel}>EXTENDED (₹)</Text>
                  <Text style={styles.infoValue}>{loanExtended || "-"}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoGrid}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>RECOVERED (₹)</Text>
                  <Text style={styles.infoValue}>{loanRecovered || "-"}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>OUTSTANDING (₹)</Text>
                  <Text style={styles.infoValue}>{loanOutstanding || "-"}</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptySubtitle}>No active loan record. Enable edit to add loan details.</Text>
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Compliance Data</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              
              {/* Audit Details */}
              <Text style={styles.modalSectionTitle}>Latest Audit</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input type="date" value={formatToIsoDate(tempAuditDate)} onChange={(e) => handleTempAuditDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={tempAuditDate} onChangeText={(val) => { setTempAuditDate(val); setTempAuditYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Year</Text>
                <TextInput style={styles.modalInput} value={tempAuditYear} onChangeText={setTempAuditYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Audit Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity key={st} style={[styles.statusToggleChip, tempAuditStatus === st && styles.statusToggleChipActive]} onPress={() => setTempAuditStatus(st)} activeOpacity={0.7}>
                      <Text style={[styles.statusToggleText, tempAuditStatus === st && styles.statusToggleTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* AGM Details */}
              <Text style={[styles.modalSectionTitle, { marginTop: 24 }]}>Latest AGM</Text>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Date</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.datePickerWrapper}>
                    <input type="date" value={formatToIsoDate(tempAgmDate)} onChange={(e) => handleTempAgmDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                  </View>
                ) : (
                  <TextInput style={styles.modalInput} value={tempAgmDate} onChangeText={(val) => { setTempAgmDate(val); setTempAgmYear(deriveFinancialYear(val)); }} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                )}
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Year</Text>
                <TextInput style={styles.modalInput} value={tempAgmYear} onChangeText={setTempAgmYear} placeholder="e.g. 2024 - 2025" placeholderTextColor={COLORS.slate400} />
              </View>
              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>AGM Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {['Pending', 'Completed'].map((st) => (
                    <TouchableOpacity key={st} style={[styles.statusToggleChip, tempAgmStatus === st && styles.statusToggleChipActive]} onPress={() => setTempAgmStatus(st)} activeOpacity={0.7}>
                      <Text style={[styles.statusToggleText, tempAgmStatus === st && styles.statusToggleTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Active Loan Details */}
              <View style={[styles.modalHeaderRow, { marginTop: 24, borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={[styles.modalSectionTitle, { marginBottom: 0 }]}>Active Loan</Text>
                <Switch
                  value={tempHasLoan}
                  onValueChange={setTempHasLoan}
                  trackColor={{ false: COLORS.slate300, true: COLORS.primary }}
                  thumbColor="#ffffff"
                />
              </View>
              <Text style={styles.emptySubtitle}>If OFF, no loan fields are required.</Text>

              {tempHasLoan && (
                <View style={{ marginTop: 12 }}>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Loan Type</Text>
                    <TextInput style={styles.modalInput} value={tempLoanType} onChangeText={setTempLoanType} placeholder="e.g. Working Capital" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Sanction Date</Text>
                    {Platform.OS === 'web' ? (
                      <View style={styles.datePickerWrapper}>
                        <input type="date" value={formatToIsoDate(tempLoanSanctionDate)} onChange={(e) => handleTempLoanDateSelect(e.target.value)} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_FAMILY, fontSize: '13px', color: '#1e293b', fontWeight: '500', cursor: 'pointer' }} />
                      </View>
                    ) : (
                      <TextInput style={styles.modalInput} value={tempLoanSanctionDate} onChangeText={setTempLoanSanctionDate} placeholder="DD Mon YYYY" placeholderTextColor={COLORS.slate400} />
                    )}
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Total Beneficiaries</Text>
                    <TextInput style={styles.modalInput} value={tempLoanBeneficiaries} onChangeText={setTempLoanBeneficiaries} placeholder="e.g. 150" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Amount Extended (₹)</Text>
                    <TextInput style={styles.modalInput} value={tempLoanExtended} onChangeText={setTempLoanExtended} placeholder="e.g. 500000" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Amount Recovered (₹)</Text>
                    <TextInput style={styles.modalInput} value={tempLoanRecovered} onChangeText={setTempLoanRecovered} placeholder="e.g. 200000" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                  <View style={styles.modalFormGroup}>
                    <Text style={styles.modalLabel}>Amount Outstanding (₹)</Text>
                    <TextInput style={styles.modalInput} value={tempLoanOutstanding} onChangeText={setTempLoanOutstanding} placeholder="e.g. 300000" keyboardType="numeric" placeholderTextColor={COLORS.slate400} />
                  </View>
                </View>
              )}

              <View style={[styles.btnWrapper, { marginTop: 24, marginBottom: 20 }]}>
                <Pressable 
                  style={({ hovered, pressed }) => [
                    styles.saveModalBtn,
                    pressed && { transform: [{ scale: 0.98 }] },
                    hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
                  ]}
                  onPress={handleSaveModal}
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
  backBtn: { padding: 8, marginRight: 8 },
  topBarTitleContainer: { flex: 1 },
  stickyActionBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  bgBlobTop: {
    position: 'absolute', top: -40, right: -40, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(122, 26, 31, 0.08)', zIndex: -1,
  },
  bgBlobBottomLeft: {
    position: 'absolute', bottom: 80, left: -50, width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(180, 83, 9, 0.06)', zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute', top: '40%', right: -60, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(122, 26, 31, 0.05)', zIndex: -1,
  },
  moduleTag: { 
    color: 'rgba(255,255,255,0.7)', fontFamily: FONT_FAMILY,
    fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginBottom: 2,
  },
  screenTitleHeader: { 
    color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, 
    fontWeight: '800', letterSpacing: -0.16,
  },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 12, gap: 12, paddingBottom: 40 },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.8)',
    borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center',
    gap: 10, borderWidth: 1, borderColor: 'rgba(253, 230, 138, 0.5)',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  alertIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.amber100,
    alignItems: 'center', justifyContent: 'center',
  },
  alertBody: { flex: 1, paddingRight: 8 },
  alertTitle: {
    fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800',
    color: COLORS.amber900, marginBottom: 2,
  },
  alertText: {
    fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500',
    color: 'rgba(146, 64, 14, 0.9)',
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.slate50,
    borderWidth: 1, borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderTitle: { 
    fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', 
    color: COLORS.slate800, letterSpacing: -0.14,
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.slate100, marginLeft: 'auto',
  },
  statusBadgeText: {
    fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800',
  },
  emptySubtitle: {
    fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate500,
    fontStyle: 'italic',
  },
  divider: { height: 1, backgroundColor: COLORS.slate100, marginVertical: 12 },
  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { 
    fontFamily: FONT_FAMILY, fontSize: 8, fontWeight: '800', color: COLORS.slate400,
    letterSpacing: 1.2, marginBottom: 2,
  },
  infoValue: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.slate800 },
  btnWrapper: {
    borderRadius: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  editCtaBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, paddingHorizontal: 16,
  },
  editCtaText: { 
    color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', letterSpacing: 0.5,
  },

  // Modal
  inAppModalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end', zIndex: 9999,
  },
  modalCard: {
    width: '100%', backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, maxHeight: '85%',
    shadowColor: '#0f172a', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 25,
  },
  modalHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.slate100, marginBottom: 16,
  },
  modalTitle: { 
    fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.slate800, letterSpacing: -0.16,
  },
  closeBtnCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.slate50,
    borderWidth: 1, borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  modalFormScroll: { maxHeight: 500 },
  modalSectionTitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate800, marginBottom: 12 },
  modalFormGroup: { marginBottom: 12, gap: 6 },
  modalLabel: { 
    fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '800', color: COLORS.slate500, letterSpacing: 1.2, marginBottom: 2,
  },
  modalInput: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, height: 42,
    fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate800, backgroundColor: COLORS.slate50,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  datePickerWrapper: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 10, paddingHorizontal: 14, height: 42,
    backgroundColor: COLORS.slate50, flexDirection: 'row', alignItems: 'center',
  },
  saveModalBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  saveModalText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  statusToggleChip: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.slate200, backgroundColor: COLORS.slate50, alignItems: 'center', justifyContent: 'center',
  },
  statusToggleChipActive: { borderColor: '#7a1a1f', backgroundColor: '#7a1a1f' },
  statusToggleText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.slate600 },
  statusToggleTextActive: { color: '#FFFFFF' },
});
