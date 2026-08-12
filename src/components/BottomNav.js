import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// STITCH Design Tokens (Extracted for Bottom Nav)
const COLORS = {
  surface: '#ffffff',
  slate800: '#1e293b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#7a1a1f',
};

const FONT_FAMILY = 'Manrope';

export default function BottomNav({ activeTab = 'home', onTabPress }) {
  const tabs = [
    { id: 'home', label: 'HOME', icon: 'home-outline', activeIcon: 'home' },
    { id: 'records', label: 'RECORDS', icon: 'chart-bar', activeIcon: 'chart-bar' },
    { id: 'profile', label: 'PROFILE', icon: 'account-outline', activeIcon: 'account' },
    { id: 'more', label: 'MORE', icon: 'view-grid-outline', activeIcon: 'view-grid' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? COLORS.primary : COLORS.slate400;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBtn}
            onPress={() => onTabPress && onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <MaterialCommunityIcons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={color}
              />
            </View>
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  tabBtn: {
    width: 64, // w-16
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6, // gap-1.5
    height: '100%',
  },
  iconContainer: {
    width: 56, // w-14
    height: 32, // h-8
    borderRadius: 16, // rounded-full
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: COLORS.slate100,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '800', // label-caps
    letterSpacing: 1.2,
  },
});
