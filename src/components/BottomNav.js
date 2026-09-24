import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// The nav is absolutely positioned against the full window height (see
// `wrapper.bottom` below). On web, when the on-screen keyboard opens, the
// visual viewport shrinks but nothing tells this fixed positioning to
// follow it — the pill ends up floating mid-screen with a blank gap
// beneath it instead of sitting above the keyboard, on EVERY mobile
// browser (this isn't the iOS-Safari-specific zoom bug fixed elsewhere;
// window.innerHeight vs. visualViewport.height diverges identically on
// Android Chrome). visualViewport is the standard, reliable way to detect
// an open on-screen keyboard — focus/blur alone can't tell a text field
// from a <select> or a programmatic focus that never opens one.
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      // A shrink this large means the keyboard is up — normal browser-chrome
      // show/hide or an orientation change doesn't shrink the visual
      // viewport nearly this much.
      setVisible(vv.height < window.innerHeight * 0.75);
    };
    vv.addEventListener('resize', handleResize);
    handleResize();
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  return visible;
}

// Same exact brand.50/800 hex values as the reference mockup's bottom
// nav (bg-brand-50 text-brand-800 on the active tab) — kept in sync with
// MpcsHomeScreen's COLORS.brand50/brand800 since this nav renders on the
// same screen.
const COLORS = {
  surface: '#ffffff',
  slate800: '#1e293b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  primary: '#4D1414',
  primaryPale: '#FDF2F2',
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
  const keyboardVisible = useKeyboardVisible();

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, useNativeDriver: false, speed: 14, bounciness: 8 }).start();
  }, []);

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  // Same pattern as native apps collapsing their tab bar during text entry —
  // simpler and more robust than tracking the keyboard's exact height and
  // repositioning the pill around it.
  if (keyboardVisible) return null;

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
