import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Modal, Platform } from 'react-native';
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
  amber: '#D97706',
  amberBg: '#FEF3C7',
};

export default function ComplianceScreen({
  hasLoan = false,
  setHasLoan,
  loanType = '',
  setLoanType,
  loanSanctionDate = '',
  setLoanSanctionDate,
  loanBeneficiaries = '',
  setLoanBeneficiaries,
  loanExtended = '',
  setLoanExtended,
  loanRecovered = '',
  setLoanRecovered,
  loanOutstanding = '',
  setLoanOutstanding,
  auditDate = "",
  setAuditDate,
  auditYear = "",
  setAuditYear,
  agmDate = "",
  setAgmDate,
  agmYear = "",
  setAgmYear,
  lastUpdated = "",
  societyName = "",
  onNext,
  onBack
}) {
  // Modals state
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);

  // Temp Compliance State
  const [tempAuditDate, setTempAuditDate] = useState(auditDate || '');
  const [tempAgmDate, setTempAgmDate] = useState(agmDate || '');

  // Temp Loan State inside Modal
  const [tempLoanType, setTempLoanType] = useState(loanType || '');
  const [tempLoanSanctionDate, setTempLoanSanctionDate] = useState(loanSanctionDate || '');
  const [tempLoanBeneficiaries, setTempLoanBeneficiaries] = useState(loanBeneficiaries || '');
  const [tempLoanExtended, setTempLoanExtended] = useState(loanExtended || '');
  const [tempLoanRecovered, setTempLoanRecovered] = useState(loanRecovered || '');
  const [tempLoanOutstanding, setTempLoanOutstanding] = useState(loanOutstanding || '');

  // Date Formatting Utilities
  const formatToInputDate = (dStr) => {
    if (!dStr) return '2025-03-15';
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    if (dStr.includes('-') && dStr.length === 10) return dStr;
    return '2025-03-15';
  };

  const formatFromInputDate = (iStr) => {
    if (!iStr) return '';
    const parts = iStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return iStr;
  };

  const getYear = (dStr) => {
    if (!dStr) return '2025';
    if (dStr.includes('/')) {
      const parts = dStr.split('/');
      return parts[parts.length - 1];
    }
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      return parts[0].length === 4 ? parts[0] : parts[parts.length - 1];
    }
    return '2025';
  };

  // Switch Active Loan Toggle
  const handleToggleLoan = (val) => {
    if (setHasLoan) setHasLoan(val);
    if (val) {
      setLoanModalVisible(true); // Auto pop-up modal when YES is checked
    }
  };

  // Save Loan Modal Form
  const handleSaveLoanModal = () => {
    if (setLoanType) setLoanType(tempLoanType);
    if (setLoanSanctionDate) setLoanSanctionDate(tempLoanSanctionDate);
    if (setLoanBeneficiaries) setLoanBeneficiaries(tempLoanBeneficiaries);
    if (setLoanExtended) setLoanExtended(tempLoanExtended);
    if (setLoanRecovered) setLoanRecovered(tempLoanRecovered);
    if (setLoanOutstanding) setLoanOutstanding(tempLoanOutstanding);
    setLoanModalVisible(false);
  };

  // Save Audit/AGM Compliance Modal
  const handleSaveComplianceModal = () => {
    const formattedAudit = tempAuditDate.includes('-') ? formatFromInputDate(tempAuditDate) : tempAuditDate;
    const formattedAgm = tempAgmDate.includes('-') ? formatFromInputDate(tempAgmDate) : tempAgmDate;

    const calcAuditYear = getYear(formattedAudit);
    const calcAgmYear = getYear(formattedAgm);

    if (setAuditDate) setAuditDate(formattedAudit);
    if (setAuditYear) setAuditYear(calcAuditYear);
    if (setAgmDate) setAgmDate(formattedAgm);
    if (setAgmYear) setAgmYear(calcAgmYear);

    setComplianceModalVisible(false);
  };

  const displayAudit = auditDate || "15/03/2025";
  const displayAuditYr = auditYear || getYear(displayAudit) || "2025";
  const displayAgm = agmDate || "20/04/2025";
  const displayAgmYr = agmYear || getYear(displayAgm) || "2025";

  return (
    <View style={styles.container}>
      {/* Deep Burgundy Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Milk PCS Compliance</Text>
        <Text style={styles.stepIndicator}>Section E</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        {/* Status Card */}
        <View style={styles.statusBanner}>
          <View style={styles.statusChip}>
            <MaterialIcons name="verified" size={18} color={COLORS.success} />
            <Text style={styles.statusChipText}>COMPLIANCE VERIFIED</Text>
          </View>
          <Text style={styles.bannerHeading}>{societyName ? `${societyName} • ` : ''}Compliance Overview</Text>
          {lastUpdated ? <Text style={styles.bannerSub}>Last Verified: {lastUpdated}</Text> : null}
        </View>

        {/* 1. Active Institutional Loan Card */}
        <View style={[styles.card, hasLoan && styles.cardHighlight]}>
          <View style={styles.rowBetween}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
              <MaterialIcons name="account-balance" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Active Institutional Loan</Text>
              <Text style={styles.cardSub}>Declare if the cooperative holds institutional debt</Text>
            </View>
            <Switch
              value={hasLoan}
              onValueChange={handleToggleLoan}
              trackColor={{ false: '#CBD5E1', true: COLORS.primary }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          {/* When Active Loan is YES, show summary card + Edit Popup button */}
          {hasLoan && (
            <View style={styles.loanSummaryBox}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Loan Type</Text>
                  <Text style={styles.summaryValue}>{loanType || 'Not specified'}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Sanction Date</Text>
                  <Text style={styles.summaryValue}>{loanSanctionDate || '-'}</Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Beneficiaries</Text>
                  <Text style={styles.summaryValue}>{loanBeneficiaries ? `${loanBeneficiaries} Producers` : '-'}</Text>
                </View>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Outstanding Due</Text>
                  <Text style={[styles.summaryValue, { color: '#C2410C' }]}>₹ {loanOutstanding || '0'}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.editLoanBtn} onPress={() => setLoanModalVisible(true)} activeOpacity={0.85}>
                <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                <Text style={styles.editLoanBtnText}>EDIT LOAN DETAILS</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 2. Audit & AGM Records Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderLabel}>AUDIT & AGM COMPLIANCE</Text>

          <View style={styles.auditRow}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <MaterialIcons name="assignment-turned-in" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.auditLabel}>Latest Audit Conducted</Text>
              <Text style={styles.auditValue}>{displayAudit}</Text>
            </View>
            <View style={styles.yearChip}>
              <Text style={styles.yearChipLabel}>Year</Text>
              <Text style={styles.yearChipValue}>{displayAuditYr}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.auditRow}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.amberBg }]}>
              <MaterialIcons name="groups" size={20} color={COLORS.amber} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.auditLabel}>Latest AGM Conducted</Text>
              <Text style={styles.auditValue}>{displayAgm}</Text>
            </View>
            <View style={[styles.yearChip, { backgroundColor: COLORS.amberBg, borderColor: '#FDE68A' }]}>
              <Text style={[styles.yearChipLabel, { color: COLORS.amber }]}>Year</Text>
              <Text style={[styles.yearChipValue, { color: COLORS.amber }]}>{displayAgmYr}</Text>
            </View>
          </View>
        </View>

        {/* Primary CTA Trigger for Audit/AGM */}
        <TouchableOpacity style={styles.updateCtaBtn} onPress={() => setComplianceModalVisible(true)} activeOpacity={0.85}>
          <MaterialIcons name="edit-calendar" size={20} color="#FFFFFF" />
          <Text style={styles.updateCtaText}>UPDATE AUDIT & AGM DATES</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. POP-UP MODAL: UPDATE ACTIVE LOAN DETAILS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Modal visible={loanModalVisible} animationType="slide" transparent onRequestClose={() => setLoanModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="account-balance" size={22} color={COLORS.primary} />
                <Text style={styles.modalHeaderTitle}>Update Active Loan Details</Text>
              </View>
              <TouchableOpacity onPress={() => setLoanModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Field 1: Type of Loans */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>TYPE OF LOANS</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="format-list-bulleted" size={18} color={COLORS.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    value={tempLoanType}
                    onChangeText={setTempLoanType}
                    placeholder="e.g. Working Capital"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Field 2: Date of Loan Sanctioned */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>DATE OF LOAN SANCTIONED</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} style={styles.fieldIcon} />
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={formatToInputDate(tempLoanSanctionDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setTempLoanSanctionDate(formatFromInputDate(e.target.value));
                        }
                      }}
                      style={styles.webModalDatePicker}
                    />
                  ) : (
                    <TextInput
                      style={styles.fieldInput}
                      value={tempLoanSanctionDate}
                      onChangeText={setTempLoanSanctionDate}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#94A3B8"
                    />
                  )}
                </View>
              </View>

              {/* Field 3: Total Number of Beneficiaries */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>TOTAL NUMBER OF BENEFICIARIES</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="groups" size={18} color={COLORS.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    value={tempLoanBeneficiaries}
                    onChangeText={setTempLoanBeneficiaries}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Field 4: Total Loan Extended in Last FY */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>TOTAL LOAN EXTENDED IN LAST FY (RS)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={tempLoanExtended}
                    onChangeText={setTempLoanExtended}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Field 5: Total Loan Recovered in Last FY */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>TOTAL LOAN RECOVERED IN LAST FY (RS)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={tempLoanRecovered}
                    onChangeText={setTempLoanRecovered}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Field 6: Total Loan Outstanding in Last FY */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>TOTAL LOAN OUTSTANDING IN LAST FY (RS)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={tempLoanOutstanding}
                    onChangeText={setTempLoanOutstanding}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoanModal} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>SAVE LOAN DETAILS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. POP-UP MODAL: UPDATE AUDIT & AGM DATES */}
      {/* ──────────────────────────────────────────────────────────── */}
      <Modal visible={complianceModalVisible} animationType="slide" transparent onRequestClose={() => setComplianceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="event" size={22} color={COLORS.primary} />
                <Text style={styles.modalHeaderTitle}>Update Audit & AGM Dates</Text>
              </View>
              <TouchableOpacity onPress={() => setComplianceModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Audit Date Selector */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>LATEST AUDIT CONDUCTED DATE</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={formatToInputDate(tempAuditDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setTempAuditDate(e.target.value);
                        }
                      }}
                      style={styles.webModalDatePicker}
                    />
                  ) : (
                    <TextInput
                      style={styles.fieldInput}
                      value={tempAuditDate}
                      onChangeText={setTempAuditDate}
                      placeholder="YYYY-MM-DD or DD/MM/YYYY"
                      placeholderTextColor="#94A3B8"
                    />
                  )}
                </View>
                <View style={styles.autoYearBadge}>
                  <Text style={styles.autoYearText}>
                    Auto-fetched Audit Year: <Text style={{ fontWeight: '900', color: COLORS.primary }}>{getYear(tempAuditDate)}</Text>
                  </Text>
                </View>
              </View>

              {/* AGM Date Selector */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>LATEST AGM CONDUCTED DATE</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="date-range" size={20} color={COLORS.amber} style={{ marginRight: 10 }} />
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={formatToInputDate(tempAgmDate)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setTempAgmDate(e.target.value);
                        }
                      }}
                      style={styles.webModalDatePicker}
                    />
                  ) : (
                    <TextInput
                      style={styles.fieldInput}
                      value={tempAgmDate}
                      onChangeText={setTempAgmDate}
                      placeholder="YYYY-MM-DD or DD/MM/YYYY"
                      placeholderTextColor="#94A3B8"
                    />
                  )}
                </View>
                <View style={[styles.autoYearBadge, { backgroundColor: COLORS.amberBg, borderColor: '#FDE68A' }]}>
                  <Text style={[styles.autoYearText, { color: COLORS.amber }]}>
                    Auto-fetched AGM Year: <Text style={{ fontWeight: '900', color: COLORS.amber }}>{getYear(tempAgmDate)}</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveComplianceModal} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>SAVE & UPDATE COMPLIANCE</Text>
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
  statusBanner: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    elevation: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusChipText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  bannerHeading: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  bannerSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHighlight: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },
  loanSummaryBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  summaryValue: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  editLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#7C1C1C',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
    outlineStyle: 'none',
  },
  editLoanBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  auditValue: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  yearChip: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  yearChipLabel: { fontSize: 9, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
  yearChipValue: { fontSize: 13, fontWeight: '900', color: COLORS.primary },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  updateCtaBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    elevation: 2,
  },
  updateCtaText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
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

  // Modal Overlay & Form Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  modalFieldGroup: { marginBottom: 14, gap: 4 },
  modalLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  fieldIcon: { marginRight: 8 },
  currencyPrefix: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginRight: 8 },
  fieldInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '700', outlineStyle: 'none' },
  webModalDatePicker: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    cursor: 'pointer',
  },
  autoYearBadge: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  autoYearText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
