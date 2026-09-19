import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Shared header for the monthly-return wizard screens (Digital Evidence,
// Sales & Deposit, Business Performance, Loan Status) — redesign source:
// https://claude.ai/artifact/FpC75VnmdTzgcpPmdQGvkx, section "2 · Monthly
// return". Same maroon (#7B1420) + 1px border + 18px radius system as
// MpcsHomeScreen / MpcsMasterDataScreen.
const COLORS = {
  maroon: '#7B1420',
  track: 'rgba(255,255,255,0.25)',
};

const FONT_FAMILY = 'Manrope';

export default function MpcsWizardHeader({ month, title, step, total = 5, draft = true, onBack }) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>MPCS · {month}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {draft && (
          <View style={styles.draftPill}>
            <Text style={styles.draftPillText}>DRAFT</Text>
          </View>
        )}
      </View>
      <View style={styles.segmentRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.segment, i < step && styles.segmentDone]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>Parameter {step} of {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  backBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  draftPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  draftPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.track,
  },
  segmentDone: {
    backgroundColor: '#ffffff',
  },
  stepLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
});
