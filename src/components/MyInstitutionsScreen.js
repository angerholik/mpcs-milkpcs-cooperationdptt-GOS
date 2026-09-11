import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, TextInput, Image, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';

// Web-only: approximates the reference's mix-blend-mode: luminosity treatment
// on the header's mountain photo (RN has no CSS filter/blend-mode support;
// react-native-web passes unrecognized style keys straight to the DOM).
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.55, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.38 };

// STITCH Design Tokens (Matching Dashboard Overview)
const COLORS = {
  background: "#F7F5F2",
  surface: "#ffffff",
  primary: "#7a1a1f",
  primaryDark: "#4a1017",
  onSurface: "#1b1b1d",
  maroon950: "#2A0307",
  maroon900: "#42060B",
  maroon850: "#54080E",
  maroon800: "#680B12",
  maroon700: "#83101A",
  maroon600: "#A11723",
  gold: "#D4AF37",
  goldLight: "#F3E5AB",
  goldDark: "#997D20",
  cream: "#FAF8F5",
  borderCream: "#E8E1D9",
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

const ROLE_LABELS = {
  CI: 'CI',
  ACI: 'ACI',
  PA: 'PA',
};

export default function MyInstitutionsScreen({
  user,
  role,
  displayName,
  institutions = [],
  onAddInstitution,
  onRemoveInstitution,
  onSelectSociety,
  onProceedToDashboard,
  onLogout
}) {
  const isCi = role === 'CI';
  const [modalVisible, setModalVisible] = useState(false);

  // Form State for Adding New Institution
  const [instType, setInstType] = useState('MPCS'); // 'MPCS' or 'MILK'
  const [instName, setInstName] = useState('');
  const [regNo, setRegNo] = useState('');
  const [gpu, setGpu] = useState(user?.district || '');

  const mpcsCount = institutions.filter(i => i.type === 'MPCS').length;
  const milkCount = institutions.filter(i => i.type === 'MILK').length;

  const filteredInstitutions = institutions;

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
      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
      {/* Header + overlapping summary cards stay inside the same capped-width
          scroll content as everything else on this screen (matching every
          other screen's convention: the header is not full-bleed) — on a
          wide desktop browser this renders as one centered mobile-width
          column instead of a full-bleed banner. The cards overlap the
          header via absolute positioning *within* headerWrap, which is
          fine because that's an internal overlap in normal document flow —
          it's only a negative margin at the very top of the ScrollView's
          own content that gets clipped by the scroll boundary. */}
      <View style={styles.headerWrap}>
        <LinearGradient
          colors={[COLORS.maroon850, COLORS.maroon900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topBar}
        >
          <Image
            source={require('../../assets/core/kanchenjunga.jpg')}
            style={[
              StyleSheet.absoluteFillObject,
              // width/height:100% on top of absoluteFillObject's inset:0 —
              // the production web export's atomic-CSS output otherwise
              // keeps a base class sized to the photo's raw intrinsic
              // dimensions (900x675px) and inset:0 alone doesn't override
              // it, so the image renders far larger than the header and
              // effectively disappears once clipped.
              { width: '100%', height: '100%' },
              headerPhotoFilter,
            ]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(84,8,14,0.2)', 'rgba(66,6,11,0.55)', COLORS.maroon900]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.headerTopRow}>
            <View style={styles.rolePill}>
              <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.gold} />
              <Text style={styles.rolePillText}>{ROLE_LABELS[role] || 'CI'}</Text>
              <View style={styles.rolePillDot} />
              {user?.district ? <Text style={styles.rolePillDistrict}>{user.district}</Text> : null}
            </View>

            {onLogout && (
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.75}>
                <MaterialCommunityIcons name="logout" size={16} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerGreetBlock}>
            <Text style={styles.welcomeNameBig}>{displayName || 'Cooperative Inspector'}</Text>
            <Text style={styles.welcomeSub}>
              {isCi ? 'Manage registered MPCS & Milk PCS institutions' : 'View institutions assigned to you'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.summaryBarRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: COLORS.red50 }]}>
              <MaterialCommunityIcons name="office-building" size={16} color={COLORS.maroon700} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: COLORS.onSurface }]}>{mpcsCount}</Text>
              <Text style={styles.summaryLabel}>MPCS Societies</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#eff6ff' }]}>
              <MaterialCommunityIcons name="storefront" size={16} color="#2563eb" />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: '#2563eb' }]}>{milkCount}</Text>
              <Text style={styles.summaryLabel}>Milk PCS Units</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: COLORS.emerald50 }]}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color={COLORS.emerald600} />
            </View>
            <View style={styles.summaryTextGroup}>
              <Text style={[styles.summaryVal, { color: COLORS.emerald700 }]}>{institutions.length}</Text>
              <Text style={styles.summaryLabel}>Total Managed</Text>
            </View>
          </View>
        </View>
      </View>

        {/* Add Institution CTA — CI only. ACI/PA cannot add institutions at
            all (they only ever act on institutions a CI assigned to them),
            so for those roles this control must not exist in the render
            tree — not disabled, not hidden, not an empty state. Static
            solid maroon-gradient pill with a persistent icon badge, per
            the Stitch reference (not a hover-reveal button). */}
        {isCi && (
          <Pressable
            style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={[COLORS.maroon800, COLORS.maroon900]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addInstBtn}
            >
              <View style={styles.addInstIconCircle}>
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.addInstBtnText}>Add New Institution (MPCS / Milk PCS)</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* List of Registered Institutions */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>{isCi ? 'REGISTERED INSTITUTIONS' : 'MY ASSIGNED INSTITUTIONS'}</Text>
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{filteredInstitutions.length}</Text>
            </View>
          </View>

          {filteredInstitutions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="bank-outline" size={32} color={COLORS.maroon800} />
              </View>
              <Text style={styles.emptyTitle}>No Institutions Found</Text>
              <Text style={styles.emptySub}>
                {isCi
                  ? 'Tap the button above to register your first MPCS or Milk PCS unit under your jurisdiction.'
                  : 'No institutions have been assigned to you yet. Contact your Cooperative Inspector.'}
              </Text>
              {isCi && (
                <TouchableOpacity
                  style={styles.emptyRegisterBtn}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyRegisterBtnText}>Register First Institution</Text>
                  <MaterialCommunityIcons name="arrow-right" size={15} color={COLORS.primary} />
                </TouchableOpacity>
              )}
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

        <View style={styles.footerBlock}>
          <Text style={styles.footerLine}>Department of Cooperation • Government of Sikkim</Text>
          <Text style={styles.footerLineMuted}>CORE Engine v2.0.4 • Encrypted Secure Portal</Text>
        </View>
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
  // marginBottom clears the summary cards, which float below this block as
  // an absolutely positioned overlay (see summaryBarRow) rather than taking
  // up normal document space themselves. marginTop/marginHorizontal cancel
  // scrollInner's own padding so the header bleeds edge-to-edge (flush with
  // the real screen on mobile, flush with the capped column's edges on
  // desktop) instead of sitting inset like a card, the way everything else
  // on this screen does.
  headerWrap: { position: 'relative', marginBottom: 50, marginTop: -14, marginHorizontal: -14 },
  topBar: {
    // Explicit position:'relative' so the absolutely-positioned photo and
    // scrim (inset:0) get a real containing block to stretch against — RN
    // native's Yoga layout treats a View as relatively positioned by
    // default, but the web export doesn't reliably carry that over, and
    // without it those children fall back to their own intrinsic size
    // (the photo rendering at its raw 900x675px instead of filling the
    // header) — a bug that only showed up in the production build, not dev.
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 80,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.2)',
    overflow: 'hidden',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rolePillText: { color: COLORS.gold, fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  rolePillDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(212,175,55,0.8)' },
  rolePillDistrict: { color: 'rgba(255,255,255,0.8)', fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '500' },
  welcomeNameBig: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '700', letterSpacing: 0.1 },
  headerGreetBlock: {},
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontFamily: FONT_FAMILY, fontSize: 12, marginTop: 4, lineHeight: 17 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: { flex: 1 },
  // paddingTop clears the summary cards, which float below headerWrap as an
  // absolutely positioned overlay (see summaryBarRow) rather than living
  // inside this scroll content.
  scrollInner: { padding: 14, gap: 14 },

  // Summary Metrics Bar — an absolutely positioned overlay straddling the
  // header's rounded bottom edge (not a negative-margin child of the
  // ScrollView, which clips anything pulled above its own boundary).
  summaryBarRow: {
    position: 'absolute',
    // 28 = the 14 gutter the rest of the content uses + the 14 headerWrap
    // bled outward, so the cards line up with everything below them.
    left: 28,
    right: 28,
    bottom: -50,
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextGroup: { gap: 4 },
  summaryVal: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', lineHeight: 24 },
  summaryLabel: { fontFamily: FONT_FAMILY, fontSize: 10, color: COLORS.slate500, fontWeight: '600', letterSpacing: 0.1 },

  // Add Institution CTA — static solid maroon-gradient pill with a
  // persistent translucent icon badge (matches the Stitch reference).
  addInstBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(161,23,35,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.maroon900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addInstIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInstBtnText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },

  // List Section
  listSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  sectionHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionCountBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(226,232,240,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: COLORS.slate700 },

  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,251,235,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(253,230,138,0.6)',
    marginBottom: 16,
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: COLORS.onSurface, marginBottom: 4 },
  emptySub: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate500, textAlign: 'center', maxWidth: 240, lineHeight: 18, marginBottom: 20 },
  emptyRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.red50,
    borderWidth: 1,
    borderColor: COLORS.red100,
  },
  emptyRegisterBtnText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '600', color: COLORS.maroon800 },

  footerBlock: { alignItems: 'center', paddingTop: 8, paddingBottom: 18, gap: 4 },
  footerLine: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '500', color: COLORS.slate400 },
  footerLineMuted: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '400', color: 'rgba(148,163,184,0.8)' },

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
