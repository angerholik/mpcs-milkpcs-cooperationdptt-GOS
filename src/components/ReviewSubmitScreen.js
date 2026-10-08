import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import MpcsWizardHeader from './mpcs/MpcsWizardHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../utils/webStyles';

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
  maroon: '#7B1420',
  ink: '#1E1B18',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

const PENDING_COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'];

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
  loanIsActive = false,
  isSealing = false,
  onCompileAndSeal,
  onNavigateScreen,
  onBack,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);

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
      title: 'Collection & Deposit',   
      status: opsState.status === 'Pending' ? 'NOT COMPLETED' : opsState.status,      
      subText: opsState.updatedAt ? `Last updated ${formatTime(opsState.updatedAt)}` : '',
      isComplete: isOpsComplete,      
      isNA: false, 
      screenKey: 'OPERATIONS' 
    },
    { 
      title: 'Activities & Events',   
      status: actStatusDisplay, 
      subText: actState.updatedAt ? `Last updated ${formatTime(actState.updatedAt)}` : '',
      isComplete: isActComplete, 
      isNA: false, 
      screenKey: 'ACTIVITIES' 
    },
    {
      title: 'Loan Status',
      status: !loanIsActive ? 'NO ACTIVE LOAN' : (compState.status === 'Pending' ? 'NOT COMPLETED' : compState.status),
      subText: (!loanIsActive || !compState.updatedAt) ? '' : `Last updated ${formatTime(compState.updatedAt)}`,
      isComplete: !loanIsActive ? false : isCompComplete,
      isNA: !loanIsActive,
      isOptional: !loanIsActive,
      screenKey: 'COMPLIANCE'
    },
  ];

  const mandatorySections = sections.filter(sec => !sec.isNA);
  const allSectionsComplete = mandatorySections.every(sec => sec.isComplete);
  const completedCount = mandatorySections.filter(sec => sec.isComplete).length;
  const pendingCount = mandatorySections.length - completedCount;

  return (
    <View style={styles.container}>
      <MpcsWizardHeader
        module="MILK PCS"
        total={mandatorySections.length}
        step={completedCount}
        month={(reportingMonth || 'CURRENT MONTH').toUpperCase()}
        title="Review & Submit"
        label={`${societyName || 'This society'} · ${completedCount} of ${mandatorySections.length} parameters done`}
        onBack={onBack}
      />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        <View style={styles.listCard}>
          {sections.map((sec, i) => {
            const tappable = !sec.isNA && !!onNavigateScreen;
            return (
              <Pressable
                key={sec.title}
                disabled={!tappable}
                style={[styles.listRow, i < sections.length - 1 && styles.listRowBorder]}
                onPress={() => onNavigateScreen(sec.screenKey)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.listRowTitle, sec.isNA && { color: COLORS.slate500 }]}>{sec.title}</Text>
                  {sec.isNA ? <Text style={styles.listRowSub}>No active loan</Text> : sec.subText ? <Text style={styles.listRowSub}>{sec.subText}</Text> : null}
                </View>
                {sec.isNA ? (
                  <Text style={styles.naText}>NA</Text>
                ) : sec.isComplete ? (
                  <View style={styles.doneGroup}>
                    <MaterialCommunityIcons name="check" size={16} color={COLORS.ink} />
                    <Text style={styles.doneText}>Done</Text>
                  </View>
                ) : (
                  <View style={styles.doneGroup}>
                    <Text style={styles.pendingText}>Pending</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.maroon} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          Tap a pending parameter to fill it in. Submitting keeps this return as a permanent record for {reportingMonth || 'this month'}; Master data is not changed.
        </Text>

        <View style={styles.divider} />

        <Pressable
          style={[styles.submitBtn, (!allSectionsComplete || isSealing) && styles.submitBtnDisabled]}
          onPress={() => allSectionsComplete && !isSealing && setModalVisible(true)}
          disabled={!allSectionsComplete || isSealing}
        >
          {isSealing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={[styles.submitBtnText, !allSectionsComplete && styles.submitBtnTextDisabled]}>
              {allSectionsComplete ? 'Submit monthly return' : `${PENDING_COUNT_WORDS[pendingCount] || pendingCount} parameter${pendingCount === 1 ? '' : 's'} still pending`}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.draftLink}>Save as draft</Text>
        </Pressable>
      </ScrollView>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            <View style={{ gap: 12 }}>
              <Text style={styles.modalTitle}>Confirm submission</Text>
              <Text style={styles.modalDesc}>
                Are you sure you want to seal and submit the monthly return for {societyName || 'this society'}?
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.submitBtn, { flex: 1 }]} onPress={() => { setModalVisible(false); onCompileAndSeal && onCompileAndSeal(); }}>
                  <Text style={styles.submitBtnText}>Submit now</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 16 },
  listCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E7E2DA' },
  listRowTitle: { fontFamily: F, fontSize: 16, fontWeight: '800', color: '#1E1B18' },
  listRowSub: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#78716C', marginTop: 2 },
  doneGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doneText: { fontFamily: F, fontSize: 14, fontWeight: '700', color: '#1E1B18' },
  pendingText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#7B1420' },
  footerNote: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#57534E', lineHeight: 18 },
  naText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#78716C' },
  divider: { height: 1, backgroundColor: '#E7E2DA' },
  draftLink: { fontFamily: F, fontSize: 13, fontWeight: '700', color: '#78716C', textAlign: 'center' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 22, width: '100%', maxWidth: 380 },
  modalTitle: { fontFamily: F, fontSize: 17, fontWeight: '800', color: '#1E1B18', textAlign: 'center' },
  modalDesc: { fontFamily: F, fontSize: 13, fontWeight: '500', color: '#57534E', textAlign: 'center', lineHeight: 19 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#E7E2DA', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#1E1B18' },
  submitBtn: { paddingVertical: 15, borderRadius: 12, backgroundColor: '#7B1420', alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#DCD3C8' },
  submitBtnText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#ffffff' },
  submitBtnTextDisabled: { color: '#4A4038' },
});
