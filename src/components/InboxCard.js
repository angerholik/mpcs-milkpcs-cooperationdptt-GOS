import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressScale from './PressScale';

// Shown while there are unread HQ messages and hidden once every one is read.
export default function InboxCard({ unreadCount = 0, latest, onPress }) {
  if (!unreadCount) return null;
  const text = latest?.message || latest?.text || '';
  return (
    <PressScale scaleTo={0.98} style={({ pressed }) => [styles.card, pressed && { backgroundColor: '#FDF2F2' }]} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="email-outline" size={22} color="#7B1420" />
        <View style={styles.count}><Text style={styles.countText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Inbox · {unreadCount} unread</Text>
        {text ? <Text style={styles.preview} numberOfLines={2}>{text}</Text> : null}
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Read</Text>
        <MaterialCommunityIcons name="chevron-right" size={14} color="#7B1420" />
      </View>
    </PressScale>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#E7E2DA', borderLeftWidth: 4, borderLeftColor: '#7B1420', padding: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FDF2F2', alignItems: 'center', justifyContent: 'center' },
  count: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#7B1420', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#fff' },
  countText: { fontFamily: F, fontSize: 10, fontWeight: '800', color: '#fff' },
  title: { fontFamily: F, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  preview: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2, lineHeight: 17 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ctaText: { fontFamily: F, fontSize: 12, fontWeight: '800', color: '#7B1420' },
});
