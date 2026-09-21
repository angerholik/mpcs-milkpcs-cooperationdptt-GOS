import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../../utils/webStyles';

const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  border: '#E7E2DA',
  disabledBg: '#DCD3C8',
  disabledText: '#4A4038',
};

const FONT_FAMILY = 'Manrope';

const PENDING_COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five'];

export default function MpcsReviewSubmitScreen({
  societyName = "",
  reportingMonth = "",
  sectionStates = {},
  loanIsActive = false,
  activitiesCount = 0,
  onSubmitReturn,
  onNavigateSection,
  onBack,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
  const evidenceSubText = evidenceState.updatedAt ? `Captured ${formatTime(evidenceState.updatedAt)}` : '';

  // .includes('COMPLETED') matched the literal string 'NOT COMPLETED' too
  // (it contains "COMPLETED" as a substring), so every section rendered as
  // done before it actually was. startsWith is safe here since the only
  // two values ever set are 'NOT COMPLETED' and 'COMPLETED ✓'.
  const salesState = sectionStates.sales || { status: 'NOT COMPLETED' };
  const isSalesComplete = salesState.status.startsWith('COMPLETED') || salesState.status.includes('UPDATED');

  const businessState = sectionStates.business || { status: 'NOT COMPLETED' };
  const isBusinessComplete = businessState.status.startsWith('COMPLETED') || businessState.status.includes('UPDATED');

  const loanState = sectionStates.loan || { status: 'NOT COMPLETED' };
  // A loan with nothing active on it isn't a real parameter to fill in —
  // it counts as already done so it never blocks submission or shows as
  // pending, same semantics MpcsHomeScreen's progress count already uses.
  const isLoanComplete = !loanIsActive || loanState.status.startsWith('COMPLETED') || loanState.status.includes('UPDATED');

  const activitiesState = sectionStates.activities || { status: '0 ENTRIES' };
  const isActivitiesComplete = activitiesCount > 0;

  const sections = [
    {
      title: 'Digital evidence',
      subText: isEvidenceComplete ? evidenceSubText : '',
      isComplete: isEvidenceComplete,
      screenKey: 'MPCS_EVIDENCE',
    },
    {
      title: 'Sales and deposit',
      subText: isSalesComplete && salesState.updatedAt ? `Saved ${formatTime(salesState.updatedAt)}` : '',
      isComplete: isSalesComplete,
      screenKey: 'MPCS_SALES',
    },
    {
      title: 'Business performance',
      subText: isBusinessComplete && businessState.updatedAt ? `Saved ${formatTime(businessState.updatedAt)}` : '',
      isComplete: isBusinessComplete,
      screenKey: 'MPCS_BUSINESS',
    },
    {
      title: 'Loan status',
      subText: isLoanComplete && loanIsActive && loanState.updatedAt ? `Saved ${formatTime(loanState.updatedAt)}` : '',
      isComplete: isLoanComplete,
      screenKey: 'MPCS_LOAN_STATUS',
    },
    {
      title: 'Activities and events',
      subText: isActivitiesComplete && activitiesState.updatedAt ? `Saved ${formatTime(activitiesState.updatedAt)}` : (isActivitiesComplete ? '' : 'No entries yet'),
      isComplete: isActivitiesComplete,
      screenKey: 'MPCS_ACTIVITIES',
    },
  ];

  const completedCount = sections.filter(sec => sec.isComplete).length;
  const totalCount = sections.length;
  const allSectionsComplete = completedCount === totalCount;
  const pendingCount = totalCount - completedCount;

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
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>MPCS · {(reportingMonth || 'CURRENT MONTH').toUpperCase()}</Text>
            <Text style={styles.title}>Review & Submit</Text>
          </View>
          <View style={styles.draftPill}>
            <Text style={styles.draftPillText}>DRAFT</Text>
          </View>
        </View>
        <View style={styles.segmentRow}>
          {sections.map((_, i) => (
            <View key={i} style={[styles.segment, i < completedCount && styles.segmentDone]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{societyName || 'This society'} · {completedCount} of {totalCount} parameters done</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listCard}>
          {sections.map((sec, i) => {
            const isLast = i === sections.length - 1;
            return (
              <Pressable
                key={sec.title}
                style={[styles.listRow, !isLast && styles.listRowBorder]}
                onPress={() => onNavigateSection && onNavigateSection(sec.screenKey)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{sec.title}</Text>
                  {sec.subText ? <Text style={styles.listRowSub}>{sec.subText}</Text> : null}
                </View>
                {sec.isComplete ? (
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
          style={[styles.submitBtn, !allSectionsComplete && styles.submitBtnDisabled]}
          onPress={() => allSectionsComplete && setModalVisible(true)}
          disabled={!allSectionsComplete}
        >
          <Text style={[styles.submitBtnText, !allSectionsComplete && styles.submitBtnTextDisabled]}>
            {allSectionsComplete ? 'Submit monthly return' : `${PENDING_COUNT_WORDS[pendingCount] || pendingCount} parameter${pendingCount === 1 ? '' : 's'} still pending`}
          </Text>
        </Pressable>

        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.draftLink}>Save as draft</Text>
        </Pressable>
      </ScrollView>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setModalVisible(false)} />
          <View style={styles.modalCard}>
            {submitted ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="check-decagram" size={44} color={COLORS.maroon} />
                <Text style={styles.modalTitle}>Return submitted</Text>
                <Text style={styles.modalDesc}>
                  Monthly return for {societyName || 'this society'} has been sealed into the official MPCS ledger.
                </Text>
                <Pressable style={[styles.submitBtn, { width: '100%', marginTop: 8 }]} onPress={() => { setModalVisible(false); onBack(); }}>
                  <Text style={styles.submitBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={styles.modalTitle}>Confirm submission</Text>
                <Text style={styles.modalDesc}>
                  Are you sure you want to seal and submit the monthly return for {societyName || 'this society'}?
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.submitBtn, { flex: 1 }]} onPress={handleConfirmSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Submit now</Text>}
                  </Pressable>
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
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  backBtn: { width: 28, height: 28, justifyContent: 'center' },
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: '#ffffff' },
  draftPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  draftPillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  segmentRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  segmentDone: { backgroundColor: '#ffffff' },
  stepLabel: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 40, gap: 16 },

  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  listRowTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '700', color: COLORS.ink },
  listRowSub: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 3 },
  doneGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  pendingText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.maroon },

  footerNote: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate600, lineHeight: 19 },
  divider: { height: 1, backgroundColor: COLORS.border },

  submitBtn: {
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: COLORS.disabledBg },
  submitBtnText: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '800', color: '#ffffff' },
  submitBtnTextDisabled: { color: COLORS.disabledText },
  draftLink: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate500, textAlign: 'center' },

  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(30,27,24,0.55)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalTitle: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  modalDesc: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '500', color: COLORS.slate600, textAlign: 'center', lineHeight: 19 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
});
