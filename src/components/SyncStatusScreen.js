import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import ScreenHeader from './ScreenHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  onNotifyPress,
  onProfilePress,
  unreadCount = 0,
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
      <ScreenHeader title="Sync Status" subtitle="MILK PCS" onBack={onBack} onAvatarPress={onProfilePress} onNotifyPress={onNotifyPress} showAlertDot={unreadCount > 0} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.inner, webCapWidth]} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <MaterialCommunityIcons name={isOnline ? 'wifi' : 'wifi-off'} size={22} color={isOnline ? '#15803D' : '#B91C1C'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{isOnline ? 'Connected' : 'Offline'}</Text>
            <Text style={styles.rowSub}>
              {isOnline ? 'Records save straight to the cloud database.' : 'Records are saving to this device and will sync once you’re back online.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Sync queue</Text>
          <Text style={[styles.sectionCount, pendingCount > 0 && { color: '#B45309' }]}>
            {syncing ? 'Syncing…' : pendingCount > 0 ? `${pendingCount} pending` : 'Up to date'}
          </Text>
        </View>

        {queueItems.length > 0 ? (
          <View style={styles.listCard}>
            {queueItems.map((item, index) => (
              <View key={item.id || index} style={[styles.listRow, index < queueItems.length - 1 && styles.listRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{TYPE_LABELS[item.type] || item.type || 'Submission'}</Text>
                  <Text style={styles.rowSub}>{formatQueuedAt(item.timestamp)}</Text>
                </View>
                {item.retryCount > 0 ? <Text style={styles.retry}>RETRY {item.retryCount}/3</Text> : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.row}>
            <MaterialCommunityIcons name="cloud-check-outline" size={22} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>All caught up</Text>
              <Text style={styles.rowSub}>No submissions waiting to sync.</Text>
            </View>
          </View>
        )}

        {pendingCount > 0 ? (
          <Pressable style={[styles.primary, (!isOnline || syncing) && { opacity: 0.5 }]} onPress={handleRetry} disabled={!isOnline || syncing}>
            <Text style={styles.primaryText}>{syncing ? 'Syncing…' : 'Retry sync now'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {onTabPress && <BottomNav activeTab={activeTab || 'more'} onTabPress={onTabPress} />}
    </View>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5F7' },
  inner: { padding: 16, paddingBottom: 110, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', padding: 16 },
  rowTitle: { fontFamily: F, fontSize: 15, fontWeight: '800', color: '#1E1B18' },
  rowSub: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#78716C', marginTop: 2, lineHeight: 17 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontFamily: F, fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionCount: { fontFamily: F, fontSize: 11, fontWeight: '600', color: '#047857' },
  listCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#E7E2DA', overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E7E2DA' },
  retry: { fontFamily: F, fontSize: 11, fontWeight: '800', color: '#B45309' },
  primary: { paddingVertical: 14, borderRadius: 12, backgroundColor: '#7B1420', alignItems: 'center' },
  primaryText: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#fff' },
});
