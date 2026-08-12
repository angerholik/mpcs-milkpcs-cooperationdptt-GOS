import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C1C1C',
  bg: '#F8F5F2',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#ECFDF5',
};

export default function ReviewSubmitScreen({
  reportingMonth = "",
  hasImage = true,
  hasOperations = true,
  activityCount = 2,
  isSealing = false,
  onCompileAndSeal,
  onBack
}) {
  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Review & Submit</Text>
        <Text style={styles.stepIndicator}>5 of 5</Text>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
        <Text style={styles.sectionHeading}>Review Your Report — {reportingMonth}</Text>

        {/* Current Period & Persistent Master Items Summary Table */}
        <View style={styles.summaryTableCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Digital Evidence</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>{hasImage ? 'Captured' : 'Pending'}</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Operations</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>{hasOperations ? 'Completed' : 'Pending'}</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Activities</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>{activityCount} entries</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Institutional Profile</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>Current</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Demographics</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>Current</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Compliance</Text>
            <View style={styles.statusBadgeRow}>
              <Text style={styles.statusText}>Current</Text>
              <MaterialIcons name="check-circle" size={18} color={COLORS.success} />
            </View>
          </View>
        </View>

        {/* Security / Seal Box */}
        <View style={styles.sealCard}>
          <View style={styles.sealIconBox}>
            <MaterialIcons name="verified" size={28} color={COLORS.success} />
          </View>
          <Text style={styles.sealTitle}>Ready to Compile & Seal</Text>
          <Text style={styles.sealSub}>
            This will generate the official, cryptographically sealed PDF record.
          </Text>

          <View style={styles.checkList}>
            <View style={styles.checkItem}>
              <MaterialIcons name="check" size={16} color={COLORS.success} />
              <Text style={styles.checkText}>All required information is complete</Text>
            </View>
            <View style={styles.checkItem}>
              <MaterialIcons name="check" size={16} color={COLORS.success} />
              <Text style={styles.checkText}>Data is validated and secure</Text>
            </View>
            <View style={styles.checkItem}>
              <MaterialIcons name="check" size={16} color={COLORS.success} />
              <Text style={styles.checkText}>Official record will be generated</Text>
            </View>
          </View>
        </View>

        {/* Ultimate Action Button */}
        <TouchableOpacity
          style={[styles.sealBtn, isSealing && { opacity: 0.75 }]}
          onPress={onCompileAndSeal}
          disabled={isSealing}
          activeOpacity={0.85}
        >
          {isSealing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialIcons name="lock" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.sealBtnText}>COMPILE & SEAL RECORD</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  sectionHeading: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  summaryTableCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '800' },
  sealCard: {
    backgroundColor: COLORS.successBg,
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  sealIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  sealTitle: { fontSize: 16, fontWeight: '900', color: '#065F46', marginBottom: 4 },
  sealSub: { fontSize: 11, color: '#047857', textAlign: 'center', lineHeight: 16, marginBottom: 14 },
  checkList: { alignSelf: 'stretch', gap: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkText: { fontSize: 11, color: '#065F46', fontWeight: '700' },
  sealBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  sealBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});
