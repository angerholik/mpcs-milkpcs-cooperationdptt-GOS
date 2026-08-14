import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Pressable
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
  primaryLight: '#FEF2F2',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export default function ReviewSubmitScreen({
  societyName = "",
  reportingMonth = "",
  milkSectionStates,
  isSealing = false,
  onCompileAndSeal,
  onNavigateScreen,
  onBack
}) {

  // Process Evidence State
  const evidenceState = milkSectionStates?.evidence || { status: 'NOT CAPTURED' };
  const isValid = evidenceState.validUntil && new Date() < new Date(evidenceState.validUntil);
  const isEvidenceCaptured = (st) => Boolean(st) && st.includes('CAPTURED') && !st.includes('NOT');
  const hasCaptured = isEvidenceCaptured(evidenceState.status) || evidenceState.status?.includes('Valid') || evidenceState.status?.includes('EXPIRED');
  const isEvidenceComplete = hasCaptured && isValid;
  const displayEvidenceStatus = (!isValid && hasCaptured) ? 'EXPIRED' : (evidenceState.status || 'NOT CAPTURED');

  const evidenceSubText = isValid 
    ? `Valid until ${formatTime(evidenceState.validUntil)}` 
    : ((!isValid && hasCaptured) ? 'Please recapture evidence' : (evidenceState.updatedAt ? `Captured ${formatTime(evidenceState.updatedAt)}` : ''));

  // Process Operations (Sales & Deposit) State
  const opsState = milkSectionStates?.operations || { status: 'NOT COMPLETED' };
  const isOpsComplete = opsState.status?.includes('COMPLETED') || opsState.status?.includes('UPDATED');

  // Process Activities State
  const actState = milkSectionStates?.activities || { status: '0 ENTRIES' };
  const isActComplete = actState.status?.includes('ENTRIES') || actState.status?.includes('COMPLETED');
  const actStatusDisplay = (actState.status === 'Pending' || actState.status === 'NOT COMPLETED') ? '0 ENTRIES' : actState.status;

  // Process Compliance State
  const compState = milkSectionStates?.compliance || { status: 'NOT COMPLETED' };
  const isCompComplete = compState.status?.includes('COMPLETED') || compState.status?.includes('UPDATED');

  const sections = [
    { 
      title: 'Digital Evidence',          
      status: displayEvidenceStatus,   
      subText: evidenceSubText,
      isComplete: isEvidenceComplete,   
      isNA: false, 
      screenKey: 'EVIDENCE' 
    },
    { 
      title: 'Monthly Sales / Deposit',   
      status: opsState.status === 'Pending' ? 'NOT COMPLETED' : opsState.status,      
      subText: opsState.updatedAt ? `Last updated ${formatTime(opsState.updatedAt)}` : '',
      isComplete: isOpsComplete,      
      isNA: false, 
      screenKey: 'OPERATIONS' 
    },
    { 
      title: 'Activities / Events Log',   
      status: actStatusDisplay, 
      subText: actState.updatedAt ? `Last updated ${formatTime(actState.updatedAt)}` : '',
      isComplete: isActComplete, 
      isNA: false, 
      screenKey: 'ACTIVITIES' 
    },
    { 
      title: 'Compliance Updates',   
      status: compState.status === 'Pending' ? 'NOT COMPLETED' : compState.status,      
      subText: compState.updatedAt ? `Last updated ${formatTime(compState.updatedAt)}` : '',
      isComplete: isCompComplete,      
      isNA: false, 
      screenKey: 'COMPLIANCE' 
    },
  ];

  const mandatorySections = sections.filter(sec => !sec.isNA);
  const allSectionsComplete = mandatorySections.every(sec => sec.isComplete);

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
              <Text style={styles.monthBannerTitle}>{reportingMonth || "CURRENT MONTH"}</Text>
              <Text style={styles.societyNameSub}>{societyName || "Milk Society"}</Text>
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
              </Text>
            </View>
          </View>

          {sections.map((sec, idx) => {
            const isTappable = !sec.isNA && onNavigateScreen;
            const RowWrapper = isTappable ? TouchableOpacity : View;
            const rowProps = isTappable
              ? {
                  onPress: () => onNavigateScreen(sec.screenKey),
                  activeOpacity: 0.75,
                  style: [styles.checkRow, idx > 0 && styles.rowBorder, sec.isNA && styles.checkRowNA, styles.checkRowTappable],
                }
              : { style: [styles.checkRow, idx > 0 && styles.rowBorder, sec.isNA && styles.checkRowNA] };

            return (
              <RowWrapper key={sec.title} {...rowProps}>
                <MaterialCommunityIcons
                  name={sec.isNA ? 'minus-circle-outline' : sec.isComplete ? 'check-circle' : 'alert-circle-outline'}
                  size={20}
                  color={sec.isNA ? COLORS.slate400 : sec.isComplete ? COLORS.emerald500 : COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkTitle, sec.isNA && styles.checkTitleNA]}>{sec.title}</Text>
                  {sec.subText ? (
                    <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate500, marginTop: 2 }}>{sec.subText}</Text>
                  ) : null}
                </View>
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
                {isTappable && (
                  <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.slate400} />
                )}
              </RowWrapper>
            );
          })}
        </View>

        {!allSectionsComplete && (
          <View style={styles.incompleteHint}>
            <MaterialCommunityIcons name="gesture-tap" size={16} color={COLORS.amber900} />
            <Text style={styles.incompleteHintText}>
              Tap any incomplete section above to go back and fill it in.
            </Text>
          </View>
        )}

        {/* Permanent Record Banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningIconBox}>
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Permanent Record</Text>
            <Text style={styles.warningText}>
              Submitting this return creates a permanent historical record for {societyName || "this society"}. Master data will remain unchanged.
            </Text>
          </View>
        </View>

        <View style={[styles.btnWrapper, { marginTop: 16 }]}>
          <Pressable 
            style={({ hovered, pressed }) => [
              styles.submitCtaBtn,
              (!allSectionsComplete || isSealing) && { backgroundColor: COLORS.slate400 },
              pressed && allSectionsComplete && !isSealing && { transform: [{ scale: 0.98 }] },
              hovered && Platform.OS === 'web' && { shadowOpacity: 0.4 }
            ]}
            onPress={onCompileAndSeal}
            disabled={!allSectionsComplete || isSealing}
          >
            {allSectionsComplete && !isSealing && (
              <LinearGradient
                colors={['#047857', '#064e3b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            {isSealing ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.submitCtaText}>
                  {allSectionsComplete ? 'COMPILE & SEAL' : 'Complete Sections to Submit'}
                </Text>
                {allSectionsComplete && <MaterialCommunityIcons name="lock-outline" size={18} color="#ffffff" />}
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
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
  scrollInner: { padding: 16, gap: 16, paddingBottom: 40 },
  monthBannerCard: {
    borderRadius: 16, overflow: 'hidden', padding: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 6,
  },
  monthBannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthBannerSub: { 
    fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', 
    color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2, marginBottom: 4 
  },
  monthBannerTitle: { fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  societyNameSub: { 
    fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '500', 
    color: 'rgba(255,255,255,0.9)', marginTop: 4 
  },
  monthBannerIconBox: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(226,232,240,0.6)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.slate50,
    borderWidth: 1, borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderTitle: { 
    fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.slate800, letterSpacing: -0.14,
  },
  cardHeaderSub: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: COLORS.slate400, marginTop: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  checkRowNA: { opacity: 0.55 },
  checkRowTappable: {
    backgroundColor: 'rgba(122, 26, 31, 0.03)', borderRadius: 10, marginHorizontal: -4, paddingHorizontal: 4,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: COLORS.slate100 },
  checkTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '600', color: COLORS.slate800 },
  checkTitleNA: { color: COLORS.slate400, fontWeight: '500' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusChipText: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  incompleteHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  incompleteHintText: { flex: 1, fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.amber900, fontWeight: '600' },
  warningBanner: {
    backgroundColor: 'rgba(254, 242, 242, 0.8)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(252, 165, 165, 0.5)',
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16,
  },
  warningIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.red50,
    borderWidth: 1, borderColor: 'rgba(252, 165, 165, 0.4)', alignItems: 'center', justifyContent: 'center',
  },
  warningTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  warningText: { fontFamily: FONT_FAMILY, fontSize: 12, color: COLORS.slate700, lineHeight: 18, fontWeight: '500' },
  btnWrapper: {
    borderRadius: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  submitCtaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  submitCtaText: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
