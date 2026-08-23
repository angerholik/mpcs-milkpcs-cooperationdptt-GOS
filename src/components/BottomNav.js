import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
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
  primaryPale: 'rgba(122,26,31,0.08)',
};

const FONT_FAMILY = 'Manrope';

const TABS = [
  { id: 'home', label: 'HOME', icon: 'home-outline', activeIcon: 'home' },
  { id: 'records', label: 'RECORDS', icon: 'chart-bar', activeIcon: 'chart-bar' },
  { id: 'profile', label: 'PROFILE', icon: 'account-outline', activeIcon: 'account' },
  { id: 'more', label: 'MORE', icon: 'view-grid-outline', activeIcon: 'view-grid' },
];

function NavTab({ tab, isActive, onPress }) {
  const progress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [isActive]);

  const bgColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(122,26,31,0)', COLORS.primaryPale],
  });
  const iconScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.slate400, COLORS.primary],
  });
  const iconColor = isActive ? COLORS.primary : COLORS.slate400;

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.iconContainer, { backgroundColor: bgColor, transform: [{ scale: iconScale }] }]}>
        <MaterialCommunityIcons name={isActive ? tab.activeIcon : tab.icon} size={22} color={iconColor} />
      </Animated.View>
      <Animated.Text style={[styles.label, { color: labelColor }]}>{tab.label}</Animated.Text>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab = 'home', onTabPress }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
  }, []);

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={[styles.wrapper, { opacity: entrance, transform: [{ translateY }] }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => (
          <NavTab
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress && onTabPress(tab.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Floating pill, inset from the screen edges, instead of a bar attached
  // flush to the bottom edge and full width.
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 28 : 16,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    height: 68,
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: '100%',
  },
  iconContainer: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
