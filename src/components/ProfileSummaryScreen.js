import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { webCapWidth } from '../utils/webStyles';
import BottomNav from './BottomNav';

// Same subtle Kanchenjunga treatment used on every header across the app.
const headerPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.4, filter: 'grayscale(0.35) contrast(1.15) brightness(0.95)', mixBlendMode: 'luminosity' }
  : { opacity: 0.28 };

// Same photo again, much fainter, as a full-page watermark behind the
// (mostly white/card-covered) scroll content below the header.
const pageBgPhotoFilter = Platform.OS === 'web'
  ? { opacity: 0.05, filter: 'grayscale(1) contrast(1.1)' }
  : { opacity: 0.035 };

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
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const complianceIsDone = (status) => (status || '').toLowerCase() === 'completed';

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/core/kanchenjunga.jpg')}
        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, pageBgPhotoFilter]}
        resizeMode="cover"
        pointerEvents="none"
      />
      <View style={styles.topBar}>
        <LinearGradient
          colors={['#7a1a1f', '#4a1017']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={require('../../assets/core/kanchenjunga.jpg')}
          style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }, headerPhotoFilter]}
          resizeMode="cover"
        />
        <View style={styles.topBarTitleContainer}>
          <Text style={styles.moduleTag}>MILK PCS</Text>
          <Text style={styles.screenTitleHeader}>Institutional Profile</Text>
        </View>
        <TouchableOpacity style={styles.notifyBtn} onPress={onNotifyPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF" />
          {unreadCount > 0 && <View style={styles.notifyBadge} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress} activeOpacity={0.8}>
          <Text style={styles.avatarText}>CI</Text>
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: COLORS.slate50, position: 'relative', overflow: 'hidden' },
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    overflow: 'hidden',
  },
  topBarTitleContainer: { flex: 1 },
  notifyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#7a1a1f',
  },
  avatarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FONT_FAMILY,
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
