import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import AnimatedContinueButton from './AnimatedContinueButton';

// STITCH Design Tokens (Matching Dashboard Overview)
const COLORS = {
  background: "#fcf8fa",
  surface: "#ffffff",
  primary: "#7a1a1f",
  primaryDark: "#4a1017",
  onSurface: "#1b1b1d",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  amber50: "#fffbeb",
  amber100: "#fef3c7",
  amber600: "#d97706",
  amber700: "#b45309",
  amber800: "#92400e",
  amber900: "#78350f",
  emerald50: "#ecfdf5",
  emerald100: "#d1fae5",
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald700: "#047857",
  red50: "#fef2f2",
  red100: "#fee2e2",
  red600: "#dc2626",
};

const FONT_FAMILY = Platform.select({
  web: 'Manrope, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  const [regNo, setRegNo] = useState('');
  const [gpu, setGpu] = useState(user?.district || '');

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

    const gpuVal = gpu.trim() || user?.district || '';
    const newInst = {
      id: `inst-${Date.now()}`,
      name: instName.trim(),
      type: instType,
      regNo: regNo.trim(),
      gpu: gpuVal,
      district: gpuVal,
      status: 'ACTIVE SOCIETY',
    };

    if (onAddInstitution) onAddInstitution(newInst);
    
    // Reset Form
    setInstName('');
    setRegNo('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Inspector Header with Rich Crimson Gradient */}
      <LinearGradient
        colors={['#7a1a1f', '#4a1017']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.roleBadgeRow}>
            <View style={styles.rolePill}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#FDE68A" />
              <Text style={styles.rolePillText}>{user?.role || 'CI'} INSPECTOR</Text>
            </View>
            {user?.district ? (
              <View style={styles.districtPill}>
                <MaterialCommunityIcons name="map-marker-outline" size={11} color="rgba(255,255,255,0.75)" />
                <Text style={styles.districtTag}>{user.district}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.welcomeName}>{user?.fullName || 'Cooperative Inspector'}</Text>
          <Text style={styles.welcomeSub}>Manage registered MPCS & Milk PCS institutions</Text>
        </View>

        {onLogout && (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.75}>
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Decorative Ambient Background Blobs (Matches Dashboard Overview) */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        {/* Modern Quick Summary Cards Bar */}
        <View style={styles.summaryBarRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: COLORS.red50 }]}>
              <MaterialCommunityIcons name="office-building" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: COLORS.primary }]}>{mpcsCount}</Text>
              <Text style={styles.summaryLabel}>MPCS SOCIETIES</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="storefront" size={16} color="#2563eb" />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: '#2563eb' }]}>{milkCount}</Text>
              <Text style={styles.summaryLabel}>MILK PCS UNITS</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: COLORS.emerald50 }]}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color={COLORS.emerald600} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: COLORS.emerald700 }]}>{institutions.length}</Text>
              <Text style={styles.summaryLabel}>TOTAL MANAGED</Text>
            </View>
          </View>
        </View>

        {/* Tab Filter Switcher */}
        <View style={styles.tabFilterContainer}>
          <TouchableOpacity
            style={styles.filterChipWrapper}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.85}
          >
            {activeTab === 'ALL' ? (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>ALL ({institutions.length})</Text>
              </View>
            ) : (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>ALL ({institutions.length})</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChipWrapper}
            onPress={() => setActiveTab('MPCS')}
            activeOpacity={0.85}
          >
            {activeTab === 'MPCS' ? (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>MPCS ({mpcsCount})</Text>
              </View>
            ) : (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>MPCS ({mpcsCount})</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChipWrapper}
            onPress={() => setActiveTab('MILK')}
            activeOpacity={0.85}
          >
            {activeTab === 'MILK' ? (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>MILK PCS ({milkCount})</Text>
              </View>
            ) : (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>MILK PCS ({milkCount})</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Add Institution CTA — same pale-bg / dark-circle treatment as
            Save & Continue, so it doesn't stack a third block of maroon
            directly under the header and the active filter chip. */}
        <AnimatedContinueButton
          label="ADD NEW INSTITUTION (MPCS / MILK PCS)"
          icon="plus"
          onPress={() => setModalVisible(true)}
          height={52}
          fontSize={11}
        />

        {/* List of Registered Institutions */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>REGISTERED INSTITUTIONS</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{filteredInstitutions.length}</Text>
            </View>
          </View>

          {filteredInstitutions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="office-building-remove-outline" size={32} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>No Institutions Found</Text>
              <Text style={styles.emptySub}>Tap the button above to register your first MPCS or Milk PCS unit.</Text>
            </View>
          ) : (
            filteredInstitutions.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => onSelectSociety && onSelectSociety(item)}
                style={({ hovered, pressed }) => [
                  styles.institutionCard,
                  Platform.OS === 'web' && { transition: 'all 0.2s ease', cursor: 'pointer' },
                  hovered && { borderColor: COLORS.primary, shadowOpacity: 0.1, elevation: 4 },
                  pressed && { transform: [{ scale: 0.995 }] }
                ]}
              >
                {({ hovered }) => (
                  <>
                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        {item.type === 'MPCS' ? (
                          <LinearGradient
                            colors={['#7a1a1f', '#5c1317']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.typeBadgeGradient}
                          >
                            <MaterialCommunityIcons name="office-building" size={12} color="#FFFFFF" />
                            <Text style={styles.typeBadgeText}>MPCS</Text>
                          </LinearGradient>
                        ) : (
                          <LinearGradient
                            colors={['#2563eb', '#1d4ed8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.typeBadgeGradient}
                          >
                            <MaterialCommunityIcons name="storefront" size={12} color="#FFFFFF" />
                            <Text style={styles.typeBadgeText}>MILK PCS</Text>
                          </LinearGradient>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={styles.instCodePill}>
                            <Text style={styles.instCodeText}>{item.gpu || item.district || 'GPU'}</Text>
                          </View>
                          {onRemoveInstitution && (
                            <TouchableOpacity
                              style={styles.deleteBtn}
                              onPress={(e) => { e.stopPropagation?.(); onRemoveInstitution(item.id); }}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={15} color={COLORS.red600} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      <Text style={[styles.instTitle, hovered && { color: COLORS.primary }]}>{item.name}</Text>

                      <View style={styles.locationRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={13} color={COLORS.slate400} />
                        <Text style={styles.instSub}>{item.regNo || 'Reg. No. Not Set'} • GPU: {item.gpu || item.district || 'Not Set'}</Text>
                      </View>

                      <View style={styles.openDashRow}>
                        <Text style={[styles.openDashLinkText, hovered && { color: COLORS.primary }]}>Open Dashboard</Text>
                        <MaterialCommunityIcons name="arrow-right" size={15} color={hovered ? COLORS.primary : COLORS.slate400} />
                      </View>
                    </View>
                  </>
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* Final Dashboard Overview CTA in Emerald Gradient */}
        {institutions.length > 0 && (
          <Pressable
            style={({ hovered, pressed }) => [
              styles.proceedDashBtnWrapper,
              pressed && { transform: [{ scale: 0.98 }] },
              hovered && { opacity: 0.95 }
            ]}
            onPress={onProceedToDashboard}
          >
            {({ hovered }) => (
              <LinearGradient
                colors={['#10b981', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.proceedDashBtn,
                  hovered && Platform.OS === 'web' && { shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 }
                ]}
              >
                <Text style={styles.proceedDashText}>PROCEED TO DASHBOARD OVERVIEW</Text>
                <MaterialCommunityIcons 
                  name="arrow-right" 
                  size={18} 
                  color="#FFFFFF" 
                  style={hovered && Platform.OS === 'web' ? { transform: [{ translateX: 4 }] } : null}
                />
              </LinearGradient>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* In-App Slide-Up Sheet Modal for Adding Institution */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Add New Institution</Text>
                <Text style={styles.modalSubTitle}>Register a new MPCS society or Milk PCS unit</Text>
              </View>
              <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <MaterialIcons name="close" size={18} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Type Switcher */}
              <Text style={styles.modalLabel}>INSTITUTION CATEGORY</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setInstType('MPCS')}
                  activeOpacity={0.85}
                >
                  {instType === 'MPCS' ? (
                    <LinearGradient
                      colors={['#7a1a1f', '#4a1017']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activeTypeBtnGradient}
                    >
                      <MaterialCommunityIcons name="office-building" size={18} color="#FFFFFF" />
                      <Text style={styles.activeTypeSelectText}>MPCS Society</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.inactiveTypeBtn}>
                      <MaterialCommunityIcons name="office-building" size={18} color={COLORS.slate500} />
                      <Text style={styles.typeSelectText}>MPCS Society</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setInstType('MILK')}
                  activeOpacity={0.85}
                >
                  {instType === 'MILK' ? (
                    <LinearGradient
                      colors={['#7a1a1f', '#4a1017']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activeTypeBtnGradient}
                    >
                      <MaterialCommunityIcons name="storefront" size={18} color="#FFFFFF" />
                      <Text style={styles.activeTypeSelectText}>Milk PCS Unit</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.inactiveTypeBtn}>
                      <MaterialCommunityIcons name="storefront" size={18} color={COLORS.slate500} />
                      <Text style={styles.typeSelectText}>Milk PCS Unit</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>{instType === 'MPCS' ? 'MPCS SOCIETY NAME' : 'MILK PCS CENTER NAME'}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={instName}
                  onChangeText={setInstName}
                  placeholder={instType === 'MPCS' ? "e.g. Dentam MPCS" : "e.g. Pelling Milk PCS"}
                  placeholderTextColor={COLORS.slate400}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>REGISTRATION NUMBER</Text>
                <TextInput
                  style={styles.modalInput}
                  value={regNo}
                  onChangeText={setRegNo}
                  placeholder="e.g. SIK/MPCS/2022/008"
                  placeholderTextColor={COLORS.slate400}
                />
              </View>

              <View style={styles.modalFormGroup}>
                <Text style={styles.modalLabel}>GPU NAME (GRAM PANCHAYAT UNIT)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={gpu}
                  onChangeText={setGpu}
                  placeholder="e.g. Dentam GPU, Gyalshing"
                  placeholderTextColor={COLORS.slate400}
                />
              </View>

              <TouchableOpacity onPress={handleAddSubmit} activeOpacity={0.85} style={{ marginTop: 10, marginBottom: 14 }}>
                <LinearGradient
                  colors={['#7a1a1f', '#4a1017']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveModalBtnGradient}
                >
                  <Text style={styles.saveModalText}>SAVE & REGISTER INSTITUTION</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  roleBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rolePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rolePillText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  districtPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  districtTag: { color: 'rgba(255,255,255,0.85)', fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '600' },
  welcomeName: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  welcomeSub: { color: 'rgba(255,255,255,0.75)', fontFamily: FONT_FAMILY, fontSize: 11, marginTop: 2 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ambient Blobs (Matches Dashboard Overview)
  bgBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(122, 26, 31, 0.06)',
    zIndex: -1,
  },
  bgBlobBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(180, 83, 9, 0.05)',
    zIndex: -1,
  },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 14, gap: 14 },

  // Summary Metrics Bar
  summaryBarRow: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextGroup: { gap: 1 },
  summaryVal: { fontFamily: FONT_FAMILY, fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontFamily: FONT_FAMILY, fontSize: 9, color: COLORS.slate500, fontWeight: '800', letterSpacing: 0.5 },

  // Tab Filter Switcher
  tabFilterContainer: { flexDirection: 'row', gap: 8 },
  filterChipWrapper: { flex: 1 },
  filterChip: {
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Tonal rather than solid-filled — a solid maroon gradient here, right
  // beneath the maroon header, made the whole top of the screen read as
  // one heavy red block.
  activeFilterChip: {
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(122,26,31,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(122,26,31,0.25)',
  },
  filterChipText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.slate600 },
  activeFilterChipText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.3 },

  // Add Institution CTA — outlined, not solid-filled, for the same reason.
  addCtaBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCtaText: { color: COLORS.primary, fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },

  // List Section
  listSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  sectionHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate700, letterSpacing: 1.2 },
  sectionCountBadge: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  sectionCountText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate600 },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.slate100,
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: COLORS.onSurface },
  emptySub: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate500, textAlign: 'center', maxWidth: 260 },

  institutionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  instCodePill: {
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  instCodeText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.slate600 },
  instTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2 },
  instSub: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate500, fontWeight: '500' },

  openDashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  openDashLinkText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.2 },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  proceedDashBtnWrapper: { borderRadius: 16, overflow: 'hidden', marginTop: 4, marginBottom: 12 },
  proceedDashBtn: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  proceedDashText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },

  // In-App Slide-Up Sheet Modal
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
    elevation: 25,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.slate300,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    marginBottom: 14,
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: COLORS.onSurface },
  modalSubTitle: { fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate500, marginTop: 2 },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFormScroll: { maxHeight: 420 },
  typeSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 14, marginTop: 6 },
  activeTypeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  inactiveTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.slate50,
  },
  typeSelectText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '700', color: COLORS.slate600 },
  activeTypeSelectText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  modalFormGroup: { marginBottom: 12, gap: 6 },
  modalLabel: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.8 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    color: COLORS.onSurface,
    backgroundColor: COLORS.slate50,
    outlineStyle: 'none',
  },
  saveModalBtnGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveModalText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
});
