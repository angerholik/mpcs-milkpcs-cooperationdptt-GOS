import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PressScale from './PressScale';

// Two tappable cards (Master data, Members) shown above the monthly return on
// both Home screens. They open their own screens, so they are cards rather
// than tabs — a tab bar implies the page content swaps in place.
export default function HomeShortcuts({ items }) {
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <PressScale
          key={it.title}
          scaleTo={0.97}
          outerStyle={{ flex: 1 }}
          style={({ pressed, hovered }) => [styles.card, hovered && { backgroundColor: 'rgba(248,250,252,0.5)' }, pressed && { backgroundColor: '#F8FAFC' }]}
          onPress={it.onPress}
        >
          <View style={styles.top}>
            <View style={[styles.iconBox, { backgroundColor: it.bg, borderColor: it.border }]}>
              <MaterialCommunityIcons name={it.icon} size={19} color={it.fg} />
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" />
          </View>
          <Text style={styles.title}>{it.title}</Text>
          <Text style={styles.sub}>{it.sub}</Text>
        </PressScale>
      ))}
    </View>
  );
}

const F = 'Manrope';
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226,232,240,0.7)', padding: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F, fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sub: { fontFamily: F, fontSize: 12, fontWeight: '500', color: '#94A3B8', marginTop: 3 },
});
