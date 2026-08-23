import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import BottomNav from './BottomNav';

const COLORS = {
  surface: '#ffffff',
  slate800: '#1e293b',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
  emerald700: '#047857',
  emerald50: '#ecfdf5',
  amber900: '#78350f',
  amber50: '#fffbeb',
};

const FONT_FAMILY = 'Manrope';

// Read-only glance view for the Profile tab — one card, no editing. Editing
// happens in Master Data (the "Save & Continue" chain), which this screen
// links out to rather than duplicating. Having Profile/More/Master Data each
// carry their own independent editable copy of the same fields is what
// caused the Back-button chain bugs to keep recurring across all three.
export default function ProfileSummaryScreen({
  centerName = "",
  regNo = "",
  presidentName = "",
  presidentMobile = "",
  managerName = "",
  managerMobile = "",
  auditStatus = "",
  auditDate = "",
  agmStatus = "",
  agmDate = "",
  totalMembers = 0,
  onEditMasterData,
  activeTab,
  onTabPress,
}) {
  const complianceIsDone = (status) => (status || '').toLowerCase() === 'completed';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Institutional Profile</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="office-building-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>{centerName || "Milk PCS Unit"}</Text>
              <Text style={styles.cardHeaderSub}>Society Identification</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>REGISTRATION NUMBER</Text>
              <Text style={styles.infoValue}>{regNo || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>TOTAL MEMBERS</Text>
              <Text style={styles.infoValue}>{totalMembers || 0}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>KEY PERSONNEL CONTACT</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PRESIDENT</Text>
              <Text style={styles.infoValue}>{presidentName || "-"}</Text>
              <Text style={styles.infoSub}>{presidentMobile || ""}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>MANAGER</Text>
              <Text style={styles.infoValue}>{managerName || "-"}</Text>
              <Text style={styles.infoSub}>{managerMobile || ""}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>COMPLIANCE RECORD</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LATEST AUDIT</Text>
              <View style={[styles.statusPill, complianceIsDone(auditStatus) ? styles.statusPillDone : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, complianceIsDone(auditStatus) ? styles.statusPillTextDone : styles.statusPillTextPending]}>
                  {auditStatus || "Pending"}
                </Text>
              </View>
              {!!auditDate && <Text style={styles.infoSub}>{auditDate}</Text>}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LATEST AGM</Text>
              <View style={[styles.statusPill, complianceIsDone(agmStatus) ? styles.statusPillDone : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, complianceIsDone(agmStatus) ? styles.statusPillTextDone : styles.statusPillTextPending]}>
                  {agmStatus || "Pending"}
                </Text>
              </View>
              {!!agmDate && <Text style={styles.infoSub}>{agmDate}</Text>}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={onEditMasterData} activeOpacity={0.85}>
          <MaterialCommunityIcons name="pencil-outline" size={16} color="#ffffff" />
          <Text style={styles.editBtnText}>Edit in Master Data</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color="#ffffff" />
        </TouchableOpacity>
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'profile'} onTabPress={onTabPress} />}
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
  topBarTitleContainer: { flex: 1 },
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
  scrollContent: { flex: 1 },
  scrollInner: {
    padding: 12,
    gap: 12,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.slate800,
    letterSpacing: -0.16,
  },
  cardHeaderSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slate400,
    marginTop: 1,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.slate100,
    marginVertical: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCol: { flex: 1 },
  infoLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.slate400,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  infoValue: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.slate800,
  },
  infoSub: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.slate500,
    marginTop: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusPillDone: { backgroundColor: COLORS.emerald50 },
  statusPillPending: { backgroundColor: COLORS.amber50 },
  statusPillText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextDone: { color: COLORS.emerald700 },
  statusPillTextPending: { color: COLORS.amber900 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  editBtnText: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
