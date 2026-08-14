import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
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
  primaryLight: '#FEF2F2',
  amber900: '#78350f',
  amber100: '#fef3c7',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  red50: '#fef2f2',
  red600: '#dc2626',
};

const FONT_FAMILY = 'Manrope';

export default function MpcsReviewSubmitScreen({
  societyName = "",
  reportingMonth = "",
  sectionStates = {},
  cscIsActive = false,
  activitiesCount = 0,
  onSubmitReturn,
  onNavigateSection,
  onBack
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Helper to format timestamp
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const evidenceState = sectionStates.evidence || { status: 'NOT CAPTURED' };
  const isValid = evidenceState.validUntil && new Date() < new Date(evidenceState.validUntil);
  const isEvidenceCaptured = (st) => Boolean(st) && st.includes('CAPTURED') && !st.includes('NOT');
  const hasCaptured = isEvidenceCaptured(evidenceState.status) || evidenceState.status?.includes('Valid') || evidenceState.status?.includes('EXPIRED');
  
  const isEvidenceComplete = hasCaptured && isValid;
  
  const displayEvidenceStatus = (!isValid && hasCaptured) ? 'EXPIRED' : (evidenceState.status || 'NOT CAPTURED');

  const evidenceSubText = isValid 
    ? `Valid until ${formatTime(evidenceState.validUntil)}` 
    : ((!isValid && hasCaptured) ? 'Please recapture evidence' : (evidenceState.updatedAt ? `Captured ${formatTime(evidenceState.updatedAt)}` : ''));

  const salesState = sectionStates.sales || { status: 'NOT COMPLETED' };
  const isSalesComplete = salesState.status.includes('COMPLETED') || salesState.status.includes('UPDATED');

  const businessState = sectionStates.business || { status: 'NOT COMPLETED' };
  const isBusinessComplete = businessState.status.includes('COMPLETED') || businessState.status.includes('UPDATED');

  const cscState = sectionStates.csc || { status: 'NOT COMPLETED' };
  const isCscComplete = cscState.status.includes('COMPLETED') || cscState.status.includes('UPDATED');

  const activitiesState = sectionStates.activities || { status: '0 ENTRIES' };
  const isActivitiesComplete = activitiesCount > 0;

  const sections = [
    { 
      title: 'Digital Evidence',          
      status: displayEvidenceStatus,   
      subText: evidenceSubText,
      isComplete: isEvidenceComplete,   
      isNA: false, 
      screenKey: 'MPCS_EVIDENCE' 
    },
    { 
      title: 'Monthly Sales / Deposit',   
      status: salesState.status,      
      subText: salesState.updatedAt ? `Last updated ${formatTime(salesState.updatedAt)}` : '',
      isComplete: isSalesComplete,      
      isNA: false, 
      screenKey: 'MPCS_SALES' 
    },
    { 
      title: 'Business Performance',      
      status: businessState.status,   
      subText: businessState.updatedAt ? `Last updated ${formatTime(businessState.updatedAt)}` : '',
      isComplete: isBusinessComplete,   
      isNA: false, 
      screenKey: 'MPCS_BUSINESS' 
    },
    {
      title: 'CSC Monthly Transactions',
      status: !cscIsActive ? 'CSC SERVICES NOT AVAILABLE' : cscState.status,
      subText: (!cscIsActive || !cscState.updatedAt) ? '' : `Last updated ${formatTime(cscState.updatedAt)}`,
      isComplete: !cscIsActive ? false : isCscComplete,
      isNA: !cscIsActive,
      isOptional: !cscIsActive,
      screenKey: 'MPCS_CSC_TRANS',
    },
    { 
      title: 'Activities / Events Log',   
      status: `${activitiesCount} ENTRIES`, 
      subText: activitiesState.updatedAt ? `Last updated ${formatTime(activitiesState.updatedAt)}` : '',
      isComplete: isActivitiesComplete, 
      isNA: false, 
      screenKey: 'MPCS_ACTIVITIES' 
    },
  ];

  // Only mandatory (non-NA/non-optional) sections block submission
  const mandatorySections = sections.filter(sec => !sec.isNA);
  const allSectionsComplete = mandatorySections.every(sec => sec.isComplete);
  const completedCount = mandatorySections.filter(sec => sec.isComplete).length;
  const requiredCount = mandatorySections.length;

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    let success = true;
    try {
      if (onSubmitReturn) {
        const res = await onSubmitReturn();
        if (res && res.error) {
          success = false;
          if (Platform.OS === 'web') {
            alert(`Submission Error: ${res.error.message || 'Failed to save submission to database.'}`);
          }
        }
      }
    } catch (e) {
      success = false;
      if (Platform.OS === 'web') {
        alert(`Submission Failed: ${e.message || 'Unexpected network error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
    if (success) {
      setSubmitted(true);
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
          <Text style={styles.moduleTag}>MPCS</Text>
          <Text style={styles.screenTitleHeader}>Review & Submit Return</Text>
        </View>
      </View>

      {/* Decorative Ambient Background Blobs */}
      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />
      <View style={styles.bgBlobBottomRight} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
        
        {/* Month Banner */}
        <View style={styles.monthBannerCard}>
          <LinearGradient
            colors={['rgba(122, 26, 31, 0.95)', 'rgba(74, 16, 23, 0.95)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.monthBannerContent}>
            <View>
              <Text style={styles.monthBannerSub}>MONTHLY REPORT</Text>
              <Text style={styles.monthBannerTitle}>{reportingMonth || "AUG 2024"}</Text>
              <Text style={styles.societyNameSub}>{societyName || "Khorong"}</Text>
            </View>
            <View style={styles.monthBannerIconBox}>
              <MaterialCommunityIcons name="file-document-check-outline" size={28} color="#ffffff" />
            </View>
          </View>
        </View>

        {/* Section Completion Checklist */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="format-list-checks" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Monthly Sections</Text>
              <Text style={styles.cardHeaderSub}>
                Tap any section to independently view or update it.
                {!cscIsActive ? '  •  CSC: Optional' : ''}
              </Text>
            </View>
          </View>

          {sections.map((sec, idx) => {
            const isTappable = !sec.isNA && onNavigateSection;
            const RowWrapper = isTappable ? TouchableOpacity : View;
            const rowProps = isTappable
              ? {
                  onPress: () => onNavigateSection(sec.screenKey),
                  activeOpacity: 0.75,
                  style: [styles.checkRow, idx > 0 && styles.rowBorder, sec.isNA && styles.checkRowNA, styles.checkRowTappable],
                }
              : { style: [styles.checkRow, idx > 0 && styles.rowBorder, sec.isNA && styles.checkRowNA] };

            return (
              <RowWrapper key={sec.title} {...rowProps}>
                {/* Left icon */}
                <MaterialCommunityIcons
                  name={sec.isNA ? 'minus-circle-outline' : sec.isComplete ? 'check-circle' : 'alert-circle-outline'}
                  size={20}
                  color={sec.isNA ? COLORS.slate400 : sec.isComplete ? COLORS.emerald500 : COLORS.primary}
                />
                {/* Title & SubText */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkTitle, sec.isNA && styles.checkTitleNA]}>{sec.title}</Text>
                  {sec.subText ? (
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate500, marginTop: 2 }}>{sec.subText}</Text>
                  ) : null}
                </View>
                {/* Status chip */}
                <View style={[
                  styles.statusChip,
                  {
                    backgroundColor: sec.isNA ? COLORS.slate100 : sec.isComplete ? COLORS.emerald50 : COLORS.red50,
                    borderColor: sec.isNA ? 'rgba(148,163,184,0.3)' : sec.isComplete ? 'rgba(16,185,129,0.2)' : 'rgba(220,38,38,0.2)',
                  }
                ]}>
                  <Text style={[styles.statusChipText, {
                    color: sec.isNA ? COLORS.slate400 : sec.isComplete ? COLORS.emerald700 : COLORS.primary,
                    fontStyle: sec.isNA ? 'italic' : 'normal',
                  }]}>
                    {sec.status}
                  </Text>
                </View>
                {/* OPTIONAL badge for inactive CSC */}
                {sec.isOptional && (
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                  </View>
                )}
                {/* Tap-to-fix chevron */}
                {isTappable && (
                  <View style={styles.goChevronBox}>

                    <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
                  </View>
                )}
              </RowWrapper>
            );
          })}

          {/* Incomplete hint */}
          {!allSectionsComplete && (
            <View style={styles.incompleteHint}>
              <MaterialCommunityIcons name="gesture-tap" size={14} color={COLORS.amber900} />
              <Text style={styles.incompleteHintText}>Tap any incomplete section above to go back and fill it in.</Text>
            </View>
          )}
        </View>

        {/* Warning Callout */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIconBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Permanent Record</Text>
            <Text style={styles.warningText}>
              Submitting this return creates a permanent historical record for {societyName || reportingMonth || 'this society'}. Master data will remain unchanged.
            </Text>
          </View>
        </View>

        {/* Submit CTA Button */}
        <View style={[styles.btnWrapper, { marginBottom: 20 }, !allSectionsComplete && { shadowOpacity: 0, elevation: 0 }]}>
          <Pressable 
            style={({ hovered, pressed }) => [
              styles.submitCtaBtn,
              pressed && allSectionsComplete && { transform: [{ scale: 0.98 }] },
              hovered && allSectionsComplete && Platform.OS === 'web' && { shadowOpacity: 0.4 }
            ]}
            onPress={() => {
              if (allSectionsComplete) {
                setModalVisible(true);
              }
            }}
            disabled={!allSectionsComplete}
          >
            <LinearGradient
              colors={allSectionsComplete ? ['#7a1a1f', '#4a1017'] : [COLORS.slate300, COLORS.slate400]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.submitCtaText, !allSectionsComplete && { color: COLORS.slate500 }]}>
              {allSectionsComplete ? "Submit Monthly Return" : "Complete Sections to Submit"}
            </Text>
            {allSectionsComplete && <MaterialCommunityIcons name="send-check" size={18} color="#ffffff" />}
          </Pressable>
        </View>
      </ScrollView>

      {/* In-App Slide-Up Sheet */}
      {modalVisible && (
        <View style={styles.inAppModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            {submitted ? (
              <View style={{ alignItems: 'center', paddingVertical: 10, gap: 12 }}>
                <View style={styles.successIconCircle}>
                  <MaterialCommunityIcons name="check-decagram" size={48} color={COLORS.emerald500} />
                </View>
                <Text style={styles.successModalTitle}>Return Submitted!</Text>
                <Text style={{ textAlign: 'center', color: COLORS.slate500, fontSize: 13, fontFamily: FONT_FAMILY, lineHeight: 20, paddingHorizontal: 10 }}>
                  Monthly return for {societyName || reportingMonth || 'this society'} has been sealed into the official MPCS ledger.
                </Text>
                <View style={[styles.btnWrapper, { width: '100%', marginTop: 16 }]}>
                  <Pressable style={styles.submitCtaBtn} onPress={() => { setModalVisible(false); onBack(); }}>
                    <LinearGradient
                      colors={['#047857', '#064e3b']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={styles.submitCtaText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Confirm Final Submission</Text>
                  <TouchableOpacity style={styles.closeBtnCircle} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="close" size={18} color={COLORS.slate500} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: COLORS.slate500, fontSize: 14, fontFamily: FONT_FAMILY, lineHeight: 22, marginTop: 4 }}>
                  Are you sure you want to seal and submit the monthly return for <Text style={{ fontWeight: '800', color: COLORS.slate800 }}>{societyName || reportingMonth || 'this society'}</Text>?
                </Text>

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <View style={[styles.btnWrapper, { flex: 1 }]}>
                    <Pressable 
                      style={[styles.submitCtaBtn, { paddingVertical: 12 }]} 
                      onPress={handleConfirmSubmit} 
                      disabled={isSubmitting}
                    >
                      <LinearGradient
                        colors={['#7a1a1f', '#4a1017']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.submitCtaText}>Submit Now</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
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
  scrollContent: { flex: 1 },
  scrollInner: { 
    padding: 12,
    gap: 14,
    paddingBottom: 40,
  },
  monthBannerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  monthBannerContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthBannerSub: { 
    color: 'rgba(255,255,255,0.78)', 
    fontFamily: FONT_FAMILY,
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  monthBannerTitle: { 
    color: '#FFFFFF', 
    fontFamily: FONT_FAMILY, 
    fontSize: 22, 
    fontWeight: '800', 
    letterSpacing: -0.5,
  },
  societyNameSub: { 
    color: 'rgba(255,255,255,0.9)', 
    fontFamily: FONT_FAMILY, 
    fontSize: 14, 
    fontWeight: '600',
    marginTop: 4,
  },
  monthBannerIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeaderRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 16 
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
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate400,
    marginTop: 1,
  },
  checkRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    gap: 12 
  },
  checkRowNA: {
    opacity: 0.55,
  },
  checkRowTappable: {
    backgroundColor: 'rgba(122, 26, 31, 0.03)',
    borderRadius: 10,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  rowBorder: { 
    borderTopWidth: 1, 
    borderTopColor: COLORS.slate100 
  },
  checkTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.slate800 
  },
  checkTitleNA: {
    color: COLORS.slate400,
    fontWeight: '500',
  },
  goChevronBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionalBadge: {
    backgroundColor: COLORS.slate100,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  optionalBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 0.4,
  },
  incompleteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  incompleteHintText: {
    flex: 1,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: COLORS.amber900,
    fontWeight: '500',
    lineHeight: 16,
  },
  statusChip: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6,
    borderWidth: 1,
  },
  statusChipText: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 9, 
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  warningBanner: {
    backgroundColor: 'rgba(254, 242, 242, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.5)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
  },
  warningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.red50,
    borderWidth: 1,
    borderColor: 'rgba(252, 165, 165, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 13, 
    fontWeight: '800', 
    color: COLORS.primary, 
    marginBottom: 4 
  },
  warningText: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 12, 
    color: COLORS.slate700, 
    lineHeight: 18, 
    fontWeight: '500' 
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
  submitCtaBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14, 
    paddingHorizontal: 16,
  },
  submitCtaText: { 
    color: '#FFFFFF', 
    fontFamily: FONT_FAMILY, 
    fontSize: 14, 
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
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successModalTitle: { 
    fontFamily: FONT_FAMILY, 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.slate800,
    letterSpacing: -0.5,
  },
  cancelBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    borderWidth: 1, 
    borderColor: COLORS.slate300, 
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { 
    color: COLORS.slate600, 
    fontFamily: FONT_FAMILY, 
    fontSize: 14, 
    fontWeight: '700' 
  },
});
