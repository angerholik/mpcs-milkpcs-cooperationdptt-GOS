import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import BottomNav from './BottomNav';
import { webCapWidth } from '../utils/webStyles';
import { getQueueItems } from '../utils/syncManager';

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
  amber900: '#78350f',
  amber100: '#fef3c7',
  emerald700: '#047857',
  emerald500: '#10b981',
  emerald50: '#ecfdf5',
  red600: '#dc2626',
  red50: '#fef2f2',
};

const FONT_FAMILY = 'Manrope';

const TYPE_LABELS = {
  MILK_PCS: 'Milk PCS Submission',
  MPCS: 'MPCS Submission',
};

function formatQueuedAt(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Shows the real state of the offline submission queue — connection status,
// how many records are waiting to sync, and each queued item's type/age —
// instead of the "Offline Engine Status" More menu item leading nowhere.
export default function SyncStatusScreen({
  pendingCount = 0,
  syncing = false,
  onRetrySync,
  onBack,
  activeTab,
  onTabPress,
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [queueItems, setQueueItems] = useState([]);

  const refreshQueueItems = useCallback(() => {
    getQueueItems().then(setQueueItems);
  }, []);

  useEffect(() => {
    refreshQueueItems();
  }, [refreshQueueItems, pendingCount]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      update();
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
      };
    }
    const unsubscribe = NetInfo.addEventListener((state) => setIsOnline(!!state.isConnected));
    return () => unsubscribe();
  }, []);

  const handleRetry = () => {
    if (onRetrySync) onRetrySync();
    refreshQueueItems();
  };

  return (
    <View style={styles.container}>
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
          <Text style={styles.moduleTag}>SYSTEM</Text>
          <Text style={styles.screenTitleHeader}>Offline Engine Status</Text>
        </View>
      </View>

      <View style={styles.bgBlobTop} pointerEvents="none" />
      <View style={styles.bgBlobBottomLeft} pointerEvents="none" />

      <ScrollView style={styles.scrollContent} contentContainerStyle={[styles.scrollInner, webCapWidth]} showsVerticalScrollIndicator={false}>
        <View style={[styles.alertCard, !isOnline && styles.alertCardOffline]}>
          <View style={[styles.alertIconBox, !isOnline && styles.alertIconBoxOffline]}>
            <MaterialCommunityIcons name={isOnline ? 'wifi' : 'wifi-off'} size={20} color={isOnline ? COLORS.amber900 : COLORS.red600} />
          </View>
          <View style={styles.alertBody}>
            <Text style={[styles.alertTitle, !isOnline && { color: COLORS.red600 }]}>
              {isOnline ? 'Connected' : 'Offline'}
            </Text>
            <Text style={styles.alertText}>
              {isOnline
                ? 'Records save straight to the cloud database.'
                : 'Records are saving to this device and will sync once you’re back online.'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardIconBox}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeaderTitle}>Sync Queue</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusBadgeText, { color: pendingCount > 0 ? COLORS.amber900 : COLORS.emerald700 }]}>
                {syncing ? 'SYNCING' : pendingCount > 0 ? `${pendingCount} PENDING` : 'UP TO DATE'}
              </Text>
            </View>
          </View>

          {queueItems.length > 0 ? (
            queueItems.map((item, index) => (
              <View key={item.id || index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.queueRow}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>{TYPE_LABELS[item.type] || item.type || 'Submission'}</Text>
                    <Text style={styles.infoValue}>{formatQueuedAt(item.timestamp)}</Text>
                  </View>
                  {item.retryCount > 0 && (
                    <View style={styles.retryBadge}>
                      <Text style={styles.retryBadgeText}>RETRY {item.retryCount}/3</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="cloud-check-outline" size={32} color={COLORS.emerald500} />
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', color: COLORS.slate600 }}>
                All caught up
              </Text>
              <Text style={{ fontFamily: FONT_FAMILY, fontSize: 11, color: COLORS.slate400, textAlign: 'center' }}>
                No submissions waiting to sync.
              </Text>
            </View>
          )}
        </View>

        {pendingCount > 0 && (
          <View style={[styles.btnWrapper, webCapWidth]}>
            <Pressable
              style={({ hovered, pressed }) => [
                styles.retryBtn,
                (!isOnline || syncing) && { opacity: 0.5 },
                pressed && { transform: [{ scale: 0.98 }] },
                hovered && Platform.OS === 'web' && !syncing && isOnline && { shadowOpacity: 0.4 }
              ]}
              onPress={handleRetry}
              disabled={!isOnline || syncing}
            >
              <MaterialCommunityIcons name={syncing ? 'sync' : 'cloud-upload-outline'} size={16} color={COLORS.primary} />
              <Text style={styles.retryBtnText}>{syncing ? 'Syncing…' : 'Retry Sync Now'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'more'} onTabPress={onTabPress} />}
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
  moduleTag: {
    color: 'rgba(255,255,255,0.7)', fontFamily: FONT_FAMILY, fontSize: 8,
    fontWeight: '800', letterSpacing: 1.2, marginBottom: 2,
  },
  screenTitleHeader: { color: '#FFFFFF', fontFamily: FONT_FAMILY, fontSize: 16, fontWeight: '800', letterSpacing: -0.16 },
  scrollContent: { flex: 1 },
  scrollInner: { padding: 12, gap: 12, paddingBottom: 110 },
  alertCard: {
    backgroundColor: 'rgba(254, 252, 232, 0.8)', borderRadius: 14, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.5)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  alertCardOffline: { backgroundColor: COLORS.red50, borderColor: 'rgba(220,38,38,0.2)' },
  alertIconBox: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.amber100,
    alignItems: 'center', justifyContent: 'center',
  },
  alertIconBoxOffline: { backgroundColor: 'rgba(220,38,38,0.12)' },
  alertBody: { flex: 1, paddingRight: 8 },
  alertTitle: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '800', color: COLORS.amber900, marginBottom: 2 },
  alertText: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500', color: 'rgba(146, 64, 14, 0.9)' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)', shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 3,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconBox: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.slate50,
    borderWidth: 1, borderColor: COLORS.slate100, alignItems: 'center', justifyContent: 'center',
  },
  cardHeaderTitle: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: '700', color: COLORS.slate800, letterSpacing: -0.14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.slate100 },
  statusBadgeText: { fontFamily: FONT_FAMILY, fontSize: 10, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.slate100, marginVertical: 12 },
  queueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoCol: { flex: 1 },
  infoLabel: { fontFamily: FONT_FAMILY, fontSize: 8, fontWeight: '800', color: COLORS.slate400, letterSpacing: 1.2, marginBottom: 2 },
  infoValue: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600', color: COLORS.slate800 },
  retryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.red50, borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)' },
  retryBadgeText: { fontFamily: FONT_FAMILY, fontSize: 9, fontWeight: '800', color: COLORS.red600 },
  btnWrapper: {
    borderRadius: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, overflow: 'hidden',
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#FFFFFF',
  },
  retryBtnText: { color: COLORS.primary, fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
});
