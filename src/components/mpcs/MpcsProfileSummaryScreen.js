import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webCapWidth } from '../../utils/webStyles';
import BottomNav from '../BottomNav';

// Same palette as MpcsMasterDataListScreen / MpcsMasterDataScreen / the
// transaction screens — flat maroon header, cream page, white bordered
// cards. This screen used to run its own gradient+photo header and a
// slate/emerald color scale left over from an earlier design pass; brought
// in line so Profile doesn't look like a different app from Master Data.
const COLORS = {
  maroon: '#7B1420',
  bg: '#F5F1EC',
  surface: '#FFFFFF',
  ink: '#1E1B18',
  slate600: '#57534E',
  slate500: '#78716C',
  slate400: '#A8A29E',
  border: '#E7E2DA',
  green700: '#15803D',
  greenBg: '#E7F3EA',
  amber50: '#FFF7ED',
  amber700: '#B45309',
};

const FONT_FAMILY = 'Manrope';

// Must match the 8 keys MpcsMasterDataListScreen's own `records` array uses
// (profile/demographics/loan/compliance/financials/dividend/shareCapital/csc)
// — this only counts completeness, it doesn't duplicate any editing logic.
const MASTER_DATA_KEYS = ['instProfile', 'demographics', 'loan', 'compliance', 'financials', 'dividend', 'shareCapital', 'csc'];

// Read-only glance view for the Profile tab — one card, no editing. Editing
// happens in Master Data (the "Save & Continue" chain), which this screen
// links out to rather than duplicating. Having Profile/More/Master Data each
// carry their own independent editable copy of the same fields is what
// caused the Back-button chain bugs to keep recurring across all three.
export default function MpcsProfileSummaryScreen({
  societyName = "",
  regNumber = "",
  panCard = "",
  presidentName = "",
  presidentMobile = "",
  secretaryName = "",
  secretaryMobile = "",
  auditStatus = "",
  auditDate = "",
  agmStatus = "",
  agmDate = "",
  totalMembers = 0,
  masterDataUpdated = {},
  pendingSyncCount = 0,
  isSyncing = false,
  onEditMasterData,
  onViewSyncStatus,
  activeTab,
  onTabPress,
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
}) {
  const complianceIsDone = (status) => (status || '').toLowerCase() === 'completed';

  const recordedCount = MASTER_DATA_KEYS.filter(k => masterDataUpdated?.[k]).length;
  const masterDataComplete = recordedCount === MASTER_DATA_KEYS.length;
  const auditDone = complianceIsDone(auditStatus);
  const agmDone = complianceIsDone(agmStatus);
  const complianceComplete = auditDone && agmDone;
  const syncClear = pendingSyncCount === 0 && !isSyncing;

  const actionItems = [
    {
      key: 'master',
      icon: 'clipboard-list-outline',
      title: 'Master data',
      subtitle: masterDataComplete ? 'All 8 records saved' : `${recordedCount} of ${MASTER_DATA_KEYS.length} records saved`,
      done: masterDataComplete,
      onPress: onEditMasterData,
    },
    {
      key: 'compliance',
      icon: 'gavel',
      title: 'Compliance',
      subtitle: `Audit ${auditDone ? 'done' : 'pending'} · AGM ${agmDone ? 'done' : 'pending'}`,
      done: complianceComplete,
      onPress: onEditMasterData,
    },
    {
      key: 'sync',
      icon: 'cloud-sync-outline',
      title: 'Offline sync',
      subtitle: isSyncing ? 'Syncing now…' : syncClear ? 'Everything synced' : `${pendingSyncCount} submission${pendingSyncCount === 1 ? '' : 's'} waiting to sync`,
      done: syncClear,
      onPress: onViewSyncStatus,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>{(societyName || 'MPCS SOCIETY').toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.notifyBtn} onPress={onNotifyPress} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={20} color="#ffffff" />
            {unreadCount > 0 && <View style={styles.notifyBadge} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarCircle} onPress={onProfilePress} activeOpacity={0.8}>
            <Text style={styles.avatarText}>CI</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, webCapWidth]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Needs your attention</Text>
        <View style={styles.card}>
          {actionItems.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.actionRow, i !== actionItems.length - 1 && styles.actionRowBorder]}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
              disabled={!item.onPress}
            >
              <View style={[styles.actionIconBox, item.done && styles.actionIconBoxDone]}>
                <MaterialCommunityIcons name={item.icon} size={17} color={item.done ? COLORS.green700 : COLORS.maroon} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              </View>
              {item.done ? (
                <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.green700} />
              ) : item.onPress ? (
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.slate400} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Society identification</Text>
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>{societyName || "MPCS Society"}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>REGISTRATION NUMBER</Text>
              <Text style={styles.infoValue}>{regNumber || "-"}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PAN CARD</Text>
              <Text style={styles.infoValue}>{panCard || "-"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.subsectionLabel}>KEY PERSONNEL CONTACT</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PRESIDENT</Text>
              <Text style={styles.infoValue}>{presidentName || "-"}</Text>
              <Text style={styles.infoSub}>{presidentMobile || ""}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>SECRETARY</Text>
              <Text style={styles.infoValue}>{secretaryName || "-"}</Text>
              <Text style={styles.infoSub}>{secretaryMobile || ""}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.subsectionLabel}>COMPLIANCE RECORD</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LATEST AUDIT</Text>
              <View style={[styles.statusPill, auditDone ? styles.statusPillDone : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, auditDone ? styles.statusPillTextDone : styles.statusPillTextPending]}>
                  {auditStatus || "Pending"}
                </Text>
              </View>
              {!!auditDate && <Text style={styles.infoSub}>{auditDate}</Text>}
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>LATEST AGM</Text>
              <View style={[styles.statusPill, agmDone ? styles.statusPillDone : styles.statusPillPending]}>
                <Text style={[styles.statusPillText, agmDone ? styles.statusPillTextDone : styles.statusPillTextPending]}>
                  {agmStatus || "Pending"}
                </Text>
              </View>
              {!!agmDate && <Text style={styles.infoSub}>{agmDate}</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>TOTAL MEMBERS</Text>
              <Text style={styles.infoValue}>{totalMembers || 0}</Text>
            </View>
            <View style={styles.infoCol} />
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
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { backgroundColor: COLORS.maroon, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 44 : 14, paddingBottom: 16 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontFamily: FONT_FAMILY, fontSize: 22, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.6, marginTop: 4 },
  notifyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  notifyBadge: {
    position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1, borderColor: COLORS.maroon,
  },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: '#ffffff' },

  scrollContent: { flex: 1 },
  scrollInner: { padding: 16, paddingBottom: 110, gap: 10 },

  sectionLabel: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.6, textTransform: 'uppercase' },

  card: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  actionRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  actionIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.amber50, alignItems: 'center', justifyContent: 'center' },
  actionIconBoxDone: { backgroundColor: COLORS.greenBg },
  actionTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: COLORS.ink },
  actionSubtitle: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 2 },

  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', color: COLORS.ink, marginBottom: 14 },

  subsectionLabel: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800', color: COLORS.slate400, letterSpacing: 0.8, marginBottom: 10 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  infoGrid: { flexDirection: 'row', gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '800', color: COLORS.slate500, letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  infoSub: { fontFamily: FONT_FAMILY, fontSize: 12, fontWeight: '500', color: COLORS.slate500, marginTop: 2 },

  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusPillDone: { backgroundColor: COLORS.greenBg },
  statusPillPending: { backgroundColor: COLORS.amber50 },
  statusPillText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800' },
  statusPillTextDone: { color: COLORS.green700 },
  statusPillTextPending: { color: COLORS.amber700 },

  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.maroon, borderRadius: 12, paddingVertical: 14 },
  editBtnText: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
