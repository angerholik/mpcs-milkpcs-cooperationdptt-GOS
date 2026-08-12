import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6B1212',
  primaryLight: '#FEF2F2',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#059669',
  successBg: '#ECFDF5',
  gold: '#B45309',
  goldBg: '#FEF3C7',
};

const FONT_FAMILY = Platform.select({
  web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  android: 'Roboto',
});

export default function MyInstitutionsScreen({
  user,
  institutions = [],
  onAddInstitution,
  onRemoveInstitution,
  onSelectSociety,
  onProceedToDashboard,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'MPCS', 'MILK'
  const [modalVisible, setModalVisible] = useState(false);

  // Form State for Adding New Institution
  const [instType, setInstType] = useState('MPCS'); // 'MPCS' or 'MILK'
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [regNo, setRegNo] = useState('');
  const [district, setDistrict] = useState(user?.district || '');

  const mpcsCount = institutions.filter(i => i.type === 'MPCS').length;
  const milkCount = institutions.filter(i => i.type === 'MILK').length;

  const filteredInstitutions = institutions.filter(i => {
    if (activeTab === 'MPCS') return i.type === 'MPCS';
    if (activeTab === 'MILK') return i.type === 'MILK';
    return true;
  });

  const handleAddSubmit = () => {
    if (!instName) {
      if (Platform.OS === 'web') alert('Please enter institution name.');
      return;
    }

    const newInst = {
      id: `inst-${Date.now()}`,
      name: instName.trim(),
      type: instType,
      code: instCode.trim() || (instType === 'MPCS' ? `MPCS-${Math.floor(1000 + Math.random() * 9000)}` : `MILK-${Math.floor(1000 + Math.random() * 9000)}`),
      regNo: regNo.trim() || `SIK/${instType}/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
      district: district.trim() || user?.district || '',
      status: 'ACTIVE SOCIETY',
    };

    if (onAddInstitution) onAddInstitution(newInst);
    
    // Reset Form
    setInstName('');
    setInstCode('');
    setRegNo('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Inspector Header */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <View style={styles.roleBadgeRow}>
            <View style={styles.rolePill}>
              <MaterialIcons name="security" size={12} color="#FFFFFF" />
              <Text style={styles.rolePillText}>{user?.role || 'CI'} INSPECTOR</Text>
            </View>
            {user?.district ? <Text style={styles.districtTag}>{user.district}</Text> : null}
          </View>
          <Text style={styles.welcomeName}>{user?.fullName || 'Cooperative Inspector'}</Text>
          <Text style={styles.welcomeSub}>Manage & add your registered MPCS and Milk PCS institutions</Text>
        </View>

        {onLogout && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        {/* Quick Summary Bar */}
        <View style={styles.summaryBarRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{mpcsCount}</Text>
            <Text style={styles.summaryLabel}>MPCS Societies</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{milkCount}</Text>
            <Text style={styles.summaryLabel}>Milk PCS Units</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryVal}>{institutions.length}</Text>
            <Text style={styles.summaryLabel}>Total Managed</Text>
          </View>
        </View>

        {/* Tab Filter Switcher */}
        <View style={styles.tabFilterRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'ALL' && styles.activeFilterChip]}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeTab === 'ALL' && styles.activeFilterChipText]}>ALL ({institutions.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'MPCS' && styles.activeFilterChip]}
            onPress={() => setActiveTab('MPCS')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeTab === 'MPCS' && styles.activeFilterChipText]}>MPCS ({mpcsCount})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'MILK' && styles.activeFilterChip]}
            onPress={() => setActiveTab('MILK')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, activeTab === 'MILK' && styles.activeFilterChipText]}>MILK PCS ({milkCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Add Institution Primary CTA Button */}
        <TouchableOpacity style={styles.addCtaBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialIcons name="add-business" size={20} color="#FFFFFF" />
          <Text style={styles.addCtaText}>+ ADD NEW INSTITUTION (MPCS / MILK PCS)</Text>
        </TouchableOpacity>

        {/* List of Registered Institutions */}
        <View style={styles.listSection}>
          <Text style={styles.sectionHeaderTitle}>Registered Institutions List</Text>

          {filteredInstitutions.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="account-balance" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Institutions Added Yet</Text>
              <Text style={styles.emptySub}>Tap the button above to add your first MPCS or Milk PCS society.</Text>
            </View>
          ) : (
            filteredInstitutions.map((item) => (
              <View key={item.id} style={styles.institutionCard}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.typeBadge, item.type === 'MPCS' ? styles.mpcsTypeBadge : styles.milkTypeBadge]}>
                    <MaterialIcons name={item.type === 'MPCS' ? "domain" : "storefront"} size={14} color="#FFFFFF" />
                    <Text style={styles.typeBadgeText}>{item.type}</Text>
                  </View>
                  <Text style={styles.instCodeText}>{item.code}</Text>
                </View>

                <Text style={styles.instTitle}>{item.name}</Text>
                <Text style={styles.instSub}>{item.regNo} • {item.district}</Text>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.openDashBtn}
                    onPress={() => onSelectSociety && onSelectSociety(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.openDashBtnText}>SELECT & OPEN DASHBOARD</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {onRemoveInstitution && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => onRemoveInstitution(item.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="delete-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Final Dashboard Overview CTA */}
        {institutions.length > 0 && (
          <TouchableOpacity style={styles.proceedDashBtn} onPress={onProceedToDashboard} activeOpacity={0.85}>
            <Text style={styles.proceedDashText}>PROCEED TO DASHBOARD OVERVIEW →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* In-App Slide-Up Sheet Modal for Adding Institution */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add New Institution</Text>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <Text style={styles.modalLabel}>Institution Category</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeSelectBtn, instType === 'MPCS' && styles.activeTypeSelectBtn]}
                  onPress={() => setInstType('MPCS')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="domain" size={18} color={instType === 'MPCS' ? '#FFFFFF' : COLORS.primary} />
                  <Text style={[styles.typeSelectText, instType === 'MPCS' && styles.activeTypeSelectText]}>MPCS Society</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeSelectBtn, instType === 'MILK' && styles.activeTypeSelectBtn]}
                  onPress={() => setInstType('MILK')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="storefront" size={18} color={instType === 'MILK' ? '#FFFFFF' : COLORS.primary} />
                  <Text style={[styles.typeSelectText, instType === 'MILK' && styles.activeTypeSelectText]}>Milk PCS Unit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>{instType === 'MPCS' ? 'MPCS Society Name' : 'Milk PCS Center Name'}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={instName}
                  onChangeText={setInstName}
                  placeholder={instType === 'MPCS' ? "e.g. Dentam MPCS" : "e.g. Pelling Milk PCS"}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Institution Code / ID</Text>
                <TextInput
                  style={styles.modalInput}
                  value={instCode}
                  onChangeText={setInstCode}
                  placeholder={instType === 'MPCS' ? "e.g. MPCS-0008" : "e.g. MILK-0043"}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>Registration Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={regNo}
                  onChangeText={setRegNo}
                  placeholder="e.g. SIK/MPCS/2022/008"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>District / GPU Location</Text>
                <TextInput
                  style={styles.modalInput}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="e.g. Gyalshing District, Sikkim"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <TouchableOpacity style={styles.saveModalBtn} onPress={handleAddSubmit} activeOpacity={0.85}>
                <Text style={styles.saveModalText}>SAVE & REGISTER INSTITUTION</Text>
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
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
  },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rolePillText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  districtTag: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '600' },
  welcomeName: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '700' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontFamily: FONT_FAMILY, fontSize: 11, marginTop: 1 },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 14 },

  summaryBarRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  summaryVal: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800', color: COLORS.primary },
  summaryLabel: { fontFamily: FONT_FAMILY, fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },

  tabFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  activeFilterChipText: { color: '#FFFFFF' },

  addCtaBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    elevation: 2,
  },
  addCtaText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },

  listSection: { marginBottom: 16 },
  sectionHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },

  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  emptySub: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },

  institutionCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mpcsTypeBadge: { backgroundColor: COLORS.primary },
  milkTypeBadge: { backgroundColor: '#1D4ED8' },
  typeBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  instCodeText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  instTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  instSub: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.textSecondary, marginTop: 2, marginBottom: 12 },

  cardActionsRow: { flexDirection: 'row', gap: 8 },
  openDashBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openDashBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  proceedDashBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  proceedDashText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

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
  typeSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14, marginTop: 6 },
  typeSelectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FEF2F2',
  },
  activeTypeSelectBtn: { backgroundColor: COLORS.primary },
  typeSelectText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.primary },
  activeTypeSelectText: { color: '#FFFFFF' },

  modalFormGroup: { marginBottom: 12, gap: 4 },
  modalLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
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
